const db = require("../utils/dbpool");
const { apiSuccess, apiError } = require("../utils/apiresult");
const { createToken, userOrAdminAuth, adminAuth } = require("../utils/jwtauth");
const { 
    generateOTP, 
    sendPasswordResetOTP, 
    sendWelcomeEmail, 
    sendAccountActivationEmail 
} = require("../utils/email");
const express = require("express");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const redis = require('redis');
const { logUserAction, getUserIP } = require("../utils/userLogs");
const router = express.Router();

const client = redis.createClient();

// Handle Redis client errors
client.on('error', (err) => {
    console.error('Redis Client Error', err);
});

// Ensure the client is connected before using it
client.connect().catch(err => {
    console.error('Failed to connect to Redis:', err);
});

// GET Routes  -> to get specific user detail by user_id
router.get("/:user_id", userOrAdminAuth, (req, res) => {
    const userIP = getUserIP(req);
    const requestorId = req.user?.id;
    
    db.query("SELECT user_id, name, email, phone, User_role, is_active, created_at FROM users WHERE user_id=?", 
        [req.params.user_id], (err, results) => {
            if (err) {
                logUserAction(requestorId, 'VIEW_USER_PROFILE', `Failed: ${err.message}`, userIP);
                return res.send(apiError(err.message));
            }
            
            if (results.length !== 1) {
                logUserAction(requestorId, 'VIEW_USER_PROFILE', `User ${req.params.user_id} not found`, userIP);
                return res.send(apiError("User not found"));
            }
            
            logUserAction(requestorId, 'VIEW_USER_PROFILE', `Viewed user: ${req.params.user_id}`, userIP);
            res.send(apiSuccess(results[0]));
        }
    );
});

// GET Routes  -> to get specific user by email
router.get("/byemail/:email", (req, res) => {
    const userIP = getUserIP(req);
    const requestorId = req.user?.id;
    
    db.query("SELECT user_id, name, email, phone, User_role, is_active, created_at FROM users WHERE email=?", 
        [req.params.email], (err, results) => {
            if (err) {
                logUserAction(requestorId, 'VIEW_USER_BY_EMAIL', `Failed: ${err.message}`, userIP);
                return res.send(apiError(err.message));
            }
            
            if (results.length !== 1) {
                logUserAction(requestorId, 'VIEW_USER_BY_EMAIL', `User ${req.params.email} not found`, userIP);
                return res.send(apiError("User not found"));
            }
            
            logUserAction(requestorId, 'VIEW_USER_BY_EMAIL', `Viewed user: ${req.params.email}`, userIP);
            res.send(apiSuccess(results[0]));
        }
    );
});

// POST Routes  -> to sign in
router.post("/signin", (req, res) => {
    const { email, password } = req.body;
    const userIP = getUserIP(req);
    
    if (!email || !password) {
        logUserAction(null, 'SIGNIN_ATTEMPT', 'Missing credentials', userIP);
        return res.send(apiError("Email and password are required"));
    }
    
    db.query("SELECT * FROM users WHERE email=?", [email], (err, results) => {
        if (err) {
            logUserAction(null, 'SIGNIN_ATTEMPT', `DB error: ${err.message}`, userIP);
            return res.send(apiError(err.message));
        }
        
        if (results.length !== 1) {
            logUserAction(null, 'SIGNIN_FAILED', `Invalid email: ${email}`, userIP);
            return res.send(apiError("Invalid email"));
        }
        
        const dbUser = results[0];
        
        if (!dbUser.is_active) {
            logUserAction(dbUser.user_id, 'SIGNIN_FAILED', 'Account deactivated', userIP);
            return res.send(apiError("Account is deactivated. Please contact support."));
        }
        
        if (!bcrypt.compareSync(password, dbUser.password)) {
            logUserAction(dbUser.user_id, 'SIGNIN_FAILED', 'Invalid password', userIP);
            return res.send(apiError("Invalid password"));
        }
        
        const token = createToken({ id: dbUser.user_id, role: dbUser.User_role, email: dbUser.email });
        logUserAction(dbUser.user_id, 'SIGNIN_SUCCESS', `Successful signin: ${email}`, userIP);
        
        const { password: _, ...userWithoutPassword } = dbUser;
        res.send(apiSuccess({ ...userWithoutPassword, token }));
    });
});

// POST Routes  -> to sign up
router.post("/signup", async (req, res) => {
    const { name, email, phone, password } = req.body;
    const userIP = getUserIP(req);
    
    if (!name || !email || !phone || !password) {
        logUserAction(null, 'SIGNUP_ATTEMPT', 'Missing required fields', userIP);
        return res.send(apiError("All fields are required"));
    }
    
    if (password.length < 6) {
        logUserAction(null, 'SIGNUP_ATTEMPT', 'Password too short', userIP);
        return res.send(apiError("Password must be at least 6 characters long"));
    }
    
    const encPassword = bcrypt.hashSync(password, 10);
    
    db.query("INSERT INTO users (name, email, phone, password, is_active, User_role) VALUES (?, ?, ?, ?, 1, 'ADMIN')",
        [name, email, phone, encPassword], async (err, result) => {
            if (err) {
                const message = err.code === 'ER_DUP_ENTRY' ? 'Email already exists' : err.message;
                logUserAction(null, 'SIGNUP_FAILED', `${email}: ${message}`, userIP);
                return res.send(apiError(message));
            }
            
            logUserAction(result.insertId, 'SIGNUP_SUCCESS', `New user: ${email}`, userIP);
            
            // Send welcome email
            const emailSent = await sendWelcomeEmail(email, name);
            if (!emailSent) {
                console.log(`Warning: Failed to send welcome email to ${email}`);
            }
            
            db.query("SELECT user_id, name, email, phone, User_role, is_active, created_at FROM users WHERE user_id=?",
                [result.insertId], (err, results) => {
                    if (err) {
                        logUserAction(result.insertId, 'SIGNUP_SUCCESS', `Failed to retrieve data: ${err.message}`, userIP);
                        return res.send(apiError(err.message));
                    }
                    res.send(apiSuccess(results[0]));
                }
            );
        }
    );
});

// POST Routes  -> for forget password
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    const userIP = getUserIP(req);

    if (!email) {
        logUserAction(null, 'FORGOT_PASSWORD_ATTEMPT', 'Missing email', userIP);
        return res.send(apiError("Email is required"));
    }

    db.query("SELECT user_id, name, email FROM users WHERE email=? AND is_active=1", [email],
        async (err, results) => {
            if (err) {
                logUserAction(null, 'FORGOT_PASSWORD_ATTEMPT', `DB error: ${err.message}`, userIP);
                return res.send(apiError(err.message));
            }
            
            if (results.length !== 1) {
                logUserAction(null, 'FORGOT_PASSWORD_FAILED', `User not found: ${email}`, userIP);
                return res.send(apiError("User not found or account is deactivated"));
            }

            const user = results[0];
            const otp = generateOTP();
            const expiresAt = Date.now() + 10 * 60 * 1000;

            try {
                await client.setEx(`otp:${email}`, 600, JSON.stringify({ otp, expiresAt, userId: user.user_id }));
            } catch (error) {
                logUserAction(user.user_id, 'FORGOT_PASSWORD_FAILED', `Redis error: ${error.message}`, userIP);
                return res.send(apiError("Failed to store OTP. Please try again."));
            }

            const emailSent = await sendPasswordResetOTP(email, user.name, otp);
            
            if (emailSent) {
                logUserAction(user.user_id, 'FORGOT_PASSWORD_OTP_SENT', `OTP sent to ${email}`, userIP);
                res.send(apiSuccess("OTP sent successfully to your email"));
            } else {
                logUserAction(user.user_id, 'FORGOT_PASSWORD_FAILED', `Email failed: ${email}`, userIP);
                res.send(apiError("Failed to send OTP. Please try again."));
            }
        }
    );
});

// POST Routes  -> to verify otp
router.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;
    const userIP = getUserIP(req);

    if (!email || !otp) {
        logUserAction(null, 'OTP_VERIFICATION_ATTEMPT', 'Missing email or OTP', userIP);
        return res.send(apiError("Email and OTP are required"));
    }

    const storedOtpData = await client.get(`otp:${email}`);
    if (!storedOtpData) {
        logUserAction(null, 'OTP_VERIFICATION_FAILED', `OTP not found: ${email}`, userIP);
        return res.send(apiError("OTP not found or expired"));
    }

    const parsedOtpData = JSON.parse(storedOtpData);

    if (Date.now() > parsedOtpData.expiresAt) {
        await client.del(`otp:${email}`);
        logUserAction(parsedOtpData.userId, 'OTP_VERIFICATION_FAILED', `OTP expired: ${email}`, userIP);
        return res.send(apiError("OTP has expired"));
    }

    if (parsedOtpData.otp !== otp) {
        logUserAction(parsedOtpData.userId, 'OTP_VERIFICATION_FAILED', `Invalid OTP: ${email}`, userIP);
        return res.send(apiError("Invalid OTP"));
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await client.setEx(resetToken, 900, JSON.stringify({
        email, userId: parsedOtpData.userId, expiresAt: Date.now() + 15 * 60 * 1000
    }));
    await client.del(`otp:${email}`);

    logUserAction(parsedOtpData.userId, 'OTP_VERIFICATION_SUCCESS', `OTP verified: ${email}`, userIP);
    res.send(apiSuccess({ message: "OTP verified successfully", resetToken }));
});

// POST Routes  -> to reset-password
router.post("/reset-password", async (req, res) => {
    const { resetToken, newPassword } = req.body;
    const userIP = getUserIP(req);

    if (!resetToken || !newPassword) {
        logUserAction(null, 'PASSWORD_RESET_ATTEMPT', 'Missing token or password', userIP);
        return res.send(apiError("Reset token and new password are required"));
    }

    if (newPassword.length < 6) {
        logUserAction(null, 'PASSWORD_RESET_ATTEMPT', 'Password too short', userIP);
        return res.send(apiError("Password must be at least 6 characters long"));
    }

    const resetData = await client.get(resetToken);
    if (!resetData) {
        logUserAction(null, 'PASSWORD_RESET_FAILED', 'Invalid token', userIP);
        return res.send(apiError("Invalid or expired reset token"));
    }

    const parsedResetData = JSON.parse(resetData);

    if (Date.now() > parsedResetData.expiresAt) {
        await client.del(resetToken);
        logUserAction(parsedResetData.userId, 'PASSWORD_RESET_FAILED', 'Token expired', userIP);
        return res.send(apiError("Reset token has expired"));
    }

    const encPassword = bcrypt.hashSync(newPassword, 10);

    db.query("UPDATE users SET password=? WHERE user_id=?", [encPassword, parsedResetData.userId],
        async (err, result) => {
            if (err) {
                logUserAction(parsedResetData.userId, 'PASSWORD_RESET_FAILED', `DB error: ${err.message}`, userIP);
                return res.send(apiError(err.message));
            }

            if (result.affectedRows !== 1) {
                logUserAction(parsedResetData.userId, 'PASSWORD_RESET_FAILED', 'User not found', userIP);
                return res.send(apiError("Failed to update password"));
            }

            await client.del(resetToken);
            logUserAction(parsedResetData.userId, 'PASSWORD_RESET_SUCCESS', `Password reset: ${parsedResetData.email}`, userIP);
            res.send(apiSuccess("Password reset successfully"));
        }
    );
});

// PUT Routes -> to update profile
router.put("/:user_id", userOrAdminAuth, (req, res) => {
    const { name, phone } = req.body;
    const userId = req.params.user_id;
    const requestorId = req.user?.id;
    const userIP = getUserIP(req);
    
    if (!name || !phone) {
        logUserAction(requestorId, 'UPDATE_PROFILE_ATTEMPT', `Missing fields for user ${userId}`, userIP);
        return res.send(apiError("Name and phone are required"));
    }
    
    db.query("UPDATE users SET name=?, phone=? WHERE user_id=?", [name, phone, userId], (err, result) => {
        if (err) {
            logUserAction(requestorId, 'UPDATE_PROFILE_FAILED', `DB error for user ${userId}: ${err.message}`, userIP);
            return res.send(apiError(err.message));
        }
        
        if (result.affectedRows !== 1) {
            logUserAction(requestorId, 'UPDATE_PROFILE_FAILED', `User ${userId} not found`, userIP);
            return res.send(apiError("User not found"));
        }
        
        logUserAction(requestorId, 'UPDATE_PROFILE_SUCCESS', `Profile updated: ${userId}`, userIP);
        
        // Return updated user data
        db.query("SELECT user_id, name, email, phone, User_role, is_active, created_at FROM users WHERE user_id=?", 
            [userId], (err, results) => {
                if (err) {
                    logUserAction(requestorId, 'UPDATE_PROFILE_SUCCESS', `Updated but failed to retrieve: ${err.message}`, userIP);
                    return res.send(apiError(err.message));
                }
                res.send(apiSuccess(results[0]));
            }
        );
    });
});

// PATCH Routes -> reactivate user account
router.patch("/activate/:email", userOrAdminAuth, async (req, res) => {
    const userIP = getUserIP(req);
    const requestorId = req.user.id;
    
    db.query("UPDATE users SET is_active = TRUE WHERE email = ?", [req.params.email], async (err, results) => {
        if (err) {
            logUserAction(requestorId, 'ACTIVATE_USER_FAILED', `DB error: ${err.message}`, userIP);
            return res.send(apiError(err.message));
        }
        
        if (results.affectedRows !== 1) {
            logUserAction(requestorId, 'ACTIVATE_USER_FAILED', `User not found: ${req.params.email}`, userIP);
            return res.send(apiError("User not found"));
        }
        
        // Get user details for email
        db.query("SELECT name FROM users WHERE email = ?", [req.params.email], async (err, userResults) => {
            if (err || userResults.length === 0) {
                console.log(`Warning: Could not fetch user details for activation email: ${req.params.email}`);
            } else {
                // Send activation notification email
                const emailSent = await sendAccountActivationEmail(req.params.email, userResults[0].name);
                if (!emailSent) {
                    console.log(`Warning: Failed to send activation email to ${req.params.email}`);
                }
            }
        });
        
        logUserAction(requestorId, 'ACTIVATE_USER_SUCCESS', `Activated: ${req.params.email}`, userIP);
        res.send(apiSuccess("User activated successfully"));
    });
});

// PATCH Routes -> to change user password
router.patch("/changepassword", userOrAdminAuth, (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    const userIP = getUserIP(req);
    
    if (!currentPassword || !newPassword) {
        logUserAction(userId, 'CHANGE_PASSWORD_ATTEMPT', 'Missing passwords', userIP);
        return res.send(apiError("Current password and new password are required"));
    }
    
    if (newPassword.length < 6) {
        logUserAction(userId, 'CHANGE_PASSWORD_ATTEMPT', 'New password too short', userIP);
        return res.send(apiError("New password must be at least 6 characters long"));
    }
    
    // Verify current password
    db.query("SELECT password FROM users WHERE user_id=?", [userId], (err, results) => {
        if (err) {
            logUserAction(userId, 'CHANGE_PASSWORD_FAILED', `DB error: ${err.message}`, userIP);
            return res.send(apiError(err.message));
        }
        
        if (results.length !== 1) {
            logUserAction(userId, 'CHANGE_PASSWORD_FAILED', 'User not found', userIP);
            return res.send(apiError("User not found"));
        }
        
        // Update password
        const encNewPassword = bcrypt.hashSync(newPassword, 10);
        
        db.query("UPDATE users SET password=? WHERE user_id=?", [encNewPassword, userId], (err, result) => {
            if (err) {
                logUserAction(userId, 'CHANGE_PASSWORD_FAILED', `Update failed: ${err.message}`, userIP);
                return res.send(apiError(err.message));
            }
            
            if (result.affectedRows !== 1) {
                logUserAction(userId, 'CHANGE_PASSWORD_FAILED', 'Failed to update', userIP);
                return res.send(apiError("Failed to update password"));
            }
            
            logUserAction(userId, 'CHANGE_PASSWORD_SUCCESS', 'Password changed', userIP);
            res.send(apiSuccess("Password updated successfully"));
        });
    });
});

// DELETE Routes -> to deactivate account
router.delete("/:email", adminAuth, (req, res) => {
    const requestorId = req.user.id;
    const userIP = getUserIP(req);
    
    db.query("UPDATE users SET is_active = FALSE WHERE email = ?", [req.params.email], (err, results) => {
        if (err) {
            logUserAction(requestorId, 'DEACTIVATE_USER_FAILED', `DB error: ${err.message}`, userIP);
            return res.send(apiError(err.message));
        }
        
        if (results.affectedRows !== 1) {
            logUserAction(requestorId, 'DEACTIVATE_USER_FAILED', `User not found: ${req.params.email}`, userIP);
            return res.send(apiError("User not found"));
        }
        
        logUserAction(requestorId, 'DEACTIVATE_USER_SUCCESS', `Deactivated: ${req.params.email}`, userIP);
        res.send(apiSuccess("User deactivated successfully"));
    });
});

module.exports = router;
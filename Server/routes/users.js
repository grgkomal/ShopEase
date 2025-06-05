const db = require("../utils/dbpool");
const { apiSuccess, apiError } = require("../utils/apiresult");
const { createToken } = require("../utils/jwtauth");
const express = require("express");
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer'); // npm install nodemailer
const crypto = require("crypto");
const redis = require('redis');
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


// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'gennugennie@gmail.com',
        pass: process.env.EMAIL_PASS || 'cqjw yrme kbqu tbhm'
    }
});

// Utility function to generate OTP
function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}             

// Utility function to send email
async function sendEmail(to, subject, text, html) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER || 'gennugennie@gmail.com',
            to,
            subject,
            text,
            html
        };
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
}

// common prefix -- /users

// GET /users/:user_id
router.get("/:user_id", (req, resp) => {
    db.query("SELECT user_id, name, email, phone, User_role, is_active, created_at FROM users WHERE user_id=?", 
        [req.params.user_id],
        (err, results) => {
            if(err)
                return resp.send(apiError(err.message))
            if(results.length !== 1)
                return resp.send(apiError("User not found"))
            return resp.send(apiSuccess(results[0]))
        }
    )
})

// GET /users/byemail/:email
router.get("/byemail/:email", (req, resp) => {
    db.query("SELECT user_id, name, email, phone, User_role, is_active, created_at FROM users WHERE email=?", 
        [req.params.email],
        (err, results) => {
            if(err)
                return resp.send(apiError(err.message))
            if(results.length !== 1)
                return resp.send(apiError("User not found"))
            return resp.send(apiSuccess(results[0]))
        }
    )
})

// GET /users/customers/all - Get all customers for admin
router.get("/customers/all", (req, resp) => {
    // Check if user is admin (assuming middleware sets req.user)
    if(req.user && req.user.role !== 'ADMIN') {
        return resp.send(apiError("Access denied. Admin privileges required."))
    }
    
    db.query("SELECT user_id, name, email, phone, User_role, is_active, created_at FROM users WHERE User_role = 'CUSTOMER' ORDER BY created_at DESC",
        (err, results) => {
            if(err)
                return resp.send(apiError(err.message))
            return resp.send(apiSuccess(results))
        }
    )
})

// GET /users/all - Get all users for admin
router.get("/all/users", (req, resp) => {
    // Check if user is admin
    if(req.user && req.user.role !== 'ADMIN') {
        return resp.send(apiError("Access denied. Admin privileges required."))
    }
    
    db.query("SELECT user_id, name, email, phone, User_role, is_active, created_at FROM users ORDER BY created_at DESC",
        (err, results) => {
            if(err)
                return resp.send(apiError(err.message))
            return resp.send(apiSuccess(results))
        }
    )
})

// POST /users/signin
router.post("/signin", (req, resp) => {
    const {email, password} = req.body
    
    if(!email || !password) {
        return resp.send(apiError("Email and password are required"))
    }
    
    db.query("SELECT * FROM users WHERE email=?", [email],
        (err, results) => {
            if(err)
                return resp.send(apiError(err.message))
            
            if(results.length !== 1) {
                return resp.send(apiError("Invalid email"))
            }
            
            const dbUser = results[0]
            
            // Check if user is active
            if(!dbUser.is_active) {
                return resp.send(apiError("Account is deactivated. Please contact support."))
            }
            
            const isMatching = bcrypt.compareSync(password, dbUser.password)
            
            if(!isMatching) {
                return resp.send(apiError("Invalid password"))
            }
            
            // Create JWT token
            const token = createToken({
                id: dbUser.user_id,
                role: dbUser.User_role
            })
            
            // Remove password from response
            const {password: _, ...userWithoutPassword} = dbUser
            
            resp.send(apiSuccess({...userWithoutPassword, token}))
        }
    )
})

// POST /users/signup
router.post("/signup", (req, resp) => {
    const {name, email, phone, password} = req.body
    
    // Validation
    if(!name || !email || !phone || !password) {
        return resp.send(apiError("All fields are required"))
    }
    
    if(password.length < 6) {
        return resp.send(apiError("Password must be at least 6 characters long"))
    }
    
    const encpassword = bcrypt.hashSync(password, 10)
    const is_active = 1
    const User_role = "CUSTOMER"
    
    db.query("INSERT INTO users (name, email, phone, password, is_active, User_role) VALUES (?, ?, ?, ?, ?, ?)",
        [name, email, phone, encpassword, is_active, User_role],
        (err, result) => {
            if(err) {
                if(err.code === 'ER_DUP_ENTRY') {
                    return resp.send(apiError("Email already exists"))
                }
                return resp.send(apiError(err.message))
            }
            
            if(result.affectedRows === 1) {
                db.query("SELECT user_id, name, email, phone, User_role, is_active, created_at FROM users WHERE user_id=?", 
                    [result.insertId],
                    (err, results) => {
                        if(err)
                            return resp.send(apiError(err.message))
                        resp.send(apiSuccess(results[0]))
                    }
                )
            }
        }
    )
})

// POST /users/forgot-password -> Forgot Password
router.post("/forgot-password", async (req, resp) => {
    const { email } = req.body;

    if (!email) {
        return resp.send(apiError("Email is required"));
    }

    // Check if user exists
    db.query("SELECT user_id, name, email FROM users WHERE email=? AND is_active=1", [email],
        async (err, results) => {
            if (err) return resp.send(apiError(err.message));

            if (results.length !== 1) {
                return resp.send(apiError("User  not found or account is deactivated"));
            }

            const user = results[0];
            const otp = generateOTP();
            const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

            // Store OTP in Redis
            try {
                await client.setEx(`otp:${email}`, 600, JSON.stringify({ otp, expiresAt, userId: user.user_id }));
            } catch (error) {
                console.error('Error storing OTP in Redis:', error);
                return resp.send(apiError("Failed to store OTP. Please try again."));
            }

            // Send OTP via email
            const emailSubject = "Password Reset OTP - Grocery Store";
            const emailText = `Your OTP for password reset is: ${otp}. This OTP will expire in 10 minutes.`;
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset Request</h2>
                    <p>Hello ${user.name},</p>
                    <p>You have requested to reset your password. Please use the following OTP:</p>
                    <div style="background-color: #f0f0f0; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p style="color: #666;">This OTP will expire in 10 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
            `;

            const emailSent = await sendEmail(email, emailSubject, emailText, emailHtml);

            if (emailSent) {
                resp.send(apiSuccess("OTP sent successfully to your email"));
            } else {
                resp.send(apiError("Failed to send OTP. Please try again."));
            }
        }
    );
});

// Ensure to close the Redis client when shutting down the application
process.on('SIGINT', async () => {
    await client.quit();
    process.exit(0);
});



// POST /users/verify-otp - Verify OTP
router.post("/verify-otp", async (req, resp) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return resp.send(apiError("Email and OTP are required"));
    }

    // Get OTP from Redis
    const storedOtpData = await client.get(`otp:${email}`);
    if (!storedOtpData) {
        return resp.send(apiError("OTP not found or expired"));
    }

    const parsedOtpData = JSON.parse(storedOtpData);

    if (Date.now() > parsedOtpData.expiresAt) {
        await client.del(`otp:${email}`); // Remove expired OTP
        return resp.send(apiError("OTP has expired"));
    }

    if (parsedOtpData.otp !== otp) {
        return resp.send(apiError("Invalid OTP"));
    }

    // OTP is valid, generate a temporary token for password reset
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Store reset token (expires in 15 minutes)
    await client.setEx(resetToken, 900, JSON.stringify({
        email,
        userId: parsedOtpData.userId,
        expiresAt: Date.now() + 15 * 60 * 1000
    }));

    // Remove OTP from Redis
    await client.del(`otp:${email}`);

    resp.send(apiSuccess({
        message: "OTP verified successfully",
        resetToken: resetToken
    }));
});



// POST /users/reset-password - Reset password using reset token
router.post("/reset-password", async (req, resp) => {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
        return resp.send(apiError("Reset token and new password are required"));
    }

    if (newPassword.length < 6) {
        return resp.send(apiError("Password must be at least 6 characters long"));
    }

    const resetData = await client.get(resetToken);
    if (!resetData) {
        return resp.send(apiError("Invalid or expired reset token"));
    }

    const parsedResetData = JSON.parse(resetData);

    if (Date.now() > parsedResetData.expiresAt) {
        await client.del(resetToken); // Now this is valid
        return resp.send(apiError("Reset token has expired"));
    }

    const encPassword = bcrypt.hashSync(newPassword, 10);

    // Make the db.query callback async
    db.query("UPDATE users SET password=? WHERE user_id=?", [encPassword, parsedResetData.userId],
        async (err, result) => { // Marked as async
            if (err) return resp.send(apiError(err.message));

            if (result.affectedRows !== 1) return resp.send(apiError("Failed to update password"));

            // Remove reset token from Redis
            await client.del(resetToken); // Now this is valid

            resp.send(apiSuccess("Password reset successfully"));
        }
    );
});

// PUT /users/:user_id - Update user profile
router.put("/:user_id", (req, resp) => {
    const {name, phone} = req.body
    const userId = req.params.user_id
    
    // Check if user is updating their own profile or admin is updating
    if(req.user && req.user.id != userId && req.user.role !== 'ADMIN') {
        return resp.send(apiError("Access denied"))
    }
    
    if(!name || !phone) {
        return resp.send(apiError("Name and phone are required"))
    }
    
    db.query("UPDATE users SET name=?, phone=? WHERE user_id=?", [name, phone, userId],
        (err, result) => {
            if(err)
                return resp.send(apiError(err.message))
            
            if(result.affectedRows !== 1)
                return resp.send(apiError("User not found"))
            
            // Get updated user data
            db.query("SELECT user_id, name, email, phone, User_role, is_active, created_at FROM users WHERE user_id=?", 
                [userId],
                (err, results) => {
                    if(err)
                        return resp.send(apiError(err.message))
                    resp.send(apiSuccess(results[0]))
                }
            )
        }
    )
})


// PATCH /users/activate/:email - Activate user (Admin only)
router.patch("/activate/:email", (req, resp) => {
    // Check if admin
    if(req.user && req.user.role !== 'ADMIN') {
        return resp.send(apiError("Access denied. Admin privileges required."))
    }
    
    db.query("UPDATE users SET is_active = TRUE WHERE email = ?", [req.params.email],
        (err, results) => {
            if (err)
                return resp.send(apiError(err.message))
            
            if (results.affectedRows !== 1)
                return resp.send(apiError("User not found"))
            
            return resp.send(apiSuccess("User activated successfully"))
        }
    )
})

// PATCH /users/changepassword - Change password (authenticated users)
router.patch("/changepassword", (req, resp) => {
    const {currentPassword, newPassword} = req.body
    const userId = req.user.id
    
    if(!currentPassword || !newPassword) {
        return resp.send(apiError("Current password and new password are required"))
    }
    
    if(newPassword.length < 6) {
        return resp.send(apiError("New password must be at least 6 characters long"))
    }
    
    // First verify current password
    db.query("SELECT password FROM users WHERE user_id=?", [userId],
        (err, results) => {
            if(err)
                return resp.send(apiError(err.message))
            
            if(results.length !== 1)
                return resp.send(apiError("User not found"))
            
            const isCurrentPasswordValid = bcrypt.compareSync(currentPassword, results[0].password)
            
            if(!isCurrentPasswordValid) {
                return resp.send(apiError("Current password is incorrect"))
            }
            
            // Update password
            const encNewPassword = bcrypt.hashSync(newPassword, 10)
            
            db.query("UPDATE users SET password=? WHERE user_id=?", [encNewPassword, userId],
                (err, result) => {
                    if(err)
                        return resp.send(apiError(err.message))
                    
                    if(result.affectedRows !== 1)
                        return resp.send(apiError("Failed to update password"))
                    
                    resp.send(apiSuccess("Password updated successfully"))
                }
            )
        }
    )
})

// PATCH /users/role/:user_id - Change user role (Admin only)
router.patch("/role/:user_id", (req, resp) => {
    const {role} = req.body
    const userId = req.params.user_id
    
    // Check if admin
    if(req.user && req.user.role !== 'ADMIN') {
        return resp.send(apiError("Access denied. Admin privileges required."))
    }
    
    if(!role || !['ADMIN', 'CUSTOMER'].includes(role)) {
        return resp.send(apiError("Valid role (ADMIN or CUSTOMER) is required"))
    }
    
    db.query("UPDATE users SET User_role=? WHERE user_id=?", [role, userId],
        (err, result) => {
            if(err)
                return resp.send(apiError(err.message))
            
            if(result.affectedRows !== 1)
                return resp.send(apiError("User not found"))
            
            resp.send(apiSuccess(`User role updated to ${role} successfully`))
        }
    )
})

// DELETE /users/:email - Deactivate user
router.delete("/:email", (req, resp) => {
    // Check if admin
    if(req.user && req.user.role !== 'ADMIN') {
        return resp.send(apiError("Access denied. Admin privileges required."))
    }
    
    db.query("UPDATE users SET is_active = FALSE WHERE email = ?", [req.params.email],
        (err, results) => {
            if (err)
                return resp.send(apiError(err.message))
            
            if (results.affectedRows !== 1)
                return resp.send(apiError("User not found"))
            
            return resp.send(apiSuccess("User deactivated successfully"))
        }
    )
})



module.exports = router



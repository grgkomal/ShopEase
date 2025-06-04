const db = require("../utils/dbpool");
const { apiSuccess, apiError } = require("../utils/apiresult");
const { createToken } = require("../utils/jwtauth");
const express = require("express");
const bcrypt = require("bcrypt");
const router = express.Router();

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
    const User_role = "ADMIN"
    
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

// PATCH /users/changepassword
router.patch("/changepassword", (req,resp) => {
    const {user_id, password} = req.body
    const encpassword = bcrypt.hashSync(password, 10)
    db.query("UPDATE users SET password=? WHERE user_id=?", [encpassword, user_id],
        (err, result) => {
            if(err)
                return resp.send(apiError(err))
            if(result.affectedRows !== 1)
                return resp.send(apiError("User not found"))
            resp.send(apiSuccess("User password updated"))
        }
    )
})

module.exports = router


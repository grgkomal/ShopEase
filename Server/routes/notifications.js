// routes/notifications.js
const db = require("../utils/dbpool");
const { apiSuccess, apiError } = require("../utils/apiresult");
const { jwtAuth, adminAuth } = require("../utils/jwtauth");
const express = require("express");
const router = express.Router();

router.use(jwtAuth);

// GET  /notifications - Get user's notifications
router.get("/:user_id", (req, resp) => {
     const user_id = req.user.id; 
    const query = "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC";
    
    db.query(query, [req.params.user_id], (err, results) => {
        if (err)
            return resp.send(apiError(err.message));
        resp.send(apiSuccess(results));
    });
});

// POST  /notifications - Create notification (Admin only)
router.post("/",adminAuth, (req, resp) => {
    const { user_id, notification_type, message } = req.body;
    
    if (!user_id || !notification_type || !message) {
        return resp.send(apiError("User ID, notification type, and message are required"));
    }
    
    const query = "INSERT INTO notifications (user_id, notification_type, message) VALUES (?, ?, ?)";
    
    db.query(query, [user_id, notification_type, message], (err, result) => {
        if (err)
            return resp.send(apiError(err.message));
        
        if (result.affectedRows === 1) {
            db.query("SELECT * FROM notifications WHERE notification_id = ?", [result.insertId], (err, results) => {
                if (err)
                    return resp.send(apiError(err.message));
                resp.send(apiSuccess(results[0]));
            });
        }
    });
});

// POST  /notifications/broadcast - Broadcast notification to all users (Admin only)
router.post("/broadcast", adminAuth, (req, resp) => {
    const { notification_type, message, user_role } = req.body;
    
    if (!notification_type || !message) {
        return resp.send(apiError("Notification type and message are required"));
    }
    
    // Get users based on role filter
    let userQuery = "SELECT user_id FROM users";
    let userParams = [];
    
    if (user_role) {
        userQuery += " WHERE User_role = ?";
        userParams.push(user_role);
    }
    
    db.query(userQuery, userParams, (err, users) => {
        if (err)
            return resp.send(apiError(err.message));
        
        if (users.length === 0)
            return resp.send(apiError("No users found"));
        
        const notifications = users.map(user => [user.user_id, notification_type, message]);
        const insertQuery = "INSERT INTO notifications (user_id, notification_type, message) VALUES ?";
        
        db.query(insertQuery, [notifications], (err, result) => {
            if (err)
                return resp.send(apiError(err.message));
            
            resp.send(apiSuccess(`Notification sent to ${result.affectedRows} users`));
        });
    });
});

// DELETE  /notifications - Delete all notifications for user
router.delete("/", (req, resp) => {
    const query = "DELETE FROM notifications WHERE user_id = ?";
    
    db.query(query, [req.user_id], (err, result) => {
        if (err)
            return resp.send(apiError(err.message));
        
        resp.send(apiSuccess(`${result.affectedRows} notifications deleted`));
    });
});

module.exports = router;
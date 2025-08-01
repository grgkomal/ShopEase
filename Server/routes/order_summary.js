//routes/order_summary
const db = require("../utils/dbpool");
const { apiSuccess, apiError } = require("../utils/apiresult");

const { jwtAuth,  userOrAdminAuth } = require("../utils/jwtauth");
const express = require("express");
const router = express.Router();


// ======================= ORDER_summary ROUTES =======================

// GET /order_summary - Get user's order summary
router.get("/", jwtAuth, userOrAdminAuth, (req, resp) => {
    const user_id = req.user.id;
    
    const query = `
        SELECT os.order_id, os.user_id, os.total_amount, os.order_status, os.payment_status, os.order_date
        FROM order_summary os
        JOIN users u ON os.user_id = u.user_id
        WHERE os.user_id = ?
        ORDER BY os.order_date DESC
    `;

    db.query(query, [user_id], (err, results) => {
        if (err) return resp.send(apiError(err.message));
        resp.send(apiSuccess(results));
    });
});


module.exports = router;

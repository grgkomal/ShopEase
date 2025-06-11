//routes/orders
const db = require("../utils/dbpool");
const { apiSuccess, apiError } = require("../utils/apiresult");
const express = require("express");
const router = express.Router();

// ======================= ORDER ROUTES =======================


// GET /orders - Get user's orders
router.get("", (req, resp) => {
    const user_id = req.user.id;
    
    const query = `
        SELECT 
            o.order_id,
            o.user_id,
            o.total_amount,
            o.order_date,
            da.building, 
            da.area, 
            da.pincode,
            COUNT(o.order_id) as item_count,
            SUM(o.total_amount) as total_order_amount
        FROM orders o
        LEFT JOIN delivery_addresses da ON o.address_id = da.address_id
        WHERE o.user_id = ? 
        GROUP BY o.order_id, da.building, da.area, da.pincode
        ORDER BY o.order_date DESC
    `;
        
    db.query(query, [user_id], (err, results) => {
        if (err)
            return resp.send(apiError(err.message));
        resp.send(apiSuccess(results));
    });
});

// GET /orders/:order_id - Get specific order details
router.get("/:order_id", (req, resp) => {
    const user_id = req.user.id;
    
    const summaryQuery = `
        SELECT 
            o.order_id,
            o.user_id,
            o.total_amount,
            o.order_date,
            da.building, 
            da.area, 
            da.pincode, 
            da.phone as delivery_phone
        FROM orders o
        LEFT JOIN delivery_addresses da ON o.address_id = da.address_id
        WHERE o.order_id = ? AND o.user_id = ?
        LIMIT 1
    `;
    
    db.query(summaryQuery, [req.params.order_id, user_id], (err, summaryResults) => {
        if (err)
            return resp.send(apiError(err.message));
        
        if (summaryResults.length === 0)
            return resp.send(apiError("Order not found"));
        
        const itemsQuery = `
            SELECT 
                o.order_id,
                o.product_id,
                o.quantity,
                o.total_amount,
                p.product_name, 
                p.image_url, 
                p.price
            FROM orders o
            JOIN products p ON o.product_id = p.product_id
            WHERE o.order_id = ?
        `;
        
        db.query(itemsQuery, [req.params.order_id], (err, itemsResults) => {
            if (err)
                return resp.send(apiError(err.message));
            
            const orderDetails = {
                ...summaryResults[0],
                items: itemsResults
            };
            
            resp.send(apiSuccess(orderDetails));
        });
    });
});



// POST /orders - Create new order from cart



module.exports = router;
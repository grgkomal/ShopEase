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
router.post("/", (req, resp) => {
    console.log(req.body);

    const user_id = req.user.id;
    const { address_id } = req.body;

    if (!address_id) {
        return resp.send(apiError("Address ID is required"));
    }

    // Get cart items
    const cartQuery = `
        SELECT c.*, p.product_name, p.price, p.product_quantity 
        FROM cart c
        JOIN products p ON c.product_id = p.product_id
        WHERE c.user_id = ?
    `;

    db.query(cartQuery, [user_id], (err, cartItems) => {
        if (err) return resp.send(apiError(err.message));

        if (cartItems.length === 0) return resp.send(apiError("Cart is empty"));

        const totalAmount = cartItems.reduce((sum, item) => sum + parseFloat(item.total_amount), 0);

        const createOrderQuery = `
            INSERT INTO orders (user_id, address_id, product_id, quantity, total_amount) 
            VALUES (?, ?, ?, ?, ?)
        `;

        const firstItem = cartItems[0];
        
        db.query(createOrderQuery, [user_id, address_id, firstItem.product_id, firstItem.quantity, totalAmount], (err, result) => {
            if (err) return resp.send(apiError(err.message));

            const order_id = result.insertId;

            const createOrderSummaryQuery = `
                INSERT INTO order_summary (order_id, user_id, total_amount, order_status, payment_status) 
                VALUES (?, ?, ?, 'DELIVERED', 'Cash On Delivery')
            `;

            db.query(createOrderSummaryQuery, [order_id, user_id, totalAmount], (err, summaryResult) => {
                if (err) return resp.send(apiError(err.message));

                db.query("DELETE FROM cart WHERE user_id = ?", [user_id], (err) => {
                    if (err) return resp.send(apiError(err.message));

                    const getOrderSummaryQuery = `
                        SELECT os.order_id, os.user_id, os.total_amount, os.order_status, os.payment_status, os.order_date
                        FROM order_summary os
                        JOIN users u ON os.user_id = u.user_id
                        WHERE os.order_summary_id = ?
                    `;

                    db.query(getOrderSummaryQuery, [summaryResult.insertId], (err, orderSummary) => {
                        if (err) return resp.send(apiError(err.message));

                        resp.send(apiSuccess("Order placed successfully with Cash on Delivery", {
                            order_summary: orderSummary[0],
                            order_id: order_id,
                            total_amount: totalAmount,
                            payment_method: "Cash On Delivery",
                            cart_items_count: cartItems.length
                        }));
                    });
                });
            });
        });
    });
});




module.exports = router;
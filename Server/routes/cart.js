//routes/cart
const db = require("../utils/dbpool");
const { apiSuccess, apiError } = require("../utils/apiresult");
const { jwtAuth, adminAuth } = require("../utils/jwtauth");
const express = require("express");
const router = express.Router();


// ======================= CART ROUTES =======================

// GET /cart - Get user's cart items
router.get("", (req, resp) => {
    const user_id = req.user.id;
    const query = `
        SELECT c.*, p.product_name, p.price, p.image_url, p.product_quantity as available_quantity,
               (c.quantity * p.price) as item_total
        FROM cart c 
        JOIN products p ON c.product_id = p.product_id 
        WHERE c.user_id = ? 
        ORDER BY c.created_at DESC
    `;
    
    db.query(query, [user_id], (err, results) => {
        if (err)
            return resp.send(apiError(err.message));
        
        const totalAmount = results.reduce((sum, item) => sum + parseFloat(item.item_total), 0);
        
        resp.send(apiSuccess({
            cart_items: results,
            total_amount: totalAmount,
            item_count: results.length
        }));
    });
});



// POST /cart - Add item to cart

// PUT /cart/:cart_id - Update cart item quantity



// DELETE /cart/:cart_id - Remove item from cart
router.delete("/:cart_id", (req, resp) => {
    // console.log(req.body);

    // Get user_id from JWT token (it's stored as 'id')
    const user_id = req.user.id;
    // Verify user owns this cart item
    db.query("SELECT user_id FROM cart WHERE cart_id=?", [req.params.cart_id],
        (err, results) => {
            if (err)
                return resp.send(apiError(err.message));
            
            if (results.length === 0)
                return resp.send(apiError("Cart item not found"));
            
            if (results[0].user_id !== req.user.id)
                return resp.send(apiError("Access denied"));
            
            db.query("DELETE FROM cart WHERE cart_id=?", [req.params.cart_id],
                (err, result) => {
                    if (err)
                        return resp.send(apiError(err.message));
                    resp.send(apiSuccess("Item removed from cart successfully"));
                }
            );
        }
    );
});


// DELETE /cart - Clear user's cart
router.delete("", (req, resp) => {
    const user_id = req.user.id;
    db.query("DELETE FROM cart WHERE user_id=?", [user_id],
        (err, result) => {
            if (err)
                return resp.send(apiError(err.message));
            resp.send(apiSuccess(`${result.affectedRows} items removed from cart`));
        }
    );
});



module.exports = router; 
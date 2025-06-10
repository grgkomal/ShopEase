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
router.post("", (req, resp) => {
    // console.log(req.body);

    const user_id = req.user.id;
    const { product_id, quantity } = req.body;
    
    if (!product_id || !quantity) {
        return resp.send(apiError("Product ID and quantity are required"));
    }
    
    if (quantity <= 0) {
        return resp.send(apiError("Quantity must be greater than 0"));
    }
    
    db.query("SELECT product_id, price, product_quantity FROM products WHERE product_id=?", [product_id],
        (err, productResults) => {
            if (err)
                return resp.send(apiError(err.message));
            
            if (productResults.length === 0)
                return resp.send(apiError("Product not found"));
            
            const product = productResults[0];
            
            db.query("SELECT cart_id, quantity FROM cart WHERE user_id=? AND product_id=?", 
                [user_id, product_id],
                (err, cartResults) => {
                    if (err)
                        return resp.send(apiError(err.message));
                    
                    const total_amount = quantity * product.price;
                    
                    if (cartResults.length > 0) {
                        const newQuantity = cartResults[0].quantity + quantity;
                        
                        if (product.product_quantity < newQuantity) {
                            return resp.send(apiError(`Cannot add ${quantity} more items. Only ${product.product_quantity - cartResults[0].quantity} more available`));
                        }
                        
                        const newTotalAmount = newQuantity * product.price;
                        
                        db.query("UPDATE cart SET quantity=?, total_amount=? WHERE cart_id=?",
                            [newQuantity, newTotalAmount, cartResults[0].cart_id],
                            (err, result) => {
                                if (err)
                                    return resp.send(apiError(err.message));
                                resp.send(apiSuccess("Cart updated successfully"));
                            }
                        );
                    } else {
                        // Add new cart item
                        db.query("INSERT INTO cart (user_id, product_id, quantity, total_amount) VALUES (?, ?, ?, ?)",
                            [user_id, product_id, quantity, total_amount], // Changed from req.user_id to user_id
                            (err, result) => {
                                if (err)
                                    return resp.send(apiError(err.message));
                                resp.send(apiSuccess("Item added to cart successfully"));
                            }
                        );
                    }
                }
            );
        }
    );
});


// PUT /cart/:cart_id - Update cart item quantity
router.put("/:cart_id", (req, resp) => {
    // console.log(req.body);

    const user_id = req.user.id;
    const { quantity } = req.body;
    
    if (!quantity || quantity <= 0) {
        return resp.send(apiError("Valid quantity is required"));
    }
    
    db.query(`
        SELECT c.cart_id, c.user_id, c.product_id, p.price, p.product_quantity 
        FROM cart c 
        JOIN products p ON c.product_id = p.product_id 
        WHERE c.cart_id = ?
    `, [req.params.cart_id], (err, results) => {
        if (err)
            return resp.send(apiError(err.message));
        
        if (results.length === 0)
            return resp.send(apiError("Cart item not found"));
        
        const cartItem = results[0];
        
        if (cartItem.user_id !== user_id) {
            return resp.send(apiError("Access denied"));
        }
        
        if (cartItem.product_quantity < quantity) {
            return resp.send(apiError(`Only ${cartItem.product_quantity} items available in stock`));
        }
        
        const total_amount = quantity * cartItem.price;
        
        db.query("UPDATE cart SET quantity=?, total_amount=? WHERE cart_id=?",
            [quantity, total_amount, req.params.cart_id],
            (err, result) => {
                if (err)
                    return resp.send(apiError(err.message));
                resp.send(apiSuccess("Cart item updated successfully"));
            }
        );
    });
});



// DELETE /cart/:cart_id - Remove item from cart
router.delete("/:cart_id", (req, resp) => {
    // console.log(req.body);
    const user_id = req.user.id;
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
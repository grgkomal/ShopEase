const db = require("../utils/dbpool");
const { apiSuccess, apiError } = require("../utils/apiresult");
const { jwtAuth, adminAuth } = require("../utils/jwtauth");
const express = require("express");
const multer = require("multer");
const path = require("path");
const upload = multer({ dest: 'uploads/' });
const fs = require("fs");
const router = express.Router();

// ======================= PRODUCTS ROUTES =======================

// GET /product - Get all products
router.get("/", (req, resp) => {
    const query = `
        SELECT p.product_name, p.description, p.price, p.product_quantity, p.image_url, c.category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.category_id 
        ORDER BY p.created_at DESC
    `;
    
    db.query(query, (err, results) => {
        if (err)
            return resp.send(apiError(err.message));
        resp.send(apiSuccess(results));
    });
});

// GET /product/category/:category_id - Get products by category
router.get("/category/:category_id", (req, resp) => {
    const query = `
        SELECT p.product_name, p.description, p.price, p.product_quantity, p.image_url, c.category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.category_id 
        WHERE p.category_id = ? 
        ORDER BY p.product_name
    `;
    
    db.query(query, [req.params.category_id], (err, results) => {
        if (err)
            return resp.send(apiError(err.message));
        resp.send(apiSuccess(results));
    });
});

// GET /product/:product_id - Get product by ID
router.get("/:product_id", (req, resp) => {
    const query = `
        SELECT p.product_name, p.description, p.price, p.product_quantity, p.image_url, c.category_name 
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.category_id 
        WHERE p.product_id = ?
    `;
    
    db.query(query, [req.params.product_id], (err, results) => {
        if (err)
            return resp.send(apiError(err.message));
        
        if (results.length === 0)
            return resp.send(apiError("Product not found"));
        
        resp.send(apiSuccess(results[0]));
    });
});

router.post("/", adminAuth,  upload.single('image_url'), (req, resp) => {

    const { category_id, product_name, description, price, product_quantity } = req.body;

    const image_url = req.file ? req.file.filename : null;
    // Validation
    if (!category_id || !product_name || !price || !product_quantity) {
        return resp.send(apiError("Category ID, product name, price, and quantity are required"));
    }
    
    if (price <= 0) {
        return resp.send(apiError("Price must be greater than 0"));
    }
    
    if (product_quantity < 0) {
        return resp.send(apiError("Quantity cannot be negative"));
    }
    
    // Check if category exists
    db.query("SELECT category_id FROM categories WHERE category_id=?", [category_id],
        (err, categoryResults) => {
            if (err)
                return resp.send(apiError(err.message));
            
            if (categoryResults.length === 0)
                return resp.send(apiError("Category not found"));
            
            // Insert product
            db.query("INSERT INTO products (category_id, product_name, description, price, product_quantity, image_url) VALUES (?, ?, ?, ?, ?, ?)",
                [category_id, product_name, description, price, product_quantity, image_url],
                (err, result) => {
                    if (err)
                        return resp.send(apiError(err.message));
                    
                    if (result.affectedRows === 1) {
                        // Fetch the newly inserted product with category info
                        const query = `
                            SELECT p.product_name, p.description, p.price, p.product_quantity, p.image_url, c.category_name 
                            FROM products p 
                            LEFT JOIN categories c ON p.category_id = c.category_id 
                            WHERE p.product_id = ?
                        `;
                        
                        db.query(query, [result.insertId], (err, results) => {
                            if (err)
                                return resp.send(apiError(err.message));
                            resp.send(apiSuccess(results[0]));
                        });
                    }
                }
            );
        }
    );
});



// PUT /product/:product_id - Update product (Admin only)

router.put("/:product_id", adminAuth, upload.single('image_url'), (req, resp) => {
    const { product_name, description, price, product_quantity } = req.body;
    const image_url = req.file ? req.file.filename : req.body.existing_image_url;


    // Validation
    if ( !product_name || !price || product_quantity === undefined) {
        return resp.send(apiError("Product name, price, and quantity are required"));
    }
    
    if (price <= 0) {
        return resp.send(apiError("Price must be greater than 0"));
    }
    
    if (product_quantity < 0) {
        return resp.send(apiError("Quantity cannot be negative"));
    }
  
   // Update product
    db.query("UPDATE products SET product_name=?, description=?, price=?, product_quantity=?, image_url=? WHERE product_id=?",
    [ product_name, description, price, product_quantity, image_url, req.params.product_id],
    (err, result) => {
        if (err)
            return resp.send(apiError(err.message));
               
        if (result.affectedRows === 0)
            return resp.send(apiError("Product not found"));
                    
        // Return updated product with category info
            const query = `
                SELECT p.product_name, p.description, p.price, p.product_quantity, p.image_url, c.category_name 
                FROM products p 
                LEFT JOIN categories c ON p.category_id = c.category_id 
                WHERE p.product_id = ?
                `;
                    
                db.query(query, [req.params.product_id], (err, results) => {
                    if (err)
                        return resp.send(apiError(err.message));
                    resp.send(apiSuccess(results[0]));
                }
            );
        }
    );
});


// DELETE /product/:product_id - Delete product (Admin only)
router.delete("/:product_id", adminAuth, (req, resp) => {
    // Check if product is in any cart or order
    db.query("SELECT COUNT(*) as cart_count FROM cart WHERE product_id=?", [req.params.product_id],
        (err, cartResults) => {
            if (err)
                return resp.send(apiError(err.message));
            
            if (cartResults[0].cart_count > 0) {
                return resp.send(apiError("Cannot delete product. It exists in user carts."));
            }
            
            // Check orders
            db.query("SELECT COUNT(*) as order_count FROM orders WHERE product_id=?", [req.params.product_id],
                (err, orderResults) => {
                    if (err)
                        return resp.send(apiError(err.message));
                    
                    if (orderResults[0].order_count > 0) {
                        return resp.send(apiError("Cannot delete product. It has associated orders."));
                    }
                    
                    // Delete product
                    db.query("DELETE FROM products WHERE product_id=?", [req.params.product_id],
                        (err, result) => {
                            if (err)
                                return resp.send(apiError(err.message));
                            
                            if (result.affectedRows === 1)
                                resp.send(apiSuccess("Product deleted successfully"));
                            else
                                resp.send(apiError("Product not found"));
                        }
                    );
                }
            );
        }
    );
});


module.exports = router;
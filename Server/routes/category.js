//routes/category

const db = require("../utils/dbpool");
const { apiSuccess, apiError } = require("../utils/apiresult");
const { jwtAuth, adminAuth } = require("../utils/jwtauth");
const express = require("express");
const router = express.Router();


// ======================= CATEGORIES ROUTES =======================

// GET /api/categories - Get all categories
router.get("/categories", (req, resp) => {
    db.query("SELECT * FROM categories ORDER BY category_name", (err, results) => {
        if (err)
            return resp.send(apiError(err.message));
        resp.send(apiSuccess(results));
    });
});


// GET /api/categories/:category_id - Get category by ID
router.get("/categories/:category_id", (req, resp) => {
    db.query("SELECT * FROM categories WHERE category_id=?", [req.params.category_id],
        (err, results) => {
            if (err)
                return resp.send(apiError(err.message));
            if (results.length === 0)
                return resp.send(apiError("Category not found"));
            resp.send(apiSuccess(results[0]));
        }
    );
});

// POST /api/categories - Add new category (Admin only)
router.post("/categories", adminAuth, (req, resp) => {
    const { category_name, description, image_url } = req.body;
    
    if (!category_name) {
        return resp.send(apiError("Category name is required"));
    }
    
    db.query("INSERT INTO categories (category_name, description, image_url) VALUES (?, ?, ?)",
        [category_name, description, image_url],
        (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return resp.send(apiError("Category already exists"));
                }
                return resp.send(apiError(err.message));
            }
            
            if (result.affectedRows === 1) {
                db.query("SELECT * FROM categories WHERE category_id=?", [result.insertcategory_id], //result.insertId] <- change
                    (err, results) => {
                        if (err)
                            return resp.send(apiError(err.message));
                        resp.send(apiSuccess(results[0]));
                    }
                );
            }
        }
    );
});

// PUT /api/categories/:category_id - Update category (Admin only)
router.put("/categories/:category_id", adminAuth, (req, resp) => {
    const { category_name, description, image_url } = req.body;
    
    if (!category_name) {
        return resp.send(apiError("Category name is required"));
    }
    
    db.query("UPDATE categories SET category_name=?, description=?, image_url=? WHERE category_id=?",
        [category_name, description, image_url, req.params.category_id],
        (err, result) => {
            if (err)
                return resp.send(apiError(err.message));
            
            if (result.affectedRows === 0)
                return resp.send(apiError("Category not found"));
            
            // Return updated category
            db.query("SELECT * FROM categories WHERE category_id=?", [req.params.category_id],
                (err, results) => {
                    if (err)
                        return resp.send(apiError(err.message));
                    resp.send(apiSuccess(results[0]));
                }
            );
        }
    );
});

// DELETE /api/categories/:category_id - Delete category (Admin only)
router.delete("/categories/:category_id", adminAuth, (req, resp) => {
    // First check if category has products
    db.query("SELECT COUNT(*) as product_count FROM products WHERE category_id=?", [req.params.category_id],
        (err, results) => {
            if (err)
                return resp.send(apiError(err.message));
            
            if (results[0].product_count > 0) {
                return resp.send(apiError("Cannot delete category. It has associated products."));
            }
            
            // Delete category
            db.query("DELETE FROM categories WHERE category_id=?", [req.params.category_id],
                (err, result) => {
                    if (err)
                        return resp.send(apiError(err.message));
                    
                    if (result.affectedRows === 1)
                        resp.send(apiSuccess("Category deleted successfully"));
                    else
                        resp.send(apiError("Category not found"));
                }
            );
        }
    );
});

module.exports = router;

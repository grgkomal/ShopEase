const express = require("express");
const path = require("path");
const fs = require("fs");
const db = require("../utils/dbpool");
const { apiSuccess, apiError } = require("../utils/apiresult");
const { upload } = require("../utils/uploadConfig");
const router = express.Router();

// Multer error middleware
function handleMulterError(err, req, res, next) {
  if (err instanceof require("multer").MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.send(apiError("File size too large. Maximum size is 5MB."));
    }
    return res.send(apiError(`File upload error: ${err.message}`));
  } else if (err) {
    return res.send(apiError(err.message));
  }
  next();
}

// GET all categories
router.get("/", (req, resp) => {
  db.query("SELECT * FROM categories ORDER BY created_at DESC", (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return resp.send(apiError(err.message));
    }
    resp.send(apiSuccess(results));
  });
});

// GET a category by ID
router.get("/:category_id", (req, resp) => {
  const id = req.params.category_id;
  db.query("SELECT * FROM categories WHERE category_id = ?", [id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return resp.send(apiError(err.message));
    }
    if (results.length === 0) {
      return resp.send(apiError("Category not found"));
    }
    resp.send(apiSuccess(results[0]));
  });
});

// POST new category (Admin only)
router.post(
  "/",
  upload.single("image_url"),
  handleMulterError,
  (req, resp) => {
    console.log('=== ADD CATEGORY REQUEST ===', req.body, req.file, req.headers);
    const { category_name, description } = req.body;
    const image_url = req.file ? req.file.filename : null;

    if (!category_name || !category_name.trim()) {
      return resp.send(apiError("Category name is required"));
    }

    db.query(
      "INSERT INTO categories (category_name, description, image_url) VALUES (?, ?, ?)",
      [category_name.trim(), description || null, image_url],
      (err, result) => {
        if (err) {
          console.error('Database insert error:', err);
          if (err.code === "ER_DUP_ENTRY") {
            return resp.send(apiError("Category already exists"));
          }
          return resp.send(apiError(err.message));
        }
        if (result.affectedRows === 1) {
          db.query("SELECT * FROM categories WHERE category_id=?", [result.insertId], (err2, results2) => {
            if (err2) {
              console.error('Select after insert error:', err2);
              return resp.send(apiError(err2.message));
            }
            console.log('Category added:', results2[0]);
            resp.send(apiSuccess(results2[0]));
          });
        } else {
          console.error('No rows affected during insert');
          return resp.send(apiError("Failed to add category"));
        }
      }
    );
  }
);

// PUT update category (Admin only)
router.put(
  "/:category_id",
  upload.single("image_url"),
  handleMulterError,
  (req, resp) => {
    console.log('=== UPDATE CATEGORY ===', req.params.category_id, req.body, req.file);
    const { category_name, description, existing_image_url } = req.body;
    const image_url = req.file ? req.file.filename : existing_image_url;

    if (!category_name || !category_name.trim()) {
      return resp.send(apiError("Category name is required"));
    }

    db.query(
      "UPDATE categories SET category_name=?, description=?, image_url=? WHERE category_id=?",
      [category_name.trim(), description || null, image_url, req.params.category_id],
      (err, result) => {
        if (err) {
          console.error('Database update error:', err);
          if (err.code === "ER_DUP_ENTRY") {
            return resp.send(apiError("Category name already exists"));
          }
          return resp.send(apiError(err.message));
        }
        if (result.affectedRows === 0) {
          return resp.send(apiError("Category not found"));
        }
        db.query("SELECT * FROM categories WHERE category_id=?", [req.params.category_id], (err2, results2) => {
          if (err2) {
            console.error('Select after update error:', err2);
            return resp.send(apiError(err2.message));
          }
          console.log('Category updated:', results2[0]);
          resp.send(apiSuccess(results2[0]));
        });
      }
    );
  }
);

// DELETE a category
router.delete("/:category_id", (req, resp) => {
  const id = req.params.category_id;
  console.log('=== DELETE CATEGORY ===', id);

  db.query("SELECT * FROM categories WHERE category_id = ?", [id], (err, results) => {
    if (err) {
      console.error('Database select error:', err);
      return resp.send(apiError(err.message));
    }
    if (results.length === 0) {
      return resp.send(apiError("Category not found"));
    }
    const cat = results[0];

    db.query("DELETE FROM categories WHERE category_id = ?", [id], (err2) => {
      if (err2) {
        console.error('Database delete error:', err2);
        return resp.send(apiError(err2.message));
      }
      if (cat.image_url) {
        const imagePath = path.join(__dirname, "../uploads", cat.image_url);
        fs.unlink(imagePath, err3 => {
          if (err3) {
            console.log('Could not delete image file:', err3.message);
          } else {
            console.log('Image file deleted:', cat.image_url);
          }
        });
      }
      console.log('Category deleted successfully');
      resp.send(apiSuccess({ message: "Category deleted successfully" }));
    });
  });
});

// GET /api/product/download/:filename - Download product image
router.get("/download/:image_url", (req, resp) => {
    const filename = req.params.image_url;
    const filePath = path.join(__dirname, '../uploads', filename);
    
    if (fs.existsSync(filePath)) {
        resp.download(filePath);
    } else {    
        resp.status(404).send(apiError("Image not found"));
    }
});

module.exports = router;

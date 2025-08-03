
const db = require("../utils/dbpool");
const { apiSuccess, apiError } = require("../utils/apiresult");
// const { jwtAuth, adminAuth } = require("../utils/jwtauth");
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Create unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept only image files - FIXED: changed image_url to image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.send(apiError("File size too large. Maximum size is 5MB."));
        }
        return res.send(apiError(`File upload error: ${err.message}`));
    } else if (err) {
        return res.send(apiError(err.message));
    }
    next();
};

// GET /api/category - Get all categories
router.get("/", (req, resp) => {
    db.query("SELECT * FROM categories ORDER BY created_at DESC", (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return resp.send(apiError(err.message));
        }
        resp.send(apiSuccess(results));
    });
});

// GET /api/category/:category_id - Get category by ID
router.get("/:category_id", (req, resp) => {
    const categoryId = req.params.category_id;
    
    db.query("SELECT * FROM categories WHERE category_id = ?", [categoryId], (err, results) => {
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

// GET /api/category/download/:filename - Download category image
router.get("/download/:filename", (req, resp) => {
    console.log('=== DOWNLOAD CATEGORY IMAGE REQUEST ===');
    const filename = req.params.filename;
    console.log('Requested filename:', filename);
    
    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(__dirname, '../uploads', sanitizedFilename);
    
    console.log('File path:', filePath);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        console.log('File not found:', filePath);
        return resp.status(404).send(apiError("Image not found"));
    }
    
    try {
        // Get file stats
        const stats = fs.statSync(filePath);
        console.log('File stats:', {
            size: stats.size,
            mtime: stats.mtime,
            isFile: stats.isFile()
        });
        
        // Set appropriate headers
        const ext = path.extname(filename).toLowerCase();
        let contentType = 'image/jpeg'; // default
        
        switch (ext) {
            case '.png':
                contentType = 'image/png';
                break;
            case '.gif':
                contentType = 'image/gif';
                break;
            case '.webp':
                contentType = 'image/webp';
                break;
            case '.jpg':
            case '.jpeg':
            default:
                contentType = 'image/jpeg';
                break;
        }
        
        resp.setHeader('Content-Type', contentType);
        resp.setHeader('Content-Length', stats.size);
        resp.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        resp.setHeader('Last-Modified', stats.mtime.toUTCString());
        
        // Send the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(resp);
        
        fileStream.on('error', (error) => {
            console.error('File stream error:', error);
            resp.status(500).send(apiError("Error reading file"));
        });
        
        console.log('File sent successfully');
        
    } catch (error) {
        console.error('Error serving file:', error);
        resp.status(500).send(apiError("Error serving file"));
    }
});

// POST /api/category - Add new category (Admin only)
router.post("/", upload.single('image_url'), handleMulterError, (req, resp) => {
    // Add debugging
    console.log('=== ADD CATEGORY REQUEST ===');
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    console.log('Request headers:', req.headers);
    
    const { category_name, description } = req.body;
    const image_url = req.file ? req.file.filename : null;

    if (!category_name || !category_name.trim()) {
        return resp.send(apiError("Category name is required"));
    }

    // Log what we're about to insert
    console.log('Inserting category:', { 
        category_name: category_name.trim(), 
        description: description || null, 
        image_url 
    });

    db.query(
        "INSERT INTO categories (category_name, description, image_url) VALUES (?, ?, ?)",
        [category_name.trim(), description || null, image_url],
        (err, result) => {
            if (err) {
                console.error('Database insert error:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return resp.send(apiError("Category already exists"));
                }
                return resp.send(apiError(err.message));
            }

            if (result.affectedRows === 1) {
                db.query("SELECT * FROM categories WHERE category_id=?", [result.insertId],
                    (err, results) => {
                        if (err) {
                            console.error('Select after insert error:', err);
                            return resp.send(apiError(err.message));
                        }
                        console.log('Category added successfully:', results[0]);
                        resp.send(apiSuccess(results[0]));
                    }
                );
            } else {
                console.error('No rows affected during insert');
                return resp.send(apiError("Failed to add category"));
            }
        }
    );
});

// PUT /api/category/:category_id - Update category (Admin only)
router.put("/:category_id", upload.single('image_url'), handleMulterError, (req, resp) => {
    // Add debugging
    console.log('=== UPDATE CATEGORY REQUEST ===');
    console.log('Category ID:', req.params.category_id);
    console.log('Request body:', req.body);
    console.log('Request file:', req.file);
    
    const { category_name, description, existing_image_url } = req.body;
    const image_url = req.file ? req.file.filename : existing_image_url;

    if (!category_name || !category_name.trim()) {
        return resp.send(apiError("Category name is required"));
    }

    console.log('Updating category with:', { 
        category_name: category_name.trim(), 
        description: description || null, 
        image_url,
        category_id: req.params.category_id
    });

    // If a new file was uploaded and there's an existing image, delete the old one
    if (req.file && existing_image_url) {
        const oldImagePath = path.join(__dirname, '../uploads', existing_image_url);
        fs.unlink(oldImagePath, (err) => {
            if (err) {
                console.log('Could not delete old image file:', err.message);
            } else {
                console.log('Old image file deleted:', existing_image_url);
            }
        });
    }

    db.query(
        "UPDATE categories SET category_name=?, description=?, image_url=? WHERE category_id=?",
        [category_name.trim(), description || null, image_url, req.params.category_id],
        (err, result) => {
            if (err) {
                console.error('Database update error:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return resp.send(apiError("Category name already exists"));
                }
                return resp.send(apiError(err.message));
            }

            if (result.affectedRows === 0) {
                return resp.send(apiError("Category not found"));
            }

            // Return updated category
            db.query("SELECT * FROM categories WHERE category_id=?", [req.params.category_id],
                (err, results) => {
                    if (err) {
                        console.error('Select after update error:', err);
                        return resp.send(apiError(err.message));
                    }
                    console.log('Category updated successfully:', results[0]);
                    resp.send(apiSuccess(results[0]));
                }
            );
        }
    );
});


// GET /category/download/:filename - Download product image
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

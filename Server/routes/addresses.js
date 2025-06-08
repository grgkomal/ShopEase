// routes/addresses

const db = require("../utils/dbpool");
const { apiSuccess, apiError } = require("../utils/apiresult");
const { jwtAuth } = require("../utils/jwtauth");
const express = require("express");
const router = express.Router();

// GET /addresses - Get user's delivery addresses
router.get("/", (req, resp) => {
    const user_id = req.user.id;
    db.query("SELECT * FROM delivery_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC",[user_id], (err, results) => {
        if (err)
            return resp.send(apiError(err.message));
        resp.send(apiSuccess(results));
    });
});



// POST /addresses - Add new delivery address
router.post("/", (req, resp) => {
    // console.log(req.body);
    const user_id = req.user.id;

    const { building, area, pincode, phone, is_default } = req.body;

    if (!building || !area || !pincode || !phone) {
        return resp.send(apiError("Building, area, pincode, and phone are required"));
    }

    if (is_default) {
        db.query("UPDATE delivery_addresses SET is_default = 0 WHERE user_id = ?", [user_id], (err) => {
            if (err) {
                console.log("Error updating default addresses:", err.message);
                return resp.send(apiError("Failed to update default addresses"));
            }
        });
    }

    const query = "INSERT INTO delivery_addresses (user_id, building, area, pincode, phone, is_default) VALUES (?, ?, ?, ?, ?, ?)";

    db.query(query, [user_id, building, area, pincode, phone, is_default || 0], (err, result) => {
        if (err) {
            return resp.send(apiError(err.message));
        }

        if (result.affectedRows === 1) {
            db.query("SELECT * FROM delivery_addresses WHERE address_id = ?", [result.insertId], (err, results) => {
                if (err) {
                    return resp.send(apiError(err.message));
                }
                resp.send(apiSuccess(results[0]));
            });
        } else {
            resp.send(apiError("Failed to insert the address"));
        }
    });
});


// PUT /addresses/:id - Update delivery address
router.put("/:id", (req, resp) => {
    const user_id = req.user.id;
    const { building, area, pincode, phone, is_default } = req.body;
    
    if (!building || !area || !pincode || !phone) {
        return resp.send(apiError("Building, area, pincode, and phone are required"));
    }
    
    // If this is set as default, update other addresses
    if (is_default) {
        db.query("UPDATE delivery_addresses SET is_default = 0 WHERE user_id = ? AND address_id != ?", 
            [user_id, req.params.id], (err) => {
            if (err) console.log("Error updating default addresses:", err.message);
        });
    }
    
    const query = "UPDATE delivery_addresses SET building=?, area=?, pincode=?, phone=?, is_default=? WHERE address_id=? AND user_id=?";
    
    db.query(query, [building, area, pincode, phone, is_default || 0, req.params.id, user_id], (err, result) => {
        if (err)
            return resp.send(apiError(err.message));
        
        if (result.affectedRows === 0)
            return resp.send(apiError("Address not found"));
        
        db.query("SELECT * FROM delivery_addresses WHERE address_id = ?", [req.params.id], (err, results) => {
            if (err)
                return resp.send(apiError(err.message));
            resp.send(apiSuccess(results[0]));
        });
    });
});

// DELETE /addresses/:id - Delete delivery address
router.delete("/:id", (req, resp) => {
    const user_id = req.user.id;
    db.query("DELETE FROM delivery_addresses WHERE address_id = ? AND user_id = ?", 
        [req.params.id, user_id], (err, result) => {
        if (err)
            return resp.send(apiError(err.message));
        
        if (result.affectedRows === 0)
            return resp.send(apiError("Address not found"));
        
        resp.send(apiSuccess("Address deleted successfully"));
    });
});

module.exports = router;
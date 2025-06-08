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

// DELETE /addresses/:id - Delete delivery address



module.exports = router;
//routes/admin
const db = require("../utils/dbpool");
const { apiSuccess, apiError } = require("../utils/apiresult");
const { jwtAuth, adminAuth } = require("../utils/jwtauth");
const express = require("express");
const router = express.Router();



// ======================= ADMIN ROUTES =======================

// ----------------------- ORDER DETAILS ----------------------
// GET /api/admin/orders/summary - Get total orders count for admin
router.get("/orders/summary", adminAuth, (req, resp) => {    
    const user_id = req.user.id;                       
    const queries = [
        "SELECT COUNT(*) as total_orders FROM orders",
        "SELECT COUNT(*) as pending_orders FROM order_summary WHERE order_status = 'Pending'",
        "SELECT COUNT(*) as delivered_orders FROM order_summary WHERE order_status = 'Delivered'",
        "SELECT COUNT(*) as delivered_orders FROM order_summary WHERE order_status = 'Delivered'",
        "SELECT SUM(total_amount) as total_revenue FROM orders",
        "SELECT COUNT(DISTINCT user_id) as total_customers FROM orders"
    ];
    
    let completed = 0;
    const results = {};
    
    queries.forEach((query, index) => {
        db.query(query,[user_id], (err, result) => {
            if (err) {
                return resp.send(apiError(err.message));
            }
            
            const key = Object.keys(result[0])[0];
            results[key] = result[0][key] || 0;
            
            completed++;
            if (completed === queries.length) {
                resp.send(apiSuccess(results));
            }
        });
    });
});

// GET /api/admin/orders - Get all orders for admin
router.get("/orders", adminAuth, (req, resp) => {
    const query = `
        SELECT os.*, u.name as customer_name, u.email as customer_email,
               da.building, da.area, da.pincode
        FROM orders os
        JOIN users u ON os.user_id = u.user_id
        LEFT JOIN orders o ON os.order_id = o.order_id
        LEFT JOIN delivery_addresses da ON o.address_id = da.address_id
        ORDER BY os.order_date DESC
    `;
    
    db.query(query,[req.user.id] ,(err, results) => {
        if (err)
            return resp.send(apiError(err.message));
        resp.send(apiSuccess(results));
    });
});


// GET /admin/orders/CUSTOMER - Get all orders
router.get("/orders/CUSTOMER", adminAuth, (req, res) => {
    const query = `
        SELECT 
            o.order_id,
            o.user_id,
            o.total_amount,
            o.order_date,
            u.name as customer_name,
            u.email as customer_email
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        ORDER BY o.order_date DESC
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            return res.send(apiError(err.message));
        }
        res.send(apiSuccess(results));
    });
});

// GET /api/admin/orders/:id - Get single order
router.get("/orders/:order_id", adminAuth, (req, res) => {
     const order_id = req.params.order_id;
    
    const query = `
        SELECT 
            o.address_id, o.order_date, o.product_id, o.quantity, o.total_amount, o.created_at, 
            u.name as customer_name,
            u.email as customer_email,
            u.phone as customer_phone
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        WHERE o.order_id = ?
    `;
    
    db.query(query, [order_id], (err, results) => {
        if (err) {
            return res.send(apiError(err.message));
        }
        
        if (results.length === 0) {
            return res.send(apiError("Order not found"));
        }
        
        res.send(apiSuccess(results[0]));
    });
});


// GET /api/admin/dashboard - Get simple dashboard data
router.get("/dashboard", adminAuth, (req, res) => {
    // Get total orders
    db.query("SELECT COUNT(*) as total_orders FROM orders", (err1, result1) => {
        if (err1) {
            return res.send(apiError(err1.message));
        }
        
        // Get total customers
        db.query("SELECT COUNT(*) as total_customers FROM users WHERE User_role = 'CUSTOMER'", (err2, result2) => {
            if (err2) {
                return res.send(apiError(err2.message));
            }
            
            // Get pending orders
            db.query("SELECT COUNT(*) as pending_orders FROM order_summary WHERE order_status = 'PENDING'", (err3, result3) => {
                if (err3) {
                    return res.send(apiError(err3.message));
                }
                
                const dashboard = {
                    total_orders: result1[0].total_orders,
                    total_customers: result2[0].total_customers,
                    pending_orders: result3[0].pending_orders
                };
                
                res.send(apiSuccess(dashboard));
            });
        });
    });
});



// PATCH /admin/orders/:order_id/status - Update order status (Admin only)
router.patch("/orders/:order_id/status", adminAuth, (req, resp) => {
    const { order_status } = req.body;
    const order_id = req.params.order_id;
    
    // Validate order_status
    if (!order_status || !['PENDING', 'DELIVERED', 'CANCELLED'].includes(order_status.toUpperCase())) {
        return resp.send(apiError("Valid order status is required (Pending, Processing, Shipped, Delivered, Cancelled)"));
    }
    
    db.query("UPDATE order_summary SET order_status = ? WHERE order_summary_id = ?",
        [order_status, order_id],
        (err, result) => {
            if (err)
                return resp.send(apiError(err.message));
                      
            if (result.affectedRows === 0)
                return resp.send(apiError("Order not found"));
                     
            resp.send(apiSuccess(`Order status updated to ${order_status}`));
        }
    );
});


// ----------------------- EMPLOYEE DETAILS -----------------------

// GET /api/admin/employees - Get all active employees
router.get("/employees", adminAuth, (req, res) => {
    const query = `
        SELECT 
            user_id,
            name,
            email,
            phone,
            User_role,
           
            created_at
        FROM users 
        WHERE User_role IN ('EMPLOYEE', 'ADMIN') AND is_active = 1
        ORDER BY name
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            return res.send(apiError(err.message));
        }
        res.send(apiSuccess(results));
    });
});


// GET /api/admin/employees/inactive - Get inactive employees
router.get("/employees/inactive", adminAuth, (req, res) => {
    const query = `
        SELECT 
            user_id,
            name,
            email,
            phone,
            User_role,
            created_at
        FROM users 
        WHERE User_role IN ('EMPLOYEE', 'ADMIN') AND is_active = 0
        ORDER BY name
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            return res.send(apiError(err.message));
        }
        res.send(apiSuccess(results));
    });
});


// PATCH /api/admin/employees/:id/toggle - Activate/Deactivate employee
router.patch("/employees/:email/toggle", adminAuth, (req, res) => {
    // const userId = req.params.user_id;
    const user_email = req.params.email;
    const isActive = req.body.is_active; // should be 1 or 0
    
    const query = "UPDATE users SET is_active = ? WHERE email = ? AND User_role = 'EMPLOYEE'";
    
    // db.query(query, [isActive, userId], (err, result) => {
    db.query(query, [isActive, user_email],
        (err, results) => {
            if (err)
                return res.send(apiError(err.message))
            
            if (results.affectedRows !== 1)
                return res.send(apiError("User not found"))
            
        
        const message = isActive ? "Employee activated" : "Employee deactivated";
        res.send(apiSuccess({ message: message }));
    });
});

// PATCH /users/role/:user_id - Change user role (Admin only)
router.patch("/role/:user_id", (req, resp) => {
    const {role} = req.body
    const userId = req.params.user_id
    
    // Check if admin
    if(req.user && req.user.role !== 'ADMIN') {
        return resp.send(apiError("Access denied. Admin privileges required."))
    }
    
    if(!role || !['ADMIN', 'CUSTOMER'].includes(role)) {
        return resp.send(apiError("Valid role (ADMIN or CUSTOMER) is required"))
    }
    
    db.query("UPDATE users SET User_role=? WHERE user_id=?", [role, userId],
        (err, result) => {
            if(err)
                return resp.send(apiError(err.message))
            
            if(result.affectedRows !== 1)
                return resp.send(apiError("User not found"))
            
            resp.send(apiSuccess(`User role updated to ${role} successfully`))
        }
    )
})


// ----------------------- CUSTOMERS DETAILS -----------------------

// GET /api/admin/customers - Get all customers
router.get("/customers", adminAuth, (req, res) => {
    const query = `
        SELECT 
            user_id,
            name,
            email,
            phone,
            created_at,
            is_active
        FROM users 
        WHERE User_role = 'CUSTOMER'
        ORDER BY name
    `;
    
    db.query(query, (err, results) => {
        if (err) {
            return res.send(apiError(err.message));
        }
        res.send(apiSuccess(results));
    });
});

// GET /users/all - Get all users for admin
router.get("/all/users", (req, resp) => {
    // Check if user is admin
    if(req.user && req.user.role !== 'ADMIN') {
        return resp.send(apiError("Access denied. Admin privileges required."))
    }
    
    db.query("SELECT user_id, name, email, phone, User_role, is_active, created_at FROM users ORDER BY created_at DESC",
        (err, results) => {
            if(err)
                return resp.send(apiError(err.message))
            return resp.send(apiSuccess(results))
        }
    )
})


module.exports = router;

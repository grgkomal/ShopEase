//routes/orders
const db = require("../utils/dbpool");
const { apiSuccess, apiError } = require("../utils/apiresult");
const { jwtAuth, adminAuth } = require("../utils/jwtauth");
const express = require("express");
const router = express.Router();

// ======================= ORDER ROUTES =======================

// GET /orders - Get user's orders



// GET /orders/:order_id - Get specific order details



// POST /orders - Create new order from cart



module.exports = router;
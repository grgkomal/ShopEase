
//utils/jwtauth
const jwt = require("jsonwebtoken")

const JWT_SECRET = process.env.JWT_SECRET || "GroceryStoreManagementSystem"

// Create JWT token
function createToken(user) {
    const payload = { 
        id: user.id, 
        role: user.role,
        email: user.email
    }
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" })
    return token
}

// Verify JWT token
function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET)
        return decoded
    } catch (err) {
        console.log("Token verification failed:", err.message)
        return null
    }
}

// JWT authentication middleware
function jwtAuth(req, resp, next) {
    // URLs that don't require authentication
    const nonProtectedUrls = [
        "/users/signin", 
        "/users/signup",
        "/users/forgot-password",
        "/users/verify-otp",
        "/users/reset-password"
     ]
    
    // Check if current URL is in non-protected list
    const isProtectedRoute = !nonProtectedUrls.some(url => req.url.startsWith(url))
    
    if (!isProtectedRoute) {
        next()
        return
    }
    
    // Check for authorization header
    if (!req.headers.authorization) {
        return resp.status(403).json({
            status: "error",
            message: "Unauthorized Access - No authorization header"
        })
    }
    
    // Extract token from "Bearer <token>" format
    const authHeader = req.headers.authorization
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader
    
    // Verify the token
    const decoded = verifyToken(token)
    console.log("Incoming user token:", decoded)
    
    if (!decoded) {
        return resp.status(403).json({
            status: "error",
            message: "Unauthorized Access - Invalid or expired token"
        })
    }
    
    // Add user info to request object
    req.user = { 
        id: decoded.id, 
        role: decoded.role,
        email: decoded.email
    }
    
    next()
}

// Admin-only middleware
function adminAuth(req, resp, next) {
    if (!req.user || req.user.role !== 'ADMIN') {
        return resp.status(403).json({
            status: "error",
            message: "Access denied. Admin privileges required."
        })
    }
    next()
}

// User or Admin middleware (user can access their own data, admin can access all)
function userOrAdminAuth(req, resp, next) {
    const requestedUserId = req.params.user_id || req.params.id
    
    if (!req.user) {
        return resp.status(403).json({
            status: "error",
            message: "Authentication required"
        })
    }
    
    // Admin can access everything, user can only access their own data
    if (req.user.role === 'ADMIN' || req.user.id == requestedUserId) {
        next()
    } else {
        return resp.status(403).json({
            status: "error",
            message: "Access denied. You can only access your own data."
        })
    }
}

module.exports = {
    createToken,
    verifyToken,
    jwtAuth,
    adminAuth,
    userOrAdminAuth
}



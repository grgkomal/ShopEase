const db = require("./dbpool");

function logUserAction(userId, actionType, actionDetails, ipAddress, callback) {
    const query = `
        INSERT INTO user_logs (user_id, action_type, action_details, ip_address) 
        VALUES (?, ?, ?, ?)
    `;
    
    db.query(query, [userId, actionType, actionDetails, ipAddress], (err, result) => {
        if (err) {
            console.error('Failed to log user action:', err);
        }
        if (callback) callback(err, result);
    });
}


function getUserIP(req) {
    return req.ip || 
           req.connection?.remoteAddress || 
           req.socket?.remoteAddress ||
           (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
           '0.0.0.0';
}


function logUserActionAsync(userId, actionType, actionDetails, ipAddress) {
    return new Promise((resolve, reject) => {
        logUserAction(userId, actionType, actionDetails, ipAddress, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
}

function logUserActionFromRequest(req, userId, actionType, actionDetails, callback) {
    const userIP = getUserIP(req);
    logUserAction(userId, actionType, actionDetails, userIP, callback);
}

function logUserActionFromRequestAsync(req, userId, actionType, actionDetails) {
    const userIP = getUserIP(req);
    return logUserActionAsync(userId, actionType, actionDetails, userIP);
}

module.exports = {
    logUserAction,
    getUserIP,
    logUserActionAsync,
    logUserActionFromRequest,
    logUserActionFromRequestAsync
};

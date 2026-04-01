const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT
const protect = async (req, res, next) => {
    let token;

    // Check if token exists in headers
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];
            
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Get user from database (exclude password)
            const userId = decoded.id || decoded.userId;
            req.user = await User.findById(userId).select('-passwordHash -password');
            
            if (!req.user) {
                return res.status(401).json({ 
                    success: false,
                    message: 'User not found' 
                });
            }
            
            // Check if account is active
            if (req.user.isActive === false) {
                return res.status(403).json({ 
                    success: false,
                    message: 'Account is deactivated. Please contact support.' 
                });
            }
            
            // Add userId to request for convenience
            req.userId = req.user._id;
            
            next();
        } catch (error) {
            // Handle specific JWT errors
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ 
                    success: false,
                    message: 'Invalid token' 
                });
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    success: false,
                    message: 'Token expired' 
                });
            }
            
            return res.status(401).json({ 
                success: false,
                message: 'Not authorized, token failed' 
            });
        }
    }
    
    // If no token
    if (!token) {
        return res.status(401).json({ 
            success: false,
            message: 'Not authorized, no token' 
        });
    }
};

// Auth middleware (alternative)
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Please authenticate' 
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId || decoded.id;
        const user = await User.findById(userId).select('-passwordHash -password');
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'User not found' 
            });
        }
        
        if (user.isActive === false) {
            return res.status(403).json({ 
                success: false,
                message: 'Account is deactivated' 
            });
        }
        
        req.user = user;
        req.userId = user._id;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid token' 
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: 'Token expired' 
            });
        }
        
        res.status(401).json({ 
            success: false,
            message: 'Please authenticate' 
        });
    }
};

// Admin only middleware
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ 
            success: false,
            message: 'Not authorized as admin' 
        });
    }
};

// Super admin middleware
const superAdminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'super_admin') {
        next();
    } else {
        return res.status(403).json({ 
            success: false,
            message: 'Not authorized as super admin' 
        });
    }
};

// Role-based middleware
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                message: 'User not authenticated' 
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false,
                message: `Role (${req.user.role}) is not authorized to access this resource` 
            });
        }
        
        next();
    };
};

module.exports = { 
    protect, 
    adminOnly, 
    authMiddleware,
    superAdminOnly,
    authorizeRoles
};
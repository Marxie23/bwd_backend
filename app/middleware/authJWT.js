const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const config = require("../config/config");

const JWT_SECRET = config.SECRET_KEY || process.env.JWT_SECRET; // Fallback to environment variable if config is missing

const verifyToken = (req, res, next) => {

    try {
        if (!req.cookies.authToken) {
            return res.status(403).json({ message: 'Cookies are not available in the request' });
        }

        // Get the token from cookies
        const token = req.cookies.authToken;

        if (!token || token.trim() === '') {
            return res.status(403).json({ message: 'Access denied, no token provided' });
        }

        // Verify the token
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                const message = err.name === 'TokenExpiredError' 
                    ? 'Unauthorized, token has expired' 
                    : 'Unauthorized, token is invalid';
                return res.status(401).json({ message });
            }

            // Attach user information to the request object
            req.user = decoded;
            next(); // Proceed to the next middleware or route handler
        });
    } catch (error) {
        // Catch any unexpected errors
        console.error('Token verification error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = verifyToken;

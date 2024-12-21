const jwt = require('jsonwebtoken');
const User = require('../models/user');
const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key'; 


const generateToken = (userId) => {
    return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '1h' });
};

const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization') && req.header('Authorization').split(' ')[1];
    if (!token) {
        return res.status(403).send('Access denied');
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).send('Invalid or expired token');
        }
        req.userId = decoded.userId;
        next();
    });
};

module.exports = { generateToken, authenticateJWT };

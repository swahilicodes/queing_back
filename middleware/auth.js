// middleware/auth.js
const jwt = require('jsonwebtoken');
const { User } = require('../models/index'); // Assuming you have a User model in Sequelize

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  //const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('the token is ',req.headers)
  if (!token) {
    return res.sendStatus(401).json({ error: 'unauthorized' })
  }else{
    try {
        // Decode the token
        const decoded = jwt.verify(token, "swahili codes");
    
        // Fetch the user from the database
        const user = await User.findOne({
            where: {phone: decoded.phone}
        }); // Assuming userId is stored in the token
    
        if (!user) return res.sendStatus(404); // User not found
    
        // Add user to the request object
        req.user = user;
        next();
      } catch (err) {
        return res.sendStatus(403); // Forbidden
      }
  }
};

module.exports = authenticateToken;

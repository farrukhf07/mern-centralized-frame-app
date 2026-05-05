const User = require('../models/User');
var jwt = require('jsonwebtoken');
const TOKEN = process.env.JWT_SECRET;

const fetchbearuser = async (req, res, next)=>{
    // Get Authorization Token
    const authHeader = req.header('Authorization');

    if(!authHeader || !authHeader.startsWith('Bearer ')){
        return res.status(401).json({error:"Please authenticate using valid token"});
    }

    try {
        const token = authHeader.split(' ')[1];

        const data = jwt.verify(token, TOKEN);
        const userData = await User.findById(data.user.id)
        req.user = userData;
        
        next();
    } catch (error) {
        return res.status(401).json({error:"Please authenticate using a valid token"});
    }
}

module.exports = fetchbearuser;
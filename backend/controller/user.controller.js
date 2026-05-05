const User = require('../models/User');

// Get User
exports.getAllUsers = async (req, res) => {
    try {
        // Current user ID from middleware
        const currentUserId = req.user.id;
        // Find all users except passwords
        const users = await User.find().select("-password");
        // exclude current user from list
        const filteredUsers = users.filter(user => user._id.toString() !== currentUserId);
        res.json(filteredUsers);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
};

// Update User
exports.updateUser = async(req, res) => {
    try {
        const userId = req.params.userId;
        const {name, role, excess} = req.body;
        // only admin is allowed
        if(req.user.role !== 'admin'){
            return res.status(403).json({sucess:false, message:"Only admin can update users"});
        }
        if(!userId){
            return res.status(400).json({sucess:false, message:"Invalid user ID"});
        }
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({sucess:false, message:"User not found"});
        }
        // update feilds if provided
        if(name !== undefined) user.name = name;
        if(role !== undefined){
            const allowedRoles = ['admin', 'manager', 'user'];
            if(!allowedRoles.includes(role)){
                return res.status(400).json({sucess:false, message:"Invalid Role"});
            }
            user.role = role
        }
        // update assigned app
        if(Array.isArray(excess)){
            user.excess = excess;
        }
        await user.save();
        res.json({sucess:true, message:"User updated sucessfully", user});
    } catch (error) {
        console.error(error);
        res.status(500).json({sucess:false, message:"Internal Server Error"});
    }
};

// fetch Role
exports.fetchRole = async (req, res)=> {
    try {
        let currentUser = req.user.id;
        const user = await User.findById(currentUser).select("-password");
        res.status(200).json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }
};

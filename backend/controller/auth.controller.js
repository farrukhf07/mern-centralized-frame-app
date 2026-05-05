const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
// gmail Login
// const {OAuth2Client} = require('google-auth-library');
// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const TOKEN = process.env.JWT_SECRET;

// Create new User
exports.createUser = async (req, res) => {
    try {
        let { name, email, password } = req.body;

        let user = await User.findOne({ email });

        if (user) {
            return res.status(400).json({ error: "Sorry, user already exists" });
        }

        const salt = await bcrypt.genSalt(8);
        const secPass = await bcrypt.hash(password, salt);

        user = await User.create({
            name,
            email,
            password: secPass
        });

        const data = {
            user: {
                id: user._id
            }
        };

        const authToken = jwt.sign(data, process.env.JWT_SECRET);

        res.status(201).json({ success: true, authToken });

    } catch (error) {
        console.error("Error in createUser:", error);
        res.status(500).json({ error: error.message });
    }
};

// Login User
exports.loginUser = async (req, res)=>{
    let{email, password} = req.body;
    try {
        let user = await User.findOne({email});
        if(!user){
            return res.status(400).json({error:"Please Login with correct Email"});
        }
        const passwordCompare = await bcrypt.compare(password, user.password)
        if(!passwordCompare){
            return res.status(400).json({error:"Please enter correct credentials"});
        }
        // if correct password
        const payload = {
            user:{
                id: user.id
            }
        }
        const authtoken = jwt.sign(payload, TOKEN);
        const retUser = await User.findById(user.id).select("-password -_id")
        res.json({authtoken, retUser});
    } catch (error) {
        console.log(error.message);
        re.status(500).send("Internal Server Error");
    }
};

exports.deleteUser = async (req, res) => {
    try {
        // Assuming the ID comes from the URL parameters (e.g., /deleteUser/:id)
        const userId = req.params.id;

        // 1. Check if user exists
        let user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        // 2. Delete the user
        await User.findByIdAndDelete(userId);

        // 3. Return success response
        res.status(200).json({ 
            success: true, 
            message: "User has been deleted successfully",
            deletedUserId: userId 
        });

    } catch (error) {
        console.error("Error in deleteUser:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

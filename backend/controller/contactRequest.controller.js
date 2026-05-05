const User = require('../models/User')
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const ContactRequest = require('../models/ContactRequest');

// Send email
exports.sendEmail = async (req, res)=>{
    try {
        const { firstName, lastName, email, phone, message} = req.body;
        if(!firstName || !lastName || !email){
            return res.status(400).json({success:false, message:"Unauthorized"});
        }
        // save in mongoDB
        console.log("ContactRequest:", ContactRequest);
        const contactRequest = new ContactRequest({
            firstName,
            lastName,
            email,
            phone,
            message
        });
        await contactRequest.save();
        // create transporter (Gmail)
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true, // true for 465, false for 587
            auth:{
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        // Email option
        const mailOptions = {
            from: process.env.EMAIL_USER, // sender (me)
            to: 'farukh.ahmad@ozitechnology.com', // receiver (me)
            replyTo: email,
            subject: "New Contact Form Submission",
            html:`
            <h2>📩 New Request</h2>
            <p><strong>First Name:</strong> ${firstName}</p>
            <p><strong>Last Name:</strong> ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || "N/A"}</p>
            <p><strong>Message:</strong> ${message || "N/A"}</p>
            `,
        };
        // send email
        await transporter.sendMail(mailOptions);
        return res.status(200).json({success:true, message:"Email sent sucessfully"});
    } catch (error) {
        console.error("Email Error:", error);
        return res.status(500).json({success:false, message:"Failed to send email", error:error.message});
    }
};

// get All request
exports.getAllRequests = async (req, res) =>{
    try {
        const requests = await ContactRequest.find().sort({createdAt: -1});
        res.json(requests);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// accept request
exports.acceptRequest = async (req, res) => {
    try {
        const { id } = req.params;

        const request = await ContactRequest.findById(id);

        if (!request) {
            return res.status(404).json({ error: "Request not found" });
        }

        const existingUser = await User.findOne({ email: request.email });

        let password;
        if (!existingUser) {
            // generate random password
            password = Math.random().toString(36).slice(-8);
            // hash password
            const salt = await bcrypt.genSalt(8);
            const secPass = await bcrypt.hash(password, salt);
            // create user
            await User.create({
                name: `${request.firstName} ${request.lastName}`,
                email: request.email,
                password: secPass
            });
        }

        // send email to user
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: request.email,
            subject: "Account Approved",
            html: existingUser
                ? `
                <h2>Your Request is Approved ✅</h2>
                <p>Your email (${request.email}) already has an account.</p>
                <p>Please sign in with your existing credentials. If you forgot your password, use the password reset option.</p>
            `
                : `
                <h2>Your Account is Approved ✅</h2>
                <p>Email: ${request.email}</p>
                <p>Password: ${password}</p>
            `
        });

        // update status
        request.status = "accepted";
        await request.save();

        res.json({
            success: true,
            message: existingUser ? "Request accepted & confirmation email sent" : "Request accepted & user created"
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// reject request
exports.rejectRequest = async (req, res) =>{
    try {
        const {id} = req.params;
        await ContactRequest.findByIdAndUpdate(id, {
            status: 'rejected'
        });
        res.json({success:true});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

// delete  request
exports.deleteRequest = async(req, res) =>{
    try {
        const id = req.params.id;
        const request = await ContactRequest.findByIdAndDelete(id);
        if(!request) return res.status(404).json({success:false});

        return res.status(200).json({success:true});
    } catch (error) {
        return res.status(500).json({error:error.message})
    }
};
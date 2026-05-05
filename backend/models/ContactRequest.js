const mongoose = require('mongoose');
const {Schema} = mongoose;

const ContactRequest = new Schema({
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    interest: String,
    message: String,
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    },
    createdAt:{
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('contactRequests', ContactRequest);
const mongoose = require('mongoose');
const {Schema} = mongoose;

const User = new Schema({
    name:{
        type: String,
        required: true,
        default: ""
    },
    email:{
        type: String,
        required: true,
        unique: true,
        default: ""
    },
    password:{
        type: String,
        default: ""
    },
    role:{
        type: String,
        default: "user"
    },
    excess:{
        type: [],
        default: []
    }
}
);

module.exports = mongoose.model('users', User);
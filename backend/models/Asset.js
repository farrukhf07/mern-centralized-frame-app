const mongoose = require('mongoose');
const {Schema} = mongoose;

const AssetSchema = new Schema({
    name:{
        type: String,
        default: ""
    },
    categoryId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "categories"
    },
    tag:{
        type: Array,
        default: []
    },
    image:{
        type: String,
        default: ""
    },
    thumbnail:{
        type: String,
        default: ""
    },
    isEnable:{
        type: Boolean,
        default: false
    },
    isPremium:{
        type: Boolean,
        default: false
    },
    sequence:{
        type: Number,
        default: 0
    },
    views:{
        type: Number,
        default:0
    },
    downloads:{
        type: Number,
        default: 0
    },
    width:{
        type: Number,
        default:0
    },
    height:{
        type: Number,
        default: 0
    },
    coordinates: {
        type: [{
            name: { type: String, default: '' },
            x: { type: Number, default: 0 },
            y: { type: Number, default: 0 },
            height: { type: Number, default: 0 },
            width: { type: Number, default: 0 },
            rotation: { type: Number, default: 0 },
            elevation: { type: Number, default: 0 }
        }],
        default: []
    },
    customFields:{}
}
);

module.exports = mongoose.model('assets', AssetSchema);
const mongoose = require('mongoose');
const {Schema} = mongoose;

const CategorySchema = new Schema({
    name:{
        type: String,
        default: ""
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
        default: 0
    },
    downloads:{
        type: Number,
        default: 0
    },
    customFields:{
        type: Map,
        of: Schema.Types.Mixed,
        default:{}
    }
}
);

module.exports = mongoose.model('categories', CategorySchema);
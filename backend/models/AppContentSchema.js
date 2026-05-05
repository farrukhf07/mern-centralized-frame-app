const mongoose = require('mongoose');
const { Schema } = mongoose;

const AppContentSchema = new Schema({
    appId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "apps",
        required: true,
        unique: true
    },
    selections: [{
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "categories",
            required: true
        },
        // CHANGED: Added isDeleted for Category level
        isDeleted: { 
            type: Boolean, 
            default: false 
        },
        // CHANGED: Assets is now an array of objects to store the flag
        assets: [{
            assetId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "assets"
            },
            isDeleted: { 
                type: Boolean, 
                default: false 
            }
        }]
    }]
});

module.exports = mongoose.model('appContents', AppContentSchema);
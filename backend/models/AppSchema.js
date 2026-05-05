const mongoose = require("mongoose");
const { Schema } = mongoose;

const AppSchema = new Schema({
  name: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    default: ""
  },
  bundleId: {
    type: String,
    // unique: true,
    // sparse: true,
    default: ""
  },

  categories: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "categories"
    }
  ]

});

module.exports = mongoose.model("apps", AppSchema);
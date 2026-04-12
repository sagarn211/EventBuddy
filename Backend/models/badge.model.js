const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema(
{
    name:{
        type: String,
        required: true,
    },

    icon: {
        type: String,
    },

    description: {
        type:String,
    },

    conditionType: {
        type: String,
        enum: ["plans_joined", "plans_created", "rating"],
    },
},
{ timestamps: true }
);

module.exports = mongoose.model("Badge", badgeSchema);
const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true
        },
        description: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        type: {
            type: String,
            enum: ["House", "Apartment", "Villa", "Condo", "Land"],
            required: true
        },
        status: {
            type: String,
            enum: ["For Sale", "For Rent"],
            required: true
        },
        bedrooms: {
            type: Number,
            default: 0
        },
        bathrooms: {
            type: Number,
            default: 0
        },
        area: {
            type: Number,
            required: true
        },
        location: {
            type: String,
            required: true,
            trim: true
        },
        address: String,
        images: [
            {
                type: String
            }
        ],
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

propertySchema.index({ title: "text", location: "text", description: "text" });

module.exports = mongoose.model("Property", propertySchema);

const mongoose = require("mongoose");

const validPageTypes = ["landing", "faq", "about", "privacy", "terms", "contact"];

const contentSchema = new mongoose.Schema(
    {
        pageType: {
            type: String,
            required: true,
            unique: true,
            enum: validPageTypes,
        },
        data: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Content", contentSchema);
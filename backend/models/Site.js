const mongoose = require('mongoose');

const SiteSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    subdomain: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    folder: {
        type: String,
        required: false, // Made optional for dynamic leaf pages
        trim: true
    },
    leafPageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LeafPage',
        required: false // Optional if using legacy folder templates
    },
    pixelCode: {
        type: String,
        trim: true
    },
    metaPixelId: {
        type: String,
        trim: true
    },
    metaAccessToken: {
        type: String,
        trim: true
    },
    metaTestCode: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Site', SiteSchema);

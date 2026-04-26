const mongoose = require('mongoose');

const componentSchema = new mongoose.Schema({
    id: { type: String }, // Make optional to prevent validation errors if frontend doesn't send it
    type: { type: String, enum: ['image', 'form', 'trust_banner'], required: true },
    content: { type: String }
});

const LeafPageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    pixelCode: {
        type: String,
        trim: true
    },
    tiktokPixelId: {
        type: String,
        trim: true
    },
    tiktokAccessToken: {
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
    productName: { type: String, trim: true },
    productPrice: { type: Number, default: 0 },
    productId: { type: Number, default: null },
    products: [{
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, default: 0 },
        image: { type: String }, // NEW: Image for the package
        isDefault: { type: Boolean, default: false },
        productId: { type: Number, default: null } // Legacy product_id reference
    }],
    siteId: { type: String, default: null },
    phone: { type: String, default: '' },
    mainImage: { type: String, trim: true }, // NEW: Specific thumbnail for products page
    components: [componentSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('LeafPage', LeafPageSchema);

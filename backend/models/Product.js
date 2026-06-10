const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    cost: { type: Number, default: 0 }, // Ürün maliyeti (alış/üretim)
    code: { type: String, default: '' },
    stock: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    urun_paketler: { type: String, default: '[]' }, // Stored as JSON string
    shopifyProductId: { type: String, default: null },
    shopifyVariantId: { type: String, default: null },
    shopifyTitle: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);

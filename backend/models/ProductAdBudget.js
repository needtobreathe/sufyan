const mongoose = require('mongoose');

const ProductAdBudgetSchema = new mongoose.Schema({
    date: { type: String, required: true, index: true },       // "2026-04-12"
    productName: { type: String, required: true, index: true }, // Ürün adı
    amount: { type: Number, required: true, default: 0 },      // Reklam harcaması (₺)
    createdBy: { type: String, default: 'Admin' }
}, { timestamps: true });

ProductAdBudgetSchema.index({ date: 1, productName: 1 }, { unique: true });

module.exports = mongoose.model('ProductAdBudget', ProductAdBudgetSchema);

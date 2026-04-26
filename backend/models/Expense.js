const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
    date: { type: String, required: true, index: true }, // "2026-04-12" formatında
    category: { 
        type: String, 
        required: true,
        enum: ['Reklam', 'Kargo', 'Personel', 'Fatura', 'Ürün Alımı', 'Ofis/Kira', 'Vergi', 'Diğer']
    },
    description: { type: String, default: '' },
    amount: { type: Number, required: true, default: 0 },
    createdBy: { type: String, default: 'Admin' }
}, { timestamps: true });

ExpenseSchema.index({ date: 1, category: 1 });

module.exports = mongoose.model('Expense', ExpenseSchema);

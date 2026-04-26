const mongoose = require('mongoose');

const paymentMethodSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g. "Kapıda Nakit Ödeme", "Kapıda Kredi Kartı", "Havale/EFT"
    description: { type: String, default: null },
    status: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);

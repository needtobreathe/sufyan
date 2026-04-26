const mongoose = require('mongoose');

const shippingCompanySchema = new mongoose.Schema({
    name: { type: String, required: true },
    logo: { type: String, default: null },
    trackingUrl: { type: String, default: null }, // URL pattern for tracking orders
    status: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('ShippingCompany', shippingCompanySchema);

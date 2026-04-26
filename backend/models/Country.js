const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String }, // e.g., 'TR'
    status: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Country', countrySchema);

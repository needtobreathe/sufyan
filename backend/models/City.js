const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
    country_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Country', required: true },
    name: { type: String, required: true },
    code: { type: String }, // e.g. license plate or region code
    status: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('City', citySchema);

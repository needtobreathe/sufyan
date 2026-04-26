const mongoose = require('mongoose');

const districtSchema = new mongoose.Schema({
    city_id: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
    name: { type: String, required: true },
    status: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('District', districtSchema);

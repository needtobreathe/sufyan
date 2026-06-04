const mongoose = require('mongoose');

const BannedIpSchema = new mongoose.Schema({
    ip: { type: String, required: true, unique: true, index: true },
    reason: { type: String },
    createdBy: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BannedIp', BannedIpSchema);

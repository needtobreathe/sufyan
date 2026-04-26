const mongoose = require('mongoose');

const DailyStatSchema = new mongoose.Schema({
    date: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
    site_id: { type: String, index: true }, // Optional site identifier
    visitors: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// Compound index for efficient lookup of a specific site's performance on a specific day
DailyStatSchema.index({ date: 1, site_id: 1 }, { unique: true });

module.exports = mongoose.model('DailyStat', DailyStatSchema);

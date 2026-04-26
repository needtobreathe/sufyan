const mongoose = require('mongoose');

const EventLogSchema = new mongoose.Schema({
    site_id: { type: String, index: true }, // NEW: Track which site this event belongs to
    device_id: { type: String, required: true, index: true },
    session_id: { type: String, required: true },
    ip_address: { type: String }, // NEW: Track IP Address
    visit_count: { type: Number, default: 1 },
    event_name: { type: String, required: true, index: true },
    timestamp: { type: Date, default: Date.now },
    data: { type: mongoose.Schema.Types.Mixed } // Flexible object for arbitrary analytics data
}, { timestamps: true });

EventLogSchema.index({ timestamp: -1 });
EventLogSchema.index({ createdAt: -1 });
EventLogSchema.index({ event_name: 1, timestamp: -1 });

module.exports = mongoose.model('EventLog', EventLogSchema);

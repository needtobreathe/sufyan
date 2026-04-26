const mongoose = require('mongoose');

const OrderLogSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    action: { type: String, required: true }, // e.g. 'created', 'status_changed', 'updated'
    changedBy: { type: String, default: 'Admin' },
    details: { type: String }, // e.g. "Durum: Yeni Sipariş → Onaylandı"
    batchId: { type: String, index: true },
    metadata: { type: Object }, // e.g. { oldStatus: '...', revenue: 100 }
    isReverted: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('OrderLog', OrderLogSchema);

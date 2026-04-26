const mongoose = require('mongoose');

const OrderLockSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        index: true
    },
    userId: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 } // TTL index
    }
}, { timestamps: true });

// Ensure one user can only have one lock at a time if needed, 
// or one order can only have one lock.
// For "Who's viewing?", multiple people could view, but usually we want to know "is someone else here?".
// Let's allow multiple locks per order, but only one per user-order pair.
OrderLockSchema.index({ orderId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('OrderLock', OrderLockSchema);

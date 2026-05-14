const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    site_id: { type: String, index: true }, 
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    province: { type: String, required: true },
    district: { type: String },
    address: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    items: [{
        name: String,
        qty: Number,
        price: Number,
        sku: String
    }],
    device_id: { type: String, index: true }, 
    ip_address: { type: String }, 
    status: { 
        type: String, 
        default: 'pending', 
        enum: ['pending', 'approved', 'preparing', 'shipped', 'delivered', 'cancelled', 'returned', 'future', 'test', 'social', 'facebook', 'instagram'] 
    },
    processedBy: { type: String }, 
    processedAt: { type: Date },   
    futureDate: { type: String },  
    totalPrice: { type: Number, default: 0 },
    referer: { type: String }, // NEW: The actual domain site came from
    externalId: { type: String, index: true }, // Legacy ID if migrated
    source: { type: String, default: 'local' } // 'local' or 'legacy'
}, { timestamps: true });

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ updatedAt: -1 });
OrderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', OrderSchema);

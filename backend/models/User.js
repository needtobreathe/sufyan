const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Make sure to npm install bcrypt if not present!

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    role: { type: String, required: true, default: 'staff' }, // 'admin', 'staff', etc.
    status: { type: Number, default: 1 }, // 1: active, 0: inactive
    ntfyTopic: { type: String, default: '' }, // Her cihaz/personel için ayrı bildirim kanalı
}, { timestamps: true });

// Pre-save hook to hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to verify password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

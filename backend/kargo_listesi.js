require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

const OrderSchema = new mongoose.Schema({
    fullName: String,
    status: String,
}, { timestamps: true, strict: false });

const Order = mongoose.model('Order', OrderSchema);

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sufyan-yaprak' });
        console.log('✅ DB bağlandı...');

        const orders = await Order.find(
            { status: { $in: ['shipped', '5'] } },
            { fullName: 1, _id: 0 }
        ).sort({ createdAt: -1 });

        const names = orders.map(o => o.fullName).filter(Boolean);
        const output = names.join('\n');

        const filePath = __dirname + '/kalan_kargolar.txt';
        fs.writeFileSync(filePath, output, 'utf-8');

        console.log(`✅ Şu an sistemde kargoda olup teslim edilmemiş olan ${names.length} müşteri bulundu.`);
        console.log(`📄 Dosya oluşturuldu: ${filePath}`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
})();

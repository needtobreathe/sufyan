require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');

const OrderSchema = new mongoose.Schema({
    fullName: String,
    status: String,
    cancellationReason: String
}, { timestamps: true, strict: false });

const Order = mongoose.model('Order', OrderSchema);

// Tüm isimleri küçük harfe çevirip, boşlukları ve Türkçe karakterleri normalize eden fonksiyon
function normalizeName(str) {
    if (!str) return '';
    return str
        .toLowerCase()
        .replace(/i̇/g, 'i')  // İ'nin küçültülmüş hali bazen i̇ olur
        .replace(/i/g, 'i')
        .replace(/ı/g, 'i')  // I ve İ karmaşasını engellemek için
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, ''); // Boşlukları ve özel karakterleri sil
}

(async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sufyan-yaprak' });
        console.log('✅ DB bağlandı, veriler gelişmiş isim taraması ile işleniyor...');

        const rawData = fs.readFileSync(__dirname + '/durumlar.json', 'utf-8');
        const data = JSON.parse(rawData);

        // Sisteme fazla yüklenmemek ve esnek arama yapmak için tüm siparişleri hafızaya alıyoruz
        const allOrders = await Order.find({}).sort({ createdAt: -1 });

        let updateCount = 0;
        let notFoundCount = 0;
        let alreadyMatchedCount = 0;

        for (const item of data) {
            const alici = (item.alici || "").trim();
            const durumId = item.durum_id;

            let newStatus = null;
            if (durumId === "5") {
                newStatus = "delivered";
            } else if (durumId === "6") {
                newStatus = "returned";
            }

            if (newStatus && alici) {
                const searchName = normalizeName(alici);
                
                // Müşterinin öncelikle (Teslim edildi veya İade durumunda) OLMAYAN güncel bir siparişini buluyoruz
                let order = allOrders.find(o => 
                    normalizeName(o.fullName) === searchName && 
                    o.status !== 'delivered' && o.status !== 'returned'
                );
                
                // Yoksa, herhangi bir siparişine bakıyoruz (zaten güncellenmiş mi diye kontrol etmek için)
                if (!order) {
                     order = allOrders.find(o => normalizeName(o.fullName) === searchName);
                }

                if (order) {
                    if (order.status !== newStatus) {
                        order.status = newStatus;
                        if (newStatus === "returned") {
                           order.cancellationReason = "Durum Güncelleme Botu (Gelişmiş Eşleşme ile)"; 
                        }
                        await order.save();
                        updateCount++;
                    } else {
                        alreadyMatchedCount++;
                    }
                } else {
                    notFoundCount++;
                    console.log('⚠️ Bulunamadı:', alici);
                }
            }
        }

        console.log('\n--- İKİNCİ TARAMA RAPORU ---');
        console.log(`✅ Ekstra güncellenen sipariş: ${updateCount}`);
        console.log(`ℹ️ Zaten durumu ayarlanmış siparişler: ${alreadyMatchedCount}`);
        console.log(`❌ Ne yaparsam yapayım eşleşmeyen: ${notFoundCount}`);
        
    } catch (e) {
        console.error('HATA OLUŞTU:', e);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
})();

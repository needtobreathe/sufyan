require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Order = require('../models/Order');

// Database URI fallback
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://admin_samet:r3r3EJlfhULHw74wrR66@194.146.36.252:27017/sufyan-yaprak?authSource=admin";

const shop = process.argv[2] || process.env.SHOPIFY_SHOP_NAME;
const token = process.argv[3] || process.env.SHOPIFY_ACCESS_TOKEN;

if (!shop || !token) {
    console.error("❌ HATA: Lütfen Shopify mağaza adını ve erişim token'ını belirtin.");
    console.error("Kullanım: node scratch/import_shopify_orders.js <magaza_adi.myshopify.com> <shpat_access_token>");
    console.error("Veya .env dosyasına SHOPIFY_SHOP_NAME ve SHOPIFY_ACCESS_TOKEN ekleyin.");
    process.exit(1);
}

// Clean shop name (remove https://, / etc)
const cleanShop = shop.replace(/^https?:\/\//, '').replace(/\/$/, '');

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log("🔌 MongoDB Bağlantısı Başarılı.");
        await importOrders();
        process.exit(0);
    })
    .catch(err => {
        console.error("❌ MongoDB Bağlantı Hatası:", err);
        process.exit(1);
    });

async function importOrders() {
    try {
        // Son 7 günün tarihini al (ISO formatında)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const dateMin = sevenDaysAgo.toISOString();

        console.log(`📡 Shopify'dan ${dateMin} tarihinden sonraki siparişler çekiliyor...`);

        // Shopify REST API URL
        const url = `https://${cleanShop}/admin/api/2024-04/orders.json?status=any&created_at_min=${dateMin}&limit=250`;

        const response = await axios.get(url, {
            headers: {
                'X-Shopify-Access-Token': token,
                'Content-Type': 'application/json'
            }
        });

        const shopifyOrders = response.data.orders || [];
        console.log(`📦 Toplam ${shopifyOrders.length} adet Shopify siparişi bulundu.`);

        let newOrdersCount = 0;
        let duplicateOrdersCount = 0;

        for (const s of shopifyOrders) {
            const uniqueDeviceId = s.name ? `shopify_${s.name}` : `shopify_${s.id}`;

            // Daha önce bu siparişi kaydettik mi kontrol edelim
            const existing = await Order.findOne({ device_id: uniqueDeviceId });
            if (existing) {
                duplicateOrdersCount++;
                continue;
            }

            // Telefon No Temizleme & Formatlama
            let phone = s.shipping_address?.phone || s.phone || s.customer?.phone || '';
            phone = phone.replace(/[^0-9]/g, '');
            if (phone.startsWith('905')) {
                phone = '0' + phone.substring(2);
            } else if (phone.startsWith('5')) {
                phone = '0' + phone;
            }

            // İsim Soyisim
            const first = s.shipping_address?.first_name || '';
            const last = s.shipping_address?.last_name || '';
            const fullName = `${first} ${last}`.trim() || s.customer?.first_name || 'İsimsiz Müşteri';

            // İl / İlçe
            const province = s.shipping_address?.province || 'Belirtilmedi';
            const district = s.shipping_address?.city || 'Belirtilmedi';

            // Adres
            const addr1 = s.shipping_address?.address1 || '';
            const addr2 = s.shipping_address?.address2 || '';
            const address = `${addr1} ${addr2}`.trim() || 'Adres belirtilmedi';

            // Ödeme Yöntemi
            let paymentMethod = 'Kapıda Nakit';
            const gateways = s.payment_gateway_names || [];
            if (gateways.some(g => g.toLowerCase().includes('cash') || g.toLowerCase().includes('cod'))) {
                paymentMethod = 'Kapıda Nakit';
            } else if (gateways.length > 0) {
                paymentMethod = 'Online Kredi Kartı';
            }

            // Sepet / Ürünler
            const items = (s.line_items || []).map(item => ({
                name: item.title + (item.variant_title ? ` (${item.variant_title})` : ''),
                qty: Number(item.quantity || 1),
                price: Number(item.price || 0)
            }));

            // Siparişi Oluştur
            const newOrder = new Order({
                fullName,
                phone,
                province,
                district,
                address,
                paymentMethod,
                site_id: 'shopify',
                referer: '',
                items,
                device_id: uniqueDeviceId,
                ip_address: s.browser_ip || 'shopify_import',
                status: 'pending',
                totalPrice: Number(s.current_total_price || s.total_price || 0),
                source: 'local',
                createdAt: new Date(s.created_at) // Orijinal sipariş tarihini koru
            });

            await newOrder.save();
            newOrdersCount++;
        }

        console.log(`🎉 Aktarım tamamlandı!`);
        console.log(`🆕 Yeni Eklenen Sipariş: ${newOrdersCount}`);
        console.log(`🔁 Es Geçilen (Mükerrer): ${duplicateOrdersCount}`);

    } catch (err) {
        console.error("❌ Shopify API veya veri aktarım hatası:", err.response?.data || err.message);
    }
}

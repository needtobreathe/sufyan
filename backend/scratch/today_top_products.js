const mongoose = require('mongoose');

async function todayTopProducts() {
  try {
    await mongoose.connect('mongodb://admin_samet:r3r3EJlfhULHw74wrR66@194.146.36.252:27017/sufyan-yaprak?authSource=admin');
    const db = mongoose.connection.db;
    const Order = db.collection('orders');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const orders = await Order.find({ createdAt: { $gte: todayStart } }).toArray();

    const stats = {};
    let totalRevenue = 0;
    let totalOrders = orders.length;

    orders.forEach(order => {
      let orderTotal = 0;
      (order.items || []).forEach(item => {
        const rev = (item.price || 0) * (item.qty || 1);
        orderTotal += rev;
        if (!stats[item.name]) stats[item.name] = { qty: 0, revenue: 0, orders: 0 };
        stats[item.name].qty += item.qty || 1;
        stats[item.name].revenue += rev;
        stats[item.name].orders += 1;
      });
      totalRevenue += orderTotal;
    });

    const sorted = Object.entries(stats).sort((a, b) => b[1].revenue - a[1].revenue);

    console.log(`\n📦 BUGÜN (${todayStart.toLocaleDateString('tr-TR')}) ÜRÜN BAZLI ANALİZ`);
    console.log(`Toplam Sipariş: ${totalOrders} | Toplam Ciro: ₺${totalRevenue.toLocaleString('tr-TR')} | Ort. Sepet: ₺${(totalRevenue/totalOrders).toFixed(0)}`);
    console.log('─'.repeat(70));
    sorted.forEach(([name, s]) => {
      const unitPrice = Math.round(s.revenue / s.qty);
      console.log(`📦 ${name}`);
      console.log(`   Sipariş: ${s.orders} | Adet: ${s.qty} | Birim: ₺${unitPrice.toLocaleString('tr-TR')} | Toplam: ₺${s.revenue.toLocaleString('tr-TR')}`);
    });
    console.log('─'.repeat(70));
  } catch (err) {
    console.error('Hata:', err);
  } finally {
    process.exit(0);
  }
}

todayTopProducts();

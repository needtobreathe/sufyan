const mongoose = require('mongoose');

async function verifyStats() {
  try {
    await mongoose.connect('mongodb://admin_samet:r3r3EJlfhULHw74wrR66@194.146.36.252:27017/sufyan-yaprak?authSource=admin');
    const Order = mongoose.connection.db.collection('orders');

    const now = new Date();

    // Today (TR timezone)
    const todayStart = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Istanbul' }));
    todayStart.setHours(0, 0, 0, 0);

    // Yesterday
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(todayStart);

    // This week (Sunday start)
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - todayStart.getDay());

    // This month
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    const CANCELLED = ['cancelled', '9', '10', '11', 'deleted'];

    async function getStats(start, end) {
      const q = end ? { createdAt: { $gte: start, $lt: end } } : { createdAt: { $gte: start } };
      const orders = await Order.find(q).toArray();
      let revenue = 0;
      orders.forEach(o => {
        if (!CANCELLED.includes(o.status)) {
          (o.items || []).forEach(i => { revenue += (i.price || 0) * (i.qty || 1); });
        }
      });
      const cancelled = orders.filter(o => CANCELLED.includes(o.status)).length;
      const shipped = orders.filter(o => ['shipped', '5', 'delivered', '12'].includes(o.status)).length;
      return { count: orders.length, revenue, cancelled, shipped };
    }

    const [today, yesterday, week, month] = await Promise.all([
      getStats(todayStart),
      getStats(yesterdayStart, yesterdayEnd),
      getStats(weekStart),
      getStats(monthStart),
    ]);

    const fmt = n => '₺' + Math.round(n).toLocaleString('tr-TR');
    const print = (label, s) => {
      console.log(`\n${label}`);
      console.log(`  Sipariş: ${s.count} | Ciro: ${fmt(s.revenue)} | İptal: ${s.cancelled} | Kargoda: ${s.shipped}`);
      console.log(`  Ort. Sepet: ${s.count > 0 ? fmt(s.revenue / s.count) : '₺0'}`);
    };

    console.log(`\n📅 Tarihler: Bugün=${todayStart.toISOString().split('T')[0]} | Haftabaşı=${weekStart.toISOString().split('T')[0]} | Aybaşı=${monthStart.toISOString().split('T')[0]}`);
    print('BUGÜN', today);
    print('DÜN', yesterday);
    print('HAFTALIK (hafta başından bugüne)', week);
    print('AYLIK', month);

    console.log('\n--- KONTROL ---');
    console.log(`Hafta - Bugün - Dün = ${week.count - today.count - yesterday.count} sipariş (diğer günler)`);
    console.log(`Ay - Hafta = ${month.count - week.count} sipariş (bu haftadan önceki günler)`);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

verifyStats();

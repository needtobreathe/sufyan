const mongoose = require('mongoose');

// Product we want to exclude
const EXCLUDED = "KİMMER 7'LI SET"; // exact name as in DB (case‑sensitive)

async function checkOtherOrders() {
  try {
    await mongoose.connect('mongodb://admin_samet:r3r3EJlfhULHw74wrR66@194.146.36.252:27017/sufyan-yaprak?authSource=admin');
    const Order = mongoose.connection.db.collection('orders');

    // Find orders that have at least one item whose name is NOT the excluded product
    const cursor = Order.find({
      items: { $elemMatch: { name: { $ne: EXCLUDED } } }
    });

    const orders = await cursor.toArray();
    if (orders.length === 0) {
      console.log('KİMMER 7\'LI SET dışındaki ürünlerden sipariş bulunamadı.');
      process.exit(0);
    }

    console.log(`Toplam ${orders.length} sipariş, KİMMER 7'LI SET dışındaki ürünlerden:`);
    const productSet = new Set();
    orders.forEach(o => {
      o.items.forEach(i => {
        if (i.name !== EXCLUDED) productSet.add(i.name);
      });
    });
    console.log('Ürün çeşitleri:', Array.from(productSet).join(', '));
    console.log('\nDetaylı sipariş listesi:');
    orders.forEach(o => {
      console.log('---');
      console.log('ID:', o._id);
      console.log('Created:', o.createdAt);
      console.log('Site:', o.site_id);
      console.log('Items:', o.items.map(i => ({ name: i.name, qty: i.qty, price: i.price })));
      console.log('Status:', o.status);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkOtherOrders();

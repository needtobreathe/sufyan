const mongoose = require('mongoose');

async function checkItemStructure() {
  try {
    await mongoose.connect('mongodb://admin_samet:r3r3EJlfhULHw74wrR66@194.146.36.252:27017/sufyan-yaprak?authSource=admin');
    const Order = mongoose.connection.db.collection('orders');

    // Get 10 recent non-cancelled orders
    const orders = await Order.find(
      { status: { $nin: ['cancelled','9','10','11'] } }
    ).sort({ createdAt: -1 }).limit(10).toArray();

    orders.forEach(o => {
      console.log(`\n--- Sipariş: ${o._id} | totalPrice: ${o.totalPrice}`);
      (o.items || []).forEach(it => {
        const computed = it.price * (it.qty || 1);
        console.log(`  Item: ${it.name} | qty: ${it.qty} | price: ${it.price} | price*qty: ${computed}`);
      });
      const sumOfItems = (o.items || []).reduce((s, it) => s + (it.price || 0), 0);
      const sumOfItemsXqty = (o.items || []).reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);
      console.log(`  → Σ price (qty yok): ${sumOfItems} | Σ price*qty: ${sumOfItemsXqty} | totalPrice: ${o.totalPrice}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
checkItemStructure();

const mongoose = require('mongoose');

async function checkPlusOrders() {
  try {
    await mongoose.connect('mongodb://admin_samet:r3r3EJlfhULHw74wrR66@194.146.36.252:27017/sufyan-yaprak?authSource=admin');
    const Order = mongoose.connection.db.collection('orders');
    const now = new Date();
    const startOfToday = new Date(now.setHours(0,0,0,0));
    const orders = await Order.find({
      createdAt: { $gte: startOfToday },
      'items.name': { $regex: 'Plus', $options: 'i' }
    }).sort({ createdAt: -1 }).limit(10).toArray();
    console.log('Recent "Plus" orders today count:', orders.length);
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

checkPlusOrders();

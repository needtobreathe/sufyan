const mongoose = require('mongoose');

async function countNonPanelOrders() {
  try {
    // Connect to the same DB used by the app
    await mongoose.connect('mongodb://admin_samet:r3r3EJlfhULHw74wrR66@194.146.36.252:27017/sufyan-yaprak?authSource=admin');
    const db = mongoose.connection.db;
    const Product = db.collection('products');
    const Order = db.collection('orders');

    // Get all product names that exist in the panel (products collection)
    const productDocs = await Product.find({}, { name: 1 }).toArray();
    const panelNames = productDocs.map(p => p.name);

    // Find orders where at least one item name is NOT in panelNames
    const ordersCursor = Order.find({
      items: { $elemMatch: { name: { $nin: panelNames } } }
    }, { _id: 1 });
    const orders = await ordersCursor.toArray();
    const count = orders.length;
    console.log('Toplam sipariş (panelde olmayan ürünler):', count);
    // Optionally list distinct product names that caused the mismatch
    const productSet = new Set();
    orders.forEach(o => {
      o.items.forEach(i => {
        if (!panelNames.includes(i.name)) productSet.add(i.name);
      });
    });
    console.log('Bu siparişlerdeki panel dışı ürünler:', Array.from(productSet).join(', '));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

countNonPanelOrders();

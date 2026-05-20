const mongoose = require('mongoose');

async function deleteNonPanelOrders() {
  try {
    await mongoose.connect('mongodb://admin_samet:r3r3EJlfhULHw74wrR66@194.146.36.252:27017/sufyan-yaprak?authSource=admin');
    const db = mongoose.connection.db;
    const Product = db.collection('products');
    const Order = db.collection('orders');

    // Get all product names present in the panel (products collection)
    const panelProducts = await Product.find({}, { name: 1 }).toArray();
    const panelNames = panelProducts.map(p => p.name);

    // Delete orders that contain at least one item whose name is NOT in panelNames
    const result = await Order.deleteMany({
      items: { $elemMatch: { name: { $nin: panelNames } } }
    });

    console.log('Silinen sipariş sayısı:', result.deletedCount);
  } catch (err) {
    console.error('Hata:', err);
  } finally {
    process.exit(0);
  }
}

deleteNonPanelOrders();

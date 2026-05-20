const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function exportNonPanelOrders() {
  try {
    await mongoose.connect('mongodb://admin_samet:r3r3EJlfhULHw74wrR66@194.146.36.252:27017/sufyan-yaprak?authSource=admin');
    const db = mongoose.connection.db;
    const Product = db.collection('products');
    const Order = db.collection('orders');

    // Get product names present in panel
    const panelProducts = await Product.find({}, { name: 1 }).toArray();
    const panelNames = panelProducts.map(p => p.name);

    // Find orders containing at least one item not in panel
    const ordersCursor = Order.find({
      items: { $elemMatch: { name: { $nin: panelNames } } }
    });
    const orders = await ordersCursor.toArray();

    if (orders.length === 0) {
      console.log('Panelde olmayan ürünlerden sipariş bulunamadı.');
      return;
    }

    // Build CSV header
    const headers = ['OrderID','CreatedAt','Site','ItemName','Qty','Price','Status'];
    const rows = [];
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!panelNames.includes(item.name)) {
          rows.push([
            order._id.toString(),
            order.createdAt ? order.createdAt.toISOString() : '',
            order.site_id || '',
            item.name,
            item.qty || 0,
            item.price || 0,
            order.status || ''
          ].join(','));
        }
      });
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const outPath = path.join(__dirname, 'non_panel_orders.csv');
    fs.writeFileSync(outPath, csvContent, 'utf8');
    console.log('CSV oluşturuldu:', outPath);
  } catch (err) {
    console.error('Hata:', err);
  } finally {
    process.exit(0);
  }
}

exportNonPanelOrders();

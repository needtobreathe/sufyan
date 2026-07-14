const mongoose = require('mongoose');

async function main() {
  try {
    await mongoose.connect('mongodb://admin_samet:r3r3EJlfhULHw74wrR66@194.146.36.252:27017/sufyan-yaprak?authSource=admin');
    const Order = mongoose.connection.db.collection('orders');

    const siteIds = await Order.distinct('site_id');
    console.log('Distinct site_id values:', siteIds);

    const sources = await Order.distinct('source');
    console.log('Distinct source values:', sources);

    // Let's count some key site_ids or sources that might look like scpanel
    const scPanelCounts = await Order.countDocuments({ site_id: /sc/i });
    console.log('Count of orders with site_id matching /sc/i:', scPanelCounts);
    
    const scPanelDistinct = await Order.distinct('site_id', { site_id: /sc/i });
    console.log('Distinct site_id matching /sc/i:', scPanelDistinct);
    
    // Let's also check if there is an order count by status or something.
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

main();

const mongoose = require('mongoose');

async function check() {
    try {
        await mongoose.connect('mongodb://admin_samet:r3r3EJlfhULHw74wrR66@194.146.36.252:27017/sufyan-yaprak?authSource=admin');
        const Order = mongoose.connection.db.collection('orders');

        const now = new Date();
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));

        const todayOrders = await Order.find({
            createdAt: { $gte: startOfToday },
            status: { $nin: ['cancelled', '9', '10', '11', 'deleted'] }
        }).toArray();

        const totalCiro = todayOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
        console.log('Real Today Ciro:', totalCiro);
        console.log('Total Orders Count:', todayOrders.length);

        // Check a few today orders
        console.log('Sample today orders:');
        todayOrders.slice(0, 3).forEach(o => {
            console.log(`Order: ${o._id}, totalPrice: ${o.totalPrice}, status: ${o.status}, items:`, o.items);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();

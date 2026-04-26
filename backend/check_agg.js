const mongoose = require('mongoose');
const EventLog = require('./models/EventLog');
require('dotenv').config();

async function checkAgg() {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sufyan-yaprak' });
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));

    const todayVisitorsBySite = await EventLog.aggregate([
        { $match: { createdAt: { $gte: startOfToday }, event_name: 'page_view' } },
        { $group: { _id: "$site_id", count: { $addToSet: "$device_id" } } },
        { $project: { _id: 1, count: { $size: "$count" } } }
    ]);

    console.log('Today Visitors Aggregation Raw:', JSON.stringify(todayVisitorsBySite, null, 2));
    process.exit(0);
}

checkAgg();

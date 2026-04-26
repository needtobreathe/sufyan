const mongoose = require('mongoose');
const EventLog = require('./models/EventLog');
require('dotenv').config();

async function deepAnalyze() {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sufyan-yaprak' });
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));

    // Dashboard today aggregation grouped by RAW site_id
    const statsRaw = await EventLog.aggregate([
        { $match: { createdAt: { $gte: startOfToday }, event_name: 'page_view' } },
        { $group: { 
            _id: "$site_id", 
            unique_visitors: { $addToSet: "$device_id" }
        } },
        { $project: { _id: 1, count: { $size: "$unique_visitors" } } }
    ]);

    console.log('--- ALL Site ID Visitor Counts Today ---');
    console.log(JSON.stringify(statsRaw, null, 2));

    // Search for site IDs similar to '2libudamaset'
    const similar = statsRaw.filter(s => s._id && s._id.toString().includes('2libudamaset'));
    console.log('\n--- Slugs similar to "2libudamaset" ---');
    console.log(similar);

    // If my aggregation still says 2224, but the Dashboard shows 2448.
    // WHERE IS 2448?
    // Let's check the total UNIQUE visitors across ALL sites combined (without group by site_id)
    const totalTodayUnique = await EventLog.distinct('device_id', {
        createdAt: { $gte: startOfToday },
        event_name: 'page_view'
    });
    console.log('\nTotal Unique Visitors combined across ALL sites:', totalTodayUnique.length);

    process.exit(0);
}

deepAnalyze();

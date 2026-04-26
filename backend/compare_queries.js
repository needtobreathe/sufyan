const mongoose = require('mongoose');
const EventLog = require('./models/EventLog');
require('dotenv').config();

async function compareQueries(slug) {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sufyan-yaprak' });
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));

    // Dashboard Query
    const dashResult = await EventLog.aggregate([
        { $match: { site_id: slug, createdAt: { $gte: startOfToday }, event_name: 'page_view' } },
        { $group: { _id: "$site_id", count: { $addToSet: "$device_id" } } },
        { $project: { _id: 1, count: { $size: "$count" } } }
    ]);

    // Report Query
    const reportResult = await EventLog.distinct('device_id', { 
        site_id: slug, 
        createdAt: { $gte: startOfToday }, 
        event_name: 'page_view' 
    });

    console.log(`Comparison for ${slug}:`);
    console.log('Dashboard Aggregation:', dashResult[0]?.count || 0);
    console.log('Report Distinct:', reportResult.length);
    process.exit(0);
}

compareQueries(process.argv[2] || '2libudamaset');

const mongoose = require('mongoose');
const EventLog = require('./models/EventLog');
require('dotenv').config();

async function analyzeData() {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sufyan-yaprak' });
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));

    // Dashboard-like aggregation for ALL sites
    const statsAll = await EventLog.aggregate([
        { $match: { createdAt: { $gte: startOfToday } } },
        { $group: { 
            _id: "$site_id", 
            total_events: { $sum: 1 },
            unique_visitors_all: { $addToSet: "$device_id" },
            page_view_visitors: { $addToSet: { $cond: [{ $eq: ["$event_name", "page_view"] }, "$device_id", "$$REMOVE"] } }
        } },
        { $project: { 
            _id: 1, 
            total_events: 1,
            visitor_count_all: { $size: "$unique_visitors_all" },
            visitor_count_page_view: { $size: "$page_view_visitors" }
        } }
    ]);

    console.log('--- Today Statistics ---');
    console.log(JSON.stringify(statsAll, null, 2));

    // Check specific slug '2libudamaset'
    const slug = '2libudamaset';
    const reportVisitors = await EventLog.distinct('device_id', { 
        site_id: slug, 
        createdAt: { $gte: startOfToday }, 
        event_name: 'page_view' 
    });
    console.log(`\n--- Slug Analysis: ${slug} ---`);
    console.log('Report Page Style (page_view + device_id):', reportVisitors.length);
    
    const dashboardStyleMatch = statsAll.find(s => s._id === slug);
    console.log('Dashboard Style Match (from aggregation):', dashboardStyleMatch?.visitor_count_page_view || 0);

    process.exit(0);
}

analyzeData();

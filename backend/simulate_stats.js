const mongoose = require('mongoose');
const EventLog = require('./models/EventLog');
const LeafPage = require('./models/LeafPage');
const Order = require('./models/Order');
require('dotenv').config();

async function simulateStats() {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sufyan-yaprak' });
    
    // Exactly copy logic from server.js
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    
    // Visitor Stats grouped by Site
    const activeThreshold = new Date(Date.now() - 60 * 1000); // 60 seconds
    const [todayVisitorsBySite, liveVisitorsBySite, leafPages] = await Promise.all([
        EventLog.aggregate([
            { $match: { createdAt: { $gte: startOfToday }, event_name: 'page_view' } },
            { $group: { _id: "$site_id", count: { $addToSet: "$device_id" } } },
            { $project: { _id: 1, count: { $size: "$count" } } }
        ]),
        EventLog.aggregate([
            { $match: { timestamp: { $gte: activeThreshold } } },
            { $group: { _id: "$site_id", count: { $addToSet: "$session_id" } } },
            { $project: { _id: 1, count: { $size: "$count" } } }
        ]),
        LeafPage.find({}, 'name slug')
    ]);

    const visitorStats = leafPages.map(page => {
        const today = todayVisitorsBySite.find(v => v._id === page.slug)?.count || 0;
        const live = liveVisitorsBySite.find(v => v._id === page.slug)?.count || 0;
        return {
            name: page.name,
            slug: page.slug,
            today,
            live
        };
    });

    console.log('--- Simulated API Output (visitors) ---');
    console.log(JSON.stringify(visitorStats, null, 2));
    
    process.exit(0);
}

simulateStats();

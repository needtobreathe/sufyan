const mongoose = require('mongoose');
const EventLog = require('./models/EventLog');
require('dotenv').config();

async function countToday() {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sufyan-yaprak' });
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));
    console.log('Start of Today:', startOfToday);
    
    const count = await EventLog.countDocuments({
        createdAt: { $gte: startOfToday },
        event_name: 'page_view'
    });
    console.log('Today page_view count:', count);
    
    const distinctSites = await EventLog.distinct('site_id', {
        createdAt: { $gte: startOfToday },
        event_name: 'page_view'
    });
    console.log('Distinct sites today:', distinctSites);

    process.exit(0);
}

countToday();

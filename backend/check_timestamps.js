const mongoose = require('mongoose');
const EventLog = require('./models/EventLog');
require('dotenv').config();

async function checkTimestamps() {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sufyan-yaprak' });
    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));

    const countCreated = await EventLog.countDocuments({
        createdAt: { $gte: startOfToday },
        event_name: 'page_view',
        site_id: '2libudamaset'
    });
    
    const countTimestamp = await EventLog.countDocuments({
        timestamp: { $gte: startOfToday },
        event_name: 'page_view',
        site_id: '2libudamaset'
    });

    const distinctCreated = await EventLog.distinct('device_id', {
        createdAt: { $gte: startOfToday },
        event_name: 'page_view',
        site_id: '2libudamaset'
    });

    const distinctTimestamp = await EventLog.distinct('device_id', {
        timestamp: { $gte: startOfToday },
        event_name: 'page_view',
        site_id: '2libudamaset'
    });

    console.log('--- Timestamp vs CreatedAt Analysis for 2libudamaset ---');
    console.log('Total Events (createdAt):', countCreated);
    console.log('Total Events (timestamp):', countTimestamp);
    console.log('Unique Visitors (createdAt):', distinctCreated.length);
    console.log('Unique Visitors (timestamp):', distinctTimestamp.length);

    process.exit(0);
}

checkTimestamps();

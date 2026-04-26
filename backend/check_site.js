const mongoose = require('mongoose');
const EventLog = require('./models/EventLog');
require('dotenv').config();

async function checkSite(slug) {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sufyan-yaprak' });
    const threshold = new Date(Date.now() - 60 * 1000);
    const sessions = await EventLog.distinct('session_id', {
        site_id: slug,
        timestamp: { $gte: threshold }
    });
    console.log(`Live Sessions for ${slug}:`, sessions.length);
    console.log('Sessions:', sessions);
    process.exit(0);
}

checkSite(process.argv[2] || '2libudamaset');

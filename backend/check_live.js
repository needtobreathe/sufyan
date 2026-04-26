const mongoose = require('mongoose');
const EventLog = require('./models/EventLog');
require('dotenv').config();

async function checkLive() {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sufyan-yaprak' });
    const threshold = new Date(Date.now() - 60 * 1000);
    const stats = await EventLog.aggregate([
        { $match: { timestamp: { $gte: threshold } } },
        { $group: { 
            _id: "$site_id", 
            sessions: { $addToSet: "$session_id" },
            count: { $sum: 1 }
        } },
        { $project: { _id: 1, sessionCount: { $size: "$sessions" }, eventCount: "$count" } }
    ]);
    console.log(JSON.stringify(stats, null, 2));
    process.exit(0);
}

checkLive();

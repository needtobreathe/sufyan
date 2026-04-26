const mongoose = require('mongoose');
const EventLog = require('./models/EventLog');
require('dotenv').config();

async function checkLogs() {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sufyan-yaprak' });
    const logs = await EventLog.find().sort({ createdAt: -1 }).limit(10);
    console.log(JSON.stringify(logs, null, 2));
    process.exit(0);
}

checkLogs();

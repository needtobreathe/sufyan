require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = "mongodb://admin_samet:r3r3EJlfhULHw74wrR66@194.146.36.252:27017/sufyan-yaprak?authSource=admin";

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB.");
    
    // Create an ad-hoc schema to query without needing the full app setup
    const EventLog = mongoose.model('EventLog', new mongoose.Schema({
        site_id: String,
        event_name: String,
        data: mongoose.Schema.Types.Mixed
    }, { strict: false })); // strict: false allows us to fetch all DB contents even if we don't define the schema exactly

    const countAll = await EventLog.countDocuments();
    console.log(`Total events in EventLog collection: ${countAll}`);

    const countSite = await EventLog.countDocuments({ site_id: '7litilkiset' });
    console.log(`Events for site_id '7litilkiset': ${countSite}`);

    // If there are events, let's see the most recent one for this site
    if (countSite > 0) {
        const sampleSiteEvents = await EventLog.find({ site_id: '7litilkiset' }).sort({ _id: -1 }).limit(3);
        console.log("Sample Events for 7litilkiset:");
        console.log(JSON.stringify(sampleSiteEvents, null, 2));
    }
    
    const countImageEvents = await EventLog.countDocuments({ site_id: '7litilkiset', event_name: 'image_view_start' });
    console.log(`Image view events for '7litilkiset': ${countImageEvents}`);

    // Let's also check if the siteId was somehow saved under a different field name or value
    const otherDocs = await EventLog.find().sort({_id: -1}).limit(2);
    console.log("Latest 2 docs in DB:");
    console.log(JSON.stringify(otherDocs, null, 2));

    process.exit(0);
  })
  .catch((err) => {
    console.error("DB Connection Error:", err);
    process.exit(1);
  });

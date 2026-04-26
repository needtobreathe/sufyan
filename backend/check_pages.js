const mongoose = require('mongoose');
const LeafPage = require('./models/LeafPage');
require('dotenv').config();

async function checkLeafPages() {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sufyan-yaprak' });
    const pages = await LeafPage.find({}, 'name slug');
    console.log(JSON.stringify(pages, null, 2));
    process.exit(0);
}

checkLeafPages();

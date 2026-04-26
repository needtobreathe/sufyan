require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { dbName: 'sufyan-yaprak' });
        console.log('Connected to MongoDB');
        
        const result = await mongoose.connection.db.collection('orders').updateMany(
            {},
            { $unset: { processedBy: 1 } }
        );
        console.log('Modified:', result.modifiedCount);
    } catch(e) {
        console.error(e);
    }
    process.exit(0);
}
run();

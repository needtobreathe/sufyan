const mongoose = require('mongoose');

async function seed() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://admin_samet:r3r3EJlfhULHw74wrR66@194.146.36.252:27017/sufyan-yaprak?authSource=admin');
        console.log('Connected!');

        const LeafPage = mongoose.connection.db.collection('leafpages');
        const Product = mongoose.connection.db.collection('products');

        const productNames = await LeafPage.distinct('productName');
        console.log('Found product names in LeafPages:', productNames);

        for (const name of productNames) {
            if (!name) continue;
            const exists = await Product.findOne({ name });
            if (!exists) {
                await Product.insertOne({
                    name,
                    price: 100,
                    cost: 0,
                    stock: 999,
                    active: true,
                    urun_paketler: '[]',
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                console.log('Seeded:', name);
            } else {
                console.log('Already exists:', name);
            }
        }

        console.log('Seeding process complete!');
        process.exit(0);
    } catch (err) {
        console.error('Error during seeding:', err);
        process.exit(1);
    }
}

seed();

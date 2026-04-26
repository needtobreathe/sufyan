require('dotenv').config();
const mongoose = require('mongoose');

const Country = require('./models/Country');
const City = require('./models/City');
const District = require('./models/District');
const ShippingCompany = require('./models/ShippingCompany');
const PaymentMethod = require('./models/PaymentMethod');
const User = require('./models/User');

mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME || 'sufyan-yaprak' })
    .then(async () => {
        console.log('✅ Connected to MongoDB for Seeding...');

        // Create Admin
        const existUser = await User.findOne({ username: 'admin' });
        if (!existUser) {
            await User.create({
                username: 'admin',
                password: 'password123',
                fullName: 'System Administrator',
                role: 'Admin',
                permissions: ['all']
            });
            console.log('✅ Created Admin user (admin / password123)');
        }

        // Create Default Payment Methods
        if (await PaymentMethod.countDocuments() === 0) {
            await PaymentMethod.insertMany([
                { name: 'Kapıda Nakit Ödeme' },
                { name: 'Kapıda Kredi Kartı' },
                { name: 'Havale / EFT' }
            ]);
            console.log('✅ Created Default Payment Methods');
        }

        // Create Default Shipping Companies
        if (await ShippingCompany.countDocuments() === 0) {
            await ShippingCompany.insertMany([
                { name: 'Yurtiçi Kargo' },
                { name: 'Aras Kargo' },
                { name: 'MNG Kargo' }
            ]);
            console.log('✅ Created Default Shipping Companies');
        }

        // Create Default Country & City
        if (await Country.countDocuments() === 0) {
            const tr = await Country.create({ name: 'Türkiye', code: 'TR' });
            console.log('✅ Created Default Country (Türkiye)');
            
            const istanbul = await City.create({ country_id: tr._id, name: 'İstanbul', code: '34' });
            console.log('✅ Created Default City (İstanbul)');

            await District.create({ city_id: istanbul._id, name: 'Kadıköy' });
            await District.create({ city_id: istanbul._id, name: 'Şişli' });
            await District.create({ city_id: istanbul._id, name: 'Beşiktaş' });
            console.log('✅ Created Default Districts for İstanbul');
        }

        console.log('🎉 Seeding completed successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error('❌ Seeding Error:', err);
        process.exit(1);
    });

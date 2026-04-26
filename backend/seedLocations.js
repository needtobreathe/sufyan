const mongoose = require('mongoose');
const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Country = require('./models/Country');
const City = require('./models/City');
const District = require('./models/District');

const DATA_URL = 'https://raw.githubusercontent.com/mertmtn/CityDistrictJSONAPI/refs/heads/master/all-city-district.json';

async function seed() {
    try {
        console.log('🚀 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected.');

        // 1. Ensure Turkey exists
        let turkey = await Country.findOne({ code: 'TR' });
        if (!turkey) {
            console.log('🌍 Creating Country: Turkey');
            turkey = await Country.create({ name: 'Türkiye', code: 'TR' });
        }

        console.log('📥 Fetching location data...');
        const response = await axios.get(DATA_URL);
        const data = response.data; // Structure: { city: [ { plateCode, name, discrits: [] } ] }

        if (!data.city || !Array.isArray(data.city)) {
            throw new Error('Invalid data format: expected "city" array');
        }

        console.log(`📊 Found ${data.city.length} cities. Starting seed...`);

        let cityCount = 0;
        let districtCount = 0;

        for (const cityObj of data.city) {
            const cityName = cityObj.name.trim();
            
            // Find or create city
            let city = await City.findOne({ name: cityName, country_id: turkey._id });
            if (!city) {
                city = await City.create({
                    name: cityName,
                    country_id: turkey._id,
                    code: cityObj.plateCode.toString(),
                    status: true
                });
                cityCount++;
            }

            // Districts (Note: the JSON uses "discrits")
            const districts = cityObj.discrits || [];
            for (const districtName of districts) {
                const trimmedDistrict = districtName.trim();
                const existingDistrict = await District.findOne({ name: trimmedDistrict, city_id: city._id });
                if (!existingDistrict) {
                    await District.create({
                        name: trimmedDistrict,
                        city_id: city._id,
                        status: true
                    });
                    districtCount++;
                }
            }
            process.stdout.write('.');
        }

        console.log(`\n\n✅ Seeding complete!`);
        console.log(`🏙️  Cities created: ${cityCount}`);
        console.log(`🏘️  Districts created: ${districtCount}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}

seed();

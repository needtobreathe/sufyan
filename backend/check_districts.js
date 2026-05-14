const mongoose = require('mongoose');
const City = require('./models/City');
const District = require('./models/District');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri, { dbName: 'sufyan-yaprak' }).then(async () => {
    console.log("MongoDB bağlandı.");
    
    // Batman ilini bul
    const batman = await City.findOne({ name: { $regex: /batman/i } });
    if (!batman) {
        console.log("Batman şehri bulunamadı!");
        process.exit(0);
    }
    
    console.log(`Şehir bulundu: ${batman.name} (ID: ${batman._id})`);
    
    // İlçeleri bul
    const districts = await District.find({ city_id: batman._id }).sort({ name: 1 });
    console.log(`Toplam İlçe: ${districts.length}`);
    districts.forEach(d => console.log(`- ${d.name} (Status: ${d.status})`));
    
    process.exit(0);
}).catch(err => {
    console.error("Hata:", err);
    process.exit(1);
});

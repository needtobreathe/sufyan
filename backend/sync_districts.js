const mongoose = require('mongoose');
const https = require('https');
const City = require('./models/City');
const District = require('./models/District');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

const fetchJson = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', err => reject(err));
    });
};

const normalizeString = (str) => {
    if (!str) return "";
    return str.toLocaleLowerCase('tr')
              .replace(/i̇/g, 'i') 
              .replace(/ /g, '')
              .replace(/-/g, '')
              .trim();
};

const formatName = (str) => {
    if (!str) return "";
    return str.split(' ').map(word => {
        return word.charAt(0).toLocaleUpperCase('tr') + word.slice(1).toLocaleLowerCase('tr');
    }).join(' ');
};

const run = async () => {
    try {
        await mongoose.connect(MONGODB_URI, { dbName: 'sufyan-yaprak' });
        console.log("MongoDB bağlandı. Tüm ilçelerin status değerleri kontrol ediliyor...");

        // 1. Önce veritabanındaki tüm ilçelerin status değerini true yapalım (Gizli kalanları açarız)
        const updateResult = await District.updateMany({ status: { $ne: true } }, { $set: { status: true } });
        console.log(`Status'ü false olan veya olmayan ${updateResult.modifiedCount} ilçe görünür yapıldı.`);

        const ilRes = await fetchJson('https://raw.githubusercontent.com/volkansenturk/turkiye-iller-ilceler/refs/heads/master/il.json');
        const ilceRes = await fetchJson('https://raw.githubusercontent.com/volkansenturk/turkiye-iller-ilceler/refs/heads/master/ilce.json');

        const ilData = ilRes.find(d => d.type === "table" && d.name === "il").data;
        const ilceData = ilceRes.find(d => d.type === "table" && d.name === "ilce").data;

        const dbCities = await City.find({});
        let addedCount = 0;

        for (const gitIl of ilData) {
            const dbCity = dbCities.find(c => normalizeString(c.name) === normalizeString(gitIl.name));
            if (!dbCity) continue;

            const gitIlceler = ilceData.filter(ilce => ilce.il_id === gitIl.id);
            const dbDistricts = await District.find({ city_id: dbCity._id });

            for (const gitIlce of gitIlceler) {
                const ilceName = gitIlce.name;
                // Eşleşme ararken daha agresif arama yapalım (içeriyor mu diye)
                const match = dbDistricts.find(d => normalizeString(d.name) === normalizeString(ilceName));

                if (!match) {
                    console.log(`EKSİK: ${dbCity.name} -> ${formatName(ilceName)} ekleniyor...`);
                    const newDistrict = new District({
                        city_id: dbCity._id,
                        name: formatName(ilceName),
                        status: true
                    });
                    await newDistrict.save();
                    addedCount++;
                }
            }
        }

        const totalDistricts = await District.countDocuments({status: true});
        console.log(`✅ İşlem tamam! Bu turda ${addedCount} eksik ilçe daha eklendi.`);
        console.log(`Toplam Aktif İlçe Sayısı: ${totalDistricts}`);
        process.exit(0);
    } catch (e) {
        console.error("Hata:", e);
        process.exit(1);
    }
}

run();

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
let localImagesPath = path.join(__dirname, 'images');
let volumeImagesPath = '/app/images';
let imagesPath = localImagesPath; // default to local

// Ensure directories exist
if (!fs.existsSync(localImagesPath)) {
    try { fs.mkdirSync(localImagesPath, { recursive: true }); } catch (e) {}
}

if (fs.existsSync('/app')) {
    imagesPath = volumeImagesPath;
    if (!fs.existsSync(volumeImagesPath)) {
        try { fs.mkdirSync(volumeImagesPath, { recursive: true }); } catch (e) {}
    }
}

if (!fs.existsSync(imagesPath)) {
    try {
        fs.mkdirSync(imagesPath, { recursive: true });
    } catch (e) {
        console.error('Failed to create images directory:', e);
    }
}
console.log('📂 Images Path:', imagesPath);
const jwt = require('jsonwebtoken');
const auth = require('./middleware/auth');

const EventLog = require('./models/EventLog');
const Order = require('./models/Order');
const OrderLog = require('./models/OrderLog');
const Site = require('./models/Site');
const LeafPage = require('./models/LeafPage');
const GlobalSetting = require('./models/GlobalSetting');
const OrderLock = require('./models/OrderLock');

// --- New Native Models ---
const Country = require('./models/Country');
const City = require('./models/City');
const District = require('./models/District');
const ShippingCompany = require('./models/ShippingCompany');
const PaymentMethod = require('./models/PaymentMethod');
const User = require('./models/User');
const Product = require('./models/Product');
const Expense = require('./models/Expense');
const ProductAdBudget = require('./models/ProductAdBudget');
const DailyStat = require('./models/DailyStat');

const multer = require('multer');
const puppeteer = require('puppeteer');
const axios = require('axios');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Define Admin Panel Path
const adminDistPath = path.join(__dirname, '..', 'panel', 'dist');

// Define Legacy API Settings (REMOVED)

console.log('🚀 [Internal] Global fetch status:', typeof fetch);
if (typeof fetch === 'undefined') {
    console.warn('⚠️  Global fetch is NOT defined. If calls fail, consider using Node 18+ or installing node-fetch.');
}

// --- Middleware ---
app.set('trust proxy', true);

app.use(cors({
    origin: function(origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if(!origin) return callback(null, true);
        
        const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];
        const baseDomain = process.env.BASE_DOMAIN || '';
        
        if (allowedOrigins.indexOf(origin) !== -1 || (baseDomain && origin.endsWith(baseDomain))) {
            callback(null, true);
        } else {
            callback(null, true); // Fallback: allow but reflected for flexibility in dev
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.text({ type: 'text/plain', limit: '10mb' }));

// Subdomain Extraction Middleware
app.use((req, res, next) => {
    const host = req.get('host') || '';
    const parts = host.split('.');
    
    // Localhost veya IP adresi kontrolü
    if (host.includes('localhost') || host.includes('127.0.0.1') || host.startsWith('www.')) {
        req.subdomain = null;
    } else if (parts.length > 2) {
        // subdomain.domain.com -> parts = [subdomain, domain, com]
        req.subdomain = parts[0];
    } else {
        req.subdomain = null;
    }
    next();
});

// Serve Admin Panel (Vite Build) - Only if NOT a subdomain AND NOT an API request
app.use((req, res, next) => {
    if (!req.subdomain && !req.path.startsWith('/api') && fs.existsSync(adminDistPath)) {
        return express.static(adminDistPath)(req, res, next);
    }
    next();
});

// Diagnostic route
app.get('/api/debug/inspect-images', (req, res) => {
    try {
        const files = fs.readdirSync(imagesPath);
        res.json({ success: true, path: imagesPath, files });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// Serve Images (Moved up for priority)
// 1. Check local repository images first (bundled assets like alt.jpg)
app.use('/images', express.static(localImagesPath));
app.use('/p/images', express.static(localImagesPath));
app.use('/api/images', express.static(localImagesPath));

// 2. Then check volume images (user uploads)
app.use('/images', express.static(volumeImagesPath));
app.use('/p/images', express.static(volumeImagesPath));
app.use('/api/images', express.static(volumeImagesPath));

// --- Multer Utils ---
const imgStorage = multer.memoryStorage();
const upload = multer({ storage: imgStorage });

mongoose.connect(process.env.MONGODB_URI, { dbName: process.env.DB_NAME || 'sufyan-yaprak' })
    .then(() => {
        console.log(`✅ MongoDB Connected: ${mongoose.connection.name}`);
        console.log(`🔗 URI Used: ${process.env.MONGODB_URI.replace(/:.+@/, ':****@')}`);
        
        // Manual cleanup interval for OrderLocks as a fallback for MongoDB TTL
        setInterval(async () => {
            try {
                const result = await OrderLock.deleteMany({ expiresAt: { $lt: new Date() } });
                if (result.deletedCount > 0) {
                    console.log(`[Presence] Background cleanup: Removed ${result.deletedCount} stale locks.`);
                }
            } catch (err) {
                console.error('[Presence] Background cleanup error:', err);
            }
        }, 60000); // Every 60 seconds

        // Background interval for Future Order transitions
        setInterval(async () => {
            try {
                const now = new Date();
                const todayStr = now.toISOString().split('T')[0];
                console.log(`🕒 [Local API Site] Checking future orders to revert (Date: ${todayStr})...`);

                // 1. Local Orders
                const localOrders = await Order.find({ 
                    status: 'future', 
                    futureDate: { $lte: todayStr } 
                });

                if (localOrders.length > 0) {
                    console.log(`🚀 [Background] Reverting ${localOrders.length} local future orders.`);
                    for (const o of localOrders) {
                        o.status = 'pending';
                        await o.save();
                        await OrderLog.create({
                            orderId: o._id,
                            action: 'system_auto_revert',
                            changedBy: 'System',
                            details: `İleri tarih doldu, sipariş yeni siparişlere düştü. (Tarih: ${o.futureDate})`
                        });
                    }
                }
            } catch (err) {
                console.error('❌ [Background] Future Order Transition Error:', err.message);
            }
        }, 15 * 60 * 1000); // Every 15 minutes
        
        // Background interval for Reporting Consolidation (Visitors)
        setInterval(async () => {
            try {
                // Consolidate data for "yesterday"
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                
                // Get date strings in TR timezone
                const getTrDayStr = (d) => {
                    const trStr = d.toLocaleString('en-US', { timeZone: 'Europe/Istanbul', year: 'numeric', month: 'numeric', day: 'numeric' });
                    const [m, day, y] = trStr.split('/');
                    return `${y}-${m.padStart(2, '0')}-${day.padStart(2, '0')}`;
                };
                
                const yesterdayStr = getTrDayStr(yesterday);
                const startOfYesterday = new Date(yesterday.setHours(0, 0, 0, 0));
                const endOfYesterday = new Date(yesterday.setHours(23, 59, 59, 999));

                console.log(`📊 [Consolidation] Updating visitor stats for ${yesterdayStr}...`);

                // Global Stats
                const globalVisitors = await EventLog.aggregate([
                    { $match: { timestamp: { $gte: startOfYesterday, $lte: endOfYesterday }, event_name: 'page_view' } },
                    { $group: { _id: "$device_id" } },
                    { $count: "count" }
                ]);

                await DailyStat.findOneAndUpdate(
                    { date: yesterdayStr, site_id: null },
                    { visitors: globalVisitors[0]?.count || 0, lastUpdated: new Date() },
                    { upsert: true }
                );

                // Per-site Stats
                const siteVisitors = await EventLog.aggregate([
                    { $match: { timestamp: { $gte: startOfYesterday, $lte: endOfYesterday }, event_name: 'page_view', site_id: { $exists: true, $ne: null } } },
                    { $group: { _id: { site: "$site_id", device: "$device_id" } } },
                    { $group: { _id: "$_id.site", count: { $sum: 1 } } }
                ]);

                for (const s of siteVisitors) {
                    await DailyStat.findOneAndUpdate(
                        { date: yesterdayStr, site_id: s._id },
                        { visitors: s.count || 0, lastUpdated: new Date() },
                        { upsert: true }
                    );
                }

                console.log(`✅ [Consolidation] Completed for ${yesterdayStr}.`);
            } catch (err) {
                console.error('❌ [Consolidation] Error:', err.message);
            }
        }, 60 * 60 * 1000); // Every 1 hour
    })
    .catch(err => console.error('❌ MongoDB connection error:', err));
// ==========================================
// EXTERNAL API ROUTES
// ==========================================

// 1. GET - Kargoya verildi durumundaki tüm siparişleri getir
app.get('/api/external/orders/shipped', async (req, res) => {
    try {
        const shippedStatuses = ['shipped', '5'];
        const orders = await Order.find({ status: { $in: shippedStatuses } }).sort({ createdAt: -1 });

        // Şehir ve ilçe isimlerini çöz
        const [allCities, allDistricts] = await Promise.all([
            City.find({}),
            District.find({})
        ]);

        const cityMap = {};
        allCities.forEach(c => cityMap[c._id.toString()] = c.name);

        const distMap = {};
        allDistricts.forEach(d => distMap[d._id.toString()] = d.name);

        const mappedOrders = orders.map(o => {
            const cityName = cityMap[o.province?.toString()] || o.province || '';
            const distName = distMap[o.district?.toString()] || o.district || '';
            const fullAddress = [o.address, distName, cityName].filter(Boolean).join(', ');

            return {
                id: o._id,
                musteri_adi: o.fullName,
                telefon: o.phone,
                adres: fullAddress,
                il: cityName,
                ilce: distName,
                detay_adres: o.address,
                urunler: o.items.map(i => ({
                    urun_adi: i.name,
                    adet: i.qty,
                    fiyat: i.price
                })),
                toplam_tutar: o.totalPrice || 0,
                siparis_tarihi: o.createdAt
            };
        });

        res.json({
            success: true,
            count: mappedOrders.length,
            orders: mappedOrders
        });
    } catch (error) {
        console.error('❌ External API - Preparing Orders Error:', error);
        res.status(500).json({ success: false, message: 'Siparişler çekilemedi' });
    }
});

// 2. PUT - Sipariş durumunu güncelle (Tamamlandı veya İade)
app.put('/api/external/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;

        // Sadece delivered ve returned durumlarına izin ver
        const allowedStatuses = ['delivered', 'returned'];
        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Geçersiz durum. İzin verilen durumlar: ${allowedStatuses.join(', ')}`,
                allowed_statuses: {
                    delivered: 'Tamamlandı',
                    returned: 'İade'
                }
            });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
        }

        const oldStatus = order.status;
        order.status = status;
        await order.save();

        // Log kaydı oluştur
        const statusLabel = status === 'delivered' ? 'Tamamlandı' : 'İade';
        await OrderLog.create({
            orderId: order._id,
            action: 'status_changed',
            changedBy: 'External API',
            details: `Durum: ${oldStatus} → ${status} (${statusLabel})`,
            metadata: {
                oldStatus,
                newStatus: status,
                source: 'external_api'
            }
        });

        res.json({
            success: true,
            message: `Sipariş durumu "${statusLabel}" olarak güncellendi`,
            order: {
                id: order._id,
                musteri_adi: order.fullName,
                eski_durum: oldStatus,
                yeni_durum: status,
                yeni_durum_label: statusLabel
            }
        });
    } catch (error) {
        console.error('❌ External API - Status Update Error:', error);
        res.status(500).json({ success: false, message: 'Durum güncellenemedi' });
    }
});

// ==========================================
// PUBLIC API ROUTES
// ==========================================

// 1. Analytics Tracking
app.post('/api/track', async (req, res) => {
    res.status(204).send();
    try {
        let payload = req.body;
        if (typeof req.body === 'string') payload = JSON.parse(req.body);
        const { device_id, session_id, visit_count, event_name, data, siteId } = payload;
        if (!device_id || !session_id || !event_name) return;
        const log = new EventLog({
            site_id: siteId, device_id, session_id,
            ip_address: req.ip || req.connection.remoteAddress,
            visit_count, event_name, data
        });
        await log.save();
    } catch (error) {
        console.error('❌ Analytics Error:', error.message);
    }
});

// Products Management Native
app.get('/api/products', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 100;
        const skip = (page - 1) * limit;

        const query = req.query.search ? { name: { $regex: req.query.search, $options: 'i' } } : {};
        const total = await Product.countDocuments(query);
        
        const [productsDb, leafPages] = await Promise.all([
            Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
            LeafPage.find({ 
                productName: { $exists: true, $ne: '', $ne: null } 
            })
        ]);

        console.log(`[Products] Found ${productsDb.length} standard products and ${leafPages.length} leaf page products.`);

        const mapped = productsDb.map(p => ({
            id: p._id.toString(),
            name: p.name,
            price: p.price,
            code: p.code,
            stock: p.stock,
            urun_paketler: p.urun_paketler,
            active: p.active,
            type: 'product'
        }));

        // Add LeafPage products if they don't already exist in mapped by name
        const productNames = new Set(mapped.map(m => m.name.toLowerCase()));
        
        leafPages.forEach(p => {
            const displayName = p.productName === p.name ? p.productName : `${p.productName} (${p.name})`;
            if (p.productName && !productNames.has(displayName.toLowerCase())) {
                mapped.push({
                    id: p._id.toString(),
                    name: displayName,
                    price: p.productPrice,
                    code: 'LEAF',
                    stock: 999,
                    active: true,
                    type: 'leaf_page'
                });
                productNames.add(displayName.toLowerCase());
            }
        });

        res.json({ 
            success: true, 
            products: mapped,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('❌ Products Fetch Error:', error);
        res.status(500).json({ success: false, message: 'Ürünler çekilemedi' });
    }
});

app.post('/api/products/save', auth, async (req, res) => {
    try {
        const { id, name, price, code, stock, active, packages } = req.body;
        const urun_paketler = JSON.stringify(packages || []);
        
        const updateData = { name, price, code, stock, active, urun_paketler };
        
        if (id) {
            await Product.findByIdAndUpdate(id, updateData);
        } else {
            await Product.create(updateData);
        }
        res.json({ success: true, message: 'Ürün başarıyla kaydedildi' });
    } catch (error) {
        console.error('❌ Product Save Error:', error);
        res.status(500).json({ success: false, message: 'Ürün kaydedilemedi' });
    }
});

app.delete('/api/products/:id', auth, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Ürün başarıyla silindi' });
    } catch (error) {
        console.error('❌ Product Delete Error:', error);
        res.status(500).json({ success: false, message: 'Ürün silinemedi' });
    }
});

// Quick cost update from daily report page
app.post('/api/products/update-cost', auth, async (req, res) => {
    try {
        const { productName, cost } = req.body;
        if (!productName) return res.status(400).json({ success: false, message: 'Ürün adı gerekli' });
        const product = await Product.findOneAndUpdate(
            { name: productName },
            { $set: { cost: Number(cost) || 0 }, $setOnInsert: { price: 0 } },
            { upsert: true, new: true, runValidators: false }
        );
        res.json({ success: true, product });
    } catch (error) {
        console.error('❌ Product Cost Update Error:', error);
        res.status(500).json({ success: false, message: 'Maliyet güncellenemedi' });
    }
});

// Geographic and Reference Data Native Queries
app.get('/api/countries', auth, async (req, res) => {
    try {
        const countriesDb = await Country.find({ status: true });
        const mapped = countriesDb.map(c => ({ ulke_id: c._id.toString(), ulke_adi: c.name }));
        res.json({ success: true, countries: mapped });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Ülkeler çekilemedi' });
    }
});

app.get('/api/shipping-companies', auth, async (req, res) => {
    try {
        const companies = await ShippingCompany.find({ status: true });
        const mapped = companies.map(c => ({ id: c._id.toString(), skt_baslik: c.name }));
        res.json({ success: true, shippingCompanies: mapped });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Kargo firmaları çekilemedi' });
    }
});

app.get('/api/cities', auth, async (req, res) => {
    try {
        let countryId = req.query.country_id;
        let query = { status: true };

        if (countryId) {
            // Handle legacy ID '1' or missing ObjectId by finding the first country (Turkey)
            if (countryId === '1' || !mongoose.Types.ObjectId.isValid(countryId)) {
                const firstCountry = await Country.findOne({ status: true });
                if (firstCountry) {
                    query.country_id = firstCountry._id;
                }
            } else {
                query.country_id = countryId;
            }
        }

        const citiesDb = await City.find(query).sort({ name: 1 });
        const mapped = citiesDb.map(c => ({ id: c._id.toString(), name: c.name }));
        res.json({ success: true, cities: mapped });
    } catch (error) {
        console.error('❌ Cities Fetch Error:', error);
        res.status(500).json({ success: false, message: 'Şehirler çekilemedi' });
    }
});

app.get('/api/districts', auth, async (req, res) => {
    try {
        const cityId = req.query.city_id;
        if (!cityId) {
            return res.json({ success: true, districts: [] });
        }

        let query = { city_id: cityId, status: true };
        if (!mongoose.Types.ObjectId.isValid(cityId)) {
             return res.json({ success: true, districts: [] });
        }

        const districtsDb = await District.find(query).sort({ name: 1 });
        const mapped = districtsDb.map(d => ({ id: d._id.toString(), name: d.name }));
        res.json({ success: true, districts: mapped });
    } catch (error) {
        console.error('❌ Districts Fetch Error:', error);
        res.status(500).json({ success: false, message: 'İlçeler çekilemedi' });
    }
});

app.get('/api/payment-methods', auth, async (req, res) => {
    try {
        const methods = await PaymentMethod.find({ status: true });
        const mapped = methods.map(p => ({ od_id: p._id.toString(), od_baslik: p.name }));
        res.json({ success: true, paymentMethods: mapped });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Ödeme yöntemleri çekilemedi' });
    }
});

// --- Scraping Endpoint ---
app.post('/api/scrape/images', auth, async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'URL gerekli' });

    try {
        console.log(`[Scrape] Fetching URL: ${url}`);
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            timeout: 10000
        });
        const $ = cheerio.load(response.data);
        const images = [];
        const baseUrl = new URL(url).origin;

        // Try to find images inside labels or divs that look like product containers
        // Based on user's snippet: label.product-element or img[data-paket]
        $('label.product-element, .product, img[data-paket]').each((i, el) => {
            let imgEl = $(el).is('img') ? $(el) : $(el).find('img');
            let imgSrc = imgEl.attr('src');
            
            if (imgSrc) {
                // Handle relative URLs
                if (imgSrc.startsWith('//')) {
                    imgSrc = 'https:' + imgSrc;
                } else if (imgSrc.startsWith('/')) {
                    imgSrc = baseUrl + imgSrc;
                } else if (!imgSrc.startsWith('http')) {
                    imgSrc = new URL(imgSrc, url).href;
                }

                if (!images.includes(imgSrc)) {
                   images.push(imgSrc);
                }
            }
        });

        if (images.length === 0) {
            return res.json({ success: false, message: 'Hiçbir ürün görseli bulunamadı.' });
        }

        // Download and save images
        const savedImages = [];
        for (const imgUrl of images) {
            try {
                const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer' });
                const ext = path.extname(new URL(imgUrl).pathname) || '.webp';
                const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
                const saveAs = path.join(imagesPath, filename);
                
                fs.writeFileSync(saveAs, imgRes.data);
                savedImages.push(`/images/${filename}`);
            } catch (e) {
                console.error(`[Scrape] Failed to download ${imgUrl}:`, e.message);
            }
        }

        res.json({ success: true, images: savedImages });
    } catch (error) {
        console.error('❌ Scrape Error:', error.message);
        res.status(500).json({ success: false, message: 'Site okunamadı: ' + error.message });
    }
});

// Bulk Sync Endpoint (acacialife.store to local)
app.post('/api/leaf-pages/sync-all', auth, async (req, res) => {
    try {
        const pages = await LeafPage.find({});
        console.log(`[Sync] Starting bulk sync for ${pages.length} pages...`);
        
        const results = {
            total: pages.length,
            success: 0,
            failed: 0,
            details: []
        };

        for (const page of pages) {
            try {
                const url = `https://${page.slug}.acacialife.store/`;
                console.log(`[Sync] Fetching: ${url}`);
                
                const response = await axios.get(url, {
                    headers: { 'User-Agent': 'Mozilla/5.0' },
                    timeout: 15000
                });
                
                const $ = cheerio.load(response.data);
                
                // 1. Extract Product Name & ID from Script
                $('script').each((i, el) => {
                    const content = $(el).html();
                    if (content.includes('PRODUCT_BASE_NAME')) {
                        const nameMatch = content.match(/PRODUCT_BASE_NAME\s*=\s*["'](.*)["']/);
                        const idMatch = content.match(/PRODUCT_ID\s*=\s*(\d+)/);
                        if (nameMatch && nameMatch[1]) page.productName = nameMatch[1];
                        if (idMatch && idMatch[1]) page.productId = parseInt(idMatch[1]);
                    }
                });

                // 2. Extract Main Images
                const newComponents = [];
                const imgPromises = [];
                
                $('.image-stack img.landing-img').each((i, el) => {
                    const src = $(el).attr('src');
                    if (src) imgPromises.push(downloadAndSaveImage(src, url));
                });

                const savedImages = await Promise.all(imgPromises);
                savedImages.filter(Boolean).forEach(img => {
                    newComponents.push({ type: 'image', content: img });
                });
                
                // Add Form Component at the end of images
                newComponents.push({ type: 'form', title: 'Sipariş Formu' });
                
                // 2. Extract Packages
                const newProducts = [];
                const pkgImgPromises = [];
                const pkgData = [];

                $('input[name="product_package"]').each((i, el) => {
                    const $pkg = $(el);
                    const pkg = {
                        name: $pkg.val(),
                        quantity: parseInt($pkg.attr('data-quantity')) || 1,
                        price: parseInt($pkg.attr('data-price')) || 0,
                        isDefault: $pkg.is(':checked'),
                        rawImg: $pkg.attr('data-image')
                    };
                    pkgData.push(pkg);
                    if (pkg.rawImg) pkgImgPromises.push(downloadAndSaveImage(pkg.rawImg, url));
                    else pkgImgPromises.push(Promise.resolve(null));
                });

                const savedPkgImages = await Promise.all(pkgImgPromises);
                pkgData.forEach((pkg, i) => {
                    newProducts.push({
                        name: pkg.name,
                        quantity: pkg.quantity,
                        price: pkg.price,
                        isDefault: pkg.isDefault,
                        image: savedPkgImages[i] || ''
                    });
                });

                // 3. Update Record
                if (newComponents.length > 1 || newProducts.length > 0) {
                    page.components = newComponents;
                    page.products = newProducts;
                    await page.save();
                    results.success++;
                    results.details.push({ slug: page.slug, status: 'success' });
                } else {
                    results.failed++;
                    results.details.push({ slug: page.slug, status: 'failed', reason: 'No components/packages found' });
                }

            } catch (err) {
                console.error(`[Sync] Failed for ${page.slug}:`, err.message);
                results.failed++;
                results.details.push({ slug: page.slug, status: 'error', reason: err.message });
            }
        }

        res.json({ success: true, results });
    } catch (error) {
        console.error('❌ Bulk Sync Error:', error);
        res.status(500).json({ success: false, message: 'Senkronizasyon işlemi başarısız: ' + error.message });
    }
});

// Helper function to download and save image
async function downloadAndSaveImage(imgUrl, sourceUrl) {
    try {
        let fullUrl = imgUrl;
        if (imgUrl.startsWith('//')) fullUrl = 'https:' + imgUrl;
        else if (imgUrl.startsWith('/')) fullUrl = new URL(sourceUrl).origin + imgUrl;
        else if (!imgUrl.startsWith('http')) {
            try {
                fullUrl = new URL(imgUrl, sourceUrl).href;
            } catch (e) {
                // If its already a path or weird, try origin
                fullUrl = new URL(sourceUrl).origin + (imgUrl.startsWith('/') ? imgUrl : '/' + imgUrl);
            }
        }

        const response = await axios.get(fullUrl, { responseType: 'arraybuffer', timeout: 8000 });
        const ext = path.extname(new URL(fullUrl).pathname) || '.webp';
        const filename = `imported-${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`;
        const savePath = path.join(imagesPath, filename);
        
        fs.writeFileSync(savePath, response.data);
        return `/images/${filename}`;
    } catch (e) {
        console.error(`[Download Fail] ${imgUrl}:`, e.message);
        return null;
    }
}

// 2. Order Submission
// Redundant Order Endpoint Removed (Unified with line 1375)

// 3. Admin Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // Find User natively
        const user = await User.findOne({ username, status: 1 });
        if (!user) {
            console.log(`[Login Debug] Kullanıcı bulunamadı: ${username}`);
            return res.status(401).json({ success: false, message: 'Geçersiz kullanıcı adı veya şifre' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log(`[Login Debug] Şifre hatalı: ${username}`);
            return res.status(401).json({ success: false, message: 'Geçersiz kullanıcı adı veya şifre' });
        }

        const token = jwt.sign(
            { 
                id: user._id,
                username: user.username,
                fullName: user.fullName,
                role: user.role,
                permissions: user.permissions 
            }, 
            process.env.JWT_SECRET || 'yaprak_secret_key', 
            { expiresIn: '24h' }
        );

        return res.json({ 
            success: true, 
            token, 
            user: { 
                id: user._id.toString(), 
                username: user.username, 
                fullName: user.fullName, 
                role: user.role, 
                type: user.role 
            } 
        });

    } catch (error) {
        console.error('[Login Debug] Full Error Object:', error);
        res.status(500).json({ success: false, message: 'Giriş işlemi sırasında sunucu hatası oluştu' });
    }
});

// --- User Management Proxy ---
// --- User Management (Local) ---
app.get('/api/users', auth, async (req, res) => {
    try {
        const { id } = req.query;
        if (id) {
            const user = await User.findById(id);
            if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
            
            // Map to legacy names for frontend
            return res.json({ 
                success: true, 
                user: {
                    id: user._id,
                    kadi: user.username,
                    ad_soyad: user.fullName,
                    mail: user.email,
                    wp_numara: user.phone,
                    kullanici_tipi: user.role,
                    durum: user.status,
                    ntfyTopic: user.ntfyTopic
                } 
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const total = await User.countDocuments();
        const users = await User.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
        const mappedUsers = users.map(u => ({
            id: u._id,
            kadi: u.username,
            ad_soyad: u.fullName,
            mail: u.email,
            wp_numara: u.phone,
            kullanici_tipi: u.role,
            kt_baslik: u.role === 'admin' ? 'Yönetici' : (u.role === 'operator' ? 'Operatör' : 'Personel'),
            kt_etiket: u.role === 'admin' ? 'danger' : (u.role === 'operator' ? 'warning' : 'success'),
            durum: u.status
        }));

        res.json({ success: true, users: mappedUsers });
    } catch (error) {
        console.error('❌ Users Fetch Error:', error);
        res.status(500).json({ success: false, message: 'Kullanıcılar getirilemedi' });
    }
});

app.get('/api/user-types', auth, async (req, res) => {
    res.json({ 
        success: true, 
        types: [
            { kt_id: 'admin', kt_baslik: 'Yönetici' },
            { kt_id: 'operator', kt_baslik: 'Operatör' },
            { kt_id: 'staff', kt_baslik: 'Personel' }
        ] 
    });
});

app.post('/api/users/save', auth, async (req, res) => {
    try {
        const { id, kadi, ad_soyad, mail, wp_numara, sifre, kullanici_tipi, durum, ntfyTopic } = req.body;
        
        if (id) {
            const user = await User.findById(id);
            if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });
            
            user.username = kadi;
            user.fullName = ad_soyad;
            user.email = mail;
            user.phone = wp_numara;
            user.role = kullanici_tipi;
            user.status = durum;
            user.ntfyTopic = ntfyTopic || '';
            if (sifre) user.password = sifre; // Trigger pre-save hook for hashing
            
            await user.save();
            res.json({ success: true, user });
        } else {
            const user = new User({
                username: kadi,
                fullName: ad_soyad,
                email: mail,
                phone: wp_numara,
                password: sifre,
                role: kullanici_tipi,
                status: durum || 1,
                ntfyTopic: ntfyTopic || ''
            });
            await user.save();
            res.json({ success: true, user });
        }
    } catch (error) {
        console.error('❌ User Save Error:', error);
        res.status(500).json({ success: false, message: 'Kullanıcı kaydedilemedi: ' + error.message });
    }
});

app.get('/api/sites-list', auth, async (req, res) => {
    try {
        const Site = require('./models/Site');
        const sites = await Site.find().sort({ name: 1 });
        const mappedSites = sites.map(s => ({
            site_id: s._id,
            site_adi: s.name,
            subdomain: s.subdomain
        }));
        res.json({ success: true, sites: mappedSites });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Siteler getirilemedi' });
    }
});

app.post('/api/users/delete', auth, async (req, res) => {
    try {
        const { id } = req.body;
        await User.findByIdAndDelete(id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Kullanıcı silinemedi' });
    }
});

// --- Shipment & Security Proxies ---
// --- Shipment Native Queries ---
app.get('/api/get_shipping_orders.php', auth, async (req, res) => {
    try {
        const toShipStatuses = ['preparing', '3', 'social', '14', '15', 'facebook', 'instagram'];
        const [orders, allCities, allDistricts] = await Promise.all([
            Order.find({ status: { $in: toShipStatuses } }).sort({ createdAt: -1 }),
            City.find({}),
            District.find({})
        ]);
        
        const cityMap = {};
        allCities.forEach(c => cityMap[c._id.toString()] = c.name);

        const distMap = {};
        allDistricts.forEach(d => distMap[d._id.toString()] = d.name);

        const summary = {
            total_count: orders.length,
            total_revenue: orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0),
            reps: [] // Mapped from processedBy if needed
        };

        // Extract reps summary
        const repsMap = {};
        orders.forEach(o => {
            if (o.processedBy) {
                repsMap[o.processedBy] = (repsMap[o.processedBy] || 0) + 1;
            }
        });
        summary.reps = Object.entries(repsMap).map(([name, count]) => ({ name, count }));

        const mappedOrders = orders.map(o => {
            const cityName = cityMap[o.province?.toString()] || o.province;
            const distName = distMap[o.district?.toString()] || o.district;
            
            return {
                id: o._id,
                customer: o.fullName,
                phone: o.phone,
                city: cityName,
                district: distName,
                address: o.address,
                revenue: o.totalPrice,
                representative: o.processedBy || 'Sistem',
                products: o.items.map(i => `${i.qty}x ${i.name}`).join(', '),
                last_note: ''
            };
        });

        res.json({ success: true, summary, orders: mappedOrders });
    } catch (error) {
        console.error('❌ Shipping Fetch Error:', error);
        res.status(500).json({ success: false, message: 'Sevkiyat verileri çekilemedi' });
    }
});


app.get('/api/get_dashboard_stats.php', auth, async (req, res) => {
    try {
        const getTrStart = (d) => {
            const trStr = d.toLocaleString('en-US', { timeZone: 'Europe/Istanbul', year: 'numeric', month: 'numeric', day: 'numeric' });
            const [m, day, y] = trStr.split('/');
            return new Date(`${y}-${m.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000+03:00`);
        };
        const getTrEnd = (d) => {
            const trStr = d.toLocaleString('en-US', { timeZone: 'Europe/Istanbul', year: 'numeric', month: 'numeric', day: 'numeric' });
            const [m, day, y] = trStr.split('/');
            return new Date(`${y}-${m.padStart(2, '0')}-${day.padStart(2, '0')}T23:59:59.999+03:00`);
        };

        const now = new Date();
        const startOfToday = getTrStart(now);
        const endOfToday = getTrEnd(now);

        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const startOfYesterday = getTrStart(yesterday);
        const endOfYesterday = getTrEnd(yesterday);

        // Haftalık durum: Son 7 gün (bugün dahil 7 gün öncesi)
        const last7Day = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        const startOfWeek = getTrStart(last7Day);

        // Aylık durum: Son 30 gün (bu dahil 30 gün öncesi)
        const last30Day = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
        const startOfMonth = getTrStart(last30Day);

        const periods = {
            today: { $gte: startOfToday, $lte: endOfToday },
            yesterday: { $gte: startOfYesterday, $lte: endOfYesterday },
            week: { $gte: startOfWeek, $lte: endOfToday },
            month: { $gte: startOfMonth, $lte: endOfToday }
        };

        const buildStatPipeline = (range) => [
            { $match: { createdAt: range } },
            { $group: {
                _id: null,
                count: { $sum: 1 },
                revenue: { $sum: { $cond: [{ $in: ["$status", ['cancelled', '9', 'deleted']] }, 0, { $ifNull: ["$totalPrice", 0] }] } },
                pending: { $sum: { $cond: [{ $in: ["$status", ['pending', '1']] }, 1, 0] } },
                processing: { $sum: { $cond: [{ $in: ["$status", ['approved', '2', 'preparing', '3']] }, 1, 0] } },
                shipped: { $sum: { $cond: [{ $in: ["$status", ['shipped', '5', 'delivered', '12']] }, 1, 0] } },
                cancelled: { $sum: { $cond: [{ $in: ["$status", ['cancelled', '9', '10', '11']] }, 1, 0] } }
            }}
        ];

        const activeThreshold = new Date(Date.now() - 60 * 1000); // 60 seconds
        
        const [
            dbProducts, monthlyOrders, todayVisitorsBySite, liveVisitorsBySite, leafPages
        ] = await Promise.all([
            Product.find({}, 'name').lean(),
            Order.find({ createdAt: { $gte: startOfMonth } }).lean(),
            EventLog.aggregate([
                { $match: { timestamp: { $gte: startOfToday }, event_name: 'page_view' } },
                { $group: { _id: "$site_id", count: { $addToSet: "$device_id" } } },
                { $project: { _id: 1, count: { $size: "$count" } } }
            ]),
            EventLog.aggregate([
                { $match: { timestamp: { $gte: activeThreshold } } },
                { $group: { _id: "$site_id", count: { $addToSet: "$session_id" } } },
                { $project: { _id: 1, count: { $size: "$count" } } }
            ]),
            LeafPage.find({}, 'name slug').lean()
        ]);

        const dbProductNames = new Set((dbProducts || []).map(p => p.name));

        const emptyStat = () => ({ count: 0, revenue: 0, pending: 0, processing: 0, shipped: 0, cancelled: 0 });
        const updatedStats = {
            today: emptyStat(),
            yesterday: emptyStat(),
            week: emptyStat(),
            month: emptyStat()
        };

        const performanceMap = {};
        const weeklyDataMap = {};

        for (const order of monthlyOrders || []) {
            const validItems = (order.items || []).filter(item => {
                const itemName = item.name || 'Bilinmeyen Ürün';
                
                // Resolve name using leafPages
                let resolvedName = itemName;
                const page = leafPages.find(lp => lp.slug === order.site_id);
                if (page) {
                    const isPackage = page.products?.some(pkg => pkg.name === itemName);
                    const hasKeywords = itemName.toLowerCase().includes('kutu') || itemName.toLowerCase().includes('adet');
                    if (isPackage || hasKeywords) {
                        resolvedName = page.productName || itemName;
                    }
                }
                
                return dbProductNames.has(resolvedName);
            });
            
            // If the order has NO valid products from the products table, completely ignore it!
            if (validItems.length === 0) continue;

            const isCancelled = ['cancelled', '9', '10', '11', 'deleted'].includes(order.status);
            const orderDate = new Date(order.createdAt);

            // Calculate revenue for only the valid items of this order
            const orderValidRevenue = isCancelled ? 0 : validItems.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);

            const isPending = ['pending', '1'].includes(order.status);
            const isProcessing = ['approved', '2', 'preparing', '3'].includes(order.status);
            const isShipped = ['shipped', '5', 'delivered', '12'].includes(order.status);
            const isOrderCancelled = ['cancelled', '9', '10', '11'].includes(order.status);

            const addStats = (target) => {
                target.count += 1;
                target.revenue += orderValidRevenue;
                if (isPending) target.pending += 1;
                if (isProcessing) target.processing += 1;
                if (isShipped) target.shipped += 1;
                if (isOrderCancelled) target.cancelled += 1;
            };

            // Month
            addStats(updatedStats.month);

            // Week
            if (orderDate >= startOfWeek) {
                addStats(updatedStats.week);
            }

            // Today
            if (orderDate >= startOfToday && orderDate <= endOfToday) {
                addStats(updatedStats.today);

                // Representative Performance (Only calculated for today's valid orders)
                const repName = order.processedBy || "Bilinmiyor";
                if (!performanceMap[repName]) {
                    performanceMap[repName] = { name: repName, approved: 0, cancelled: 0 };
                }
                if (['approved', '2', 'preparing', '3', 'shipped', '5', 'delivered', '12'].includes(order.status)) {
                    performanceMap[repName].approved += 1;
                } else if (['cancelled', '9', '10', '11'].includes(order.status)) {
                    performanceMap[repName].cancelled += 1;
                }
            }

            // Yesterday
            if (orderDate >= startOfYesterday && orderDate <= endOfYesterday) {
                addStats(updatedStats.yesterday);
            }

            // Weekly performance data per day
            if (orderDate >= startOfWeek) {
                const trStr = orderDate.toLocaleString('en-US', { timeZone: 'Europe/Istanbul', year: 'numeric', month: 'numeric', day: 'numeric' });
                const [m, day, y] = trStr.split('/');
                const dayStr = `${y}-${m.padStart(2, '0')}-${day.padStart(2, '0')}`;

                if (!weeklyDataMap[dayStr]) {
                    weeklyDataMap[dayStr] = { count: 0, cancelled: 0 };
                }
                weeklyDataMap[dayStr].count += 1;
                if (isOrderCancelled) {
                    weeklyDataMap[dayStr].cancelled += 1;
                }
            }
        }

        const performance = Object.values(performanceMap).filter(p => p.name !== "Bilinmiyor" && (p.approved > 0 || p.cancelled > 0));

        const weeklyData = [];
        for (let i = 6; i >= 0; i--) {
            const targetDay = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            const trStr = targetDay.toLocaleString('en-US', { timeZone: 'Europe/Istanbul', year: 'numeric', month: 'numeric', day: 'numeric' });
            const [m, day, y] = trStr.split('/');
            const dayStr = `${y}-${m.padStart(2, '0')}-${day.padStart(2, '0')}`;
            const trWeekday = targetDay.toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', weekday: 'long' });
            
            const dbData = weeklyDataMap[dayStr] || { count: 0, cancelled: 0 };
            weeklyData.push({
                date: dayStr,
                day: trWeekday,
                count: dbData.count,
                cancelled: dbData.cancelled
            });
        }

        const visitorStats = leafPages.map(page => {
            const today = todayVisitorsBySite.find(v => v._id === page.slug)?.count || 0;
            const live = liveVisitorsBySite.find(v => v._id === page.slug)?.count || 0;
            return {
                name: page.name,
                slug: page.slug,
                today,
                live
            };
        });

        // 2. Calculate Product Stats
        const productMap = {};
        for (const order of monthlyOrders || []) {
            const isCancelled = ['cancelled', '9', '10', '11', 'deleted'].includes(order.status);
            const orderDate = new Date(order.createdAt);
            
            for (const item of order.items || []) {
                const itemName = item.name || 'Bilinmeyen Ürün';
                const qty = item.qty || 1;
                
                // Resolve name using leafPages
                let resolvedName = itemName;
                const page = leafPages.find(lp => lp.slug === order.site_id);
                if (page) {
                    const isPackage = page.products?.some(pkg => pkg.name === itemName);
                    const hasKeywords = itemName.toLowerCase().includes('kutu') || itemName.toLowerCase().includes('adet');
                    if (isPackage || hasKeywords) {
                        resolvedName = page.productName || itemName;
                    }
                }
                
                // Keep only products in the Product collection!
                if (!dbProductNames.has(resolvedName)) continue;

                if (!productMap[resolvedName]) {
                    productMap[resolvedName] = {
                        name: resolvedName,
                        todayCount: 0,
                        todayRevenue: 0,
                        yesterdayCount: 0,
                        yesterdayRevenue: 0,
                        weekCount: 0,
                        weekRevenue: 0,
                        monthCount: 0,
                        monthRevenue: 0
                    };
                }

                const itemRevenue = isCancelled ? 0 : (item.price || 0) * qty;

                // Month
                productMap[resolvedName].monthCount += 1;
                productMap[resolvedName].monthRevenue += itemRevenue;

                // Week
                if (orderDate >= startOfWeek) {
                    productMap[resolvedName].weekCount += 1;
                    productMap[resolvedName].weekRevenue += itemRevenue;
                }

                // Today
                if (orderDate >= startOfToday && orderDate <= endOfToday) {
                    productMap[resolvedName].todayCount += 1;
                    productMap[resolvedName].todayRevenue += itemRevenue;
                }

                // Yesterday
                if (orderDate >= startOfYesterday && orderDate <= endOfYesterday) {
                    productMap[resolvedName].yesterdayCount += 1;
                    productMap[resolvedName].yesterdayRevenue += itemRevenue;
                }
            }
        }
        const productStats = Object.values(productMap).sort((a, b) => b.monthRevenue - a.monthRevenue);

        res.json({
            success: true,
            stats: {
                ...updatedStats,
                visitors: visitorStats,
                weeklyData: weeklyData,
                productStats: productStats
            },
            performance: performance
        });
        } catch (error) {
            console.error('❌ Stats Error:', error);
            res.status(500).json({ success: true, stats: { // Return empty stats on error to avoid crash
                today: { count: 0, revenue: 0, pending: 0, processing: 0, shipped:0, cancelled: 0 },
                yesterday: { count: 0, revenue: 0, pending: 0, processing: 0, shipped:0, cancelled: 0 },
                week: { count: 0, revenue: 0, pending: 0, processing: 0, shipped:0, cancelled: 0 },
                month: { count: 0, revenue: 0, pending: 0, processing: 0, shipped:0, cancelled: 0 },
                weeklyData: []
            }, performance: [] });
        }
    });

app.get('/api/get_order_counts.php', auth, async (req, res) => {
    try {
        const now = new Date();
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            total, newCount, preparing, cancelled, future, shipped, deliveredCount, returnedCount,
            today, week, month, approved, social, ulasCount, instaCount, fbCount, productAgg, dbProducts, allLeafPages
        ] = await Promise.all([
            Order.countDocuments({}),
            Order.countDocuments({ status: { $in: ['pending', '1'] } }),
            Order.countDocuments({ status: { $in: ['preparing', '3'] } }),
            Order.countDocuments({ status: { $in: ['cancelled', '9', '10', '11'] } }),
            Order.countDocuments({ status: { $in: ['future', '16'] } }),
            Order.countDocuments({ status: { $in: ['shipped', '5'] } }),
            Order.countDocuments({ status: { $in: ['delivered', '12'] } }),
            Order.countDocuments({ status: { $in: ['returned', '18'] } }),
            Order.countDocuments({ createdAt: { $gte: startOfToday } }),
            Order.countDocuments({ createdAt: { $gte: startOfWeek } }),
            Order.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Order.countDocuments({ status: { $in: ['approved', '2'] } }),
            Order.countDocuments({ status: { $in: ['social', '14', '15'] } }),
            Order.countDocuments({ status: { $in: ['ulasilamayan', '13'] } }),
            Order.countDocuments({ status: { $in: ['instagram', '14'] } }),
            Order.countDocuments({ status: { $in: ['facebook', '15'] } }),
            Order.aggregate([
                { $unwind: "$items" },
                { $group: { _id: { name: "$items.name", site_id: "$site_id" }, count: { $sum: 1 } } }
            ]),
            Product.find({}, 'name'),
            LeafPage.find({}, 'slug productName products')
        ]);
        
        const leafPages = allLeafPages || [];
        
        // Resolve names and aggregate by final name
        const productCountsMap = {};
        productAgg.forEach(p => {
            const itemName = p._id.name;
            const siteId = p._id.site_id;
            let finalName = itemName;

            const page = leafPages.find(lp => lp.slug === siteId);
            if (page) {
                // If it's a known package or contains "Kutu/Adet", resolve to productName
                const isPackage = page.products?.some(pkg => pkg.name === itemName);
                const hasKeywords = itemName.toLowerCase().includes('kutu') || itemName.toLowerCase().includes('adet');
                
                if (isPackage || hasKeywords) {
                    finalName = page.productName || itemName;
                }
            }

            productCountsMap[finalName] = (productCountsMap[finalName] || 0) + p.count;
        });
        
        // Keep ONLY products that exist in our database Product table!
        const finalProductCounts = dbProducts.map(p => ({
            name: p.name,
            count: productCountsMap[p.name] || 0
        })).filter(p => p.count > 0);

        // Sort final list again by count descending
        finalProductCounts.sort((a, b) => b.count - a.count);

        res.json({
            success: true,
            counts: {
                total,
                new: newCount,
                preparing,
                social,
                cancelled,
                future: future,
                ulasilamayan: ulasCount,
                shipped,
                delivered: deliveredCount,
                returned: returnedCount,
                today,
                week,
                month,
                approved,
                instagram: instaCount,
                facebook: fbCount,
                toShip: preparing + social,
                productCounts: finalProductCounts
            }
        });
    } catch (error) {
        console.error('❌ Count Error:', error);
        res.status(500).json({ success: false });
    }
});

app.post('/api/process_shipment.php', auth, async (req, res) => {
    try {
        const { order_ids, type } = req.body;
        const batchId = `BATCH-${Date.now()}-${Math.round(Math.random() * 1000)}`;
        
        if (type === 'export') {
            console.log(`[Shipment] Excel export performed for ${order_ids?.length} orders by ${req.user.fullName}`);
            // Log the batch export
            if (order_ids && order_ids.length > 0) {
                for (const id of order_ids) {
                    await OrderLog.create({
                        orderId: id,
                        action: 'export',
                        changedBy: req.user.fullName,
                        details: 'Excel listesine eklendi',
                        batchId
                    });
                }
            }
            return res.json({ success: true, batchId });
        }

        if (type === 'shipment') {
            if (!order_ids || !Array.isArray(order_ids)) {
                return res.status(400).json({ success: false, message: 'Geçersiz sipariş listesi' });
            }

            const results = await Promise.all(order_ids.map(async (id) => {
                const order = await Order.findById(id);
                if (order) {
                    const oldStatus = order.status;
                    order.status = 'shipped';
                    await order.save();

                    await OrderLog.create({
                        orderId: order._id,
                        action: 'status_changed',
                        changedBy: req.user.fullName,
                        details: `Sevkiyat: ${oldStatus} → shipped`,
                        batchId,
                        metadata: { 
                            oldStatus, 
                            newStatus: 'shipped',
                            revenue: order.totalPrice || 0
                        }
                    });
                    return true;
                }
                return false;
            }));

            const count = results.filter(r => r).length;
            return res.json({ 
                success: true, 
                message: `${count} sipariş kargoya verildi.`, 
                processed_count: count,
                batchId 
            });
        }

        res.status(400).json({ success: false, message: 'Bilinmeyen işlem tipi' });
    } catch (error) {
        console.error('❌ Shipping Process Error:', error);
        res.status(500).json({ success: false, message: 'İşlem başarısız' });
    }
});

app.get('/api/get_shipment_logs.php', auth, async (req, res) => {
    try {
        const logs = await OrderLog.aggregate([
            { $match: { batchId: { $ne: null } } },
            { $group: {
                _id: "$batchId",
                created_at: { $first: "$createdAt" },
                user_name: { $first: "$changedBy" },
                type: { $first: "$action" },
                count: { $sum: 1 },
                revenue: { $sum: { $ifNull: ["$metadata.revenue", 0] } },
                is_reverted: { $first: "$isReverted" }
            }},
            { $sort: { created_at: -1 } },
            { $project: {
                id: "$_id",
                created_at: { $divide: [{ $toLong: "$created_at" }, 1000] },
                user_name: 1,
                type: { $cond: [{ $eq: ["$type", "status_changed"] }, "shipment", "$type"] },
                count: 1,
                revenue: 1,
                is_reverted: 1
            }}
        ]);
        res.json({ success: true, logs });
    } catch (error) {
        console.error('Shipment Logs Error:', error);
        res.status(500).json({ success: false, message: 'Loglar çekilemedi' });
    }
});

app.post('/api/undo_shipment.php', auth, async (req, res) => {
    try {
        const { log_id } = req.body;
        const logs = await OrderLog.find({ batchId: log_id, isReverted: false });
        
        if (!logs.length) {
            return res.status(404).json({ success: false, message: 'İşlem bulunamadı veya zaten geri alınmış' });
        }

        for (const log of logs) {
            if (log.action === 'status_changed' && log.metadata?.oldStatus) {
                await Order.findByIdAndUpdate(log.orderId, { status: log.metadata.oldStatus });
            }
            log.isReverted = true;
            await log.save();
            
            // Log the undo action
            await OrderLog.create({
                orderId: log.orderId,
                action: 'undo',
                changedBy: req.user.fullName,
                details: `İşlem geri alındı: ${log.batchId}`
            });
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Undo Shipment Error:', error);
        res.status(500).json({ success: false, message: 'İşlem geri alınamadı' });
    }
});

// ==========================================
// PROTECTED API ROUTES (ADMIN)
// ==========================================

const sharp = require('sharp');

// --- Upload Image ---
app.post('/api/upload', auth, upload.single('image'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Dosya yüklenemedi.' });
    }

    try {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const filename = uniqueSuffix + '.webp';
        
        // Use the globally defined imagesPath
        const outputPath = path.join(imagesPath, filename);

        await sharp(req.file.buffer)
            .webp({ quality: 80 })
            .toFile(outputPath);

        const imageUrl = `/images/${filename}`;
        res.json({ success: true, url: imageUrl });
    } catch (error) {
        console.error('Sharp Image Processing Error:', error);
        res.status(500).json({ success: false, message: 'Resim işlenirken hata oluştu.' });
    }
});

// --- Import Images from URL ---
app.post('/api/import-images', auth, async (req, res) => {
    console.log('[DEBUG] Import request received');
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'URL gereklidir.' });

    console.log(`[Import] Starting scrape for: ${url}`);
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // Set a reasonable timeout and user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // Extract image sources targeting specific links (e.g., <a href="#siparisformu">)
        const imgSrcs = await page.evaluate(() => {
            // First try to find images inside specific tracking links
            const anchorImgs = Array.from(document.querySelectorAll('a[href*="siparisformu"], a[href*="paket-secimi"], a[href*="siparis-formu"], a[href*="paketler"]'))
                .flatMap(a => Array.from(a.querySelectorAll('img')))
                .map(img => img.src)
                .filter(src => src && src.startsWith('http'));

            if (anchorImgs.length > 0) return anchorImgs;

            // Fallback: If no specific anchors found, maybe look for common content images
            return Array.from(document.querySelectorAll('.contentimg, #content img, .entry-content img'))
                .map(img => img.src)
                .filter(src => src && src.startsWith('http'));
        });

        await browser.close();
        browser = null;

        if (imgSrcs.length === 0) {
            return res.json({ success: true, images: [], message: 'Sayfada uygun görsel bulunamadı.' });
        }

        console.log(`[Import] Found ${imgSrcs.length} images. Starting download...`);

        const importedImages = [];
        // Process unique images only
        const uniqueSrcs = [...new Set(imgSrcs)];

        for (const src of uniqueSrcs) {
            try {
                const imgRes = await fetch(src);
                if (!imgRes.ok) continue;

                const buffer = await imgRes.arrayBuffer();
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const filename = `imported-${uniqueSuffix}.webp`;
                const outputPath = path.join(imagesPath, filename);

                await sharp(Buffer.from(buffer))
                    .webp({ quality: 80 })
                    .toFile(outputPath);

                importedImages.push(`/images/${filename}`);
            } catch (err) {
                console.error(`[Import] Failed to process ${src}:`, err.message);
            }
        }

        res.json({ success: true, images: importedImages });
    } catch (error) {
        if (browser) await browser.close();
        console.error('❌ Import Error:', error);
        res.status(500).json({ success: false, message: 'URL taranırken hata oluştu: ' + error.message });
    }
});

// --- Leaf Pages Management ---
app.get('/api/leaf-pages', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const total = await LeafPage.countDocuments();
        const leafPages = await LeafPage.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Calculate active users per slug in the last 60 seconds
        const activeThreshold = new Date(Date.now() - 60 * 1000); 
        const activeUsersCount = await EventLog.aggregate([
            { $match: { timestamp: { $gte: activeThreshold } } },
            { $group: { _id: "$site_id", users: { $addToSet: "$session_id" } } },
            { $project: { _id: 1, count: { $size: "$users" } } }
        ]);

        const activeUsersMap = {};
        activeUsersCount.forEach(row => {
            activeUsersMap[row._id] = row.count;
        });

        const leafPagesWithActive = leafPages.map(page => {
            return {
                ...page.toObject(),
                activeUsers: activeUsersMap[page.slug] || 0
            };
        });

        res.json({ 
            success: true, 
            leafPages: leafPagesWithActive,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// legacy-sites endpoint removed

app.get('/api/leaf-pages/:id', auth, async (req, res) => {
    try {
        const page = await LeafPage.findById(req.params.id);
        if (!page) return res.status(404).json({ success: false, message: 'Sayfa bulunamadı' });
        res.json({ success: true, page });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/leaf-pages', auth, async (req, res) => {
    try {
        const { name, slug, pixelCode, tiktokPixelId, tiktokAccessToken, metaPixelId, metaAccessToken, metaTestCode, productName, productPrice, productId, products, components, phone, mainImage } = req.body;
        const existing = await LeafPage.findOne({ slug: slug.toLowerCase() });
        if (existing) return res.status(400).json({ success: false, message: 'Bu slug (uyantı) zaten kullanımda.' });
        const newPage = new LeafPage({ name, slug, pixelCode, tiktokPixelId, tiktokAccessToken, metaPixelId, metaAccessToken, metaTestCode, productName, productPrice, productId, products, components, phone, mainImage });
        await newPage.save();
        res.status(201).json({ success: true, page: newPage });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Ekleme hatası' });
    }
});

app.put('/api/leaf-pages/:id', auth, async (req, res) => {
    try {
        const page = await LeafPage.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, page });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.delete('/api/leaf-pages/:id', auth, async (req, res) => {
    try {
        await LeafPage.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/leaf-pages/:id/clone', auth, async (req, res) => {
    try {
        const sourcePage = await LeafPage.findById(req.params.id);
        if (!sourcePage) return res.status(404).json({ success: false, message: 'Kaynak sayfa bulunamadı' });

        const randomStr = Math.random().toString(36).substring(2, 8);
        const newSlug = `${sourcePage.slug}-copy-${randomStr}`;
        const newSubdomain = randomStr;

        // Clone LeafPage
        const pageObj = sourcePage.toObject();
        delete pageObj._id;
        delete pageObj.createdAt;
        pageObj.name = `${pageObj.name} (Kopya)`;
        pageObj.slug = newSlug;

        const newPage = new LeafPage(pageObj);
        await newPage.save();

        // Create Site for the cloned page
        const Site = require('./models/Site');
        const newSite = new Site({
            name: newPage.name,
            subdomain: newSubdomain,
            leafPageId: newPage._id,
            pixelCode: newPage.pixelCode
        });
        await newSite.save();

        res.json({ success: true, page: newPage, site: newSite });
    } catch (error) {
        console.error('❌ Clone Error:', error);
        res.status(500).json({ success: false, message: 'Klonlama hatası: ' + error.message });
    }
});

// --- Sites Management ---
app.get('/api/sites', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const total = await Site.countDocuments();
        const sites = await Site.find().populate('leafPageId').sort({ createdAt: -1 }).skip(skip).limit(limit);
        
        const now = new Date();
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));
        const activeThreshold = new Date(Date.now() - 60 * 1000); // 60 seconds
        
        const sitesWithActive = await Promise.all(sites.map(async (site) => {
            const activeUsers = await EventLog.distinct('session_id', {
                site_id: site.subdomain,
                timestamp: { $gte: activeThreshold }
            });
            const todayOrders = await Order.countDocuments({
                createdAt: { $gte: startOfToday },
                $or: [{ siteId: site.subdomain }, { subdomain: site.subdomain }]
            });
            const totalOrders = await Order.countDocuments({
                $or: [{ siteId: site.subdomain }, { subdomain: site.subdomain }]
            });

            return {
                ...site.toObject(),
                activeUsers: activeUsers.length || 0,
                todayOrders,
                totalOrders,
                productName: site.leafPageId ? site.leafPageId.productName : (site.folder || 'Bilinmiyor')
            };
        }));

        res.json({ 
            success: true, 
            sites: sitesWithActive,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('Siteler getirilemedi:', error);
        res.status(500).json({ success: false, message: 'Siteler getirilemedi.' });
    }
});

app.get('/api/sites/:id', auth, async (req, res) => {
    try {
        const site = await Site.findById(req.params.id);
        if (!site) return res.status(404).json({ success: false, message: 'Site bulunamadı' });
        res.json({ success: true, site });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Hata oluştu' });
    }
});

app.post('/api/sites', auth, async (req, res) => {
    try {
        const { name, subdomain, folder, leafPageId, pixelCode } = req.body;
        const existing = await Site.findOne({ subdomain: subdomain.toLowerCase() });
        if (existing) return res.status(400).json({ success: false, message: 'Bu subdomain zaten kullanımda.' });
        const newSite = new Site({ name, subdomain, folder, leafPageId, pixelCode });
        await newSite.save();
        res.status(201).json({ success: true, site: newSite });
    } catch (error) {
        console.error('Site creation error:', error);
        res.status(500).json({ success: false, message: 'Ekleme hatası' });
    }
});

app.put('/api/sites/:id', auth, async (req, res) => {
    try {
        const site = await Site.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, site });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Güncelleme hatası' });
    }
});

app.delete('/api/sites/:id', auth, async (req, res) => {
    try {
        await Site.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// ==========================================
// ORDER PRESENCE (LOCKING) SYSTEM
// ==========================================

app.get('/api/orders/locks', auth, async (req, res) => {
    try {
        const locks = await OrderLock.find();
        res.json({ success: true, locks });
    } catch (error) {
        console.error('Presence Locks Error:', error);
        res.status(500).json({ success: false });
    }
});

app.post('/api/orders/:id/lock', auth, async (req, res) => {
    try {
        const orderId = req.params.id;
        const { id: userId, fullName: userName } = req.user;
        console.log(`[Presence] Locking order ${orderId} for user ${userName}`);
        const expiresAt = new Date(Date.now() + 15 * 1000); // 15 seconds expiry

        // Upsert the lock
        const lock = await OrderLock.findOneAndUpdate(
            { orderId, userId },
            { userName, expiresAt },
            { upsert: true, new: true }
        );
        console.log(`[Presence] Lock updated for order ${orderId}, user ${userName}. Expiry: ${expiresAt.toISOString()}`);

        // Get all active locks for this order to return to the user
        const activeLocks = await OrderLock.find({ 
            orderId, 
            userId: { $ne: userId } // Other users
        });

        res.json({ success: true, activeLocks });
    } catch (error) {
        console.error('Lock Error:', error);
        res.status(500).json({ success: false });
    }
});

app.post('/api/orders/:id/unlock', auth, async (req, res) => {
    try {
        const orderId = req.params.id;
        const { id: userId, userName } = req.user;
        console.log(`[Presence] Unlocking order ${orderId} for user ${userId}`);
        const result = await OrderLock.deleteOne({ orderId, userId });
        console.log(`[Presence] Unlock result:`, result);
        res.json({ success: true });
    } catch (error) {
        console.error('Unlock Error:', error);
        res.status(500).json({ success: false });
    }
});

// --- Orders Management ---
app.put('/api/orders/:id/status', auth, async (req, res) => {
    console.log(`\n>>> [STATUS UPDATE] Hit for order: ${req.params.id} <<<`);
    console.log(`    Status: ${req.body?.status}, Source: ${req.query.source}`);
    try {
        const { status, cancellationReason } = req.body;
        const noteText = cancellationReason ? `İptal sebebi: ${cancellationReason}` : null;
        
        console.log(`    [Status Local] Updating local order: ${req.params.id}`);
        const updateData = { 
            status,
            processedBy: req.user.fullName || 'Personel',
            processedAt: new Date()
        };

        const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
        await OrderLog.create({ 
            orderId: req.params.id, 
            action: 'status_change', 
            changedBy: req.user.fullName || 'Admin', 
            details: `Durum güncellendi: ${status}` 
        });

        if (noteText) {
            await OrderLog.create({
                orderId: req.params.id,
                action: 'note',
                changedBy: req.user.fullName || 'Admin',
                details: noteText
            });
        }
        res.json({ success: true, order });
    } catch (error) {
        console.error('❌ Status Update Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Order Management Native
app.get('/api/orders', auth, async (req, res) => {
    try {
        const { date, status, search, limit, page } = req.query;
        let query = {};
        
        // Sadece sufyan-yaprak veritabanında tanımlı olan LeafPage / Site slug'larına ait siparişleri getir
        const activeLeafPages = await LeafPage.find({}, 'slug');
        const activeSites = await Site.find({}, 'subdomain');
        const allActiveSlugs = [
            ...activeLeafPages.map(p => p.slug?.toLowerCase()),
            ...activeSites.map(s => s.subdomain?.toLowerCase())
        ].filter(Boolean);
        
        query.site_id = { $in: allActiveSlugs };
        
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            query.createdAt = { $gte: start, $lte: end };
        }

        if (status) {
            let statusArray = status.split(',');
            const expandedModes = new Set(statusArray);
            
            const legacyMap = {
                'pending': '1',
                'approved': '2',
                'preparing': '3',
                'shipped': '5',
                'cancelled': ['9', '10', '11'],
                'delivered': '12',
                'ulasilamayan': '13',
                'social': ['14', '15'],
                'facebook': '15',
                'instagram': '14',
                'future': '16',
                'test': ['8', '17'],
                'returned': '18'
            };

            statusArray.forEach(s => {
                if (legacyMap[s]) {
                    if (Array.isArray(legacyMap[s])) {
                        legacyMap[s].forEach(id => expandedModes.add(id));
                    } else {
                        expandedModes.add(legacyMap[s]);
                    }
                }
            });

            query.status = { $in: Array.from(expandedModes) };
        }

        if (search) {
            const searchRegex = { $regex: search, $options: 'i' };
            query.$or = [
                { fullName: searchRegex },
                { phone: searchRegex },
                { province: searchRegex },
                { district: searchRegex },
                { site_id: searchRegex }
            ];
        }

        if (req.query.product) {
            const productName = req.query.product;
            const matchingPages = await LeafPage.find({ productName: productName }, 'slug');
            const slugs = matchingPages.map(p => p.slug);
            console.log(`🔍 Product Filter: ${productName}, Found Slugs:`, slugs);
            
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { 'items.name': { $regex: productName, $options: 'i' } },
                    { 
                        site_id: { $in: slugs },
                        'items.name': { $regex: 'Kutu|Adet', $options: 'i' }
                    }
                ]
            });
        }

        const limitVal = parseInt(limit) || 50;
        const pageVal = parseInt(page) || 1;
        const skip = (pageVal - 1) * limitVal;

        const orders = await Order.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitVal);
        
        const total = await Order.countDocuments(query);

        res.json({ 
            success: true, 
            orders,
            total,
            totalPages: Math.ceil(total / limitVal),
            currentPage: pageVal
        });
    } catch (error) {
        console.error('❌ Orders Fetch Error:', error);
        res.status(500).json({ success: false, message: 'Siparişler çekilemedi' });
    }
});

// Internal Order Creation Logic
async function createOrderInternal(data, ip) {
    const { 
        fullName, phone, province, district, address, 
        paymentMethod, product_package, packages, siteId, 
        ip_address, totalPrice, items, status, processedBy 
    } = data;

    // --- DEDUPLICATION CHECK ---
    // Prevent double orders if the same phone number creates an order within 30 seconds
    const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
    const existingOrder = await Order.findOne({
        phone: phone,
        createdAt: { $gte: thirtySecondsAgo }
    });
    
    if (existingOrder) {
        console.warn(`[Duplicate Prevention] Sipariş engellendi: ${phone}`);
        return existingOrder;
    }

    // Construct items array - Harmonize with landing page (product_name) and manual panel (items)
    let finalItems = items || [];
    
    // Support landing page format (product_name, quantity)
    if (finalItems.length === 0 && data.product_name) {
        finalItems.push({ 
            name: data.product_name, 
            qty: Number(data.quantity || 1), 
            price: Number(data.totalPrice || 0) 
        });
    }
    
    // Support legacy/alternate format (product_package)
    if (finalItems.length === 0 && product_package) {
        finalItems.push({ name: product_package, qty: 1 });
    }
    
    // Support packages array
    if (finalItems.length === 0 && packages && Array.isArray(packages)) {
        finalItems = packages.map(p => ({ name: p.name, qty: p.qty || 1, price: p.price }));
    }

    const newOrder = new Order({
        fullName,
        phone,
        province,
        district,
        address,
        paymentMethod,
        site_id: siteId || data.site_id,
        referer: data.referer || '', // Save referer if provided
        items: finalItems,
        device_id: data.device_id || '',
        ip_address: ip_address || ip,
        status: status || 'pending',
        totalPrice: totalPrice || 0,
        source: 'local',
        processedBy,
        processedAt: processedBy ? new Date() : null
    });

    await newOrder.save();
    
    // Log creation
    await OrderLog.create({
        orderId: newOrder._id,
        action: 'created',
        details: processedBy ? `Sipariş manuel oluşturuldu (${processedBy})` : 'Sipariş oluşturuldu'
    });

    return newOrder;
}

async function sendNtfyNotification(order) {
    try {
        console.log(`[ntfy] Yeni siparis icin bildirim islemi basladi: ${order._id}`);
        
        // Teşhis logu: Veritabanındaki tüm kullanıcıları ve ntfyTopic durumlarını gör
        const allUsers = await User.find({}, 'username ntfyTopic status');
        console.log('[ntfy] Veritabanindaki kullanıcılar:');
        allUsers.forEach(u => console.log(` - ${u.username}: topic='${u.ntfyTopic}', durum=${u.status}`));

        // ntfyTopic tanımlanmış kullanıcıları bul
        const allUsersWithTopic = await User.find({ 
            ntfyTopic: { $ne: '', $exists: true }
        });
        
        // Aktif olanları JavaScript seviyesinde filtrele (CastError hatasını önlemek için)
        const users = allUsersWithTopic.filter(u => u.status == 1 || u.status === true || u.status === "1");

        const safeCustomerName = order.fullName || order.customer || 'Bilinmeyen Musteri';

        if (!users || users.length === 0) {
            const defaultTopic = process.env.NTFY_TOPIC || 'adenteknik_siparis_takip';
            console.warn(`[ntfy] Kayitli aktif ntfyTopic sahibi bulunamadı. Varsayilan odaya (${defaultTopic}) gonderiliyor.`);
            return await sendSingleNtfy(defaultTopic, order, `https://.site/orders/${order._id}`);
        }

        console.log(`[ntfy] ${users.length} adet cihaz/kanal bulundu. Gonderiliyor...`);

        for (const user of users) {
             try {
                // Token ve link oluşturma
                const token = jwt.sign(
                    { id: user._id, username: user.username, fullName: user.fullName, role: user.role }, 
                    process.env.JWT_SECRET || 'yaprak_secret_key', 
                    { expiresIn: '24h' }
                );
                const loginUrl = `https://.site/login?token=${token}&redirect=/orders/${order._id}`;
                
                console.log(`[ntfy] -> ${user.username} kullanıcısına gonderiliyor: ${user.ntfyTopic}`);
                await sendSingleNtfy(user.ntfyTopic, order, loginUrl);
             } catch (tokenErr) {
                console.error(`[ntfy] ${user.username} token hatasi:`, tokenErr.message);
             }
        }
    } catch (error) {
        console.error(`[ntfy] Kritik gonderim hatasi: ${error.message}`);
    }
}

async function sendSingleNtfy(topic, order, clickUrl) {
    const url = `https://ntfy.sh/${topic}`;
    const safeName = order.fullName || order.customer || 'Bilinmeyen Musteri';
    const message = `${safeName} bir siparis olusturdu.`;
    
    console.log(`[ntfy] Istek gonderiliyor: ${url}`);
    
    try {
        const response = await axios.post(url, message, {
            headers: {
                'Title': 'Yeni Siparis Geldi!',
                'Tags': 'package,shopping_bags',
                'Priority': 'high',
                'Click': clickUrl || 'https://.site/orders?filter=new'.trim(),
                'Icon': 'https://cdn..com/images/theme-images/97987e86-d147-4b63-a081-34e07894d6f5/image_180.webp',
                'Content-Type': 'text/plain; charset=utf-8'
            },
            timeout: 15000, // 15 saniyeye çıkardım
            family: 4 // IPv4 adreslemesini zorunlu tut (Çözüm burası!)
        });

        console.log(`[ntfy] ${topic} kanalina bildirim basariyla gonderildi.`);
    } catch (err) {
        let errorMsg = err.message;
        if (err.response) {
            errorMsg = `HTTP ${err.response.status}: ${JSON.stringify(err.response.data)}`;
        } else if (err.code) {
            errorMsg = `Baglanti Hatasi (${err.code})`;
        }
        console.error(`[ntfy] ${topic} gonderim hatası:`, errorMsg);
    }
}

// Create Order (Renderer/App)
app.post('/api/orders', async (req, res) => {
    try {
        // Validation check for landing page / external requests
        const { fullName, phone, address, paymentMethod } = req.body;
        if (!fullName || !phone || !address || !paymentMethod) {
            return res.status(400).json({ success: false, message: 'Lütfen tüm zorunlu alanları doldurun.' });
        }

        // --- VALIDATION: CHECK IF PRODUCT/PAGE EXISTS IN THIS DATABASE ---
        const siteId = req.body.siteId || 'default';
        if (siteId !== 'default') {
            const activePage = await LeafPage.findOne({ slug: siteId.toLowerCase() });
            if (!activePage) {
                console.warn(`[Blocked Unauthorized Order] Bilinmeyen/Yabancı ürün slug'ı ile sipariş engellendi: ${siteId}`);
                return res.status(400).json({ success: false, message: 'Geçersiz ürün veya sayfa kimliği.' });
            }
        }

        // --- 24 SAAT MÜKERRER SİPARİŞ KONTROLÜ ---
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
        const deviceId = req.body.device_id;
        const cleanPhone = phone.replace(/\s/g, '');
        
        // Find product name in the request
        const productName = req.body.product_name || req.body.product_package || (req.body.items && req.body.items[0]?.name);

        // Build $or conditions: block if ANY ONE matches
        const dupConditions = [];
        if (cleanPhone) dupConditions.push({ phone: cleanPhone });
        if (deviceId && deviceId !== 'unknown') dupConditions.push({ device_id: deviceId });
        if (clientIp) dupConditions.push({ ip_address: clientIp });

        if (dupConditions.length > 0 && productName) {
            const existingOrder = await Order.findOne({
                createdAt: { $gte: twentyFourHoursAgo },
                $or: dupConditions,
                "items.name": productName
            });

            if (existingOrder) {
                console.warn(`[Duplicate 24h] Aynı üründen sipariş engellendi -> Ürün: ${productName}, Telefon: ${cleanPhone}, Device: ${deviceId}, IP: ${clientIp}`);
                // Return 200 status code instead of 429 so that reverse proxies (like Nginx) 
                // do not intercept the request with custom HTML error pages, ensuring JSON can be parsed.
                return res.status(200).json({ 
                    success: false, 
                    duplicate: true,
                    message: 'Siparişiniz daha önce alınmıştır. Müşteri temsilcimiz en kısa sürede sizinle iletişime geçecektir.' 
                });
            }
        }

        const newOrder = await createOrderInternal(req.body, req.ip);
        
        // Fetch product/page-specific details (TikTok Pixel) but enforce global WhatsApp phone
        let productPhone = '';
        let tiktokPixelId = '';
        let tiktokAccessToken = '';

        try {
            const siteId = req.body.siteId || 'default';
            if (siteId !== 'default') {
                const lp = await LeafPage.findOne({ slug: siteId.toLowerCase() });
                if (lp) {
                    // We no longer read productPhone from the individual page settings as requested.
                    if (lp.tiktokPixelId) tiktokPixelId = lp.tiktokPixelId;
                    if (lp.tiktokAccessToken) tiktokAccessToken = lp.tiktokAccessToken;
                }
            }
            
            // Always use the global active WhatsApp number for confirmation
            const wpSetting = await GlobalSetting.findOne({ key: 'active_wp_number' });
            if (wpSetting) {
                productPhone = wpSetting.value;
            }
        } catch (err) {
            console.error('Error fetching page details:', err);
        }

        // --- TikTok Events API (Server Side) ---
        if (tiktokPixelId && tiktokAccessToken) {
            sendTikTokServerEvent('Purchase', req, newOrder, tiktokPixelId, tiktokAccessToken);
            sendTikTokServerEvent('CompletePayment', req, newOrder, tiktokPixelId, tiktokAccessToken);
        }

        // --- ntfy.sh Telefon Bildirimi ---
        console.log(`[Order API] Bildirim tetikleniyor. Musteri: ${newOrder.fullName}, ID: ${newOrder._id}`);
        sendNtfyNotification(newOrder).catch(err => console.error('[Order API] ntfy Hatası:', err));

        res.status(201).json({ 
            success: true, 
            message: 'Siparişiniz başarıyla alındı.', 
            orderId: newOrder._id,
            productPhone: productPhone || '905444778742' // Ultimate fallback
        });
    } catch (error) {
        console.error('❌ Order Create Error:', error);
        res.status(500).json({ success: false, message: 'Sipariş oluşturulamadı: ' + error.message });
    }
});

// Create Order (Manual Panel)
app.post('/api/orders/manual', auth, async (req, res) => {
    try {
        req.body.status = req.body.status || 'preparing'; 
        req.body.processedBy = req.user.fullName;
        const newOrder = await createOrderInternal(req.body, req.ip);
        
        // --- ntfy.sh Telefon Bildirimi ---
        sendNtfyNotification(newOrder);
        
        res.json({ success: true, message: 'Sipariş başarıyla oluşturuldu', orderId: newOrder._id });
    } catch (error) {
        console.error('❌ Manual Order Create Error:', error);
        res.status(500).json({ success: false, message: 'Manuel sipariş oluşturulamadı: ' + error.message });
    }
});

app.get('/api/orders/:id', auth, async (req, res) => {
    try {
        let order = await Order.findById(req.params.id);
        
        if (!order) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });
        
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.put('/api/orders/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });

        const oldStatus = order.status;
        const updateData = { ...req.body };
        
        if (updateData.status && updateData.status !== oldStatus) {
            if (updateData.status === 'preparing') {
                updateData.processedBy = req.user.fullName;
                updateData.processedAt = new Date();
            }
            
            await OrderLog.create({
                orderId: order._id,
                action: 'status_changed',
                changedBy: req.user.fullName,
                details: `Durum: ${oldStatus} → ${updateData.status}`
            });
        }

        const updated = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json({ success: true, order: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.delete('/api/orders/:id', auth, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: 'Sipariş bulunamadı' });

        await Order.findByIdAndDelete(req.params.id);
        // Also delete associated logs
        await OrderLog.deleteMany({ orderId: req.params.id });

        res.json({ success: true, message: 'Sipariş başarıyla silindi.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/api/orders/:id/logs', auth, async (req, res) => {
    try {
        const logs = await OrderLog.find({ orderId: req.params.id }).sort({ createdAt: -1 });
        res.json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

app.post('/api/orders/:id/notes', auth, async (req, res) => {
    try {
        const { note } = req.body;
        if (!note) return res.status(400).json({ success: false, message: 'Not boş olamaz' });

        const log = new OrderLog({
            orderId: req.params.id,
            action: 'note',
            changedBy: req.user.fullName,
            details: note
        });
        await log.save();
        res.json({ success: true, log });
    } catch (error) {
        console.error('❌ Add Note Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- Dashboard & Analytics ---
app.get('/api/stats', auth, async (req, res) => {
    try {
        const { site_id } = req.query;
        const query = site_id ? { site_id } : {};
        
        const now = new Date();
        const startOfToday = new Date(new Date(now).setHours(0, 0, 0, 0));
        const startOfYesterday = new Date(new Date(startOfToday).setDate(startOfToday.getDate() - 1));
        const endOfYesterday = new Date(new Date(startOfToday).getTime() - 1);
        const startOfWeek = new Date(new Date(now).setDate(now.getDate() - 7));
        const startOfMonth = new Date(new Date(now).setDate(now.getDate() - 30));

        const periods = {
            today: { $gte: startOfToday },
            yesterday: { $gte: startOfYesterday, $lte: endOfYesterday },
            week: { $gte: startOfWeek },
            month: { $gte: startOfMonth }
        };

        const responseData = { success: true, stats: {}, employeePerformance: [] };

        // Helper to get stats for a range
        const getRangeStats = async (range) => {
            const rangeQuery = { ...query, createdAt: range };
            const [counts, revenue] = await Promise.all([
                Order.aggregate([
                    { $match: rangeQuery },
                    { $group: {
                        _id: null,
                        total: { $sum: 1 },
                        pending: { $sum: { $cond: [{ $in: ["$status", ["pending", "1"]] }, 1, 0] } },
                        approved: { $sum: { $cond: [{ $in: ["$status", ["approved", "preparing", "2", "3"]] }, 1, 0] } },
                        cancelled: { $sum: { $cond: [{ $in: ["$status", ["cancelled", "9"]] }, 1, 0] } }
                    }}
                ]),
                Order.aggregate([
                    // Ciro: Tüm siparişlerin toplam tutarı
                    { $match: { ...rangeQuery } },
                    { $group: { _id: null, total: { $sum: "$totalPrice" } } }
                ])
            ]);
            return {
                count: counts[0]?.total || 0,
                revenue: revenue[0]?.total || 0,
                pending: counts[0]?.pending || 0,
                approved: counts[0]?.approved || 0,
                cancelled: counts[0]?.cancelled || 0
            };
        };

        for (const [key, range] of Object.entries(periods)) {
            responseData.stats[key] = await getRangeStats(range);
        }

        // --- Employee Performance (Local) ---
        const empPerf = await Order.aggregate([
            { $match: query },
            { $group: {
                _id: "$processedBy",
                approved: { $sum: { $cond: [{ $in: ["$status", ["approved", "preparing", "shipped", "2", "3", "5"]] }, 1, 0] } },
                cancelled: { $sum: { $cond: [{ $in: ["$status", ["cancelled", "9"]] }, 1, 0] } }
            }},
            { $sort: { approved: -1 } }
        ]);

        responseData.employeePerformance = empPerf.map(e => ({
            name: e._id || 'Bilinmeyen',
            approved: e.approved,
            cancelled: e.cancelled
        }));

        // Recent Orders (Local Only)
        const recentOrders = await Order.find(query).sort({ createdAt: -1 }).limit(10);
        responseData.stats.recentOrders = recentOrders;

        res.json(responseData);
    } catch (error) {
        console.error('❌ Stats Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- Settings Management ---
app.get('/api/settings', auth, async (req, res) => {
    try {
        const settings = await GlobalSetting.find();
        const settingsObj = {};
        settings.forEach(s => { settingsObj[s.key] = s.value; });
        
        res.json({ success: true, settings: settingsObj });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Ayarlar getirilemedi' });
    }
});

app.post('/api/settings', auth, async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) return res.status(400).json({ success: false, message: 'Anahtar gerekli' });
        
        await GlobalSetting.findOneAndUpdate(
            { key },
            { value },
            { upsert: true, new: true }
        );
        
        res.json({ success: true, message: 'Ayar kaydedildi' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Ayar kaydedilemedi' });
    }
});

app.get('/api/reporting/summary', auth, async (req, res) => {
    try {
        const { site_id } = req.query;
        const now = new Date();
        const startOfToday = new Date(now.setHours(0, 0, 0, 0));
        
        const baseQuery = site_id ? { site_id } : {};
        const [totalEvents, todayEvents, uniqueVisitors, todayVisitors, breakdown] = await Promise.all([
            EventLog.countDocuments(baseQuery),
            EventLog.countDocuments({ ...baseQuery, createdAt: { $gte: startOfToday } }),
            EventLog.distinct('device_id', baseQuery),
            EventLog.distinct('device_id', { ...baseQuery, createdAt: { $gte: startOfToday }, event_name: 'page_view' }),
            EventLog.aggregate([
                { $match: baseQuery },
                { $group: { _id: '$event_name', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ])
        ]);

        // Aggregate order counts for summary
        const [totalOrders, todayOrders] = await Promise.all([
            Order.countDocuments(baseQuery.site_id ? { status: { $ne: 'deleted' }, $or: [{ siteId: baseQuery.site_id }, { subdomain: baseQuery.site_id }] } : {}),
            Order.countDocuments({ 
                createdAt: { $gte: startOfToday },
                ...(baseQuery.site_id ? { $or: [{ siteId: baseQuery.site_id }, { subdomain: baseQuery.site_id }] } : {})
            })
        ]);

        res.json({ 
            success: true, 
            summary: { 
                totalEvents, 
                todayEvents, 
                uniqueVisitors: uniqueVisitors.length,
                todayVisitors: todayVisitors.length,
                totalOrders,
                todayOrders,
                eventBreakdown: breakdown 
            } 
        });
    } catch (error) {
        console.error('Reporting Summary Error:', error);
        res.status(500).json({ success: false });
    }
});

app.get('/api/reporting/live', auth, async (req, res) => {
    try {
        const { site_id } = req.query;
        const activeThreshold = new Date(Date.now() - 30 * 1000);
        const query = { timestamp: { $gte: activeThreshold } };
        if (site_id) query.site_id = site_id;

        const count = await EventLog.distinct('session_id', query);
        res.json({ success: true, count: count.length });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});

// ==========================================
// EXPENSE MANAGEMENT
// ==========================================
app.get('/api/expenses', auth, async (req, res) => {
    try {
        const { date } = req.query;
        const query = date ? { date } : {};
        const expenses = await Expense.find(query).sort({ createdAt: -1 });
        const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        res.json({ success: true, expenses, total });
    } catch (error) {
        console.error('❌ Expenses Fetch Error:', error);
        res.status(500).json({ success: false, message: 'Giderler çekilemedi' });
    }
});

app.post('/api/expenses', auth, async (req, res) => {
    try {
        const { date, category, description, amount } = req.body;
        if (!date || !category || !amount) {
            return res.status(400).json({ success: false, message: 'Tarih, kategori ve tutar zorunludur' });
        }
        const expense = new Expense({
            date,
            category,
            description: description || '',
            amount: Number(amount),
            createdBy: req.user.fullName || 'Admin'
        });
        await expense.save();
        res.json({ success: true, expense });
    } catch (error) {
        console.error('❌ Expense Create Error:', error);
        res.status(500).json({ success: false, message: 'Gider eklenemedi' });
    }
});

app.delete('/api/expenses/:id', auth, async (req, res) => {
    try {
        await Expense.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('❌ Expense Delete Error:', error);
        res.status(500).json({ success: false, message: 'Gider silinemedi' });
    }
});

// ==========================================
// PRODUCT AD BUDGETS
// ==========================================
app.post('/api/product-ad-budgets', auth, async (req, res) => {
    try {
        const { date, productName, amount } = req.body;
        if (!date || !productName) {
            return res.status(400).json({ success: false, message: 'Tarih ve ürün adı zorunludur' });
        }
        const budget = await ProductAdBudget.findOneAndUpdate(
            { date, productName },
            { amount: Number(amount) || 0, createdBy: req.user.fullName || 'Admin' },
            { upsert: true, new: true }
        );
        res.json({ success: true, budget });
    } catch (error) {
        console.error('❌ Ad Budget Save Error:', error);
        res.status(500).json({ success: false, message: 'Reklam bütçesi kaydedilemedi' });
    }
});

app.get('/api/product-ad-budgets', auth, async (req, res) => {
    try {
        const { date } = req.query;
        const query = date ? { date } : {};
        const budgets = await ProductAdBudget.find(query);
        res.json({ success: true, budgets });
    } catch (error) {
        console.error('❌ Ad Budget Fetch Error:', error);
        res.status(500).json({ success: false, message: 'Reklam bütçeleri çekilemedi' });
    }
});

// ==========================================
// DAILY PATRON REPORT
// ==========================================
app.get('/api/reporting/daily-report', auth, async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ success: false, message: 'Tarih parametresi gerekli' });

        // Parse date boundaries in Turkey timezone
        const startDate = new Date(`${date}T00:00:00.000+03:00`);
        const endDate = new Date(`${date}T23:59:59.999+03:00`);

        // Fetch all data in parallel
        const [orders, expenses, products, visitorCount, leafPages, adBudgets] = await Promise.all([
            Order.find({ createdAt: { $gte: startDate, $lte: endDate } }),
            Expense.find({ date }),
            Product.find({}),
            EventLog.aggregate([
                { $match: { timestamp: { $gte: startDate, $lte: endDate }, event_name: 'page_view' } },
                { $group: { _id: null, uniqueVisitors: { $addToSet: '$device_id' } } },
                { $project: { count: { $size: '$uniqueVisitors' } } }
            ]),
            LeafPage.find({}, 'name slug productName').lean(),
            ProductAdBudget.find({ date })
        ]);

        // Build ad budget map
        const adBudgetMap = {};
        adBudgets.forEach(b => {
            adBudgetMap[b.productName] = b.amount || 0;
        });

        const totalVisitors = visitorCount[0]?.count || 0;

        // Build product cost map
        const productCostMap = {};
        products.forEach(p => {
            productCostMap[p.name] = { cost: p.cost || 0, price: p.price || 0 };
        });

        // --- Order Status Counts ---
        const cancelledStatuses = ['cancelled', '9', '10', '11'];
        const approvedStatuses = ['approved', '2', 'preparing', '3', 'shipped', '5', 'delivered', '12'];
        const pendingStatuses = ['pending', '1'];
        const shippedStatuses = ['shipped', '5'];
        const preparingStatuses = ['preparing', '3'];
        const deliveredStatuses = ['delivered', '12'];

        const statusCounts = {
            total: orders.length,
            pending: 0,
            approved: 0,
            preparing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0,
            other: 0
        };

        let totalRevenue = 0;
        let revenueOrderCount = 0;

        // --- Product-Level Breakdown ---
        const productMap = {};

        // --- Rep Performance ---
        const repMap = {};

        // --- Site Breakdown ---
        const siteMap = {};

        // --- Status Distribution ---
        const statusDistribution = {};

        orders.forEach(order => {
            const st = order.status;

            // Count statuses
            if (pendingStatuses.includes(st)) statusCounts.pending++;
            else if (approvedStatuses.includes(st) && !shippedStatuses.includes(st) && !preparingStatuses.includes(st) && !deliveredStatuses.includes(st)) statusCounts.approved++;
            else if (preparingStatuses.includes(st)) statusCounts.preparing++;
            else if (shippedStatuses.includes(st)) statusCounts.shipped++;
            else if (deliveredStatuses.includes(st)) statusCounts.delivered++;
            else if (cancelledStatuses.includes(st)) statusCounts.cancelled++;
            else statusCounts.other++;

            // Revenue (exclude cancelled)
            if (!cancelledStatuses.includes(st)) {
                totalRevenue += order.totalPrice || 0;
                revenueOrderCount++;
            }

            // Product breakdown
            if (order.items && order.items.length > 0) {
                order.items.forEach(item => {
                    const key = item.name || 'Bilinmeyen Ürün';
                    if (!productMap[key]) {
                        const productInfo = productCostMap[key] || { cost: 0, price: 0 };
                        productMap[key] = {
                            name: key,
                            qty: 0,
                            unitPrice: item.price || productInfo.price || 0,
                            unitCost: productInfo.cost || 0,
                            totalRevenue: 0,
                            totalCost: 0,
                            profitLoss: 0
                        };
                    }
                    const isCancelled = cancelledStatuses.includes(st);
                    if (!isCancelled) {
                        productMap[key].qty += item.qty || 1;
                        const itemRevenue = (item.price || productMap[key].unitPrice) * (item.qty || 1);
                        const itemCost = productMap[key].unitCost * (item.qty || 1);
                        productMap[key].totalRevenue += itemRevenue;
                        productMap[key].totalCost += itemCost;
                        productMap[key].profitLoss += (itemRevenue - itemCost);
                    }
                });
            }

            // Rep performance
            if (order.processedBy) {
                if (!repMap[order.processedBy]) {
                    repMap[order.processedBy] = { name: order.processedBy, approved: 0, cancelled: 0, total: 0, revenue: 0 };
                }
                repMap[order.processedBy].total++;
                if (cancelledStatuses.includes(st)) {
                    repMap[order.processedBy].cancelled++;
                } else if (approvedStatuses.includes(st) || shippedStatuses.includes(st) || deliveredStatuses.includes(st) || preparingStatuses.includes(st)) {
                    repMap[order.processedBy].approved++;
                    repMap[order.processedBy].revenue += order.totalPrice || 0;
                }
            }

            // Site breakdown
            const siteKey = order.site_id || 'Doğrudan';
            if (!siteMap[siteKey]) {
                const leafPage = leafPages.find(lp => lp.slug === siteKey);
                siteMap[siteKey] = {
                    slug: siteKey,
                    name: leafPage?.name || siteKey,
                    orderCount: 0,
                    revenue: 0,
                    cancelled: 0
                };
            }
            siteMap[siteKey].orderCount++;
            if (cancelledStatuses.includes(st)) {
                siteMap[siteKey].cancelled++;
            } else {
                siteMap[siteKey].revenue += order.totalPrice || 0;
            }

            // Status distribution for chart
            const statusLabel = cancelledStatuses.includes(st) ? 'İptal' :
                               pendingStatuses.includes(st) ? 'Bekleyen' :
                               preparingStatuses.includes(st) ? 'Hazırlanıyor' :
                               shippedStatuses.includes(st) ? 'Kargoda' :
                               deliveredStatuses.includes(st) ? 'Teslim Edildi' :
                               approvedStatuses.includes(st) ? 'Onaylandı' : 'Diğer';
            statusDistribution[statusLabel] = (statusDistribution[statusLabel] || 0) + 1;
        });

        // Calculate totals — inject ad budgets into each product
        const productBreakdown = Object.values(productMap).map(p => {
            const adBudget = adBudgetMap[p.name] || 0;
            return {
                ...p,
                adBudget,
                netProfit: p.profitLoss - adBudget  // Kâr/Zarar - Reklam
            };
        }).sort((a, b) => b.totalRevenue - a.totalRevenue);

        const totalProductCost = productBreakdown.reduce((sum, p) => sum + p.totalCost, 0);
        const totalAdBudget = productBreakdown.reduce((sum, p) => sum + p.adBudget, 0);
        const totalProductProfit = productBreakdown.reduce((sum, p) => sum + p.profitLoss, 0);
        const totalNetProfit = productBreakdown.reduce((sum, p) => sum + p.netProfit, 0);

        const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const netProfitLoss = totalRevenue - totalProductCost - totalAdBudget - totalExpenses;

        const avgBasket = revenueOrderCount > 0 ? totalRevenue / revenueOrderCount : 0;
        const conversionRate = totalVisitors > 0 ? ((orders.length / totalVisitors) * 100).toFixed(2) : 0;

        res.json({
            success: true,
            date,
            summary: {
                totalOrders: orders.length,
                ...statusCounts,
                totalRevenue,
                revenueOrderCount,
                avgBasket,
                totalVisitors,
                conversionRate: parseFloat(conversionRate)
            },
            productBreakdown,
            expenses,
            expenseSummary: {
                totalExpenses,
                byCategory: expenses.reduce((acc, e) => {
                    acc[e.category] = (acc[e.category] || 0) + e.amount;
                    return acc;
                }, {})
            },
            profitLoss: {
                totalRevenue,
                totalProductCost,
                totalAdBudget,
                totalProductProfit,
                totalNetProfit,
                totalExpenses,
                netProfitLoss
            },
            repPerformance: Object.values(repMap).sort((a, b) => b.approved - a.approved),
            siteBreakdown: Object.values(siteMap).sort((a, b) => b.orderCount - a.orderCount),
            statusDistribution
        });
    } catch (error) {
        console.error('❌ Daily Report Error:', error);
        res.status(500).json({ success: false, message: 'Günlük rapor oluşturulamadı' });
    }
});

// Added for Günlük Ciro Takibi (Daily Revenue Tracking) mockups
app.get('/api/reporting/performance', auth, async (req, res) => {
    try {
        const { site_id, startDate: qStart, endDate: qEnd } = req.query;
        
        // Define range
        let rangeStart, rangeEnd;
        if (qStart && qEnd) {
            rangeStart = new Date(`${qStart}T00:00:00.000+03:00`);
            rangeEnd = new Date(`${qEnd}T23:59:59.999+03:00`);
        } else {
            rangeStart = new Date();
            rangeStart.setDate(rangeStart.getDate() - 29);
            rangeStart.setHours(0, 0, 0, 0);
            rangeEnd = new Date();
            rangeEnd.setHours(23, 59, 59, 999);
        }

        const orderQuery = site_id ? { $or: [{ siteId: site_id }, { subdomain: site_id }] } : {};

        // Helper for TR day string
        const getTrDayStr = (d) => {
            const trStr = d.toLocaleString('en-US', { timeZone: 'Europe/Istanbul', year: 'numeric', month: 'numeric', day: 'numeric' });
            const [m, day, y] = trStr.split('/');
            return `${y}-${m.padStart(2, '0')}-${day.padStart(2, '0')}`;
        };
        
        const todayStr = getTrDayStr(new Date());
        const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));

        const [dailyStatsRaw, historicalVisitors, todayVisitorsRaw, productStatsRaw] = await Promise.all([
            Order.aggregate([
                { $match: { ...orderQuery, createdAt: { $gte: rangeStart, $lte: rangeEnd } } },
                { $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "Europe/Istanbul" } },
                    totalCreated: { $sum: 1 },
                    cancelled: { $sum: { $cond: [{ $in: ["$status", ["cancelled", "9", "10", "11"]] }, 1, 0] } },
                    revenueOrders: { $sum: { $cond: [{ $in: ["$status", ["approved", "2", "preparing", "3", "shipped", "5", "delivered", "12"]] }, 1, 0] } },
                    dailyRevenue: { $sum: { $cond: [{ $not: { $in: ["$status", ["cancelled", "9", "10", "11", "deleted"]] } }, "$totalPrice", 0] } }
                }},
                { $sort: { _id: -1 } }
            ]),
            DailyStat.find({ 
                date: { $gte: getTrDayStr(rangeStart), $lt: todayStr },
                site_id: site_id || null 
            }).lean(),
            EventLog.aggregate([
                { $match: { 
                    timestamp: { $gte: startOfToday }, 
                    event_name: 'page_view',
                    ...(site_id ? { site_id } : {}) 
                }},
                { $group: { _id: "$device_id" } },
                { $count: "count" }
            ]),
            Order.aggregate([
                { $match: { 
                    ...orderQuery, 
                    createdAt: { $gte: rangeStart, $lte: rangeEnd },
                    status: { $nin: ["cancelled", "9", "10", "11", "deleted"] }
                }},
                { $unwind: "$items" },
                { $group: {
                    _id: "$items.name",
                    orderCount: { $addToSet: "$_id" },
                    totalQty: { $sum: "$items.qty" },
                    totalRevenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } }
                }},
                { $project: {
                    name: "$_id",
                    orderCount: { $size: "$orderCount" },
                    totalQty: 1,
                    totalRevenue: 1
                }},
                { $sort: { totalRevenue: -1 } }
            ])
        ]);

        // Merge visitor stats
        const visitorStatsRaw = historicalVisitors.map(h => ({ _id: h.date, visitors: h.visitors }));
        if (todayVisitorsRaw.length > 0 && rangeEnd >= startOfToday) {
            visitorStatsRaw.push({ _id: todayStr, visitors: todayVisitorsRaw[0].count });
        } else if (rangeEnd >= startOfToday) {
            visitorStatsRaw.push({ _id: todayStr, visitors: 0 });
        }

        const dateMap = {};

        visitorStatsRaw.forEach(v => {
            dateMap[v._id] = {
                _id: v._id,
                totalCreated: 0,
                cancelled: 0,
                revenueOrders: 0,
                dailyRevenue: 0,
                visitors: v.visitors || 0,
                conversion: 0
            };
        });

        dailyStatsRaw.forEach(o => {
            if (!dateMap[o._id]) {
                dateMap[o._id] = { _id: o._id, visitors: 0 };
            }
            dateMap[o._id].totalCreated = o.totalCreated || 0;
            dateMap[o._id].cancelled = o.cancelled || 0;
            dateMap[o._id].revenueOrders = o.revenueOrders || 0;
            dateMap[o._id].dailyRevenue = o.dailyRevenue || 0;
        });

        const dailyStats = Object.values(dateMap).sort((a, b) => b._id.localeCompare(a._id));

        dailyStats.forEach(day => {
            if (day.visitors > 0) {
                day.conversion = ((day.totalCreated / day.visitors) * 100).toFixed(2);
            } else {
                day.conversion = 0;
            }
        });

        // Calculate summary cards
        const summaryArgs = dailyStats.reduce((acc, curr) => {
            acc.totalRevenue += curr.dailyRevenue || 0;
            acc.totalOrders += curr.totalCreated || 0;
            acc.totalCancelled += curr.cancelled || 0;
            acc.totalRevenueOrders += curr.revenueOrders || 0;
            acc.totalVisitors += curr.visitors || 0;
            return acc;
        }, { totalRevenue: 0, totalOrders: 0, totalCancelled: 0, totalRevenueOrders: 0, totalVisitors: 0 });

        const avgBasket = summaryArgs.totalRevenueOrders > 0 
            ? (summaryArgs.totalRevenue / summaryArgs.totalRevenueOrders) 
            : 0;
            
        const avgConversion = summaryArgs.totalVisitors > 0
            ? ((summaryArgs.totalOrders / summaryArgs.totalVisitors) * 100).toFixed(2)
            : 0;

        // Calculate shares for product stats
        const productStats = productStatsRaw.map(p => ({
            ...p,
            share: summaryArgs.totalRevenue > 0 ? ((p.totalRevenue / summaryArgs.totalRevenue) * 100).toFixed(1) : 0
        }));

        res.json({ 
            success: true, 
            dailyStats,
            productStats,
            summary: {
                totalRevenue: summaryArgs.totalRevenue,
                totalOrders: summaryArgs.totalOrders,
                totalCancelled: summaryArgs.totalCancelled,
                totalVisitors: summaryArgs.totalVisitors,
                avgConversion: parseFloat(avgConversion),
                avgBasket
            }
        });
    } catch (error) {
        console.error('Performance API Error:', error);
        res.status(500).json({ success: false });
    }
});


app.get('/api/reporting/visual-analysis/:siteId', auth, async (req, res) => {
    try {
        const { siteId } = req.params;
        const stats = await EventLog.aggregate([
            { $match: { site_id: siteId, event_name: { $in: ['image_view_start', 'image_view_end'] } } },
            { $group: {
                _id: '$data.image',
                views: { $sum: { $cond: [{ $eq: ["$event_name", "image_view_start"] }, 1, 0] } },
                totalDuration: { $sum: { $ifNull: ["$data.duration_ms", 0] } }
            }},
            { $project: {
                image: '$_id',
                views: 1,
                avgDuration: { $cond: [{ $gt: ["$views", 0] }, { $divide: ["$totalDuration", "$views"] }, 0] }
            }},
            { $sort: { views: -1 } }
        ]);
        res.json({ success: true, stats });
    } catch (error) {
        console.error('Visual Analysis Error:', error);
        res.status(500).json({ success: false });
    }
});

app.get('/api/reporting/events', auth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const query = {};
        if (req.query.event) query.event_name = req.query.event;
        if (req.query.device) query.device_id = req.query.device;
        if (req.query.site_id) query.site_id = req.query.site_id;
        const [events, total] = await Promise.all([
            EventLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
            EventLog.countDocuments(query)
        ]);
        res.json({ success: true, events, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } });
    } catch (error) {
        res.status(500).json({ success: false });
    }
});


// ==========================================
// STATIC ASSETS & PAGE SERVING
// ==========================================

// (imagesPath defined at top)

// (Static assets moved to top)

// (Moved to top for debugging)

// 3. SPA Catch-all (for Admin Panel refreshes) - Ignore API routes
app.get(/^(?!\/api).+/, (req, res, next) => {
    // If it's an API route that reached here, it's a 404
    if (req.path.startsWith('/api')) {
        return next();
    }
    
    const adminIndex = path.join(__dirname, '..', 'panel', 'dist', 'index.html');
    if (fs.existsSync(adminIndex)) {
        res.sendFile(adminIndex);
    } else {
        res.status(404).send('Not Found');
    }
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası: ' + err.message });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} [Version: 1.0.2 - REFACTORED_ORDERS]`));


// ==========================================
// STATIC ASSETS & PAGE SERVING
// ==========================================

// (imagesPath defined at top)

// (Static assets moved to top)

// (Moved to top for debugging)

// 3. SPA Catch-all (for Admin Panel refreshes) - Ignore API routes
app.get(/^(?!\/api).+/, (req, res, next) => {
    // If it's an API route that reached here, it's a 404
    if (req.path.startsWith('/api')) {
        return next();
    }
    
    const adminIndex = path.join(__dirname, '..', 'panel', 'dist', 'index.html');
    if (fs.existsSync(adminIndex)) {
        res.sendFile(adminIndex);
    } else {
        res.status(404).send('Not Found');
    }
});

// --- Global Error Handler ---
app.use((err, req, res, next) => {
    console.error('❌ Server Error:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası: ' + err.message });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT} [Version: 1.0.2 - REFACTORED_ORDERS]`));
// --- TikTok Events API Helper ---
async function sendTikTokServerEvent(eventName, req, order, pixelId, accessToken) {
    try {
        const hash = (val) => val ? crypto.createHash('sha256').update(String(val).trim().toLowerCase()).digest('hex') : '';
        
        const timestamp = new Date().toISOString();
        const eventId = req.body.eventId || `server_${order._id}_${Date.now()}`;
        
        const payload = {
            "partner": "TikTok",
            "pixel_code": pixelId,
            "event": eventName,
            "event_id": eventId,
            "event_time": Math.floor(Date.now() / 1000),
            "test_event_code": req.body.tt_test_id || "",
            "context": {
                "ad": {
                    "callback": req.body.ttclid || ""
                },
                "user": {
                    "phone": hash(order.phone),
                    "email": hash(order.email || ""),
                    "ip": (req.headers['x-forwarded-for'] || req.socket.remoteAddress || "").split(',')[0].trim(),
                    "user_agent": req.headers['user-agent'] || ""
                },
                "page": {
                    "url": req.headers.referer || ""
                }
            },
            "properties": {
                "contents": [
                    {
                        "content_name": order.product_name || "Ürün",
                        "content_id": order.siteId || "default",
                        "content_type": "product_group"
                    }
                ],
                "value": parseFloat(String(order.totalPrice || "0").replace(',', '.')) || 0,
                "currency": "TRY"
            }
        };

        const response = await axios.post(`https://analytics.tiktok.com/open_api/v1.3/event/track/`, payload, {
            headers: {
                'Access-Token': accessToken,
                'Content-Type': 'application/json'
            }
        });

        console.log(`✅ [TIKTOK API] ${eventName} sent successfully for pixel ${pixelId}:`, response.data);
    } catch (error) {
        console.error(`❌ [TIKTOK API] Error sending ${eventName} to pixel ${pixelId}:`, error.response?.data || error.message);
    }
}

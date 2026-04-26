require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const crypto = require('crypto');

const EventLog = require('./models/EventLog');
const LeafPage = require('./models/LeafPage');
const Site = require('./models/Site');
const GlobalSetting = require('./models/GlobalSetting');

const app = express();
const PORT = process.env.RENDERER_PORT || 3002;
const IMAGE_BASE_URL = process.env.IMAGE_BASE_URL || ''; // E.g. https://backend.siparisyonet.store

app.set('trust proxy', true);
app.use(cors({
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.text({ type: ['text/plain', 'application/json'], limit: '1mb' }));

// Subdomain Extraction Middleware
app.use((req, res, next) => {
    const host = req.get('host') || '';
    let parts = host.split('.');
    
    // Remove www if present
    if (parts[0] === 'www') {
        parts.shift();
    }

    if (parts.length > 2) {
        req.subdomain = parts[0];
    } else {
        req.subdomain = null;
    }
    next();
});

mongoose.connect(process.env.MONGODB_URI, { dbName: 'sufyan-yaprak' })
    .then(() => {
        console.log('✅ MongoDB Connected (Renderer)');
        console.log(`🔗 URI Used: ${process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:.+@/, ':****@') : 'UNDEFINED'}`);
    })
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        console.error(`🔗 Failed URI: ${process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:.+@/, ':****@') : 'UNDEFINED'}`);
    });

// --- Public APIs (Local Backend) ---

// 1. Analytics Tracking
app.post('/api/app-state', async (req, res) => {
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

// 2. Order Submission (Local Backend)
app.post('/api/orders', async (req, res) => {
    try {
        const backendBase = (process.env.BACKEND_URL || 'http://localhost:5005') + '/api';
        const clientIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip;
        const userAgent = req.headers['user-agent'] || '';
        
        const orderData = {
            ...req.body,
            ip_address: clientIp
        };

        const response = await fetch(`${backendBase}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();

        // --- Meta CAPI Integration ---
        if (data.success) {
            const { siteId, fullName, phone, totalPrice, eventId, product_name } = req.body;
            
            // Background process: find meta credentials and send event
            (async () => {
                try {
                    // Try to find credentials from LeafPage or Site
                    const page = await LeafPage.findOne({ slug: siteId });
                    let metaId = page?.metaPixelId;
                    let metaToken = page?.metaAccessToken;
                    let metaTestCode = page?.metaTestCode;

                    if (!metaId || !metaToken) {
                        const site = await Site.findOne({ subdomain: siteId });
                        metaId = metaId || site?.metaPixelId;
                        metaToken = metaToken || site?.metaAccessToken;
                        metaTestCode = metaTestCode || site?.metaTestCode;
                    }

                    if (metaId && metaToken) {
                        await sendMetaCAPI(metaId, metaToken, {
                            eventName: 'Purchase',
                            eventId: eventId,
                            clientIp: clientIp,
                            clientUserAgent: userAgent,
                            userData: {
                                fn: fullName,
                                ph: phone
                            },
                            customData: {
                                value: parseFloat(String(totalPrice).replace(',', '.')) || 0,
                                currency: 'TRY',
                                content_name: product_name
                            },
                            testCode: metaTestCode
                        });
                    }
                } catch (e) {
                    console.error('[CAPI Trigger Error]', e.message);
                }
            })();
        }

        res.status(response.status).json(data);
    } catch (error) {
        console.error('❌ Order Proxy Error:', error);
        res.status(500).json({ success: false, message: 'Backend sunucusuna bağlanılamadı.' });
    }
});

/**
 * Meta CAPI Helper Functions
 */
function hashData(data) {
    if (!data) return null;
    return crypto.createHash('sha256').update(String(data).trim().toLowerCase()).digest('hex');
}

async function sendMetaCAPI(pixelId, accessToken, options) {
    const { eventName, eventId, clientIp, clientUserAgent, userData, customData, testCode } = options;
    
    // Format Phone for Meta (E.164 without +)
    let formattedPhone = (userData.ph || '').replace(/\D/g, '');
    if (formattedPhone.length === 10) formattedPhone = '90' + formattedPhone;
    if (formattedPhone.startsWith('0')) formattedPhone = '9' + formattedPhone;

    const payload = {
        data: [{
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            event_id: eventId,
            event_source_url: clientUserAgent.includes('Mobile') ? 'http://mobile.site' : 'http://desktop.site', // Fallback
            action_source: 'website',
            user_data: {
                client_ip_address: clientIp,
                client_user_agent: clientUserAgent,
                ph: [hashData(formattedPhone)],
                fn: [hashData(userData.fn?.split(' ')[0])],
                ln: [hashData(userData.fn?.split(' ').slice(1).join(' '))]
            },
            custom_data: customData
        }]
    };

    if (testCode) payload.test_event_code = testCode;

    try {
        const response = await fetch(`https://graph.facebook.com/v17.0/${pixelId}/events?access_token=${accessToken}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        console.log(`[META CAPI] ${eventName} sent! EventID: ${eventId}`, result);
    } catch (error) {
        console.error('[META CAPI ERROR]', error.message);
    }
}

// --- Page Rendering Engine ---

async function renderLeafPageData(leafPage, site, res) {
    const kampanyaTemplatePath = path.join(__dirname, 'pages', 'kampanya1', 'index.html');
    if (!fs.existsSync(kampanyaTemplatePath)) return res.status(404).send('Template bulunamadı');

    let html = fs.readFileSync(kampanyaTemplatePath, 'utf8');
    console.log(`[Renderer] Rendering page: ${leafPage.slug} with ${leafPage.components?.length || 0} components`);

    const orderFormWrapperRegex = /<div class="order-form-wrapper" id="siparis-formu">([\s\S]*?)<\/form>\s*<\/div>\s*<\/div>/;
    const matchForm = html.match(orderFormWrapperRegex);
    const formHtml = matchForm ? matchForm[0] : '';
    
    const metaTestCode = leafPage.metaTestCode || (site && site.metaTestCode) || '';
    html = html.replace('</head>', `<script>
        window.SITE_ID = "${leafPage.slug}"; 
        window.PRODUCT_ID = ${leafPage.productId || 0}; 
        window.META_TEST_CODE = "${metaTestCode}";
        window.API_BASE_URL = "${IMAGE_BASE_URL}";
    </script>\n</head>`);

    // --- Product Package Data Preparation ---
    let packages = [];

    if (leafPage.products && leafPage.products.length > 0) {
        packages = leafPage.products.map(p => {
            let img = p.image || '';
            if (img && !img.startsWith('http') && IMAGE_BASE_URL) {
                img = IMAGE_BASE_URL + (img.startsWith('/') ? img : '/' + img);
            }
            return {
                name: p.name,
                quantity: p.quantity || 1,
                price: p.price || 0,
                image: img,
                isDefault: p.isDefault || false,
                productId: p.productId || leafPage.productId || 0
            };
        });
    } else if (leafPage.productName) {
        packages = [{
            name: leafPage.productName,
            quantity: 1,
            price: leafPage.productPrice || 0,
            image: '',
            isDefault: true,
            productId: leafPage.productId || 0
        }];
    }

    const defaultProduct = (packages.length > 0) ? (packages.find(p => p.isDefault) || packages[0]) : null;

    let packagesHtml = '';
    let packageButtonsHtml = '';
    let packageScript = '';

    if (defaultProduct) {
        const baseProductName = leafPage.productName || defaultProduct.name;
        packagesHtml = `
            <input type="hidden" id="selected_product_name" name="product_name" value="${baseProductName.replace(/"/g, '&quot;')}">
            <input type="hidden" id="selected_quantity" name="quantity" value="${defaultProduct.quantity}">
            <input type="hidden" id="selected_totalPrice" name="totalPrice" value="${defaultProduct.price}">
            <input type="hidden" id="selected_product_id" name="product_id" value="${defaultProduct.productId || ''}">
        `;

        if (packages.length > 0) {
            packageButtonsHtml = '<div class="package-section-wrapper">\n';
            
            // DYNAMIC IMAGE ABOVE BUTTONS
            if (defaultProduct.image) {
                packageButtonsHtml += `
                    <div class="package-display-image-container">
                        <img id="package-display-image" src="${defaultProduct.image}" class="landing-img">
                    </div>
                `;
            }

            if (packages.length > 1) {
                packageButtonsHtml += '<div class="package-selection-container">\n';
                packageButtonsHtml += '<div class="package-title">Ürün Paketi Seçiniz</div>\n';
                packageButtonsHtml += '<div class="package-buttons-grid">\n';
                
                packages.forEach((pkg, pIdx) => {
                    const isActive = (pkg === defaultProduct) ? 'active' : '';
                    packageButtonsHtml += `
                        <button type="button" class="package-btn ${isActive}" 
                            data-index="${pIdx}"
                            data-name="${pkg.name}" 
                            data-price="${pkg.price}" 
                            data-qty="${pkg.quantity}" 
                            data-img="${pkg.image || ''}">
                            <div class="pkg-name">${pkg.name}</div>
                            <div class="pkg-price">${pkg.price} ₺</div>
                        </button>
                    `;
                });
                packageButtonsHtml += '</div>\n</div>\n';
            }
            packageButtonsHtml += '</div>\n';

            packageScript = `
                <style>
                    .package-section-wrapper { background: #fff; border-top: 1px solid #eee; padding-bottom: 10px; }
                    .package-display-image-container { width: 100%; line-height: 0; }
                    .package-display-image-container img { width: 100%; height: auto; }
                    .package-selection-container { padding: 20px 15px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
                    .package-title { font-size: 20px; font-weight: 800; color: #111827; margin-bottom: 16px; text-align: left; }
                    .package-buttons-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
                    .package-btn { 
                        display: flex; flex-direction: column; align-items: center; justify-content: center;
                        padding: 18px 10px; border: 2px solid #e5e7eb; border-radius: 18px;
                        background: #f3f4f6; cursor: pointer; transition: all 0.25s ease; text-align: center;
                        min-height: 90px;
                    }
                    .package-btn.active { 
                        border-color: #f97316; 
                        background: #ffedd5; 
                        box-shadow: 0 10px 20px -5px rgba(249, 115, 22, 0.3);
                        transform: translateY(-2px);
                    }
                    .pkg-name { font-size: 15px; font-weight: 700; color: #111827; margin-bottom: 4px; }
                    .pkg-price { font-size: 18px; font-weight: 800; color: #f97316; }
                    .package-btn.active .pkg-name { color: #111827; }
                </style>
                <script>
                    document.addEventListener('DOMContentLoaded', function() {
                        const btns = document.querySelectorAll('.package-btn');
                        const pkgImg = document.getElementById('package-display-image');
                        const inputName = document.getElementById('selected_product_name');
                        const inputQty = document.getElementById('selected_quantity');
                        const inputPrice = document.getElementById('selected_totalPrice');

                        btns.forEach(btn => {
                            btn.addEventListener('click', function() {
                                // Update Active State
                                btns.forEach(b => b.classList.remove('active'));
                                this.classList.add('active');

                                // Update Image
                                const newImg = this.getAttribute('data-img');
                                if (newImg && pkgImg) {
                                    pkgImg.src = newImg;
                                }

                                // Update Form Hidden Fields
                                const baseName = ${JSON.stringify(leafPage.productName || '')} || this.getAttribute('data-name');
                                if (inputName) inputName.value = baseName;
                                if (inputQty) inputQty.value = this.getAttribute('data-qty');
                                if (inputPrice) inputPrice.value = this.getAttribute('data-price');
                                
                                window.dispatchEvent(new CustomEvent('packageChanged', { 
                                    detail: { price: this.getAttribute('data-price'), name: baseName } 
                                }));
                            });
                        });
                    });
                </script>
            `;
        }
    }

    let newImageStack = '<div class="image-stack">\n';

    leafPage.components.forEach((comp, idx) => {
        if (comp.type === 'image') {
            const priority = idx === 0 ? 'fetchpriority="high" decoding="sync"' : 'loading="lazy" decoding="async"';
            let src = comp.content;
            if (src && !src.startsWith('http') && IMAGE_BASE_URL) {
                src = IMAGE_BASE_URL + (src.startsWith('/') ? src : '/' + src);
            }
            newImageStack += `<img src="${src}" class="landing-img" ${priority}>\n`;
        } else if (comp.type === 'form') {
            // Insert package view (Image + Buttons) right before the form
            newImageStack += `${packageButtonsHtml}\n`;
            newImageStack += `${formHtml}\n`;
        }
    });
    newImageStack += '</div>';
    
    if (packageScript) {
        newImageStack += packageScript;
    }

    const containerRegex = /<div class="image-stack">[\s\S]*?<!-- Trust Badges Image -->/;
    const finalContent = (leafPage.components && leafPage.components.length > 0) ? newImageStack : null;
    
    if (finalContent) {
        html = html.replace(containerRegex, finalContent + '\n\n    <!-- Trust Badges Image -->');
    } else {
        console.warn(`[Renderer] Warning: Page ${leafPage.slug} has no components. Using default template content.`);
    }

    // Inject options inside the form (inside the padded container)
    if (packagesHtml) {
        html = html.replace('<form id="orderForm">', `<form id="orderForm">\n${packagesHtml}`);
    }

    // Update asset paths to use /lp-assets prefix
    const vTime = Date.now();
    html = html.replace('href="style.css"', `href="/lp-assets/style.css?v=${vTime}"`);
    html = html.replace('src="script.js"', `src="/lp-assets/script.js?v=${vTime}"`);

    // Add base tag to fix relative asset paths (CSS/JS/Images)
    html = html.replace('<head>', '<head>\n    <base href="/">');

    // Use shared pixel injection function
    html = await injectPixels(html, leafPage, site);

    return res.send(html);
}

/**
 * Render All Products Page (Global Listing)
 */
async function renderAllProductsPage(req, res) {
    const templatePath = path.join(__dirname, 'pages', 'urunler', 'index.html');
    if (!fs.existsSync(templatePath)) return res.status(404).send('Template bulunamadı');

    let html = fs.readFileSync(templatePath, 'utf8');

    try {
        // Fetch Scrolling Text from Settings
        const scrollingTextSetting = await GlobalSetting.findOne({ key: 'urunler_scrolling_text' });
        const scrollingText = scrollingTextSetting ? scrollingTextSetting.value : `
            <span>🚚 TÜM SİPARİŞLERDE ÜCRETSİZ KARGO</span>
            <span>✅ KAPIDA NAKİT VEYA KREDİ KARTI İLE ÖDEME</span>
            <span>⭐ SIPARISYONET GÜVENCESİYLE %100 ORİJİNAL ÜRÜNLER</span>
            <span>🔥 GÜNÜN FIRSATLARINI KAÇIRMAYIN</span>
        `.trim();

        html = html.replace('<!-- SCROLLING_TEXT_PLACEHOLDER -->', scrollingText + scrollingText); // Duplicate for seamless loop

        const leafPages = await LeafPage.find({}).sort({ createdAt: -1 });
        
        let productsHtml = '';
        const host = req.get('host') || '';
        const hostParts = host.split('.');
        const baseDomain = hostParts.length > 2 ? hostParts.slice(1).join('.') : host;

        leafPages.forEach(page => {
            // Priority: 1. mainImage, 2. First image component
            let imgSrc = page.mainImage;
            if (!imgSrc) {
                const firstImg = page.components.find(c => c.type === 'image');
                imgSrc = firstImg ? firstImg.content : 'https://via.placeholder.com/400';
            }
            
            if (imgSrc && !imgSrc.startsWith('http') && IMAGE_BASE_URL) {
                imgSrc = IMAGE_BASE_URL + (imgSrc.startsWith('/') ? imgSrc : '/' + imgSrc);
            }

            const pageUrl = `https://${page.slug}.${baseDomain}`;

            productsHtml += `
                <a href="${pageUrl}" class="product-card">
                    <div class="image-wrapper">
                        <img src="${imgSrc}" alt="${page.name}" loading="lazy">
                    </div>
                    <div class="card-body">
                        <h2>${page.name}</h2>
                        <div class="btn-explore">
                            Hemen İncele
                            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </div>
                    </div>
                </a>
            `;
        });

        if (!productsHtml) {
            productsHtml = '<div class="empty-state">Henüz ürün bulunmuyor.</div>';
        }

        html = html.replace('<!-- PRODUCTS_PLACEHOLDER -->', productsHtml);
        
        // Inject Pixels
        html = await injectPixels(html, null, null);

        res.send(html);
    } catch (error) {
        console.error('All Products Render Error:', error);
        res.status(500).send('Sunucu hatası');
    }
}

/**
 * Shared function to inject Pixels & Console Logger into HTML
 */
async function injectPixels(html, leafPage = null, site = null) {
    // --- Smart Pixel Injection ---
    let finalPixelHtml = '';


    let pagePixel = '';
    if (leafPage) {
        pagePixel = (site && site.pixelCode) ? site.pixelCode : (leafPage.pixelCode || '');
    } else if (site && site.pixelCode) {
        pagePixel = site.pixelCode;
    }

    let globalPixel = '';
    try {
        const globalPixelSetting = await GlobalSetting.findOne({ key: 'global_pixel' });
        if (globalPixelSetting && globalPixelSetting.value) {
            globalPixel = globalPixelSetting.value;
        }
    } catch (err) {}

    // Combine them, but try to avoid duplicating the base script
    const fbBasePattern = /!function\(f,b,e,v,n,t,s\)[\s\S]*?fbevents\.js\s*'\s*\)\s*;/;
    
    if (pagePixel && globalPixel) {
        if (pagePixel.match(fbBasePattern) && globalPixel.match(fbBasePattern)) {
            // Function-based replace to avoid $& / $1 issues
            const strippedGlobal = globalPixel.replace(fbBasePattern, () => '/* Base script already loaded */');
            finalPixelHtml = pagePixel + '\n' + strippedGlobal;
        } else {
            finalPixelHtml = pagePixel + '\n' + globalPixel;
        }
    } else {
        finalPixelHtml = pagePixel || globalPixel || '';
    }

    if (finalPixelHtml) {
        if (html.includes('</head>')) {
            html = html.replace('</head>', () => `${finalPixelHtml}\n</head>`);
        } else {
            html = finalPixelHtml + html;
        }
    }
    return html;
}

// Serve Static Images & Template Assets
app.get('/images/:filename', async (req, res) => {
    try {
        const backendBase = process.env.BACKEND_URL || 'http://localhost:5005';
        const imgRes = await fetch(`${backendBase}/images/${req.params.filename}`);
        
        if (!imgRes.ok) {
            // Fallback to old behavior if backend doesn't have it or is unreachable
            if (IMAGE_BASE_URL && (!req.get('host') || !req.get('host').includes('api.siparisyonet.site'))) {
                return res.redirect(`${IMAGE_BASE_URL}/images/${req.params.filename}`);
            }
            return res.status(404).send('Not Found');
        }

        const contentType = imgRes.headers.get('content-type');
        if (contentType) res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        
        imgRes.body.pipe(res);
    } catch (e) {
        console.error('Image Proxy Error:', e.message);
        if (IMAGE_BASE_URL && (!req.get('host') || !req.get('host').includes('api.siparisyonet.site'))) {
            return res.redirect(`${IMAGE_BASE_URL}/images/${req.params.filename}`);
        }
        res.status(500).send('Image folder is on individual backend server.');
    }
});

// Serve campaign-specific files (style.css, script.js) under /lp-assets
app.use('/lp-assets', express.static(path.join(__dirname, 'pages', 'kampanya1')));

// 1. Direct Slug Routing
app.get('/p/:slug', async (req, res) => {
    try {
        const leafPage = await LeafPage.findOne({ slug: req.params.slug.toLowerCase() });
        if (!leafPage) return res.status(404).send('Sayfa Bulunamadı');
        return renderLeafPageData(leafPage, null, res);
    } catch (error) {
        res.status(500).send('Server Error');
    }
});

// 2. Subdomain & Success Page Routing
app.get('*', async (req, res, next) => {
    try {
        const subdomain = req.subdomain;

    // --- Special: Global Products Page ---
    if (subdomain === 'urunler' || req.query.view === 'urunler') {
        return renderAllProductsPage(req, res);
    }
    
    // --- Success Page Logic (Available even without subdomain for local testing) ---
    if (req.path.includes('success.html')) {
        const successTemplatePath = path.join(__dirname, 'pages', 'kampanya1', 'success.html');
        if (fs.existsSync(successTemplatePath)) {
            let html = fs.readFileSync(successTemplatePath, 'utf8');
            
            // Fetch active WP number from global settings
            const wpSetting = await GlobalSetting.findOne({ key: 'active_wp_number' });
            const activeWp = wpSetting ? wpSetting.value : '905444778742'; // Use setting or hardcoded fallback

            // Use regex to replace any phone number set in defaultPhone variable
            html = html.replace(/const defaultPhone = '.*';/, `const defaultPhone = '${activeWp}';`);
            
            let siteForPixel = null;
            if (subdomain) {
                siteForPixel = await Site.findOne({ subdomain: subdomain.toLowerCase() });
            }

            // Inject Pixels & Logger using the shared function
            html = await injectPixels(html, null, siteForPixel);

            return res.send(html);
        }
    }

    if (!subdomain) return res.status(404).send('Site Not Found');

        const site = await Site.findOne({ subdomain: subdomain.toLowerCase() }).populate('leafPageId');
        if (site && site.leafPageId) {
            return renderLeafPageData(site.leafPageId, site, res);
        }

        // --- NEW: Try to find a LeafPage matching the subdomain as a fallback ---
        const leafPage = await LeafPage.findOne({ slug: subdomain.toLowerCase() });
        if (leafPage) {
            return renderLeafPageData(leafPage, null, res);
        }

        // Fallback or Legacy Folder Routing
        const folderName = site ? site.folder : subdomain;
        const pageFolder = path.join(__dirname, 'pages', folderName);
        const indexPath = path.join(pageFolder, 'index.html');
        
        if (fs.existsSync(indexPath)) {
             let html = fs.readFileSync(indexPath, 'utf8');
             return res.send(html);
        }
        
        res.status(404).send('Not Found');
    } catch (error) {
        console.error("Router Error:", error);
        res.status(500).send('Server Error');
    }
});

app.listen(PORT, () => console.log(`🚀 Renderer running on port ${PORT}`));

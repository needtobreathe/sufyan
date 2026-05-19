const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// GÜNCEL DOĞRU MONGODB URI
const MONGODB_URI = 'mongodb://admin_samet:r3r3EJlfhULHw74wrR66@global-mongo-r7zwwu:27017/sufyan-yaprak?authSource=admin';
const EXPORT_DIR = path.join(__dirname, 'exported_html_pages');
const LOCAL_IMAGES_SRC = '/var/www/my-node-app/sufyan/backend/images';

// LeafPage Şeması Tanımı
const LeafPageSchema = new mongoose.Schema({
    name: String,
    slug: String,
    pixelCode: String,
    tiktokPixelId: String,
    tiktokAccessToken: String,
    metaPixelId: String,
    metaAccessToken: String,
    metaTestCode: String,
    productName: String,
    productPrice: Number,
    phone: String,
    mainImage: String,
    products: [{
        name: String,
        quantity: Number,
        price: Number,
        image: String,
        isDefault: Boolean
    }],
    components: [{
        type: { type: String },
        content: String
    }]
});

const LeafPage = mongoose.model('LeafPage', LeafPageSchema);

// HTML Şablonunu Oluşturan Fonksiyon
function generateHTML(page) {
    const slug = page.slug;
    let pixelHeader = '';
    
    // Meta (Facebook) Pixel
    if (page.metaPixelId) {
        pixelHeader += '\n<!-- Meta Pixel Code -->\n' +
        '<script>\n' +
        '!function(f,b,e,v,n,t,s)\n' +
        '{if(f.fbq)return;n=f.fbq=function(){n.callMethod?\n' +
        'n.callMethod.apply(n,arguments):n.queue.push(arguments)};\n' +
        'if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version=\'2.0\';\n' +
        'n.queue=[];t=b.createElement(e);t.async=!0;\n' +
        't.src=v;s=b.getElementsByTagName(e)[0];\n' +
        's.parentNode.insertBefore(t,s)}(window, document,\'script\',\n' +
        '\'https://connect.facebook.net/en_US/fbevents.js\');\n' +
        'fbq(\'init\', \'' + page.metaPixelId + '\');\n' +
        'fbq(\'track\', \'PageView\');\n' +
        '</script>\n' +
        '<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=' + page.metaPixelId + '&ev=PageView&noscript=1"/></noscript>\n' +
        '<!-- End Meta Pixel Code -->\n';
    }

    // TikTok Pixel
    if (page.tiktokPixelId) {
        pixelHeader += '\n<!-- TikTok Pixel Code -->\n' +
        '<script>\n' +
        '!function (w, d, t) {\n' +
        '  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var o="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=o,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=d.createElement("script");a.type="text/javascript",a.async=!0,a.src=o;var c=d.getElementsByTagName("script")[0];c.parentNode.insertBefore(a,c)};\n' +
        '  ttq.load(\'' + page.tiktokPixelId + '\');\n' +
        '  ttq.page();\n' +
        '}(window, document, \'ttq\');\n' +
        '</script>\n' +
        '<!-- End TikTok Pixel Code -->\n';
    }

    if (page.pixelCode) {
        pixelHeader += '\n' + page.pixelCode + '\n';
    }

    let componentsHTML = '';
    
    page.components.forEach((comp, compIdx) => {
        if (comp.type === 'image') {
            const imgFilename = path.basename(comp.content);
            componentsHTML += '\n<div class="component-image text-center my-3">\n' +
            '    <img src="./images/' + imgFilename + '" class="img-fluid rounded shadow-sm" alt="Ürün Detay" style="max-width: 100%;">\n' +
            '</div>\n';
        } else if (comp.type === 'trust_banner') {
            componentsHTML += '\n<div class="component-trust text-center my-4 p-3 bg-light rounded border">\n' +
            '    <p class="mb-0 text-muted">🛡️ <strong>%100 Güvenli Ödeme & Kapıda Nakit Ödeme İmkanı</strong></p>\n' +
            '    <p class="small text-muted mb-0">🚚 Ücretsiz Kargo & 3 Günde Hızlı Teslimat</p>\n' +
            '</div>\n';
        } else if (comp.type === 'form') {
            let packageOptions = '';
            page.products.forEach((prod, index) => {
                const checked = prod.isDefault || index === 0 ? 'checked' : '';
                const activeClass = prod.isDefault || index === 0 ? 'border-primary bg-light-primary' : '';
                packageOptions += '\n<div class="form-check package-option p-3 mb-2 rounded border ' + activeClass + '">\n' +
                '    <input class="form-check-input" type="radio" name="product_package" id="pkg_' + index + '" value="' + prod.name + '" data-price="' + prod.price + '" ' + checked + '>\n' +
                '    <label class="form-check-label w-100 fs-5 d-flex justify-content-between" for="pkg_' + index + '">\n' +
                '        <span><strong>' + prod.quantity + ' Adet</strong> - ' + prod.name + '</span>\n' +
                '        <span class="text-primary fw-bold">' + prod.price + ' TL</span>\n' +
                '    </label>\n' +
                '</div>';
            });

            componentsHTML += '\n<div id="siparis-formu" class="component-form card shadow-lg border-primary my-5">\n' +
            '    <div class="card-header bg-primary text-white text-center py-3">\n' +
            '        <h3 class="mb-0">KAPIDA ÖDEMELİ HIZLI SİPARİŞ FORMU</h3>\n' +
            '        <p class="mb-0 small">Formu Doldurun, Ürününüz Kapınıza Gelsin!</p>\n' +
            '    </div>\n' +
            '    <div class="card-body p-4">\n' +
            '        <form onsubmit="gonderSiparis(event)">\n' +
            '            <h5 class="mb-3 text-muted">1. Paket Seçimi</h5>\n' +
            '            <div class="package-list mb-4">\n' +
            '                ' + packageOptions + '\n' +
            '            </div>\n' +
            '            <h5 class="mb-3 text-muted">2. Teslimat Bilgileri</h5>\n' +
            '            <div class="mb-3">\n' +
            '                <label class="form-label">Adınız Soyadınız</label>\n' +
            '                <input type="text" class="form-control form-control-lg" id="full_name" required placeholder="Örn: Ahmet Yılmaz">\n' +
            '            </div>\n' +
            '            <div class="mb-3">\n' +
            '                <label class="form-label">Telefon Numaranız</label>\n' +
            '                <input type="tel" class="form-control form-control-lg" id="phone" required placeholder="Örn: 05xx xxx xx xx">\n' +
            '            </div>\n' +
            '            <div class="row">\n' +
            '                <div class="col-md-6 mb-3">\n' +
            '                    <label class="form-label">İl</label>\n' +
            '                    <select class="form-select form-select-lg" id="province" required onchange="sehirDegisti()">\n' +
            '                        <option value="">Seçiniz</option>\n' +
            '                    </select>\n' +
            '                </div>\n' +
            '                <div class="col-md-6 mb-3">\n' +
            '                    <label class="form-label">İlçe</label>\n' +
            '                    <select class="form-select form-select-lg" id="district" required disabled>\n' +
            '                        <option value="">İl Seçiniz</option>\n' +
            '                    </select>\n' +
            '                </div>\n' +
            '            </div>\n' +
            '            <div class="mb-4">\n' +
            '                <label class="form-label">Açık Adresiniz</label>\n' +
            '                <textarea class="form-control form-control-lg" id="address" rows="3" required placeholder="Sokak, Mahalle, Kapı No vb."></textarea>\n' +
            '            </div>\n' +
            '            <button type="submit" class="btn btn-success btn-lg w-100 py-3 fs-4 fw-bold shadow">\n' +
            '                SİPARİŞİ TAMAMLA (KAPIDA ÖDE)\n' +
            '            </button>\n' +
            '        </form>\n' +
            '    </div>\n' +
            '</div>\n';
        }
    });

    let finalHTML = '<!DOCTYPE html>\n' +
    '<html lang="tr">\n' +
    '<head>\n' +
    '    <meta charset="UTF-8">\n' +
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '    <title>' + page.name + ' - Resmi Satış Sitesi</title>\n' +
    '    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">\n' +
    '    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">\n' +
    '    <style>\n' +
    '        body {\n' +
    '            font-family: \'Outfit\', sans-serif;\n' +
    '            background-color: #f8f9fa;\n' +
    '            color: #333;\n' +
    '        }\n' +
    '        .container {\n' +
    '            max-width: 650px;\n' +
    '        }\n' +
    '        .package-option {\n' +
    '            cursor: pointer;\n' +
    '            transition: all 0.2s ease-in-out;\n' +
    '        }\n' +
    '        .package-option:hover {\n' +
    '            border-color: #0d6efd !important;\n' +
    '            background-color: rgba(13, 110, 253, 0.05);\n' +
    '        }\n' +
    '        .bg-light-primary {\n' +
    '            background-color: rgba(13, 110, 253, 0.05);\n' +
    '        }\n' +
    '    </style>\n' +
    '    ' + pixelHeader + '\n' +
    '</head>\n' +
    '<body>\n' +
    '    <div class="container py-4">\n' +
    '        ' + componentsHTML + '\n' +
    '    </div>\n' +
    '    <script>\n' +
    '    let sehirVerileri = [];\n' +
    '    async function sehirleriYukle() {\n' +
    '        try {\n' +
    '            const res = await fetch(\'https://sufyanbackend.siparisyonet.online/api/cities\');\n' +
    '            const data = await res.json();\n' +
    '            if (data.success) {\n' +
    '                sehirVerileri = data.cities;\n' +
    '                const provSel = document.getElementById(\'province\');\n' +
    '                sehirVerileri.forEach(city => {\n' +
    '                    const opt = document.createElement(\'option\');\n' +
    '                    opt.value = city.sehir_id;\n' +
    '                    opt.textContent = city.name;\n' +
    '                    provSel.appendChild(opt);\n' +
    '                });\n' +
    '            }\n' +
    '        } catch (e) { console.error(\'Şehirler yüklenemedi:\', e); }\n' +
    '    }\n' +
    '    async function sehirDegisti() {\n' +
    '        const provId = document.getElementById(\'province\').value;\n' +
    '        const distSel = document.getElementById(\'district\');\n' +
    '        distSel.innerHTML = \'<option value="">Yükleniyor...</option>\';\n' +
    '        distSel.disabled = true;\n' +
    '        if (!provId) {\n' +
    '            distSel.innerHTML = \'<option value="">İl Seçiniz</option>\';\n' +
    '            return;\n' +
    '        }\n' +
    '        try {\n' +
    '            const res = await fetch(\'https://sufyanbackend.siparisyonet.online/api/districts?city_id=\' + provId);\n' +
    '            const data = await res.json();\n' +
    '            if (data.success) {\n' +
    '                distSel.innerHTML = \'<option value="">Seçiniz</option>\';\n' +
    '                data.districts.forEach(dist => {\n' +
    '                    const opt = document.createElement(\'option\');\n' +
    '                    opt.value = dist.id;\n' +
    '                    opt.textContent = dist.name;\n' +
    '                    distSel.appendChild(opt);\n' +
    '                });\n' +
    '                distSel.disabled = false;\n' +
    '            }\n' +
    '        } catch (e) { \n' +
    '            console.error(\'İlçeler yüklenemedi:\', e); \n' +
    '            distSel.innerHTML = \'<option value="">Hata oluştu</option>\';\n' +
    '        }\n' +
    '    }\n' +
    '    async function gonderSiparis(event) {\n' +
    '        event.preventDefault();\n' +
    '        const nameInput = document.getElementById(\'full_name\').value;\n' +
    '        const phoneInput = document.getElementById(\'phone\').value;\n' +
    '        const provSel = document.getElementById(\'province\');\n' +
    '        const distSel = document.getElementById(\'district\');\n' +
    '        const addrInput = document.getElementById(\'address\').value;\n' +
    '        const selectedPkg = document.querySelector(\'input[name="product_package"]:checked\');\n' +
    '        const pkgName = selectedPkg.value;\n' +
    '        const pkgPrice = parseFloat(selectedPkg.getAttribute(\'data-price\')) || 0;\n' +
    '        const payload = {\n' +
    '            fullName: nameInput,\n' +
    '            phone: phoneInput,\n' +
    '            province: provSel.options[provSel.selectedIndex].text,\n' +
    '            district: distSel.options[distSel.selectedIndex].text,\n' +
    '            address: addrInput,\n' +
    '            items: [{\n' +
    '                name: pkgName,\n' +
    '                qty: 1,\n' +
    '                price: pkgPrice\n' +
    '            }],\n' +
    '            siteId: "' + slug + '"\n' +
    '        };\n' +
    '        if (typeof fbq !== \'undefined\') fbq(\'track\', \'InitiateCheckout\');\n' +
    '        if (typeof ttq !== \'undefined\') ttq.track(\'InitiateCheckout\');\n' +
    '        try {\n' +
    '            const response = await fetch(\'https://sufyanbackend.siparisyonet.online/api/orders/public\', {\n' +
    '                method: \'POST\',\n' +
    '                headers: { \'Content-Type\': \'application/json\' },\n' +
    '                body: JSON.stringify(payload)\n' +
    '            });\n' +
    '            const data = await response.json();\n' +
    '            if (data.success) {\n' +
    '                if (typeof fbq !== \'undefined\') fbq(\'track\', \'Purchase\', { value: pkgPrice, currency: \'TRY\' });\n' +
    '                if (typeof ttq !== \'undefined\') ttq.track(\'CompletePayment\', { value: pkgPrice, currency: \'TRY\' });\n' +
    '                alert(\'Siparişiniz başarıyla alındı! Teşekkür ederiz.\');\n' +
    '                window.location.href = \'https://sufyanpanel.siparisyonet.online/success?phone=\' + (data.productPhone || \'905444778742\');\n' +
    '            } else {\n' +
    '                alert(\'Hata: \' + data.message);\n' +
    '            }\n' +
    '        } catch (e) {\n' +
    '            console.error(\'Sipariş gönderim hatası:\', e);\n' +
    '            alert(\'Sipariş gönderilirken bağlantı sorunu yaşandı.\');\n' +
    '        }\n' +
    '    }\n' +
    '    document.addEventListener(\'change\', (e) => {\n' +
    '        if (e.target && e.target.name === \'product_package\') {\n' +
    '            document.querySelectorAll(\'.package-option\').forEach(el => el.classList.remove(\'border-primary\', \'bg-light-primary\'));\n' +
    '            e.target.closest(\'.package-option\').classList.add(\'border-primary\', \'bg-light-primary\');\n' +
    '        }\n' +
    '    });\n' +
    '    window.onload = sehirleriYukle;\n' +
    '    </script>\n' +
    '</body>\n' +
    '</html>';

    return finalHTML;
}

// Görsel Kopyalama Yardımcısı
function copyImage(srcPath, destDir) {
    if (!fs.existsSync(srcPath)) return false;
    const filename = path.basename(srcPath);
    const destPath = path.join(destDir, filename);
    try {
        fs.copyFileSync(srcPath, destPath);
        return true;
    } catch (e) {
        console.error('Görsel kopyalanamadı:', e.message);
        return false;
    }
}

// Ana Başlatıcı
async function run() {
    try {
        console.log('🔌 Veritabanına bağlanılıyor...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Veritabanı bağlantısı başarılı.');

        const pages = await LeafPage.find({});
        console.log('📦 Toplam ' + pages.length + ' adet yaprak sayfa bulundu.');

        if (!fs.existsSync(EXPORT_DIR)) {
            fs.mkdirSync(EXPORT_DIR, { recursive: true });
        }

        for (const page of pages) {
            console.log('\n⏳ Sayfa işleniyor: ' + page.name + ' (' + page.slug + ')');
            const pageDir = path.join(EXPORT_DIR, page.slug);
            const imagesDir = path.join(pageDir, 'images');

            if (!fs.existsSync(pageDir)) fs.mkdirSync(pageDir, { recursive: true });
            if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

            // 1. Görselleri kopyala
            page.components.forEach(comp => {
                if (comp.type === 'image' && comp.content) {
                    const imgName = path.basename(comp.content);
                    const fullSrcPath = path.join(LOCAL_IMAGES_SRC, imgName);
                    copyImage(fullSrcPath, imagesDir);
                }
            });

            if (page.mainImage) {
                const imgName = path.basename(page.mainImage);
                const fullSrcPath = path.join(LOCAL_IMAGES_SRC, imgName);
                copyImage(fullSrcPath, imagesDir);
            }

            // 2. HTML oluştur
            const htmlContent = generateHTML(page);
            fs.writeFileSync(path.join(pageDir, 'index.html'), htmlContent);
            console.log('✅ Statik HTML başarıyla üretildi: ' + page.slug + '/index.html');
        }

        console.log('\n🏆 İŞLEM BAŞARIYLA TAMAMLANDI! Klasör: ' + EXPORT_DIR);
    } catch (e) {
        console.error('❌ Hata:', e);
    } finally {
        await mongoose.disconnect();
    }
}

run();

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// MongoDB Bağlantı Bilgileri
const MONGODB_URI = 'mongodb://admin_samet:r3r3EJlfhULHw74wrR66@global-mongo-r7zwwu:27017/sufyan-yaprak?authSource=admin';
const EXPORT_DIR = path.join(__dirname, 'exported_html_pages');
const LOCAL_IMAGES_SRC = '/var/www/my-node-app/sufyan/backend/images'; // Sunucudaki görsellerin kaynağı

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
    
    // Piksel kodlarını hazırlayalım
    let pixelHeader = '';
    
    // Meta (Facebook) Pixel
    if (page.metaPixelId) {
        pixelHeader += `
        <!-- Meta Pixel Code -->
        <script>
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${page.metaPixelId}');
        fbq('track', 'PageView');
        </script>
        <noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${page.metaPixelId}&ev=PageView&noscript=1"/></noscript>
        <!-- End Meta Pixel Code -->
        `;
    }

    // TikTok Pixel
    if (page.tiktokPixelId) {
        pixelHeader += `
        <!-- TikTok Pixel Code -->
        <script>
        !function (w, d, t) {
          w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var o="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=o,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=d.createElement("script");a.type="text/javascript",a.async=!0,a.src=o;var c=d.getElementsByTagName("script")[0];c.parentNode.insertBefore(a,c)};
          ttq.load('${page.tiktokPixelId}');
          ttq.page();
        }(window, document, 'ttq');
        </script>
        <!-- End TikTok Pixel Code -->
        `;
    }

    // Custom Pixel Code (Analytics, Google Tag vb.)
    if (page.pixelCode) {
        pixelHeader += `\n${page.pixelCode}\n`;
    }

    // Bileşenleri (components) HTML'e çevirme
    let componentsHTML = '';
    
    page.components.forEach(comp => {
        if (comp.type === 'image') {
            // Görsel adını ayıralım ve local klasöre göre güncelleyelim
            const imgFilename = path.basename(comp.content);
            componentsHTML += `
            <div class="component-image text-center my-3">
                <img src="./images/${imgFilename}" class="img-fluid rounded shadow-sm" alt="Ürün Detay" style="max-width: 100%;">
            </div>\n`;
        } else if (comp.type === 'trust_banner') {
            componentsHTML += `
            <div class="component-trust text-center my-4 p-3 bg-light rounded border">
                <p class="mb-0 text-muted">🛡️ <strong>%100 Güvenli Ödeme & Kapıda Nakit Ödeme İmkanı</strong></p>
                <p class="small text-muted mb-0">🚚 Ücretsiz Kargo & 3 Günde Hızlı Teslimat</p>
            </div>\n`;
        } else if (comp.type === 'form') {
            // Paket seçeneklerini select/radio olarak oluşturma
            let packageOptions = '';
            page.products.forEach((prod, index) => {
                const checked = prod.isDefault || index === 0 ? 'checked' : '';
                packageOptions += `
                <div class="form-check package-option p-3 mb-2 rounded border ${checked ? 'border-primary bg-light-primary' : ''}">
                    <input class="form-check-input" type="radio" name="product_package" id="pkg_${index}" value="${prod.name}" data-price="${prod.price}" ${checked}>
                    <label class="form-check-label w-100 fs-5 d-flex justify-content-between" for="pkg_${index}">
                        <span><strong>${prod.quantity} Adet</strong> - ${prod.name}</span>
                        <span class="text-primary fw-bold">${prod.price} TL</span>
                    </label>
                </div>`;
            });

            componentsHTML += `
            <div id="siparis-formu" class="component-form card shadow-lg border-primary my-5">
                <div class="card-header bg-primary text-white text-center py-3">
                    <h3 class="mb-0">KAPIDA ÖDEMELİ HIZLI SİPARİŞ FORMU</h3>
                    <p class="mb-0 small">Formu Doldurun, Ürününüz Kapınıza Gelsin!</p>
                </div>
                <div class="card-body p-4">
                    <form onsubmit="gonderSiparis(event)">
                        
                        <h5 class="mb-3 text-muted">1. Paket Seçimi</h5>
                        <div class="package-list mb-4">
                            ${packageOptions}
                        </div>

                        <h5 class="mb-3 text-muted">2. Teslimat Bilgileri</h5>
                        <div class="mb-3">
                            <label class="form-label">Adınız Soyadınız</label>
                            <input type="text" class="form-control form-control-lg" id="full_name" required placeholder="Örn: Ahmet Yılmaz">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Telefon Numaranız</label>
                            <input type="tel" class="form-control form-control-lg" id="phone" required placeholder="Örn: 05xx xxx xx xx">
                        </div>
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="form-label">İl</label>
                                <select class="form-select form-select-lg" id="province" required onchange="sehirDegisti()">
                                    <option value="">Seçiniz</option>
                                </select>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="form-label">İlçe</label>
                                <select class="form-select form-select-lg" id="district" required disabled>
                                    <option value="">İl Seçiniz</option>
                                </select>
                            </div>
                        </div>
                        <div class="mb-4">
                            <label class="form-label">Açık Adresiniz</label>
                            <textarea class="form-control form-control-lg" id="address" rows="3" required placeholder="Sokak, Mahalle, Kapı No vb."></textarea>
                        </div>

                        <button type="submit" class="btn btn-success btn-lg w-100 py-3 fs-4 fw-bold shadow">
                            SİPARİŞİ TAMAMLA (KAPIDA ÖDE)
                        </button>
                    </form>
                </div>
            </div>\n`;
        }
    });

    // Tam HTML Kodunu İnşa Ediyoruz
    return `<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${page.name} - Resmi Satış Sitesi</title>
    
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
    
    <style>
        body {
            font-family: 'Outfit', sans-serif;
            background-color: #f8f9fa;
            color: #333;
        }
        .container {
            max-width: 650px;
        }
        .package-option {
            cursor: pointer;
            transition: all 0.2s ease-in-out;
        }
        .package-option:hover {
            border-color: #0d6efd !important;
            background-color: rgba(13, 110, 253, 0.05);
        }
        .bg-light-primary {
            background-color: rgba(13, 110, 253, 0.05);
        }
    </style>
    
    ${pixelHeader}
</head>
<body>

    <div class="container py-4">
        
        <!-- Dinamik Sayfa Bileşenleri -->
        ${componentsHTML}

    </div>

    <!-- İl ve İlçe Veri & Sipariş Gönderme JS -->
    <script>
    // İl ve İlçe listesini yükleme ve dinamikleştirme
    let sehirVerileri = [];

    async function sehirleriYukle() {
        try {
            // Şehir verilerini doğrudan API'den çekiyoruz
            const res = await fetch('https://sufyanbackend.siparisyonet.online/api/cities');
            const data = await res.json();
            if (data.success) {
                sehirVerileri = data.cities;
                const provSel = document.getElementById('province');
                sehirVerileri.forEach(city => {
                    const opt = document.createElement('option');
                    opt.value = city.sehir_id;
                    opt.textContent = city.name;
                    provSel.appendChild(opt);
                });
            }
        } catch (e) { console.error('Şehirler yüklenemedi:', e); }
    }

    async function sehirDegisti() {
        const provId = document.getElementById('province').value;
        const distSel = document.getElementById('district');
        distSel.innerHTML = '<option value="">Yükleniyor...</option>';
        distSel.disabled = true;

        if (!provId) {
            distSel.innerHTML = '<option value="">İl Seçiniz</option>';
            return;
        }

        try {
            const res = await fetch('https://sufyanbackend.siparisyonet.online/api/districts?city_id=' + provId);
            const data = await res.json();
            if (data.success) {
                distSel.innerHTML = '<option value="">Seçiniz</option>';
                data.districts.forEach(dist => {
                    const opt = document.createElement('option');
                    opt.value = dist.id;
                    opt.textContent = dist.name;
                    distSel.appendChild(opt);
                });
                distSel.disabled = false;
            }
        } catch (e) { 
            console.error('İlçeler yüklenemedi:', e); 
            distSel.innerHTML = '<option value="">Hata oluştu</option>';
        }
    }

    // Siparişi POST etme
    async function gonderSiparis(event) {
        event.preventDefault();
        
        const nameInput = document.getElementById('full_name').value;
        const phoneInput = document.getElementById('phone').value;
        const provSel = document.getElementById('province');
        const distSel = document.getElementById('district');
        const addrInput = document.getElementById('address').value;
        
        // Seçilen paket bilgileri
        const selectedPkg = document.querySelector('input[name="product_package"]:checked');
        const pkgName = selectedPkg.value;
        const pkgPrice = parseFloat(selectedPkg.getAttribute('data-price')) || 0;

        const payload = {
            fullName: nameInput,
            phone: phoneInput,
            province: provSel.options[provSel.selectedIndex].text,
            district: distSel.options[distSel.selectedIndex].text,
            address: addrInput,
            items: [{
                name: pkgName,
                qty: 1,
                price: pkgPrice
            }],
            siteId: "${slug}" // Dinamik site slug bilgisi
        };

        // Piksel tetikleme (InitiateCheckout)
        if (typeof fbq !== 'undefined') fbq('track', 'InitiateCheckout');
        if (typeof ttq !== 'undefined') ttq.track('InitiateCheckout');

        try {
            const response = await fetch('https://sufyanbackend.siparisyonet.online/api/orders/public', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await response.json();
            
            if (data.success) {
                // Piksel tetikleme (Purchase)
                if (typeof fbq !== 'undefined') fbq('track', 'Purchase', { value: pkgPrice, currency: 'TRY' });
                if (typeof ttq !== 'undefined') ttq.track('CompletePayment', { value: pkgPrice, currency: 'TRY' });
                
                alert('Siparişiniz başarıyla alındı! Teşekkür ederiz.');
                window.location.href = 'https://sufyanpanel.siparisyonet.online/success?phone=' + (data.productPhone || '905444778742');
            } else {
                alert('Hata: ' + data.message);
            }
        } catch (e) {
            console.error('Sipariş gönderim hatası:', e);
            alert('Sipariş gönderilirken bağlantı sorunu yaşandı.');
        }
    }

    // Paket seçimini görsel olarak güzelleştirme
    document.addEventListener('change', (e) => {
        if (e.target && e.target.name === 'product_package') {
            document.querySelectorAll('.package-option').forEach(el => el.classList.remove('border-primary', 'bg-light-primary'));
            e.target.closest('.package-option').classList.add('border-primary', 'bg-light-primary');
        }
    });

    // Sayfa yüklenince şehirleri çek
    window.onload = sehirleriYukle;
    </script>
</body>
</html>`;
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
        console.error(`Görsel kopyalanamadı: ${srcPath} -> ${destPath}`, e);
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
        console.log(`📦 Toplam ${pages.length} adet yaprak sayfa bulundu.`);

        if (!fs.existsSync(EXPORT_DIR)) {
            fs.mkdirSync(EXPORT_DIR, { recursive: true });
        }

        for (const page of pages) {
            console.log(`\n⏳ Sayfa işleniyor: ${page.name} (${page.slug})`);
            const pageDir = path.join(EXPORT_DIR, page.slug);
            const imagesDir = path.join(pageDir, 'images');

            if (!fs.existsSync(pageDir)) fs.mkdirSync(pageDir, { recursive: true });
            if (!fs.existsSync(imagesDir)) fs.mkdirSync(imagesDir, { recursive: true });

            // 1. Görselleri Bulup Kopyalayalım
            // Bileşenlerin içindeki görselleri bulalım
            page.components.forEach(comp => {
                if (comp.type === 'image' && comp.content) {
                    const imgName = path.basename(comp.content);
                    const fullSrcPath = path.join(LOCAL_IMAGES_SRC, imgName);
                    copyImage(fullSrcPath, imagesDir);
                }
            });

            // Main Thumbnail görseli
            if (page.mainImage) {
                const imgName = path.basename(page.mainImage);
                const fullSrcPath = path.join(LOCAL_IMAGES_SRC, imgName);
                copyImage(fullSrcPath, imagesDir);
            }

            // 2. HTML'i Oluşturalım
            const htmlContent = generateHTML(page);
            fs.writeFileSync(path.join(pageDir, 'index.html'), htmlContent);
            console.log(`✅ Sayfa başarıyla statik HTML'e dönüştürüldü: ${page.slug}/index.html`);
        }

        console.log(`\n🏆 İŞLEM TAMAMLANDI! Tüm yaprak sayfalar '${EXPORT_DIR}' klasörüne başarıyla çıkarıldı.`);
    } catch (e) {
        console.error('❌ Hata oluştu:', e);
    } finally {
        await mongoose.disconnect();
    }
}

run();

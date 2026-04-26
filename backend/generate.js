const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    // Launch headless browser
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();

    // Set a matching viewport size for the banner
    await page.setViewport({ width: 1242, height: 900, deviceScaleFactor: 2 });

    // The HTML content representing the exact user design
    const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800;900&display=swap" rel="stylesheet">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            body {
                margin: 0;
                padding: 0;
                background: white;
                font-family: 'Montserrat', sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                width: 1242px;
                height: 900px;
            }
            .grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-template-rows: 1fr 1fr;
                gap: 80px 40px;
                width: 1000px;
                text-align: center;
            }
            .item {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            .icon {
                font-size: 75px;
                color: #b0b0b0; /* Light gray */
                margin-bottom: 25px;
            }
            .title {
                font-size: 42px;
                font-weight: 900;
                color: #1a1a1a;
                line-height: 1.1;
                margin-bottom: 15px;
                letter-spacing: -1.5px;
                text-transform: uppercase;
            }
            .desc {
                font-size: 24px;
                font-weight: 400;
                color: #8c8c8c;
                line-height: 1.4;
                padding: 0 20px;
            }
        </style>
    </head>
    <body>
        <div class="grid">
            <!-- 1. Kapıda Nakit -->
            <div class="item">
                <i class="fa-regular fa-credit-card icon"></i>
                <div class="title">KAPIDA NAKİT<br>ÖDEME</div>
                <div class="desc">Kredi kartı ile dilerseniz<br>ödemeyi teslimat sırasında<br>yapabilirsiniz.</div>
            </div>

            <!-- 2. Orjinal Ürün -->
            <div class="item">
                <i class="fa-solid fa-award icon"></i>
                <div class="title">%100 Orjinal<br>Ürün</div>
                <div class="desc">Ürünümüz %100<br>orjinaldir</div>
            </div>

            <!-- 3. Hızlı Kargo -->
            <div class="item">
                <i class="fa-solid fa-truck-fast icon"></i>
                <div class="title">HIZLI<br>KARGO</div>
                <div class="desc">Siparişiniz aynı gün<br>içerisinde hemen<br>kargoya verilir.</div>
            </div>

            <!-- 4. Güvenli Alışveriş -->
            <div class="item">
                <i class="fa-solid fa-lock icon"></i>
                <div class="title">GÜVENLİ<br>ALIŞVERİŞ</div>
                <div class="desc">Sitemizin güvenliği<br>256 Bit SSL Sertifikası<br>ile sağlanmaktadır.</div>
            </div>
        </div>
    </body>
    </html>
    `;

    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Ensure icon fonts are fully loaded
    await page.evaluateHandle('document.fonts.ready');
    await new Promise(resolve => setTimeout(resolve, 1500)); // extra buffer for font awesome icons

    // Save screenshot
    const outPath = path.resolve(__dirname, '../images/trust_banner.jpg');
    await page.screenshot({ path: outPath, type: 'jpeg', quality: 90 });

    console.log('✅ Banner successfully generated at:', outPath);
    await browser.close();
})();

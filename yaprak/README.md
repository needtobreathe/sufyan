# Yaprak Page Renderer

Bu proje, " Yaprak" projesinin sürükle-bırak sayfalarını bağımsız bir domain altında görüntülemek için ayrıştırılmış halidir.

## Kurulum

1.  Bağımlılıkları yükleyin:
    ```bash
    npm install
    ```
2.  `.env` dosyasındaki verilerin (MongoDB URI, Legacy API Bilgileri) doğruluğunu kontrol edin.

## Çalıştırma

- Geliştirme modu:
  ```bash
  npm run dev
  ```
- Canlı mod (Production):
  ```bash
  npm start
  ```

## Özellikler

- **Subdomain Desteği:** `site1.domain.com` gibi alt alan adlarını otomatik algılar ve ilgili sayfayı basar.
- **Analytics:** Sayfa üzerindeki tüm kullanıcı hareketlerini MongoDB'ye kaydeder.
- **Sipariş:** Sayfadan gelen siparişleri doğrudan sizin legacy PHP API'nize (MySQL) iletir.

## Dizin Yapısı

- `/pages`: HTML şablonları ve legacy kampanya klasörleri.
- `/images`: Sayfalarda kullanılan görseller.
- `/models`: MongoDB veri şemaları.

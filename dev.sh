#!/bin/bash

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "🚀 Yaprak Projesi Tüm Sunucuları Başlatılıyor..."

# 1. Portları temizle
echo "🧹 Portlar temizleniyor (5005, 5006, 5173)..."
lsof -ti:5005 | xargs kill 2>/dev/null || true
lsof -ti:5006 | xargs kill 2>/dev/null || true
lsof -ti:5173 | xargs kill 2>/dev/null || true
sleep 1

# 2. Node.js Backend API (Port 5005)
echo "⚙️  Backend API Port 5005'de başlatılıyor..."
(cd "$DIR/backend" && PORT=5005 node server.js) &

# 3. Yaprak Renderer (Sayfa Motoru - Port 5006)
echo "📄 Yaprak Renderer Port 5006'da başlatılıyor..."
(cd "$DIR/yaprak" && RENDERER_PORT=5006 node server.js) &

# 4. Vue Admin Panel (Yönetim Paneli - Port 5173)
echo "📊 Admin Panel Port 5173'te başlatılıyor..."
(cd "$DIR/panel" && npm run dev) &

echo ""
echo "✅ Servisler başarıyla ayağa kalktı!"
echo "👉 Backend:  http://localhost:5005"
echo "👉 Renderer: http://localhost:5006"
echo "👉 Panel:    http://localhost:5173"
echo ""
echo "Çıkış yapmak için CTRL+C'ye basın."

trap "kill 0" EXIT
wait

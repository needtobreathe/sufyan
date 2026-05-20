const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

async function generateTodayReport() {
  try {
    await mongoose.connect('mongodb://admin_samet:r3r3EJlfhULHw74wrR66@194.146.36.252:27017/sufyan-yaprak?authSource=admin');
    const Order = mongoose.connection.db.collection('orders');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const orders = await Order.find({ createdAt: { $gte: todayStart } })
      .sort({ createdAt: 1 })
      .toArray();

    const CANCELLED = ['cancelled', '9', '10', '11', 'deleted'];

    const statusLabel = (s) => {
      const map = {
        pending: 'Yeni', '1': 'Yeni',
        approved: 'Onaylandı', '2': 'Onaylandı',
        preparing: 'Hazırlanıyor', '3': 'Hazırlanıyor',
        shipped: 'Kargoya Verildi', '5': 'Kargoya Verildi',
        delivered: 'Teslim Edildi', '12': 'Teslim Edildi',
        cancelled: 'İptal', '9': 'İptal', '10': 'İptal', '11': 'İptal',
        deleted: 'Silindi',
      };
      return map[s] || s;
    };

    const statusClass = (s) => {
      if (['pending','1'].includes(s)) return 'status-pending';
      if (['approved','2','preparing','3'].includes(s)) return 'status-preparing';
      if (['shipped','5','delivered','12'].includes(s)) return 'status-shipped';
      if (CANCELLED.includes(s)) return 'status-cancelled';
      return '';
    };

    const fmt = (n) => '₺' + Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 0 });
    const fmtDate = (d) => new Date(d).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit' });

    let totalRevenue = 0;
    let totalOrders = orders.length;
    let cancelledCount = 0;

    const rows = orders.map((order, i) => {
      const isCancelled = CANCELLED.includes(order.status);
      const orderTotal = (order.items || []).reduce((s, it) => s + (it.price || 0), 0);
      if (!isCancelled) totalRevenue += orderTotal;
      if (isCancelled) cancelledCount++;

      const items = (order.items || []).map(it =>
        `<span class="item-chip">${it.name}${it.qty > 1 ? ` ×${it.qty}` : ''}</span>`
      ).join('');

      return `
        <tr class="${isCancelled ? 'row-cancelled' : ''}">
          <td class="td-num">${i + 1}</td>
          <td class="td-time">${fmtDate(order.createdAt)}</td>
          <td class="td-name">${order.customerName || order.name || '—'}</td>
          <td class="td-phone">${order.phone || order.customerPhone || '—'}</td>
          <td class="td-items">${items}</td>
          <td class="td-price">${fmt(orderTotal)}</td>
          <td><span class="status-badge ${statusClass(order.status)}">${statusLabel(order.status)}</span></td>
          <td class="td-site"><code>${order.site_id || '—'}</code></td>
        </tr>`;
    }).join('');

    const now = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });
    const today = new Date().toLocaleDateString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: 'long', year: 'numeric' });

    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Günlük Sipariş Dökümü – ${today}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #f1f5f9; color: #1e293b; padding: 32px; }

    .report-header {
      background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%);
      color: white;
      border-radius: 16px;
      padding: 32px 40px;
      margin-bottom: 28px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      box-shadow: 0 8px 32px rgba(29,78,216,0.25);
    }
    .report-header h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
    .report-header p { font-size: 13px; opacity: 0.75; margin-top: 4px; }
    .report-header .generated { font-size: 12px; opacity: 0.6; text-align: right; }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }
    .card {
      background: white;
      border-radius: 12px;
      padding: 20px 24px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.07);
      border: 1px solid #e2e8f0;
    }
    .card-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .card-value { font-size: 28px; font-weight: 800; color: #0f172a; }
    .card-sub { font-size: 12px; color: #94a3b8; margin-top: 4px; }
    .card.green .card-value { color: #16a34a; }
    .card.red .card-value { color: #dc2626; }
    .card.blue .card-value { color: #1d4ed8; }

    .table-wrapper {
      background: white;
      border-radius: 14px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.07);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .table-title {
      padding: 18px 24px;
      border-bottom: 1px solid #f1f5f9;
      font-weight: 700;
      font-size: 15px;
      color: #0f172a;
    }
    table { width: 100%; border-collapse: collapse; }
    thead th {
      background: #f8fafc;
      padding: 12px 14px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e2e8f0;
    }
    tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.15s; }
    tbody tr:hover { background: #f8fafc; }
    tbody tr:last-child { border-bottom: none; }
    tbody tr.row-cancelled { opacity: 0.5; }
    td { padding: 11px 14px; font-size: 13px; vertical-align: middle; }

    .td-num { color: #94a3b8; font-size: 12px; width: 40px; }
    .td-time { color: #64748b; white-space: nowrap; }
    .td-name { font-weight: 600; }
    .td-phone { color: #64748b; font-size: 12px; }
    .td-price { font-weight: 700; color: #0f172a; text-align: right; white-space: nowrap; }
    .td-site code { background: #f1f5f9; padding: 2px 7px; border-radius: 6px; font-size: 11px; color: #475569; }
    .td-items { max-width: 260px; }

    .item-chip {
      display: inline-block;
      background: #eff6ff;
      color: #1d4ed8;
      border: 1px solid #bfdbfe;
      border-radius: 20px;
      padding: 2px 10px;
      font-size: 11px;
      font-weight: 600;
      margin: 2px 2px;
      white-space: nowrap;
    }

    .status-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      white-space: nowrap;
    }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-preparing { background: #e0f2fe; color: #0369a1; }
    .status-shipped { background: #dcfce7; color: #166534; }
    .status-cancelled { background: #fee2e2; color: #991b1b; }

    .footer {
      text-align: center;
      margin-top: 24px;
      font-size: 12px;
      color: #94a3b8;
    }

    @media print {
      body { padding: 16px; background: white; }
      .report-header { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>

  <div class="report-header">
    <div>
      <h1>📦 Günlük Sipariş Dökümü</h1>
      <p>${today}</p>
    </div>
    <div class="generated">Oluşturulma: ${now}</div>
  </div>

  <div class="summary-cards">
    <div class="card blue">
      <div class="card-label">Toplam Sipariş</div>
      <div class="card-value">${totalOrders}</div>
      <div class="card-sub">${cancelledCount} iptal dahil</div>
    </div>
    <div class="card green">
      <div class="card-label">Toplam Ciro</div>
      <div class="card-value">${fmt(totalRevenue)}</div>
      <div class="card-sub">İptal hariç</div>
    </div>
    <div class="card">
      <div class="card-label">Ortalama Sepet</div>
      <div class="card-value">${totalOrders > 0 ? fmt(totalRevenue / totalOrders) : '₺0'}</div>
      <div class="card-sub">Tüm siparişler baz alındı</div>
    </div>
    <div class="card red">
      <div class="card-label">İptal Sayısı</div>
      <div class="card-value">${cancelledCount}</div>
      <div class="card-sub">%${totalOrders > 0 ? ((cancelledCount / totalOrders) * 100).toFixed(1) : 0} iptal oranı</div>
    </div>
  </div>

  <div class="table-wrapper">
    <div class="table-title">Sipariş Listesi</div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Saat</th>
          <th>Ad Soyad</th>
          <th>Telefon</th>
          <th>Ürünler</th>
          <th style="text-align:right">Tutar</th>
          <th>Durum</th>
          <th>Sayfa</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>

  <div class="footer">
    Sufyan Panel – ${today} tarihli sipariş raporu &nbsp;|&nbsp; Toplam ${totalOrders} sipariş
  </div>

</body>
</html>`;

    const outPath = path.join(__dirname, 'today_report.html');
    fs.writeFileSync(outPath, html, 'utf8');
    console.log('✅ Rapor oluşturuldu:', outPath);
    console.log(`📦 Toplam Sipariş: ${totalOrders}`);
    console.log(`💰 Toplam Ciro: ${fmt(totalRevenue)}`);
    console.log(`❌ İptal: ${cancelledCount}`);
  } catch (err) {
    console.error('Hata:', err);
  } finally {
    process.exit(0);
  }
}

generateTodayReport();

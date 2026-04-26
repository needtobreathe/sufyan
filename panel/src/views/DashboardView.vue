<template>
  <AdminLayout pageTitle="Yönetici Özeti">
    <!-- Role Guard for non-admins (Representatives) -->
    <div v-if="!isAdmin" class="welcome-container">
      <div class="welcome-card">
        <div class="welcome-icon">👋</div>
        <h2>Hoş geldin, {{ user.fullName }}!</h2>
        <p>Gününüz harika geçsin. Siparişleri yönetmek için yan menüden "Sipariş Listesi"ne gidebilirsiniz.</p>
        <button class="action-btn" @click="$router.push('/orders')">Siparişleri Görüntüle</button>
      </div>
    </div>

    <div v-else class="dashboard-content">
      <!-- MAIN STAT CARDS -->
      <div class="metrics-grid">
        <div v-for="card in topCards" :key="card.key" :class="['metric-card', card.themeClass]">
          <div class="card-header">
            <span class="card-title">{{ card.title }}</span>
            <span v-if="card.key === 'today'" class="trend-badge down">▼ 77%</span>
          </div>
          
          <div class="card-body">
            <div class="stat-main">
              <div class="stat-left">
                <span class="stat-value">{{ statsData[card.key]?.count || 0 }}</span>
                <span class="stat-label">Toplam Sipariş</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-right">
                <span class="stat-value text-green">{{ formatTL(statsData[card.key]?.revenue || 0) }}</span>
                <span class="stat-label">Toplam Ciro</span>
              </div>
            </div>
            
            <div class="stat-breakdown">
              <div class="breakdown-item text-yellow">
                <span class="val">{{ statsData[card.key]?.pending || 0 }}</span> Yeni
              </div>
              <div class="breakdown-item text-blue">
                <span class="val">{{ statsData[card.key]?.processing || 0 }}</span> K.Bekleyen
              </div>
              <div class="breakdown-item text-green">
                <span class="val">{{ statsData[card.key]?.shipped || 0 }}</span> K.Verildi
              </div>
              <div class="breakdown-item text-red">
                <span class="val">{{ statsData[card.key]?.cancelled || 0 }}</span> İptal
              </div>
            </div>

            <div class="stat-footer">
              Ort. Sepet: <span class="calc-val">{{ formatTL(calculateAvgBasket(statsData[card.key])) }}</span>
            </div>
          </div>
          <div class="card-bottom-line"></div>
        </div>
      </div>

      <!-- LIVE VISITORS STRIP -->
      <div v-if="liveVisitors.length > 0" class="live-visitors-strip">
        <div class="strip-label">
          <span class="pulse-dot"></span>
          <span>Canlı Trafik</span>
        </div>
        <div class="strip-items">
          <div v-for="site in liveVisitors" :key="site.slug" class="strip-item">
            <span class="s-name">{{ site.name }}</span>
            <span class="s-count">{{ site.live }} Aktif</span>
          </div>
        </div>
      </div>

      <!-- MIDDLE ROW: CHART & REP PERFORMANCE -->
      <div class="middle-grid">
        <!-- Performans Analiz Grafiği -->
        <div class="dashboard-section chart-section">
          <div class="section-header">
            <h3>Performans Analiz Grafiği</h3>
          </div>
          <div class="chart-container">
             <Line v-if="isChartReady" :data="chartData" :options="chartOptions" />
          </div>
        </div>

        <!-- Temsilci Performans Takibi -->
        <div class="dashboard-section reps-section">
          <div class="section-header">
            <h3>Temsilci Performans Takibi</h3>
          </div>
          <div class="reps-list">
            <div v-for="(rep, idx) in employeePerformance" :key="idx" class="rep-row">
               <div class="rep-info">
                 <div class="rep-avatar">{{ rep.name.charAt(0).toUpperCase() }}</div>
                 <span class="rep-name">{{ rep.name }}</span>
               </div>
               <div class="rep-stats">
                 <div class="r-stat r-approved" title="Onaylanan">
                   <i class="icon">✓</i>
                   <span>{{ rep.approved }}</span>
                 </div>
                 <div class="r-stat r-cancelled" title="İptal Edilen">
                   <i class="icon">✕</i>
                   <span>{{ rep.cancelled }}</span>
                 </div>
               </div>
            </div>
            <div v-if="!employeePerformance.length" class="empty-state">Bugün hiç hareket yok.</div>
          </div>
        </div>
      </div>

      <!-- BOTTOM ROW: WEEKLY TABLE & LAST 10 ORDERS -->
      <div class="bottom-grid">
        <!-- Haftalık Performans Çizelgesi -->
        <div class="dashboard-section weekly-section">
          <div class="section-header">
            <h3>Haftalık Performans Çizelgesi</h3>
          </div>
          <div class="table-responsive">
            <table class="dashboard-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Gün</th>
                  <th>Sipariş Sayısı</th>
                  <th>İptal Edilen</th>
                  <th>Başarı Oranı</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(day, idx) in statsData.weeklyData" :key="idx">
                  <td><b>{{ day.date }}</b></td>
                  <td>{{ day.day }}</td>
                  <td><span class="badge blue">{{ day.count }}</span></td>
                  <td><span class="badge red">{{ day.cancelled }}</span></td>
                  <td>
                    <span :class="['rate-pill', getRateClass(day.count, day.cancelled)]">
                      %{{ getSuccessRate(day.count, day.cancelled) }}
                    </span>
                  </td>
                </tr>
                <tr v-if="!statsData.weeklyData || !statsData.weeklyData.length">
                  <td colspan="5" class="empty-row">Veri bulunamadı.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

         <!-- Son 10 Sipariş -->
         <div class="dashboard-section recent-orders-section">
          <div class="section-header">
            <h3>Son 10 Sipariş</h3>
            <button class="view-all-link" @click="$router.push('/orders')">Tümünü Gör</button>
          </div>
          <div class="table-responsive">
            <table class="dashboard-table">
              <thead>
                <tr>
                  <th>Müşteri</th>
                  <th>Durum</th>
                  <th>Tarih</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in recentOrders" :key="order._id">
                  <td class="customer-cell">
                    <span class="name">{{ order.fullName }}</span>
                    <span class="phone">{{ order.phone }}</span>
                  </td>
                  <td>
                    <span :class="['status-pill', 'status-' + (order.status || 'pending')]">
                      {{ getStatusLabel(order.status) }}
                    </span>
                  </td>
                  <td class="date-cell">
                    <div class="date-display">
                      <span class="time">{{ formatDateParts(order.createdAt).time }}</span>
                      <span class="date">{{ formatDateParts(order.createdAt).date }}</span>
                    </div>
                  </td>
                </tr>
                <tr v-if="recentOrders.length === 0">
                  <td colspan="3" class="empty-row">Sipariş bulunamadı</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { apiFetch } from '@/utils/fetch'
import AdminLayout from '../components/AdminLayout.vue'

// Chart.js imports
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const user = JSON.parse(localStorage.getItem('admin_user') || '{}')
const isAdmin = computed(() => 
  user.role === '1' || user.role === 1 ||
  user.type === '1' || user.type === 1 ||
  user.kullanici_tipi === '1' || user.kullanici_tipi === 1 ||
  user.role === 'admin' || user.type === 'admin'
)

const topCards = [
  { key: 'today', title: 'BUGÜNÜN ÖZETİ', themeClass: 'theme-blue' },
  { key: 'yesterday', title: 'DÜNKÜ VERİLER', themeClass: 'theme-purple' },
  { key: 'week', title: 'HAFTALIK DURUM', themeClass: 'theme-green' },
  { key: 'month', title: 'AYLIK GENEL TOPLAM', themeClass: 'theme-red' }
]

const statsData = ref({
  today: { count: 0, revenue: 0, pending: 0, processing: 0, shipped: 0, cancelled: 0 },
  yesterday: { count: 0, revenue: 0, pending: 0, processing: 0, shipped: 0, cancelled: 0 },
  week: { count: 0, revenue: 0, pending: 0, processing: 0, shipped: 0, cancelled: 0 },
  month: { count: 0, revenue: 0, pending: 0, processing: 0, shipped: 0, cancelled: 0 },
  weeklyData: []
})

const employeePerformance = ref([])
const recentOrders = ref([])
let pollInterval = null
const isChartReady = ref(false)

const liveVisitors = computed(() => {
  return statsData.value.visitors?.filter(s => s.live > 0) || []
})

// Chart Configurations
const chartData = ref({
  labels: [],
  datasets: [
    {
       label: 'Sipariş Sayısı',
       backgroundColor: 'rgba(59, 130, 246, 0.15)',
       borderColor: '#3b82f6',
       pointBackgroundColor: '#ffffff',
       pointBorderColor: '#3b82f6',
       pointHoverBackgroundColor: '#3b82f6',
       pointHoverBorderColor: '#ffffff',
       borderWidth: 2,
       tension: 0.4,
       fill: true,
       data: []
    },
    {
       label: 'İptal Edilen',
       backgroundColor: 'rgba(239, 68, 68, 0.0)',
       borderColor: '#ef4444',
       pointBackgroundColor: '#ffffff',
       pointBorderColor: '#ef4444',
       borderWidth: 2,
       borderDash: [5, 5],
       tension: 0.4,
       fill: false,
       data: []
    }
  ]
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: { boxWidth: 10, usePointStyle: true, font: { family: 'Inter', size: 12 } }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      titleFont: { family: 'Inter', size: 13 },
      bodyFont: { family: 'Inter', size: 13 },
      padding: 12,
      cornerRadius: 8
    }
  },
  scales: {
    x: { grid: { display: false }, ticks: { font: { family: 'Inter' } } },
    y: { grid: { borderDash: [4, 4], color: '#f1f5f9' }, beginAtZero: true, ticks: { font: { family: 'Inter' }, precision: 0 } }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  }
}

const formatTL = (val) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val)
}

const calculateAvgBasket = (dataObj) => {
  if (!dataObj || dataObj.count === 0) return 0
  const validTotal = dataObj.count - (dataObj.cancelled || 0)
  if (validTotal <= 0) return 0
  return dataObj.revenue / validTotal
}

const getSuccessRate = (count, cancelled) => {
  if (!count || count === 0) return 0;
  return (((count - cancelled) / count) * 100).toFixed(0);
}

const getRateClass = (count, cancelled) => {
  const rate = getSuccessRate(count, cancelled);
  if (rate >= 80) return 'rate-high';
  if (rate >= 50) return 'rate-medium';
  return 'rate-low';
}

const fetchStats = async () => {
  try {
    const res = await apiFetch('/api/get_dashboard_stats.php')
    const json = await res.json()
    if (json.success) {
      statsData.value = json.stats || statsData.value
      employeePerformance.value = json.performance || []
      
      // Update Chart
      if (json.stats?.weeklyData) {
         const labels = json.stats.weeklyData.map(d => d.day.slice(0,3) + ' (' + d.date.split('-').slice(1,3).reverse().join('/') + ')');
         const counts = json.stats.weeklyData.map(d => d.count);
         const cancels = json.stats.weeklyData.map(d => d.cancelled);
         
         chartData.value.labels = labels;
         chartData.value.datasets[0].data = counts;
         chartData.value.datasets[1].data = cancels;
         isChartReady.value = true;
      }
    }

    try {
      const localRes = await apiFetch('/api/orders?limit=10')
      const localJson = await localRes.json()
      if (localJson.success) {
        recentOrders.value = localJson.orders
      }
    } catch (err) {
       recentOrders.value = []
    }
  } catch (e) {
    console.error('Stats fetch error:', e)
  }
}

onMounted(() => {
  fetchStats()
  pollInterval = setInterval(fetchStats, 5000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})

const formatDateParts = (dateStr) => {
  if (!dateStr) return { time: '-', date: '-' }
  const d = new Date(dateStr)
  return {
    time: d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    date: d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }
}

const statusLabels = {
  pending: 'Yeni Sipariş',
  approved: 'Onaylandı',
  preparing: 'Hazırlanıyor',
  shipped: 'Kargoya Verildi',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal',
  future: 'İleri Tarihli',
  test: 'Test',
  '1': 'Yeni',
  '2': 'Onaylandı',
  '3': 'Hazırlanıyor',
  '4': 'Paketlendi',
  '5': 'Kargoda',
  '6': 'Dağıtımda',
  '7': 'Sorunlu',
  '8': 'Test',
  '9': 'İptal',
  '10': 'Mükerrer',
  '11': 'Sahte',
  '12': 'Teslim Edildi',
  '13': 'Ulaşılamayan',
  '14': 'Instagram DM',
  '15': 'Facebook DM',
  '16': 'İleri Tarihli',
}

const getStatusLabel = (status) => {
  if (!status) return 'Yeni Sipariş'
  return statusLabels[status] || status
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.dashboard-content {
  padding: 8px 0;
  font-family: 'Inter', sans-serif;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Base Styles */
h3 { margin: 0; font-size: 16px; font-weight: 700; color: #1e293b; letter-spacing: -0.3px; }
.dashboard-section {
  background: #ffffff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02);
  border: 1px solid #f1f5f9;
}
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.view-all-link { background: none; border: none; font-size: 13px; font-weight: 600; color: #3b82f6; cursor: pointer; }
.view-all-link:hover { text-decoration: underline; }

/* 1. TOP METRICS GRID (MATCHING IMAGE) */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.metric-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border: 1px solid #f1f5f9;
}
.card-header {
  padding: 20px 20px 10px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}
.trend-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 6px;
}
.trend-badge.down { background: #fee2e2; color: #b91c1c; }
.trend-badge.up { background: #dcfce3; color: #15803d; }

.card-body {
  padding: 0 20px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.stat-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.stat-left, .stat-right {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-value { font-size: 28px; font-weight: 800; color: #0f172a; line-height: 1.1; letter-spacing: -0.5px; }
.text-green { color: #10b981 !important; }
.stat-label { font-size: 12px; font-weight: 500; color: #94a3b8; }
.stat-divider { width: 1px; height: 40px; background: #e2e8f0; margin: 0 10px; }

.stat-breakdown {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 16px;
}
.breakdown-item { font-size: 11px; font-weight: 600; color: #94a3b8; }
.breakdown-item .val { font-size: 13px; font-weight: 800; }
.text-yellow .val { color: #f59e0b; }
.text-blue .val { color: #3b82f6; }
.text-red .val { color: #ef4444; }

.stat-footer { font-size: 12px; font-weight: 600; color: #94a3b8; }
.stat-footer .calc-val { color: #0f172a; font-weight: 700; font-size: 13px; }

.card-bottom-line { height: 4px; width: 100%; position: absolute; bottom: 0; left: 0; }
.theme-blue .card-bottom-line { background: #3b82f6; }
.theme-purple .card-bottom-line { background: #8b5cf6; }
.theme-green .card-bottom-line { background: #10b981; }
.theme-red .card-bottom-line { background: #f43f5e; }

/* LIVE VISITORS STRIP */
.live-visitors-strip {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 16px;
  gap: 16px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
  overflow-x: auto;
  white-space: nowrap;
}
.live-visitors-strip::-webkit-scrollbar { display: none; }
.strip-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 13px;
  color: #10b981;
  text-transform: uppercase;
  border-right: 1px solid #e2e8f0;
  padding-right: 16px;
}
.strip-items {
  display: flex;
  align-items: center;
  gap: 12px;
}
.strip-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid #f1f5f9;
  font-size: 13px;
}
.strip-item .s-name { font-weight: 600; color: #1e293b; }
.strip-item .s-count { font-weight: 700; color: #10b981; }

.pulse-dot {
  width: 8px; height: 8px; background: #10b981; border-radius: 50%;
  animation: pulse-ring 2s infinite;
}
@keyframes pulse-ring {
  0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
  100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}

/* 2. MIDDLE GRID (CHART + REPS) */
.middle-grid {
  display: grid;
  grid-template-columns: 2.5fr 1.5fr;
  gap: 20px;
}
.chart-container {
  height: 300px;
  width: 100%;
}
.reps-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 4px;
}
.reps-list::-webkit-scrollbar { width: 6px; }
.reps-list::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

.rep-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8fafc;
  border-radius: 10px;
  border: 1px solid #f1f5f9;
  transition: all 0.2s;
}
.rep-row:hover { background: #f1f5f9; }
.rep-info { display: flex; align-items: center; gap: 12px; }
.rep-avatar {
  width: 36px; height: 36px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white; font-weight: 700; font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
}
.rep-name { font-weight: 600; color: #1e293b; font-size: 14px; }
.rep-stats { display: flex; gap: 12px; }
.r-stat {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 8px; border-radius: 6px;
  font-weight: 700; font-size: 13px;
}
.r-stat .icon { font-style: normal; font-size: 14px; }
.r-approved { background: #dcfce3; color: #15803d; }
.r-cancelled { background: #fee2e2; color: #b91c1c; }

/* 3. BOTTOM GRID (TABLES) */
.bottom-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 20px;
}
.table-responsive { width: 100%; overflow-x: auto; }
.dashboard-table { width: 100%; border-collapse: collapse; }
.dashboard-table th {
  text-align: left; padding: 12px 16px; font-size: 12px; font-weight: 700; color: #64748b;
  text-transform: uppercase; border-bottom: 2px solid #f1f5f9; background: #f8fafc;
}
.dashboard-table th:first-child { border-top-left-radius: 8px; }
.dashboard-table th:last-child { border-top-right-radius: 8px; }
.dashboard-table td { padding: 14px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; }
.dashboard-table tr:hover td { background: #f8fafc; }
.empty-row { text-align: center; padding: 32px !important; color: #94a3b8; font-style: italic; }

.badge { padding: 4px 10px; border-radius: 12px; font-weight: 700; font-size: 13px; display: inline-block; }
.badge.blue { background: #eff6ff; color: #2563eb; }
.badge.red { background: #fef2f2; color: #dc2626; }

.rate-pill { padding: 6px 12px; border-radius: 20px; font-weight: 700; font-size: 12px; }
.rate-high { background: #10b981; color: white; }
.rate-medium { background: #f59e0b; color: white; }
.rate-low { background: #ef4444; color: white; }

.customer-cell .name { display: block; font-weight: 600; color: #0f172a; margin-bottom: 2px;}
.customer-cell .phone { font-size: 12px; color: #64748b; font-family: monospace; }

.date-display .time { display: block; font-weight: 600; font-size: 13px; color: #0f172a; }
.date-display .date { font-size: 11px; color: #64748b; }

.status-pill {
  padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 600;
  border: 1px solid transparent;
}
.status-pending, .status-1 { background: #fffbeb; color: #92400e; border-color: #fde68a; }
.status-approved, .status-2 { background: #dcfce3; color: #166534; border-color: #bbf7d0; }
.status-preparing, .status-3 { background: #eff6ff; color: #1e40af; border-color: #bfdbfe; }
.status-shipped, .status-4, .status-5, .status-6, .status-12 { background: #faf5ff; color: #6b21a8; border-color: #e9d5ff; }
.status-cancelled, .status-9, .status-10, .status-11, .status-7 { background: #fef2f2; color: #991b1b; border-color: #fecaca; }

@media (max-width: 1200px) {
  .middle-grid { grid-template-columns: 1fr; }
  .bottom-grid { grid-template-columns: 1fr; }
}
@media (max-width: 1024px) {
  .metrics-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 650px) {
  .metrics-grid { grid-template-columns: 1fr; }
  .stat-breakdown { flex-wrap: wrap; gap: 8px; }
}
</style>

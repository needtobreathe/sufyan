<template>
  <AdminLayout pageTitle="Raporlar & Dönüşüm Analizi">
    <div class="page-container">

      <!-- Filter Section -->
      <div class="filter-section">
        <div class="date-inputs">
          <div class="input-group">
            <label>Başlangıç</label>
            <input type="date" v-model="dates.start" @change="loadData" />
          </div>
          <div class="input-group">
            <label>Bitiş</label>
            <input type="date" v-model="dates.end" @change="loadData" />
          </div>
        </div>
        <div class="range-presets">
          <button @click="setToday">Bugün</button>
          <button @click="setYesterday">Dün</button>
          <button @click="setPresetRange(7)">Son 7 Gün</button>
          <button @click="setPresetRange(30)">Son 30 Gün</button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="card visitor-card">
          <div class="icon-box">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-title">Toplam Ziyaretçi</span>
            <span class="card-value">{{ summary.totalVisitors }} Kişi</span>
          </div>
        </div>

        <div class="card siparis-card">
          <div class="icon-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-title">Toplam Sipariş</span>
            <span class="card-value">{{ summary.totalOrders }} Adet</span>
          </div>
        </div>

        <div class="card conversion-card">
          <div class="icon-box">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-title">Dönüşüm Oranı (Ort.)</span>
            <span class="card-value" :class="conversionClass(summary.avgConversion)">%{{ summary.avgConversion }}</span>
          </div>
        </div>

        <div class="card ciro-card">
          <div class="icon-box">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-title">Toplam Ciro</span>
            <span class="card-value">{{ formatCurrency(summary.totalRevenue) }}</span>
          </div>
        </div>

        <div class="card sepet-card">
          <div class="icon-box">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-title">Ort. Sepet Tutarı</span>
            <span class="card-value">{{ formatCurrency(summary.avgBasket) }}</span>
          </div>
        </div>

        <div class="card iptal-card">
          <div class="icon-box">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-title">Toplam İptal</span>
            <span class="card-value">{{ summary.totalCancelled }} Adet</span>
          </div>
        </div>
      </div>

      <!-- Product Performance Table -->
      <div class="table-container product-table-container">
        <div class="table-header">
          <div class="table-titles">
            <h3>Ürün Bazlı Satış Performansı</h3>
            <p>Seçili tarihler arasındaki en çok satan ürünler</p>
          </div>
        </div>
        <table class="performance-table product-table">
          <thead>
            <tr>
              <th>ÜRÜN ADI</th>
              <th class="text-center">SİPARİŞ</th>
              <th class="text-center">ADET</th>
              <th class="text-right">TOPLAM CİRO</th>
              <th class="text-right">CİRO PAYI</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in productStats" :key="product.name">
              <td class="font-bold text-dark">{{ product.name }}</td>
              <td class="text-center font-medium">{{ product.orderCount }}</td>
              <td class="text-center font-medium">{{ product.totalQty }}</td>
              <td class="text-right font-bold text-green">{{ formatCurrency(product.totalRevenue) }}</td>
              <td class="text-right">
                <div class="share-cell">
                   <div class="share-bar-container">
                     <div class="share-bar" :style="{ width: product.share + '%' }"></div>
                   </div>
                   <span class="share-text">%{{ product.share }}</span>
                </div>
              </td>
            </tr>
            <tr v-if="productStats.length === 0 && !loading">
              <td colspan="5" class="empty-state">Bu tarih aralığında ürün satışı bulunamadı.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Chart Section -->
      <div class="chart-container" v-if="!loading && dailyStats.length > 0">
        <div class="table-header">
          <div class="table-titles">
            <h3>Performans Karşılaştırma Grafiği</h3>
            <p>Sipariş ve ziyaretçi eğilimleri</p>
          </div>
        </div>
        <div class="chart-wrapper">
          <Bar :data="chartData" :options="chartOptions" v-if="isChartReady" />
        </div>
      </div>

      <!-- Data Table -->
      <div class="table-container">
        <div class="table-header">
          <div class="table-titles">
            <h3>Günlük Performans Dökümü</h3>
            <p>Tarih bazında ziyaretçi ve ciro raporu</p>
          </div>
          <button class="refresh-btn" @click="loadData" :disabled="loading">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ 'spin': loading }">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
            Yenile
          </button>
        </div>

        <table class="performance-table">
          <thead>
            <tr>
              <th>TARİH</th>
              <th class="text-center">ZİYARETÇİ</th>
              <th class="text-center">TOPLAM OLUŞTURULAN</th>
              <th class="text-center">DÖNÜŞÜM ORANI</th>
              <th class="text-center">İPTAL</th>
              <th class="text-center">CİROYA DAHİL SİP.</th>
              <th>GÜNLÜK CİRO</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="stat in dailyStats" :key="stat._id">
              <td class="font-bold text-dark">{{ formatDateStr(stat._id) }}</td>
              <td class="text-center text-dark font-medium">{{ stat.visitors || 0 }}</td>
              <td class="text-center font-medium">{{ stat.totalCreated }}</td>
              <td class="text-center font-bold" :class="conversionClass(stat.conversion)">
                %{{ stat.conversion }}
              </td>
              <td class="text-center text-red font-medium">{{ stat.cancelled || 0 }}</td>
              <td class="text-center text-green font-medium">{{ stat.revenueOrders || 0 }}</td>
              <td class="text-green font-bold">{{ formatCurrency(stat.dailyRevenue) }}</td>
            </tr>
            <tr v-if="dailyStats.length === 0 && !loading">
              <td colspan="7" class="empty-state">Son 30 güne ait veri bulunamadı.</td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import AdminLayout from '../components/AdminLayout.vue'
import { apiFetch } from '@/utils/fetch'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

const dailyStats = ref([])
const productStats = ref([])
const isChartReady = ref(false)

// Default range: Last 30 days
const getDefaultDates = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 29)
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  }
}

const dates = ref(getDefaultDates())
const summary = ref({
  totalRevenue: 0,
  totalOrders: 0,
  totalCancelled: 0,
  totalVisitors: 0,
  avgConversion: 0,
  avgBasket: 0
})
const loading = ref(false)

onMounted(() => {
  loadData()
})

const loadData = async () => {
  loading.value = true
  isChartReady.value = false
  try {
    const params = new URLSearchParams({
      startDate: dates.value.start,
      endDate: dates.value.end
    })
    const res = await apiFetch(`/api/reporting/performance?${params.toString()}`)
    const data = await res.json()
    if (data.success) {
      dailyStats.value = data.dailyStats || []
      productStats.value = data.productStats || []
      summary.value = data.summary || {
        totalRevenue: 0,
        totalOrders: 0,
        totalCancelled: 0,
        totalVisitors: 0,
        avgConversion: 0,
        avgBasket: 0
      }
      
      // Delay chart rendering slightly to ensure DOM is ready
      await nextTick()
      setTimeout(() => isChartReady.value = true, 50)
    }
  } catch (error) {
    console.error('Veriler yüklenirken hata:', error)
  } finally {
    loading.value = false
  }
}

// Chart computation
const chartData = computed(() => {
  const reversed = [...dailyStats.value].reverse() // Show oldest to newest
  return {
    labels: reversed.map(s => formatDateStr(s._id).substring(0, 5)), // like 04.04
    datasets: [
      {
        type: 'bar',
        label: 'Siparişler',
        backgroundColor: '#3b82f6',
        borderRadius: 4,
        data: reversed.map(s => s.totalCreated || 0),
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Ziyaretçiler',
        borderColor: '#8b5cf6',
        backgroundColor: '#8b5cf6',
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        data: reversed.map(s => s.visitors || 0),
        yAxisID: 'y1'
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top',
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.9)',
      titleFont: { size: 13, family: 'Inter' },
      bodyFont: { size: 12, family: 'Inter' },
      padding: 10,
      cornerRadius: 6,
    }
  },
  scales: {
    x: {
      grid: { display: false }
    },
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      title: { display: true, text: 'Sipariş Sayısı' },
      grid: {
        color: '#f3f4f6'
      }
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      grid: { drawOnChartArea: false },
      title: { display: true, text: 'Ziyaretçi Sayısı' }
    }
  }
}

const formatCurrency = (val) => {
  if (!val) return '₺0,00'
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val)
}

const formatDateStr = (dateStr) => {
  if (!dateStr) return '-'
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`
  }
  return dateStr
}

const conversionClass = (val) => {
  const num = parseFloat(val)
  if (isNaN(num) || num === 0) return 'text-dark'
  if (num < 1.5) return 'text-red'
  if (num >= 3.0) return 'text-green'
  return 'text-orange'
}
const setPresetRange = (days) => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - (days - 1))
  
  dates.value = {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  }
  loadData()
}

const setToday = () => {
  const now = new Date().toISOString().split('T')[0]
  dates.value = { start: now, end: now }
  loadData()
}

const setYesterday = () => {
  const yest = new Date()
  yest.setDate(yest.getDate() - 1)
  const yestStr = yest.toISOString().split('T')[0]
  dates.value = { start: yestStr, end: yestStr }
  loadData()
}
</script>

<style scoped>
.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 0 40px 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
  transition: transform 0.2s, box-shadow 0.2s;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
}

.icon-box {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-title {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
}

.card-value {
  font-size: 20px;
  font-weight: 700;
  color: #111827;
}

/* Specific Card Colors */
.ciro-card .icon-box { background-color: #ecfdf5; color: #10b981; }
.siparis-card .icon-box { background-color: #eff6ff; color: #3b82f6; }
.sepet-card .icon-box { background-color: #fef2f2; color: #ef4444; }
.iptal-card .icon-box { background-color: #fff7ed; color: #f97316; }
.visitor-card .icon-box { background-color: #f5f3ff; color: #8b5cf6; }
.conversion-card .icon-box { background-color: #fdf4ff; color: #d946ef; }

/* Chart Area */
.chart-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
  margin-bottom: 24px;
}

.chart-wrapper {
  padding: 0 24px 24px 24px;
  height: 350px;
}

/* Table Container */
.table-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

.table-header {
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f3f4f6;
}

.table-titles h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #111827;
}

.table-titles p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  border: 1px solid #e5e7eb;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

/* Performance Table */
.performance-table {
  width: 100%;
  border-collapse: collapse;
}

.performance-table th {
  background-color: #f9fafb;
  padding: 16px 24px;
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

.performance-table td {
  padding: 16px 24px;
  font-size: 13.5px;
  border-bottom: 1px solid #f9fafb;
  vertical-align: middle;
}

.performance-table tr:hover td {
  background-color: #fdfdfd;
}

.performance-table tr:last-child td {
  border-bottom: none;
}

/* Utilities */
.text-center { text-align: center !important; }
.text-right { text-align: right !important; }
.font-medium { font-weight: 500; }
.font-bold { font-weight: 600; }
.text-dark { color: #111827; }
.text-red { color: #ef4444; }
.text-green { color: #10b981; }
.text-orange { color: #f59e0b; }

.empty-state {
  text-align: center;
  padding: 40px !important;
  color: #6b7280;
  font-size: 14px;
}

@media (max-width: 1024px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }
  .performance-table {
    display: block;
    overflow-x: auto;
  }
}
/* Filter Section */
.filter-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
  margin-bottom: 24px;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
  flex-wrap: wrap;
}

.date-inputs {
  display: flex;
  gap: 16px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-group label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
}

.input-group input {
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  color: #374151;
  outline: none;
  transition: border-color 0.2s;
}

.input-group input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.range-presets {
  display: flex;
  gap: 8px;
}

.range-presets button {
  padding: 8px 14px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.range-presets button:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #111827;
}

/* Product Table Specifics */
.product-table-container {
  margin-bottom: 24px;
}

.share-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.share-bar-container {
  width: 100px;
  height: 8px;
  background: #f3f4f6;
  border-radius: 4px;
  overflow: hidden;
}

.share-bar {
  height: 100%;
  background: #10b981;
  border-radius: 4px;
}

.share-text {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  width: 45px;
  text-align: right;
}

@media (max-width: 768px) {
  .filter-section {
    flex-direction: column;
    align-items: flex-start;
  }
  .range-presets {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 4px;
  }
}
</style>

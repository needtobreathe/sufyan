<template>
  <AdminLayout pageTitle="Günlük Patron Raporu">
    <div class="daily-report">

      <!-- TOP BAR: Date Picker + Actions -->
      <div class="report-topbar">
        <div class="date-nav">
          <button class="nav-arrow" @click="changeDate(-1)" title="Önceki Gün">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <div class="date-display-box">
            <input type="date" v-model="selectedDate" class="date-input" id="report-date-input" />
            <span class="date-label">{{ formattedDate }}</span>
          </div>
          <button class="nav-arrow" @click="changeDate(1)" title="Sonraki Gün" :disabled="isToday">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
        <div class="topbar-actions">
          <button class="btn-refresh" @click="loadReport" :disabled="loading">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" :class="{ spin: loading }"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            Yenile
          </button>
          <button class="btn-print" @click="printReport">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            PDF / Yazdır
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-overlay">
        <div class="loader"></div>
        <span>Rapor yükleniyor...</span>
      </div>

      <div v-else class="report-body" id="printable-report">

        <!-- PDF HEADER (only visible on print) -->
        <div class="print-header">
          <div class="ph-left">
            <h1 class="ph-company">Sipariş Yönet</h1>
            <span class="ph-subtitle">Günlük Faaliyet Raporu</span>
          </div>
          <div class="ph-right">
            <div class="ph-date-box">
              <span class="ph-date-label">RAPOR TARİHİ</span>
              <span class="ph-date-value">{{ formattedDateShort }}</span>
            </div>
            <span class="ph-day">{{ formattedDayName }}</span>
          </div>
        </div>


        <!-- SUMMARY CARDS -->
        <div class="summary-grid">
          <div class="summary-card card-orders">
            <div class="sc-icon">📦</div>
            <div class="sc-content">
              <span class="sc-value">{{ report.summary.totalOrders }}</span>
              <span class="sc-label">Toplam Sipariş</span>
            </div>
          </div>
          <div class="summary-card card-approved">
            <div class="sc-icon">✅</div>
            <div class="sc-content">
              <span class="sc-value text-emerald">{{ report.summary.approved + report.summary.preparing + report.summary.shipped + report.summary.delivered }}</span>
              <span class="sc-label">Onaylanan</span>
            </div>
          </div>
          <div class="summary-card card-cancelled">
            <div class="sc-icon">❌</div>
            <div class="sc-content">
              <span class="sc-value text-rose">{{ report.summary.cancelled }}</span>
              <span class="sc-label">İptal Edilen</span>
            </div>
          </div>
          <div class="summary-card card-revenue">
            <div class="sc-icon">💰</div>
            <div class="sc-content">
              <span class="sc-value text-emerald">{{ formatCurrency(report.summary.totalRevenue) }}</span>
              <span class="sc-label">Günlük Ciro</span>
            </div>
          </div>
          <div class="summary-card card-visitors">
            <div class="sc-icon">👥</div>
            <div class="sc-content">
              <span class="sc-value text-indigo">{{ report.summary.totalVisitors }}</span>
              <span class="sc-label">Ziyaretçi</span>
            </div>
          </div>
          <div class="summary-card card-conversion">
            <div class="sc-icon">📈</div>
            <div class="sc-content">
              <span class="sc-value" :class="conversionColor">%{{ report.summary.conversionRate }}</span>
              <span class="sc-label">Dönüşüm</span>
            </div>
          </div>
        </div>

        <!-- STATUS DETAIL STRIP -->
        <div class="status-strip">
          <div class="strip-chip pending"><span class="chip-val">{{ report.summary.pending }}</span> Bekleyen</div>
          <div class="strip-chip approved"><span class="chip-val">{{ report.summary.approved }}</span> Onaylanan</div>
          <div class="strip-chip preparing"><span class="chip-val">{{ report.summary.preparing }}</span> Hazırlanan</div>
          <div class="strip-chip shipped"><span class="chip-val">{{ report.summary.shipped }}</span> Kargoda</div>
          <div class="strip-chip delivered"><span class="chip-val">{{ report.summary.delivered }}</span> Teslim</div>
          <div class="strip-chip cancelled"><span class="chip-val">{{ report.summary.cancelled }}</span> İptal</div>
          <div class="strip-chip basket">
            <span class="chip-val">{{ formatCurrency(report.summary.avgBasket) }}</span> Ort. Sepet
          </div>
        </div>

        <!-- MIDDLE GRID: Product Breakdown + Expense Management -->
        <div class="middle-grid">

          <!-- PRODUCT P/L TABLE -->
          <div class="section product-section">
            <div class="section-header">
              <h3>📊 Ürün Bazlı Kâr / Zarar</h3>
            </div>
            <div class="table-wrap">
              <table class="data-table" id="product-table">
                <thead>
                  <tr>
                    <th>ÜRÜN ADI</th>
                    <th class="text-center">ADET</th>
                    <th class="text-right">GELİŞ ₺</th>
                    <th class="text-right">CİRO</th>
                    <th class="text-right">T. MALİYET</th>
                    <th class="text-right">KÂR</th>
                    <th class="text-right">REKLAM ₺</th>
                    <th class="text-right">NET KÂR</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in report.productBreakdown" :key="p.name">
                    <td class="fw-600">{{ p.name }}</td>
                    <td class="text-center">{{ p.qty }}</td>
                    <td class="text-right">
                      <div class="ad-budget-cell no-print">
                        <span class="ad-currency">₺</span>
                        <input
                          type="number"
                          class="cost-input"
                          :value="p.unitCost || 0"
                          @change="(e) => saveProductCost(p.name, e.target.value)"
                          min="0"
                          step="1"
                        />
                      </div>
                      <span class="print-only text-muted fw-600">{{ formatCurrency(p.unitCost || 0) }}</span>
                    </td>
                    <td class="text-right fw-600">{{ formatCurrency(p.totalRevenue) }}</td>
                    <td class="text-right text-muted">{{ formatCurrency(p.totalCost) }}</td>
                    <td class="text-right fw-600" :class="p.profitLoss >= 0 ? 'text-emerald' : 'text-rose'">
                      {{ formatCurrency(p.profitLoss) }}
                    </td>
                    <td class="text-right">
                      <div class="ad-budget-cell no-print">
                        <span class="ad-currency">₺</span>
                        <input
                          type="number"
                          class="ad-budget-input"
                          :value="p.adBudget || 0"
                          @change="(e) => saveAdBudget(p.name, e.target.value)"
                          min="0"
                          step="1"
                        />
                      </div>
                      <span class="print-only text-rose fw-600">{{ formatCurrency(p.adBudget || 0) }}</span>
                    </td>
                    <td class="text-right fw-700" :class="p.netProfit >= 0 ? 'text-emerald' : 'text-rose'">
                      {{ p.netProfit >= 0 ? '+' : '' }}{{ formatCurrency(p.netProfit) }}
                    </td>
                  </tr>
                  <tr v-if="report.productBreakdown.length === 0">
                    <td colspan="8" class="empty-td">Bu tarihte ürün verisi yok.</td>
                  </tr>
                </tbody>
                <tfoot v-if="report.productBreakdown.length > 0">
                  <tr class="totals-row">
                    <td class="fw-700">TOPLAM</td>
                    <td class="text-center fw-600">{{ totalProductQty }}</td>
                    <td></td>
                    <td class="text-right fw-700">{{ formatCurrency(report.profitLoss.totalRevenue) }}</td>
                    <td class="text-right fw-700 text-muted">{{ formatCurrency(report.profitLoss.totalProductCost) }}</td>
                    <td class="text-right fw-700" :class="report.profitLoss.totalProductProfit >= 0 ? 'text-emerald' : 'text-rose'">
                      {{ formatCurrency(report.profitLoss.totalProductProfit) }}
                    </td>
                    <td class="text-right fw-700 text-rose">{{ formatCurrency(report.profitLoss.totalAdBudget) }}</td>
                    <td class="text-right fw-700" :class="report.profitLoss.totalNetProfit >= 0 ? 'text-emerald' : 'text-rose'">
                      {{ report.profitLoss.totalNetProfit >= 0 ? '+' : '' }}{{ formatCurrency(report.profitLoss.totalNetProfit) }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- EXPENSE MANAGEMENT -->
          <div class="section expense-section">
            <div class="section-header">
              <h3>💸 Gider Yönetimi</h3>
            </div>

            <!-- Add Expense Form -->
            <div class="expense-form no-print">
              <select v-model="newExpense.category" class="exp-select" id="expense-category">
                <option value="">Kategori Seçin</option>
                <option v-for="cat in expenseCategories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
              <input v-model="newExpense.description" type="text" class="exp-input" placeholder="Açıklama (opsiyonel)" id="expense-description" />
              <input v-model.number="newExpense.amount" type="number" class="exp-input exp-amount" placeholder="Tutar ₺" min="0" step="0.01" id="expense-amount" />
              <button class="btn-add-expense" @click="addExpense" :disabled="!newExpense.category || !newExpense.amount" id="add-expense-btn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Ekle
              </button>
            </div>

            <!-- Expenses List -->
            <div class="expenses-list">
              <div v-for="exp in report.expenses" :key="exp._id" class="expense-row">
                <div class="exp-info">
                  <span class="exp-cat-badge" :style="{ background: categoryColor(exp.category) }">{{ exp.category }}</span>
                  <span class="exp-desc">{{ exp.description || '-' }}</span>
                </div>
                <div class="exp-right">
                  <span class="exp-amount-val">{{ formatCurrency(exp.amount) }}</span>
                  <button class="exp-delete no-print" @click="deleteExpense(exp._id)" title="Sil">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              </div>
              <div v-if="report.expenses.length === 0" class="expense-empty">
                Henüz gider eklenmemiş.
              </div>
              <!-- Expense Totals -->
              <div class="expense-total" v-if="report.expenses.length > 0">
                <span>Toplam Gider</span>
                <span class="fw-700 text-rose">{{ formatCurrency(report.expenseSummary.totalExpenses) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- NET PROFIT/LOSS HERO CARD -->
        <div class="profit-hero" :class="report.profitLoss.netProfitLoss >= 0 ? 'profit-positive' : 'profit-negative'">
          <div class="profit-grid">
            <div class="profit-item">
              <span class="pi-label">Toplam Ciro</span>
              <span class="pi-value">{{ formatCurrency(report.profitLoss.totalRevenue) }}</span>
            </div>
            <div class="profit-sep">−</div>
            <div class="profit-item">
              <span class="pi-label">Ürün Maliyeti</span>
              <span class="pi-value">{{ formatCurrency(report.profitLoss.totalProductCost) }}</span>
            </div>
            <div class="profit-sep">−</div>
            <div class="profit-item">
              <span class="pi-label">Reklam</span>
              <span class="pi-value">{{ formatCurrency(report.profitLoss.totalAdBudget) }}</span>
            </div>
            <div class="profit-sep">−</div>
            <div class="profit-item">
              <span class="pi-label">Giderler</span>
              <span class="pi-value">{{ formatCurrency(report.profitLoss.totalExpenses) }}</span>
            </div>
            <div class="profit-sep">=</div>
            <div class="profit-item profit-result">
              <span class="pi-label">{{ report.profitLoss.netProfitLoss >= 0 ? 'NET KÂR' : 'NET ZARAR' }}</span>
              <span class="pi-value pi-hero">
                {{ report.profitLoss.netProfitLoss >= 0 ? '+' : '' }}{{ formatCurrency(report.profitLoss.netProfitLoss) }}
              </span>
            </div>
          </div>
        </div>

        <!-- BOTTOM GRID: Rep Performance + Site Breakdown -->
        <div class="bottom-grid">

          <!-- REP PERFORMANCE -->
          <div class="section">
            <div class="section-header">
              <h3>👤 Temsilci Performansı</h3>
            </div>
            <div class="reps-list">
              <div v-for="rep in report.repPerformance" :key="rep.name" class="rep-card">
                <div class="rep-left">
                  <div class="rep-avatar">{{ rep.name.charAt(0).toUpperCase() }}</div>
                  <div class="rep-details">
                    <span class="rep-name">{{ rep.name }}</span>
                    <span class="rep-sub">{{ rep.total }} sipariş · {{ formatCurrency(rep.revenue) }}</span>
                  </div>
                </div>
                <div class="rep-badges">
                  <span class="rep-badge rep-ok">✓ {{ rep.approved }}</span>
                  <span class="rep-badge rep-fail">✕ {{ rep.cancelled }}</span>
                </div>
              </div>
              <div v-if="report.repPerformance.length === 0" class="empty-state">
                Temsilci verisi bulunamadı.
              </div>
            </div>
          </div>

          <!-- SITE BREAKDOWN -->
          <div class="section">
            <div class="section-header">
              <h3>🌐 Site / Sayfa Bazlı Kırılım</h3>
            </div>
            <div class="table-wrap">
              <table class="data-table" id="site-table">
                <thead>
                  <tr>
                    <th>SAYFA</th>
                    <th class="text-center">SİPARİŞ</th>
                    <th class="text-center">İPTAL</th>
                    <th class="text-right">CİRO</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="site in report.siteBreakdown" :key="site.slug">
                    <td class="fw-600">{{ site.name }}</td>
                    <td class="text-center">{{ site.orderCount }}</td>
                    <td class="text-center text-rose">{{ site.cancelled }}</td>
                    <td class="text-right fw-600 text-emerald">{{ formatCurrency(site.revenue) }}</td>
                  </tr>
                  <tr v-if="report.siteBreakdown.length === 0">
                    <td colspan="4" class="empty-td">Site verisi yok.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- STATUS CHART -->
        <div class="section chart-section" v-if="hasStatusData">
          <div class="section-header">
            <h3>📉 Sipariş Durumu Dağılımı</h3>
          </div>
          <div class="chart-wrapper">
            <Doughnut :data="statusChartData" :options="chartOptions" v-if="chartReady" />
          </div>
        </div>

        <!-- PDF FOOTER (only visible on print) -->
        <div class="print-footer">
          <div class="pf-left">
            <span>Bu rapor <strong>Sipariş Yönet Paneli</strong> tarafından otomatik olarak oluşturulmuştur.</span>
          </div>
          <div class="pf-right">
            <span>Oluşturulma: {{ printTimestamp }}</span>
          </div>
        </div>

      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import AdminLayout from '../components/AdminLayout.vue'
import { apiFetch } from '@/utils/fetch'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend)

const today = new Date().toISOString().split('T')[0]
const selectedDate = ref(today)
const loading = ref(false)
const chartReady = ref(false)

const expenseCategories = ['Reklam', 'Kargo', 'Personel', 'Fatura', 'Ürün Alımı', 'Ofis/Kira', 'Vergi', 'Diğer']

const newExpense = ref({
  category: '',
  description: '',
  amount: null
})

const emptyReport = {
  summary: { totalOrders: 0, pending: 0, approved: 0, preparing: 0, shipped: 0, delivered: 0, cancelled: 0, other: 0, totalRevenue: 0, revenueOrderCount: 0, avgBasket: 0, totalVisitors: 0, conversionRate: 0 },
  productBreakdown: [],
  expenses: [],
  expenseSummary: { totalExpenses: 0, byCategory: {} },
  profitLoss: { totalRevenue: 0, totalProductCost: 0, totalAdBudget: 0, totalProductProfit: 0, totalNetProfit: 0, totalExpenses: 0, netProfitLoss: 0 },
  repPerformance: [],
  siteBreakdown: [],
  statusDistribution: {}
}

const report = ref({ ...emptyReport })

const formattedDate = computed(() => {
  if (!selectedDate.value) return '-'
  const d = new Date(selectedDate.value + 'T12:00:00')
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  return d.toLocaleDateString('tr-TR', options)
})

const formattedDateShort = computed(() => {
  if (!selectedDate.value) return '-'
  const d = new Date(selectedDate.value + 'T12:00:00')
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })
})

const formattedDayName = computed(() => {
  if (!selectedDate.value) return ''
  const d = new Date(selectedDate.value + 'T12:00:00')
  return d.toLocaleDateString('tr-TR', { weekday: 'long' })
})

const printTimestamp = computed(() => {
  const now = new Date()
  return now.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
})

const isToday = computed(() => selectedDate.value === today)

const conversionColor = computed(() => {
  const v = report.value.summary.conversionRate
  if (v >= 3) return 'text-emerald'
  if (v >= 1.5) return 'text-amber'
  return 'text-rose'
})

const totalProductQty = computed(() => report.value.productBreakdown.reduce((sum, p) => sum + p.qty, 0))

const hasStatusData = computed(() => Object.keys(report.value.statusDistribution).length > 0)

const statusChartData = computed(() => {
  const dist = report.value.statusDistribution
  const colorMap = {
    'Bekleyen': '#f59e0b',
    'Onaylandı': '#10b981',
    'Hazırlanıyor': '#3b82f6',
    'Kargoda': '#8b5cf6',
    'Teslim Edildi': '#06b6d4',
    'İptal': '#ef4444',
    'Diğer': '#6b7280'
  }
  return {
    labels: Object.keys(dist),
    datasets: [{
      data: Object.values(dist),
      backgroundColor: Object.keys(dist).map(k => colorMap[k] || '#6b7280'),
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 6
    }]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        padding: 16,
        usePointStyle: true,
        pointStyle: 'circle',
        font: { family: 'Inter', size: 13, weight: '500' }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(15, 23, 42, 0.92)',
      titleFont: { family: 'Inter', size: 14 },
      bodyFont: { family: 'Inter', size: 13 },
      padding: 12,
      cornerRadius: 8,
      callbacks: {
        label: (ctx) => ` ${ctx.label}: ${ctx.parsed} sipariş`
      }
    }
  }
}

const changeDate = (delta) => {
  const d = new Date(selectedDate.value + 'T12:00:00')
  d.setDate(d.getDate() + delta)
  selectedDate.value = d.toISOString().split('T')[0]
}

watch(selectedDate, () => {
  loadReport()
})

onMounted(() => {
  loadReport()
})

const loadReport = async () => {
  loading.value = true
  chartReady.value = false
  try {
    const res = await apiFetch(`/api/reporting/daily-report?date=${selectedDate.value}`)
    const data = await res.json()
    if (data.success) {
      report.value = {
        summary: data.summary || emptyReport.summary,
        productBreakdown: data.productBreakdown || [],
        expenses: data.expenses || [],
        expenseSummary: data.expenseSummary || emptyReport.expenseSummary,
        profitLoss: data.profitLoss || emptyReport.profitLoss,
        repPerformance: data.repPerformance || [],
        siteBreakdown: data.siteBreakdown || [],
        statusDistribution: data.statusDistribution || {}
      }
      await nextTick()
      setTimeout(() => chartReady.value = true, 100)
    }
  } catch (error) {
    console.error('Rapor yüklenirken hata:', error)
  } finally {
    loading.value = false
  }
}

const addExpense = async () => {
  if (!newExpense.value.category || !newExpense.value.amount) return
  try {
    const res = await apiFetch('/api/expenses', {
      method: 'POST',
      body: JSON.stringify({
        date: selectedDate.value,
        category: newExpense.value.category,
        description: newExpense.value.description,
        amount: newExpense.value.amount
      })
    })
    const data = await res.json()
    if (data.success) {
      newExpense.value = { category: '', description: '', amount: null }
      loadReport() // Refresh all data
    }
  } catch (error) {
    console.error('Gider eklenirken hata:', error)
  }
}

const deleteExpense = async (id) => {
  if (!confirm('Bu gider kalemini silmek istediğinize emin misiniz?')) return
  try {
    const res = await apiFetch(`/api/expenses/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      loadReport()
    }
  } catch (error) {
    console.error('Gider silinirken hata:', error)
  }
}

const saveAdBudget = async (productName, value) => {
  const amount = Number(value) || 0
  try {
    await apiFetch('/api/product-ad-budgets', {
      method: 'POST',
      body: JSON.stringify({
        date: selectedDate.value,
        productName,
        amount
      })
    })
    const product = report.value.productBreakdown.find(p => p.name === productName)
    if (product) {
      product.adBudget = amount
      product.netProfit = product.profitLoss - amount
    }
    recalcTotals()
  } catch (error) {
    console.error('Reklam bütçesi kaydedilirken hata:', error)
  }
}

const saveProductCost = async (productName, value) => {
  const cost = Number(value) || 0
  // Update local state immediately (UI first)
  const product = report.value.productBreakdown.find(p => p.name === productName)
  if (product) {
    product.unitCost = cost
    product.totalCost = cost * product.qty
    product.profitLoss = product.totalRevenue - product.totalCost
    product.netProfit = product.profitLoss - (product.adBudget || 0)
  }
  recalcTotals()
  // Then save to backend
  try {
    await apiFetch('/api/products/update-cost', {
      method: 'POST',
      body: JSON.stringify({ productName, cost })
    })
  } catch (error) {
    console.error('Ürün maliyeti kaydedilirken hata:', error)
  }
}

const recalcTotals = () => {
  const bd = report.value.productBreakdown
  const totalProductCost = bd.reduce((s, p) => s + (p.totalCost || 0), 0)
  const totalAdBudget = bd.reduce((s, p) => s + (p.adBudget || 0), 0)
  const totalProductProfit = bd.reduce((s, p) => s + (p.profitLoss || 0), 0)
  const totalNetProfit = bd.reduce((s, p) => s + (p.netProfit || 0), 0)
  const totalExpenses = report.value.profitLoss.totalExpenses
  const totalRevenue = report.value.profitLoss.totalRevenue
  report.value.profitLoss.totalProductCost = totalProductCost
  report.value.profitLoss.totalAdBudget = totalAdBudget
  report.value.profitLoss.totalProductProfit = totalProductProfit
  report.value.profitLoss.totalNetProfit = totalNetProfit
  report.value.profitLoss.netProfitLoss = totalRevenue - totalProductCost - totalAdBudget - totalExpenses
}

const printReport = () => {
  // Hide sidebar and topbar for clean print
  const sidebar = document.querySelector('.sidebar')
  const topbar = document.querySelector('.topbar')
  const main = document.querySelector('.main')
  const layout = document.querySelector('.layout')
  
  if (sidebar) sidebar.style.display = 'none'
  if (topbar) topbar.style.display = 'none'
  if (main) main.style.marginLeft = '0'
  if (layout) layout.classList.add('print-mode')
  
  // Trigger print
  setTimeout(() => {
    window.print()
    
    // Restore after print
    setTimeout(() => {
      if (sidebar) sidebar.style.display = ''
      if (topbar) topbar.style.display = ''
      if (main) main.style.marginLeft = ''
      if (layout) layout.classList.remove('print-mode')
    }, 500)
  }, 200)
}

const formatCurrency = (val) => {
  if (val == null || isNaN(val)) return '₺0'
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(val)
}

const categoryColor = (cat) => {
  const map = {
    'Reklam': '#3b82f6',
    'Kargo': '#8b5cf6',
    'Personel': '#f59e0b',
    'Fatura': '#ef4444',
    'Ürün Alımı': '#10b981',
    'Ofis/Kira': '#6366f1',
    'Vergi': '#ec4899',
    'Diğer': '#6b7280'
  }
  return map[cat] || '#6b7280'
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

.daily-report {
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  padding-bottom: 40px;
}

/* ====== TOP BAR ====== */
.report-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  gap: 16px;
  flex-wrap: wrap;
}

.date-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-arrow {
  width: 38px;
  height: 38px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #475569;
  transition: all 0.15s;
}
.nav-arrow:hover:not(:disabled) { background: #f1f5f9; border-color: #cbd5e1; color: #0f172a; }
.nav-arrow:disabled { opacity: 0.3; cursor: not-allowed; }

.date-display-box {
  position: relative;
  cursor: pointer;
}
.date-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}
.date-label {
  display: block;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: #fff;
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.3px;
  white-space: nowrap;
  pointer-events: none;
}

.topbar-actions {
  display: flex;
  gap: 10px;
}

.btn-refresh, .btn-print {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-refresh:hover, .btn-print:hover { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
.btn-print { background: #0f172a; color: #fff; border-color: #0f172a; }
.btn-print:hover { background: #1e293b; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* ====== LOADING ====== */
.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 80px 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}
.loader {
  width: 40px; height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #0f172a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* ====== SUMMARY CARDS ====== */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: transform 0.2s, box-shadow 0.2s;
}
.summary-card:hover { transform: translateY(-2px); box-shadow: 0 8px 16px rgba(0,0,0,0.06); }

.sc-icon { font-size: 28px; flex-shrink: 0; }
.sc-content { display: flex; flex-direction: column; gap: 2px; }
.sc-value { font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; line-height: 1.1; }
.sc-label { font-size: 12px; font-weight: 500; color: #94a3b8; }

/* ====== STATUS STRIP ====== */
.status-strip {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 24px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 3px rgba(0,0,0,0.03);
}

.strip-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}
.chip-val { font-weight: 800; font-size: 14px; }
.strip-chip.pending { background: #f59e0b; }
.strip-chip.approved { background: #10b981; }
.strip-chip.preparing { background: #3b82f6; }
.strip-chip.shipped { background: #8b5cf6; }
.strip-chip.delivered { background: #06b6d4; }
.strip-chip.cancelled { background: #ef4444; }
.strip-chip.basket { background: #0f172a; }

/* ====== SECTION COMMON ====== */
.section {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #f1f5f9;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  overflow: hidden;
}
.section-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f1f5f9;
}
.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
  letter-spacing: -0.3px;
}

/* ====== MIDDLE GRID ====== */
.middle-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

/* ====== DATA TABLE ====== */
.table-wrap { overflow-x: auto; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th {
  padding: 14px 20px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: left;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}
.data-table td {
  padding: 14px 20px;
  font-size: 13px;
  color: #334155;
  border-bottom: 1px solid #f8fafc;
}
.data-table tr:hover td { background: #fafbfc; }
.totals-row td {
  background: #f8fafc !important;
  border-top: 2px solid #e2e8f0;
  font-size: 14px;
}
.empty-td { text-align: center; padding: 32px !important; color: #94a3b8; font-style: italic; }

/* ====== EXPENSE ====== */
.expense-form {
  display: flex;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  flex-wrap: wrap;
}
.exp-select, .exp-input {
  padding: 9px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  background: #f8fafc;
  color: #0f172a;
  outline: none;
  transition: border-color 0.15s;
}
.exp-select:focus, .exp-input:focus { border-color: #94a3b8; background: #fff; }
.exp-select { min-width: 140px; }
.exp-input { flex: 1; min-width: 100px; }
.exp-amount { max-width: 120px; }

.btn-add-expense {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}
.btn-add-expense:hover:not(:disabled) { background: #059669; }
.btn-add-expense:disabled { opacity: 0.4; cursor: not-allowed; }

.expenses-list { padding: 8px 0; max-height: 320px; overflow-y: auto; }

.expense-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid #f8fafc;
  transition: background 0.12s;
}
.expense-row:hover { background: #fafbfc; }

.exp-info { display: flex; align-items: center; gap: 10px; }
.exp-cat-badge {
  padding: 3px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}
.exp-desc { font-size: 13px; color: #475569; }
.exp-right { display: flex; align-items: center; gap: 12px; }
.exp-amount-val { font-size: 14px; font-weight: 700; color: #ef4444; }
.exp-delete {
  width: 28px; height: 28px;
  border: 1px solid #fee2e2;
  border-radius: 6px;
  background: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  color: #ef4444;
  transition: all 0.15s;
}
.exp-delete:hover { background: #fef2f2; border-color: #fca5a5; }

.expense-empty { padding: 32px 20px; text-align: center; color: #94a3b8; font-size: 13px; font-style: italic; }

.expense-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  background: #fef2f2;
  border-top: 2px solid #fecaca;
  font-size: 14px;
  font-weight: 600;
  color: #991b1b;
}

/* ====== PROFIT HERO ====== */
.profit-hero {
  border-radius: 16px;
  padding: 28px 32px;
  margin-bottom: 24px;
  border: 2px solid;
}
.profit-positive {
  background: linear-gradient(135deg, #ecfdf5, #d1fae5);
  border-color: #a7f3d0;
}
.profit-negative {
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  border-color: #fecaca;
}

.profit-grid {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}

.profit-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.pi-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
.pi-value { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }

.profit-sep {
  font-size: 28px;
  font-weight: 800;
  color: #94a3b8;
  padding: 0 4px;
}

.profit-result .pi-label { color: #0f172a; font-size: 14px; }
.profit-positive .profit-result .pi-hero { color: #059669; font-size: 32px; }
.profit-negative .profit-result .pi-hero { color: #dc2626; font-size: 32px; }

/* ====== BOTTOM GRID ====== */
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

/* ====== REPS ====== */
.reps-list { padding: 12px 16px; }

.rep-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  margin-bottom: 8px;
  transition: background 0.12s;
}
.rep-card:hover { background: #f1f5f9; }

.rep-left { display: flex; align-items: center; gap: 12px; }
.rep-avatar {
  width: 38px; height: 38px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: #fff;
  font-weight: 800;
  font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
}
.rep-details { display: flex; flex-direction: column; }
.rep-name { font-size: 14px; font-weight: 700; color: #0f172a; }
.rep-sub { font-size: 12px; color: #94a3b8; font-weight: 500; }

.rep-badges { display: flex; gap: 8px; }
.rep-badge {
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
}
.rep-ok { background: #dcfce7; color: #15803d; }
.rep-fail { background: #fee2e2; color: #b91c1c; }

/* ====== CHART ====== */
.chart-section { margin-bottom: 24px; }
.chart-wrapper {
  padding: 24px;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ====== EMPTY ====== */
.empty-state { padding: 32px 20px; text-align: center; color: #94a3b8; font-size: 13px; font-style: italic; }

/* ====== AD BUDGET INLINE INPUT ====== */
.ad-budget-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
}
.ad-currency {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
}
.ad-budget-input {
  width: 80px;
  padding: 5px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  color: #ef4444;
  text-align: right;
  background: #fef2f2;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  -moz-appearance: textfield;
}
.ad-budget-input::-webkit-inner-spin-button,
.ad-budget-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.ad-budget-input:focus {
  border-color: #f87171;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
  background: #fff;
}

.cost-input {
  width: 80px;
  padding: 5px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  color: #3b82f6;
  text-align: right;
  background: #eff6ff;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  -moz-appearance: textfield;
}
.cost-input::-webkit-inner-spin-button,
.cost-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.cost-input:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  background: #fff;
}

/* ====== PRINT-ONLY ====== */
.print-only { display: none; }
@media print { .print-only { display: inline !important; } }

/* ====== UTILITIES ====== */
.text-center { text-align: center !important; }
.text-right { text-align: right !important; }
.fw-600 { font-weight: 600; }
.fw-700 { font-weight: 700; }
.text-emerald { color: #059669 !important; }
.text-rose { color: #dc2626 !important; }
.text-indigo { color: #4f46e5 !important; }
.text-amber { color: #d97706 !important; }
.text-muted { color: #94a3b8 !important; }

/* ====== RESPONSIVE ====== */
@media (max-width: 1200px) {
  .summary-grid { grid-template-columns: repeat(3, 1fr); }
  .middle-grid { grid-template-columns: 1fr; }
  .bottom-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .summary-grid { grid-template-columns: repeat(2, 1fr); }
  .report-topbar { flex-direction: column; align-items: stretch; }
  .topbar-actions { justify-content: stretch; }
  .topbar-actions button { flex: 1; justify-content: center; }
  .profit-grid { flex-direction: column; gap: 12px; }
  .profit-sep { font-size: 20px; }
  .status-strip { justify-content: center; }
}
@media (max-width: 480px) {
  .summary-grid { grid-template-columns: 1fr; }
  .expense-form { flex-direction: column; }
  .exp-amount { max-width: 100%; }
}

/* ====== PRINT HEADER/FOOTER (hidden on screen) ====== */
.print-header, .print-footer {
  display: none;
}

/* ====== PRINT STYLES ====== */
@media print {
  /* === GLOBAL OVERRIDES === */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
  }

  .no-print { display: none !important; }

  /* === PAGE SETUP === */
  @page {
    size: A4 portrait;
    margin: 12mm 10mm 14mm 10mm;
  }

  /* === HIDE UI CHROME === */
  .report-topbar { display: none !important; }
  .loading-overlay { display: none !important; }
  .chart-section { display: none !important; } /* Canvas charts don't print well */

  /* === CONTAINER === */
  .daily-report {
    padding: 0 !important;
    max-width: 100% !important;
    font-size: 11px;
  }

  .report-body {
    padding: 0;
  }

  /* === PRINT HEADER === */
  .print-header {
    display: flex !important;
    justify-content: space-between;
    align-items: flex-end;
    padding: 0 0 16px 0;
    margin-bottom: 20px;
    border-bottom: 3px solid #0f172a;
  }
  .ph-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .ph-company {
    font-size: 26px;
    font-weight: 900;
    color: #0f172a;
    margin: 0;
    letter-spacing: -1px;
    line-height: 1;
  }
  .ph-subtitle {
    font-size: 13px;
    font-weight: 500;
    color: #64748b;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .ph-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }
  .ph-date-box {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }
  .ph-date-label {
    font-size: 9px;
    font-weight: 700;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }
  .ph-date-value {
    font-size: 22px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.5px;
  }
  .ph-day {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: capitalize;
  }

  /* === PRINT FOOTER === */
  .print-footer {
    display: flex !important;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0 0 0;
    margin-top: 24px;
    border-top: 2px solid #e2e8f0;
    font-size: 9px;
    color: #94a3b8;
  }
  .pf-left strong { color: #64748b; }

  /* === SUMMARY CARDS (print-optimized grid) === */
  .summary-grid {
    grid-template-columns: repeat(6, 1fr) !important;
    gap: 8px !important;
    margin-bottom: 14px !important;
  }
  .summary-card {
    padding: 12px 10px !important;
    border: 1px solid #d1d5db !important;
    box-shadow: none !important;
    border-radius: 8px !important;
    gap: 8px !important;
  }
  .summary-card:hover { transform: none !important; }
  .sc-icon { font-size: 18px !important; }
  .sc-value { font-size: 18px !important; }
  .sc-label { font-size: 10px !important; }

  /* === STATUS STRIP === */
  .status-strip {
    padding: 10px 14px !important;
    margin-bottom: 16px !important;
    gap: 6px !important;
    border: 1px solid #d1d5db !important;
    box-shadow: none !important;
  }
  .strip-chip {
    padding: 4px 10px !important;
    font-size: 10px !important;
    border-radius: 12px !important;
  }
  .chip-val { font-size: 12px !important; }

  /* === SECTIONS === */
  .section {
    box-shadow: none !important;
    border: 1px solid #d1d5db !important;
    border-radius: 8px !important;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .section-header {
    padding: 12px 16px !important;
    border-bottom: 1px solid #d1d5db !important;
  }
  .section-header h3 {
    font-size: 13px !important;
  }

  /* === GRIDS (single column for print) === */
  .middle-grid {
    grid-template-columns: 1fr !important;
    gap: 14px !important;
    margin-bottom: 16px !important;
  }
  .bottom-grid {
    grid-template-columns: 1fr !important;
    gap: 14px !important;
    margin-bottom: 16px !important;
  }

  /* === TABLES === */
  .data-table th {
    padding: 8px 12px !important;
    font-size: 9px !important;
    background: #f1f5f9 !important;
    border-bottom: 1px solid #d1d5db !important;
  }
  .data-table td {
    padding: 8px 12px !important;
    font-size: 11px !important;
    border-bottom: 1px solid #e2e8f0 !important;
  }
  .data-table tr:hover td { background: transparent !important; }
  .totals-row td {
    background: #f1f5f9 !important;
    border-top: 2px solid #94a3b8 !important;
    font-size: 12px !important;
  }

  /* === EXPENSE LIST (print version) === */
  .expenses-list {
    max-height: none !important;
    overflow: visible !important;
    padding: 4px 0 !important;
  }
  .expense-row {
    padding: 8px 16px !important;
    border-bottom: 1px solid #e2e8f0 !important;
  }
  .expense-row:hover { background: transparent !important; }
  .exp-cat-badge {
    font-size: 9px !important;
    padding: 2px 8px !important;
  }
  .exp-desc { font-size: 11px !important; }
  .exp-amount-val { font-size: 12px !important; }
  .expense-total {
    padding: 10px 16px !important;
    font-size: 12px !important;
  }
  .expense-empty {
    padding: 16px !important;
    font-size: 11px !important;
  }

  /* === PROFIT HERO === */
  .profit-hero {
    padding: 18px 20px !important;
    margin-bottom: 16px !important;
    border-radius: 8px !important;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .profit-positive {
    background: #ecfdf5 !important;
    border: 2px solid #86efac !important;
  }
  .profit-negative {
    background: #fef2f2 !important;
    border: 2px solid #fca5a5 !important;
  }
  .profit-grid {
    gap: 16px !important;
    flex-wrap: nowrap !important;
  }
  .pi-label { font-size: 10px !important; }
  .pi-value { font-size: 16px !important; }
  .profit-sep { font-size: 20px !important; }
  .profit-positive .profit-result .pi-hero { font-size: 24px !important; }
  .profit-negative .profit-result .pi-hero { font-size: 24px !important; }
  .profit-result .pi-label { font-size: 12px !important; }

  /* === REPS === */
  .reps-list { padding: 8px 12px !important; }
  .rep-card {
    padding: 10px 12px !important;
    margin-bottom: 6px !important;
    border: 1px solid #e2e8f0 !important;
    background: #f8fafc !important;
    break-inside: avoid;
  }
  .rep-card:hover { background: #f8fafc !important; }
  .rep-avatar {
    width: 28px !important;
    height: 28px !important;
    font-size: 12px !important;
    border-radius: 6px !important;
    background: #3b82f6 !important;
  }
  .rep-name { font-size: 12px !important; }
  .rep-sub { font-size: 10px !important; }
  .rep-badge {
    font-size: 11px !important;
    padding: 2px 8px !important;
  }
}
</style>

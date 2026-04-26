<template>
  <AdminLayout :pageTitle="'Sayfa Özel Raporu'">
    <div class="page-container">
      <div class="page-header">
        <div class="header-left">
          <router-link to="/leaf-pages" class="back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </router-link>
          <div>
            <h1 class="page-title">Rapor: <span class="slug-highlight">/p/{{ slug }}</span></h1>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="card visitors-card">
          <div class="icon-box">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-title">Toplam Ziyaretçi</span>
            <span class="card-value">{{ summary.uniqueVisitors || 0 }}</span>
          </div>
        </div>

        <div class="card today-visitors-card">
          <div class="icon-box">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-title">Bugünkü Ziyaretçi</span>
            <span class="card-value">{{ summary.todayVisitors || 0 }}</span>
          </div>
        </div>

        <div class="card orders-card">
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
            <span class="card-value">{{ summary.totalOrders || 0 }}</span>
          </div>
        </div>

        <div class="card today-orders-card">
          <div class="icon-box">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div class="card-content">
            <span class="card-title">Bugünkü Sipariş</span>
            <span class="card-value">{{ summary.todayOrders || 0 }}</span>
          </div>
        </div>
      </div>

      <!-- Visual Analysis Section -->
      <div class="table-container mb-24">
        <div class="table-header">
          <div class="table-titles">
            <h3>Görsel Analizi</h3>
            <p>Hangi görselin kaç kez görüntülendiğini ve incelendiğini görün.</p>
          </div>
        </div>
        
        <div class="visual-list">
          <div v-for="(stat, index) in visualStats" :key="stat.image" class="visual-list-item">
            <div class="rank-badge">{{ index + 1 }}</div>
            <div class="visual-image-wrapper">
              <img v-if="stat.image && stat.image !== 'undefined'" :src="getImageUrl(stat.image)" alt="Sayfa Görseli" class="visual-img" @error="handleImgError" />
              <div v-else class="visual-img-placeholder">Görsel Yok</div>
            </div>
            <div class="visual-details">
              <h4>Sayfa Görseli {{ stat.image ? '(' + stat.image.split('/').pop() + ')' : '' }}</h4>
              <p class="view-count"><strong>{{ stat.views }}</strong> Görüntülenme</p>
            </div>
            <div class="visual-duration">
              <span class="duration-label">Ortalama Süre:</span>
              <span class="duration-time">{{ (stat.avgDuration / 1000).toFixed(1) }} sn</span>
            </div>
          </div>
          <div v-if="visualStats.length === 0 && !loading" class="empty-state">
            Henüz görsel etkileşim verisi bulunamadı.
          </div>
        </div>
      </div>

      <!-- Event Log Section -->
      <div class="table-container">
        <div class="table-header">
          <div class="table-titles">
            <h3>Olay Geçmişi</h3>
            <p>Son gerçekleşen ziyaretçi eylemleri ve etkinlikleri</p>
          </div>
        </div>

        <table class="performance-table">
          <thead>
            <tr>
              <th>TARİH</th>
              <th>OLAY</th>
              <th>DEVICE ID</th>
              <th>ZİYARET</th>
              <th>IP</th>
              <th>DETAY</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ev in events" :key="ev._id">
              <td class="font-medium text-dark">{{ formatDate(ev.createdAt) }}</td>
              <td>
                <span class="event-tag">{{ eventDescriptions[ev.event_name] || ev.event_name }}</span>
              </td>
              <td><span class="mono-text">{{ ev.device_id ? ev.device_id.slice(-8) : '-' }}</span></td>
              <td class="text-center font-medium">{{ ev.visit_count }}.</td>
              <td>{{ ev.ip_address || '-' }}</td>
              <td class="text-gray">{{ formatData(ev.data, ev.event_name) }}</td>
            </tr>
            <tr v-if="events.length === 0 && !loading">
              <td colspan="6" class="empty-state">Kayıt bulunamadı.</td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination" v-if="pagination.totalPages > 1">
          <button class="page-btn" :disabled="pagination.page <= 1" @click="loadEvents(pagination.page - 1)">Önceki</button>
          <span class="page-info">{{ pagination.page }} / {{ pagination.totalPages }}</span>
          <button class="page-btn" :disabled="pagination.page >= pagination.totalPages" @click="loadEvents(pagination.page + 1)">Sonraki</button>
        </div>
      </div>
      
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiFetch } from '../utils/fetch'
import AdminLayout from '../components/AdminLayout.vue'

const route = useRoute()
const slug = route.params.slug
const baseUrl = window.location.origin
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

const loading = ref(true)

const summary = ref({
  uniqueVisitors: 0,
  todayVisitors: 0,
  totalOrders: 0,
  todayOrders: 0
})

const visualStats = ref([])
const events = ref([])
const pagination = ref({ page: 1, limit: 30, total: 0, totalPages: 0 })

const eventDescriptions = {
  page_view: 'Sayfa görüntüleme',
  scroll_depth: 'Kaydırma',
  click_cta: 'CTA Tıklaması',
  form_input_filled: 'Form alanı dolumu',
  form_validation_error: 'Form hatası',
  image_view_start: 'Görsele odaklanma (Başlangıç)',
  image_view_end: 'Görsele odaklanma (Bitiş)',
  exit_intent_detected: 'Çıkış niyeti',
  site_leave_or_hide: 'Siteden ayrılma',
  site_return: 'Siteye dönüş'
}

onMounted(async () => {
  await Promise.all([loadSummary(), loadVisualStats(), loadEvents(1)])
  loading.value = false
})

const getImageUrl = (imagePath) => {
  if (!imagePath) return ''
  if (imagePath.startsWith('http')) return imagePath
  
  // if localhost, prepend API url. otherwise keep relative for standard routing mapping
  const backendBase = isLocalhost ? 'http://localhost:5005' : ''
  if (!imagePath.startsWith('/')) imagePath = '/' + imagePath
  return backendBase + imagePath
}

const handleImgError = (e) => {
  e.target.style.display = 'none'
  e.target.nextElementSibling && (e.target.nextElementSibling.style.display = 'flex')
}

const loadSummary = async () => {
  try {
    const res = await apiFetch(`/api/reporting/summary?site_id=${slug}`)
    const data = await res.json()
    if (data.success) {
      summary.value = {
        uniqueVisitors: data.summary.uniqueVisitors || 0,
        todayVisitors: data.summary.todayVisitors || 0,
        totalOrders: data.summary.totalOrders || 0,
        todayOrders: data.summary.todayOrders || 0
      }
    }
  } catch (e) {
    console.error('Özet yüklenemedi', e)
  }
}

const loadVisualStats = async () => {
  try {
    const res = await apiFetch(`/api/reporting/visual-analysis/${slug}`)
    const data = await res.json()
    if (data.success) {
      visualStats.value = data.stats || []
    }
  } catch (e) {
    console.error('Görsel veriler yüklenemedi', e)
  }
}

const loadEvents = async (page = 1) => {
  try {
    const res = await apiFetch(`/api/reporting/events?page=${page}&limit=${pagination.value.limit}&site_id=${slug}`)
    const data = await res.json()
    if (data.success) {
      events.value = data.events
      Object.assign(pagination.value, data.pagination)
    }
  } catch (e) {
    console.error('Olaylar yüklenemedi', e)
  }
}

const formatDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const formatData = (data, eventName) => {
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) return '-'

  switch(eventName) {
    case 'scroll_depth': return `%${data.depth_pct || 0}`
    case 'click_cta': return `"${data.target_clicked || ''}"`
    case 'form_input_filled': return `Alan: "${data.field_name || ''}"`
    case 'image_view_end': return `${(data.duration_ms / 1000).toFixed(1)} sn (${data.image ? data.image.split('/').pop() : ''})`
    case 'site_leave_or_hide': return `${Math.round(data.time_spent_ms / 1000)} sn`
    default:
      const entries = Object.entries(data)
      return entries.map(([k, v]) => `${k}: ${typeof v === 'number' ? Math.round(v) : v}`).join(', ')
  }
}
</script>

<style scoped>
.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 0 40px 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
}

.page-header {
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  color: #374151;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f9fafb;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #111827;
}

.slug-highlight {
  color: #6b7280;
  font-weight: 500;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
.visitors-card .icon-box { background-color: #eff6ff; color: #3b82f6; }
.today-visitors-card .icon-box { background-color: #ecfdf5; color: #10b981; }
.orders-card .icon-box { background-color: #f5f3ff; color: #8b5cf6; }
.today-orders-card .icon-box { background-color: #fff7ed; color: #f97316; }

/* Table Container (Shared) */
.table-container {
  background: white;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

.mb-24 {
  margin-bottom: 24px;
}

.table-header {
  padding: 20px 24px;
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

/* Visual List Section */
.visual-list {
  display: flex;
  flex-direction: column;
}

.visual-list-item {
  display: flex;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid #f9fafb;
}

.visual-list-item:hover {
  background-color: #fcfcfc;
}

.visual-list-item:last-child {
  border-bottom: none;
}

.rank-badge {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #f3f4f6;
  color: #4b5563;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  margin-right: 20px;
}

.visual-image-wrapper {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 20px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.visual-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.visual-img-placeholder {
  font-size: 10px;
  color: #9ca3af;
  text-align: center;
  line-height: 1.2;
}

.visual-details {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.visual-details h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.view-count {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.view-count strong {
  color: #111827;
}

.visual-duration {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.duration-label {
  font-size: 12px;
  color: #6b7280;
}

.duration-time {
  font-size: 15px;
  font-weight: 600;
  color: #10b981;
}

/* Performance Table */
.performance-table {
  width: 100%;
  border-collapse: collapse;
}

.performance-table th {
  background-color: #f9fafb;
  padding: 14px 24px;
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

.event-tag {
  background: #f3f4f6;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #4b5563;
}

.mono-text {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12.5px;
  color: #3b82f6;
  background: #eff6ff;
  padding: 2px 6px;
  border-radius: 4px;
}

/* Utilities */
.text-center { text-align: center !important; }
.font-medium { font-weight: 500; }
.text-dark { color: #111827; }
.text-gray { color: #6b7280; }

.empty-state {
  text-align: center;
  padding: 40px !important;
  color: #6b7280;
  font-size: 14px;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-top: 1px solid #f3f4f6;
}

.page-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: #f9fafb;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 13px;
  color: #6b7280;
  font-weight: 500;
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
  .visual-list-item {
    flex-wrap: wrap;
    gap: 12px;
  }
  .visual-duration {
    align-items: flex-start;
    width: 100%;
    margin-left: 52px;
  }
}
</style>

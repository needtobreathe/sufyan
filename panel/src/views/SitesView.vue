<template>
  <AdminLayout pageTitle="Yaprak Sayfalar">
    <div class="page-header">
      <h2>Yaprak Sayfa Listesi</h2>
      <button class="primary-btn dark-btn" @click="$router.push('/sites/add')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Yeni Sayfa Oluştur
      </button>
    </div>

    <div class="table-card">
      <div v-if="loading && sites.length === 0" class="loading-state">Yükleniyor...</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>SAYFA ADI</th>
            <th>İLİŞKİLİ ÜRÜN</th>
            <th>BAĞLANTI (SUBDOMAIN / DOMAIN)</th>
            <th class="text-center">BUGÜN</th>
            <th class="text-center">TOPLAM</th>
            <th>İŞLEMLER</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="site in sites" :key="site._id">
            <td class="font-medium text-dark">
              <div class="site-name-wrapper">
                {{ site.name }}
                <div v-if="site.activeUsers > 0" class="live-badge" :title="`Şu an ${site.activeUsers} aktif ziyaretçi var`">
                  <span class="live-dot"></span>
                  <span class="live-count">{{ site.activeUsers }}</span>
                </div>
              </div>
            </td>
            <td>
              <span class="product-badge">{{ site.productName || 'Belirtilmedi' }}</span>
            </td>
            <td>
              <div class="link-group">
                <span class="url-text">{{ site.customDomain || `${site.subdomain}.${baseUrl}` }}</span>
                <div class="link-actions">
                  <a :href="getSiteUrl(site)" target="_blank" class="mini-link">Git</a>
                  <button @click="copyUrl(getSiteUrl(site))" class="mini-link">Kopyala</button>
                </div>
              </div>
            </td>
            <td class="text-center">
              <span class="stat-number" :class="{ 'has-data': site.todayOrders > 0 }">
                {{ site.todayOrders > 0 ? site.todayOrders : '-' }}
              </span>
            </td>
            <td class="text-center">
              <span class="stat-number" :class="{ 'has-data': site.totalOrders > 0 }">
                {{ site.totalOrders > 0 ? site.totalOrders : '0' }}
              </span>
            </td>
            <td>
              <div class="actions">
                <button class="action-btn report-btn" @click="$router.push(`/leaf-page-reports/${site._id}`)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                  Rapor
                </button>
                <button class="action-btn edit-btn" @click="$router.push('/sites/' + site._id + '/edit')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Düzenle
                </button>
                <button class="action-btn delete-btn" @click="deleteSite(site._id)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  Sil
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="sites.length === 0 && !loading">
            <td colspan="6" class="empty-row">Henüz yaprak sayfa bulunamadı.</td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination Footer -->
      <div v-if="totalPages > 1" class="pagination-footer">
        <button class="pag-btn" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">&laquo;</button>
        <span class="pag-info">{{ currentPage }} / {{ totalPages }}</span>
        <button class="pag-btn" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">&raquo;</button>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '../components/AdminLayout.vue'
import { apiFetch } from '@/utils/fetch'

const route = useRoute()
const router = useRouter()

const sites = ref([])
const loading = ref(true)
let refreshInterval = null
const baseUrl = window.location.host.split(':')[0]

// Pagination states
const currentPage = ref(parseInt(route.query.page) || 1)
const totalPages = ref(1)

onMounted(async () => {
  await loadSites()
  refreshInterval = setInterval(() => loadSites(currentPage.value), 10000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})

const getSiteUrl = (site) => {
  if (site.customDomain) return `https://${site.customDomain}`
  return `http://${site.subdomain}.${baseUrl}`
}

const copyUrl = (url) => {
  navigator.clipboard.writeText(url).then(() => {
    // Optional toast
  })
}

const loadSites = async (page = currentPage.value) => {
  try {
    const res = await apiFetch(`/api/sites?page=${page}&limit=50`)
    const data = await res.json()
    if (data.success) {
      sites.value = data.sites
      totalPages.value = data.totalPages || 1
      currentPage.value = data.currentPage || 1
    }
  } catch (e) {
    console.error('Siteler yüklenemedi', e)
  } finally {
    loading.value = false
  }
}

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  router.push({ query: { ...route.query, page } })
}

watch(() => route.query.page, (newPage) => {
  const p = parseInt(newPage) || 1
  if (p !== currentPage.value) {
    loadSites(p)
  }
})

const deleteSite = async (id) => {
  if (confirm('Bu sayfayı silmek istediğinizden emin misiniz?')) {
    try {
      const res = await apiFetch(`/api/sites/${id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.success) {
        loadSites()
      } else {
        alert(data.message || 'Hata oluştu')
      }
    } catch (e) {
      console.error('Site silinemedi', e)
      alert('Hata oluştu.')
    }
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #111;
  margin: 0;
}

.dark-btn {
  background: #111;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.dark-btn:hover {
  background: #333;
}

.table-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #eaeaea;
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  background: #fdfdfd;
  color: #888;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #eaeaea;
}

.data-table td {
  padding: 16px;
  font-size: 13px;
  color: #444;
  border-bottom: 1px solid #f9f9f9;
  vertical-align: middle;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.font-medium {
  font-weight: 500;
}

.text-dark {
  color: #111;
}

.text-center {
  text-align: center !important;
}

.product-badge {
  display: inline-block;
  background: #f0f7ff;
  color: #0ea5e9;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.link-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.url-text {
  color: #3b82f6;
  font-weight: 500;
  letter-spacing: -0.2px;
}

.link-actions {
  display: flex;
  gap: 12px;
}

.mini-link {
  background: none;
  border: none;
  padding: 0;
  color: #888;
  font-size: 11px;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.2s;
}

.mini-link:hover {
  color: #333;
}

.stat-number {
  color: #888;
  font-weight: 500;
  font-size: 14px;
}

.stat-number.has-data {
  color: #3b82f6;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #fff;
  border: 1px solid #eaeaea;
  padding: 6px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  color: #555;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f9f9f9;
  border-color: #ddd;
}

.report-btn {
  color: #4b5563;
}

.edit-btn {
  color: #4b5563;
}

.delete-btn {
  color: #ef4444;
}

.delete-btn:hover {
  border-color: #fecaca;
  background: #fef2f2;
}

.empty-row {
  text-align: center;
  padding: 40px !important;
  color: #999;
}

.site-name-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ecfdf5;
  border: 1px solid #10b981;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  color: #065f46;
}

.live-count {
  line-height: 1;
}

.live-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  background-color: #22c55e;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
  100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

.pagination-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 15px;
  border-top: 1px solid #eaeaea;
  background: #fdfdfd;
}

.pag-btn {
  padding: 5px 12px;
  border: 1px solid #eaeaea;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.pag-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pag-info {
  font-size: 13px;
  font-weight: 600;
  color: #666;
}

.loading-state {
  padding: 40px;
  text-align: center;
  color: #666;
}
</style>

<template>
  <AdminLayout pageTitle="Yaprak Sayfalar">
    <div class="page-header">
      <h2>Yaprak Sayfa Listesi</h2>
        <div class="header-actions">
          <button class="sync-btn shopify-all-btn" @click="handlePushAllPackagesToShopify" :disabled="pushingAll || syncing">
            <svg v-if="pushingAll" class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
            {{ pushingAll ? 'Paketler Aktarılıyor...' : 'Paketleri Shopify\'a Gönder' }}
          </button>
          <button class="sync-btn" @click="handleSyncAll" :disabled="syncing">
            <svg v-if="syncing" class="spinner" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6m12-4a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
            {{ syncing ? 'Eşleniyor...' : 'Eşleme Yap' }}
          </button>
          <button class="primary-btn" @click="$router.push('/leaf-pages/add')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Yeni Sayfa Oluştur
          </button>
        </div>
    </div>

    <div class="table-card">
      <div v-if="loading" class="loading-state">Yükleniyor...</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Sayfa Adı</th>
            <th>İlişkili Ürün</th>
            <th>Uzantı (Slug)</th>
            <th class="center-th">Bugünkü Sipariş</th>
            <th class="center-th">Toplam Sipariş</th>
            <th>Bağlantı</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="page in leafPages" :key="page._id">
            <td class="page-name">
              <div class="site-name-wrapper">
                {{ page.name }}
                <div v-if="page.activeUsers > 0" class="live-badge" :title="`Şu an ${page.activeUsers} aktif ziyaretçi var`">
                  <span class="live-dot"></span>
                  <span class="live-count">{{ page.activeUsers }}</span>
                </div>
              </div>
            </td>
            <td>
              <span class="product-tag" :class="{ 'no-product': !page.productId }">
                {{ getProductName(page) }}
              </span>
            </td>
            <td><code>{{ page.slug }}</code></td>
            <td class="order-cell">
              <span class="order-badge today" :class="{ 'zero': !page.ordersToday }">{{ page.ordersToday || 0 }}</span>
            </td>
            <td class="order-cell">
              <span class="order-badge total">{{ page.ordersTotal || 0 }}</span>
            </td>
            <td>
              <div class="link-action">
                <a :href="getPageUrl(page)" target="_blank" class="preview-link">Görüntüle</a>
                <button class="copy-btn" @click="copyLink(page)">Kopyala</button>
              </div>
            </td>
            <td>
              <div class="actions">
                <button 
                  v-if="hasShopifyProduct(page)" 
                  class="action-btn action-shopify" 
                  @click="pushPackagesToShopify(page)"
                  :disabled="pushing === page._id"
                  title="Paketleri Shopify Varyantı Olarak Gönder"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  {{ pushing === page._id ? 'Aktarılıyor...' : 'Shopify\'a Gönder' }}
                </button>
                <button class="action-btn action-clone" @click="clonePage(page._id)" :disabled="cloning === page._id">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  {{ cloning === page._id ? 'Klonlanıyor...' : 'Kopyala' }}
                </button>
                <button class="action-btn action-reports" @click="$router.push('/leaf-pages/' + page.slug + '/reports')">
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20V10M18 20V4M6 20v-4"/></svg>
                   Rapor
                </button>
                <button class="action-btn action-edit" @click="$router.push('/leaf-pages/' + page._id + '/edit')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  Düzenle
                </button>
                <button class="action-btn action-delete" @click="deletePage(page._id)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  Sil
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="leafPages.length === 0">
            <td colspan="7" style="text-align: center; color: #999; padding: 40px;">Henüz bir yaprak sayfa oluşturulmamış.</td>
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
import { ref, onMounted, computed, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '../components/AdminLayout.vue'
import { apiFetch } from '../utils/fetch'

const route = useRoute()
const router = useRouter()

const leafPages = ref([])
const products = ref([])
const loading = ref(true)

// Pagination states
const currentPage = ref(parseInt(route.query.page) || 1)
const totalPages = ref(1)

const fetchInitialData = async (page = currentPage.value) => {
  loading.value = true
  try {
    const [pRes, sRes] = await Promise.all([
      apiFetch('/api/products'),
      apiFetch(`/api/leaf-pages?page=${page}&limit=50`)
    ])
    
    const pData = await pRes.json()
    const sData = await sRes.json()
    
    if (pData.success) products.value = pData.products || []
    if (sData.success) {
      leafPages.value = sData.leafPages || []
      totalPages.value = sData.totalPages || 1
      currentPage.value = sData.currentPage || 1
    }
  } catch (error) {
    console.error('Veriler yüklenemedi:', error)
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
    fetchInitialData(p)
  }
})

const getProductName = (page) => {
  if (page.productName) return page.productName
  if (!page.productId) return 'İlişkilendirilmemiş'
  const product = products.value.find(p => p.id == page.productId)
  return product ? product.name : 'Bilinmeyen Ürün (ID: ' + page.productId + ')'
}

const getPageUrl = (page) => {
  if (page.site) {
    if (page.site.customDomain) {
      return `https://${page.site.customDomain}/p/${page.slug}`
    }
    if (page.site.subdomain) {
      return `https://${page.site.subdomain}.acacialifebl.store`
    }
  }
  return `https://${page.slug}.acacialifebl.store`
}

const copyLink = (page) => {
  let url = getPageUrl(page)
  if (url.startsWith('/')) {
    url = window.location.origin + url
  }
  navigator.clipboard.writeText(url)
  alert('Bağlantı kopyalandı!')
}

const deletePage = async (id) => {
  if (confirm('Bu sayfayı silmek istediğinizden emin misiniz?')) {
    try {
      const response = await apiFetch(`/api/leaf-pages/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      if (data.success) {
        leafPages.value = leafPages.value.filter(p => p._id !== id)
      } else {
        alert(data.message || 'Hata oluştu')
      }
    } catch (error) {
      alert('İşlem başarısız oldu')
    }
  }
}

const cloning = ref(null)
const clonePage = async (id) => {
  try {
    cloning.value = id
    const response = await apiFetch(`/api/leaf-pages/${id}/clone`, {
      method: 'POST'
    })
    const data = await response.json()
    if (data.success) {
      await fetchInitialData()
      alert('Sayfa başarıyla kopyalandı! Yeni bir subdomain oluşturuldu.')
    } else {
      alert(data.message || 'Klonlama hatası')
    }
  } catch (error) {
    alert('İşlem başarısız oldu')
  } finally {
    cloning.value = null
  }
}
const pushing = ref(null)
const pushingAll = ref(false)

const hasShopifyProduct = (page) => {
  const prodName = getProductName(page)
  const product = products.value.find(p => p.name.toLowerCase() === prodName.toLowerCase())
  return product && product.shopifyProductId
}

const handlePushAllPackagesToShopify = async () => {
  const eligiblePages = leafPages.value.filter(page => hasShopifyProduct(page))
  if (eligiblePages.length === 0) {
    alert('Shopify ile eşlenmiş ürünü olan herhangi bir yaprak sayfa bulunamadı.')
    return
  }

  if (!confirm(`Toplam ${eligiblePages.length} sayfanın paketlerini Shopify'a göndermek istediğinizden emin misiniz?`)) return

  pushingAll.value = true
  let successCount = 0
  let failCount = 0

  for (const page of eligiblePages) {
    try {
      const response = await apiFetch('/api/shopify/push-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leafPageId: page._id })
      })
      const data = await response.json()
      if (data.success) {
        successCount++
      } else {
        failCount++
        console.error(`Page ${page.name} failed:`, data.message)
      }
    } catch (err) {
      failCount++
      console.error(`Page ${page.name} error:`, err)
    }
  }

  pushingAll.value = false
  alert(`Shopify Paket Aktarımı Tamamlandı!\nBaşarılı: ${successCount}\nHatalı/Başarısız: ${failCount}`)
}


const pushPackagesToShopify = async (page) => {
  if (!confirm(`"${page.productName}" paketlerini Shopify'a varyant olarak göndermek istediğinizden emin misiniz? Bu işlem Shopify'daki mevcut varyantları güncelleyecektir.`)) return

  pushing.value = page._id
  try {
    const response = await apiFetch('/api/shopify/push-packages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leafPageId: page._id })
    })

    const data = await response.json()
    if (data.success) {
      alert(data.message)
    } else {
      alert(data.message || 'Gönderme işlemi başarısız oldu.')
    }
  } catch (error) {
    console.error('Push packages error:', error)
    alert('Hata oluştu.')
  } finally {
    pushing.value = null
  }
}

const syncing = ref(false)
const handleSyncAll = async () => {
  if (!confirm('Tüm sayfalar acacialife.store üzerinden eşlenecektir. Bu işlem görselleri ve paketleri günceller. Emin misiniz?')) return
  
  syncing.value = true
  try {
    const response = await apiFetch('/api/leaf-pages/sync-all', { method: 'POST' })
    const data = await response.json()
    if (data.success) {
      const { success, failed, total } = data.results
      alert(`Eşleme Tamamlandı!\nToplam: ${total}\nBaşarılı: ${success}\nHatalı: ${failed}`)
      await fetchInitialData()
    } else {
      alert(data.message || 'Eşleme sırasında hata oluştu')
    }
  } catch (error) {
    console.error('Sync Error:', error)
    alert('İşlem başarısız oldu')
  } finally {
    syncing.value = false
  }
}

let refreshInterval = null

onMounted(() => {
  fetchInitialData()
  refreshInterval = setInterval(() => fetchInitialData(currentPage.value), 10000)
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #111;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.sync-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #111;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.sync-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
}

.sync-btn:disabled {
  opacity: 0.6;
  cursor: wait;
}

.primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: #111;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.spinner {
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

.table-card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
}

.loading-state {
  padding: 40px;
  text-align: center;
  color: #666;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: left;
  border-bottom: 1px solid #e5e5e5;
  background: #fafafa;
}

.data-table td {
  padding: 12px 16px;
  font-size: 13px;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
}

.page-name { font-weight: 600; color: #111; }

.product-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #e3f2fd;
  color: #1565c0;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.product-tag.no-product {
  background: #f5f5f5;
  color: #999;
}

.link-action {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-link {
  color: #1565c0;
  text-decoration: none;
  font-weight: 500;
}

.copy-btn {
  padding: 2px 6px;
  font-size: 10px;
  color: #666;
  background: #f5f5f5;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  cursor: pointer;
}

.actions { display: flex; gap: 6px; }

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
}

.action-edit { color: #555; }
.action-clone { color: #43a047; border-color: #c8e6c9; }
.action-delete { color: #d32f2f; border-color: #ffcdd2; }

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

.center-th { text-align: center; }

.order-cell {
  text-align: center;
}

.order-badge {
  display: inline-block;
  min-width: 32px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
}

.order-badge.today {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
}

.order-badge.today.zero {
  background: #f9fafb;
  color: #9ca3af;
  border: 1px solid #e5e7eb;
  font-weight: 500;
}

.order-badge.total {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.pagination-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 15px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.pag-btn {
  padding: 5px 12px;
  border: 1px solid #e5e5e5;
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
.action-shopify {
  color: #166534;
  border-color: #bbf7d0;
}
.action-shopify:hover:not(:disabled) {
  background: #f0fdf4;
  border-color: #166534;
}
.action-shopify:disabled {
  opacity: 0.5;
  cursor: wait;
}
.shopify-all-btn {
  background: #f0fdf4 !important;
  color: #166534 !important;
  border-color: #bbf7d0 !important;
}
.shopify-all-btn:hover:not(:disabled) {
  background: #dcfce7 !important;
  border-color: #166534 !important;
}
</style>

<template>
  <AdminLayout pageTitle="Shopify Ürün Eşleme">
    <div class="page-header">
      <div class="header-info">
        <h2>Shopify Ürün Eşleme</h2>
        <p class="subtitle">Bu paneldeki yerel ürünleri Shopify mağazanızdaki ürünler ve varyantlar ile eşleyin.</p>
      </div>
      <button class="primary-btn refresh-btn" @click="fetchData" :disabled="loading">
        <svg v-if="!loading" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        <span v-else class="spinner"></span>
        Yenile
      </button>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-banner">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{{ error }}</span>
    </div>

    <!-- Main Content -->
    <div class="table-card">
      <div v-if="loading && products.length === 0" class="loading-state">
        <div class="spinner large"></div>
        <p>Veriler yükleniyor...</p>
      </div>

      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Yerel Ürün Adı</th>
            <th>Yerel Fiyat</th>
            <th>Shopify Eşleşmesi</th>
            <th class="actions-header">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td class="product-info-cell">
              <span class="product-name">{{ product.name }}</span>
              <span class="product-code" v-if="product.code">{{ product.code }}</span>
            </td>
            <td class="product-price">₺{{ product.price.toLocaleString('tr-TR') }}</td>
            <td>
              <div v-if="product.shopifyProductId" class="mapping-badge mapped">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shopify-icon">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
                <div class="mapping-details">
                  <span class="shopify-title">{{ product.shopifyTitle || 'Eşlendi' }}</span>
                  <span class="shopify-ids">ID: {{ product.shopifyVariantId || product.shopifyProductId }}</span>
                </div>
              </div>
              <span v-else class="mapping-badge not-mapped">Eşlenmedi</span>
            </td>
            <td>
              <div class="actions">
                <button class="action-btn action-edit" @click="openMappingModal(product)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 3h6v6"/>
                    <path d="M10 14L21 3"/>
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  </svg>
                  Eşleşmeyi Düzenle
                </button>
                <button v-if="product.shopifyProductId" class="action-btn action-delete" @click="removeMapping(product)">
                  Eşleşmeyi Kaldır
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="products.length === 0 && !loading">
            <td colspan="4" class="no-results">
              Yerel ürün bulunamadı.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Mapping Modal -->
    <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
        <div class="modal-header">
          <h3>Ürün Eşleştir</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="local-product-summary">
            <span class="label">Yerel Ürün:</span>
            <span class="value">{{ activeProduct?.name }}</span>
          </div>

          <div class="shopify-search-section">
            <label>Shopify Ürünü Seçin</label>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Shopify ürünlerinde ara..." 
              class="search-input" 
            />
          </div>

          <!-- Shopify Products List -->
          <div class="shopify-products-list">
            <div v-if="filteredShopifyProducts.length === 0" class="no-results">
              Ürün bulunamadı.
            </div>
            <div 
              v-for="sp in filteredShopifyProducts" 
              :key="sp.id" 
              class="shopify-product-item"
              :class="{ selected: selectedShopifyProductId === sp.id }"
              @click="selectShopifyProduct(sp)"
            >
              <img :src="sp.image || '/assets/default-product.png'" class="product-thumb" @error="handleImageError" />
              <div class="product-info">
                <span class="title">{{ sp.title }}</span>
                <span class="variants-count">{{ sp.variants.length }} varyant mevcut</span>
              </div>
            </div>
          </div>

          <!-- Variants List -->
          <div v-if="selectedProductVariants.length > 0" class="shopify-variants-section">
            <label>Shopify Varyantı Seçin</label>
            <div class="variants-list">
              <div 
                v-for="v in selectedProductVariants" 
                :key="v.id" 
                class="variant-item"
                :class="{ selected: selectedVariantId === v.id }"
                @click="selectedVariantId = v.id"
              >
                <div class="variant-details">
                  <span class="variant-title">{{ v.title === 'Default Title' ? 'Varsayılan Varyant' : v.title }}</span>
                  <span class="variant-sku" v-if="v.sku">SKU: {{ v.sku }}</span>
                </div>
                <span class="variant-price">₺{{ Number(v.price).toLocaleString('tr-TR') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="discard-btn" @click="closeModal">Vazgeç</button>
          <button 
            class="primary-btn" 
            @click="saveMapping" 
            :disabled="!selectedShopifyProductId || !selectedVariantId || saving"
          >
            <span v-if="saving" class="spinner"></span>
            Eşleşmeyi Kaydet
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '../components/AdminLayout.vue'
import { apiFetch } from '../utils/fetch'

const products = ref([])
const shopifyProducts = ref([])
const loading = ref(false)
const saving = ref(false)
const error = ref(null)

// Modal state
const modalOpen = ref(false)
const activeProduct = ref(null)
const searchQuery = ref('')
const selectedShopifyProductId = ref(null)
const selectedVariantId = ref(null)

const fetchData = async () => {
  loading.value = true
  error.value = null
  try {
    const [localRes, shopifyRes] = await Promise.all([
      apiFetch('/api/products?limit=250'),
      apiFetch('/api/shopify/products')
    ])

    const localData = await localRes.json()
    const shopifyData = await shopifyRes.json()

    if (localData.success) {
      // Filter out leaf page products, only sync standard local products
      products.value = localData.products.filter(p => p.type === 'product')
    } else {
      error.value = 'Yerel ürünler yüklenemedi.'
    }

    if (shopifyData.success) {
      shopifyProducts.value = shopifyData.products
    } else {
      error.value = shopifyData.message || 'Shopify ürünleri yüklenemedi.'
    }
  } catch (err) {
    console.error('Fetch data error:', err)
    error.value = 'Sunucuyla bağlantı kurulamadı.'
  } finally {
    loading.value = false
  }
}

const filteredShopifyProducts = computed(() => {
  if (!searchQuery.value) return shopifyProducts.value
  const query = searchQuery.value.toLowerCase()
  return shopifyProducts.value.filter(p => 
    p.title.toLowerCase().includes(query) || 
    p.id.includes(query)
  )
})

const selectedProductVariants = computed(() => {
  const p = shopifyProducts.value.find(prod => prod.id === selectedShopifyProductId.value)
  return p ? p.variants : []
})

const openMappingModal = (product) => {
  activeProduct.value = product
  searchQuery.value = ''
  selectedShopifyProductId.value = product.shopifyProductId || null
  selectedVariantId.value = product.shopifyVariantId || null
  modalOpen.value = true
}

const closeModal = () => {
  modalOpen.value = false
  activeProduct.value = null
  selectedShopifyProductId.value = null
  selectedVariantId.value = null
}

const selectShopifyProduct = (sp) => {
  selectedShopifyProductId.value = sp.id
  if (sp.variants.length === 1) {
    selectedVariantId.value = sp.variants[0].id
  } else {
    selectedVariantId.value = null
  }
}

const saveMapping = async () => {
  if (!activeProduct.value || !selectedShopifyProductId.value || !selectedVariantId.value) return

  saving.value = true
  try {
    const shopifyProd = shopifyProducts.value.find(p => p.id === selectedShopifyProductId.value)
    const variant = shopifyProd.variants.find(v => v.id === selectedVariantId.value)
    const title = `${shopifyProd.title} - ${variant.title === 'Default Title' ? 'Varsayılan' : variant.title}`

    const response = await apiFetch('/api/shopify/map-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: activeProduct.value.id,
        shopifyProductId: selectedShopifyProductId.value,
        shopifyVariantId: selectedVariantId.value,
        shopifyTitle: title
      })
    })

    const data = await response.json()
    if (data.success) {
      // Update local state
      const p = products.value.find(prod => prod.id === activeProduct.value.id)
      if (p) {
        p.shopifyProductId = selectedShopifyProductId.value
        p.shopifyVariantId = selectedVariantId.value
        p.shopifyTitle = title
      }
      closeModal()
    } else {
      alert(data.message || 'Eşleme kaydedilemedi.')
    }
  } catch (err) {
    console.error('Save mapping error:', err)
    alert('Hata oluştu.')
  } finally {
    saving.value = false
  }
}

const removeMapping = async (product) => {
  if (!confirm(`${product.name} ürününün Shopify eşleşmesini kaldırmak istediğinizden emin misiniz?`)) return

  try {
    const response = await apiFetch('/api/shopify/map-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: product.id,
        shopifyProductId: null,
        shopifyVariantId: null,
        shopifyTitle: null
      })
    })

    const data = await response.json()
    if (data.success) {
      product.shopifyProductId = null
      product.shopifyVariantId = null
      product.shopifyTitle = null
    } else {
      alert(data.message || 'Eşleşme kaldırılamadı.')
    }
  } catch (err) {
    console.error('Remove mapping error:', err)
    alert('Hata oluştu.')
  }
}

const handleImageError = (e) => {
  e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%23cccccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-info h2 {
  font-size: 20px;
  font-weight: 700;
  color: #111;
  margin: 0 0 4px 0;
}

.subtitle {
  font-size: 13px;
  color: #666;
  margin: 0;
}

.primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: #111;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.primary-btn:hover:not(:disabled) {
  background: #333;
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #fdf2f2;
  border: 1px solid #f8b4b4;
  border-radius: 8px;
  color: #9b1c1c;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 20px;
}

.table-card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  overflow: hidden;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  color: #666;
  gap: 12px;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

.spinner.large {
  width: 32px;
  height: 32px;
  border-color: rgba(0, 0, 0, 0.1);
  border-top-color: #111;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th {
  padding: 14px 20px;
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
  padding: 16px 20px;
  font-size: 13px;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

.product-info-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.product-name {
  font-weight: 600;
  color: #111;
}

.product-code {
  font-size: 11px;
  color: #888;
  font-weight: 500;
}

.product-price {
  font-weight: 600;
  color: #111;
}

.mapping-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.mapping-badge.mapped {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.mapping-badge.not-mapped {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  color: #6b7280;
}

.shopify-icon {
  color: #2c9a58;
}

.mapping-details {
  display: flex;
  flex-direction: column;
}

.shopify-title {
  font-weight: 600;
  line-height: 1.2;
}

.shopify-ids {
  font-size: 10px;
  color: #666;
  margin-top: 2px;
}

.actions {
  display: flex;
  gap: 8px;
}

.actions-header {
  text-align: right !important;
}

.data-table td:last-child {
  text-align: right;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-edit {
  color: #3b82f6;
  border-color: #bfdbfe;
}

.action-edit:hover {
  background: #eff6ff;
  border-color: #3b82f6;
}

.action-delete {
  color: #ef4444;
  border-color: #fca5a5;
}

.action-delete:hover {
  background: #fdf2f2;
  border-color: #ef4444;
}

/* Modal Styling */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  backdrop-filter: blur(4px);
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-card {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 550px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slideUp 0.2s ease;
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e5e5;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: #111;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  line-height: 1;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.local-product-summary {
  display: flex;
  gap: 8px;
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
}

.local-product-summary .label {
  color: #666;
  font-weight: 500;
}

.local-product-summary .value {
  color: #111;
  font-weight: 600;
}

.shopify-search-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.shopify-search-section label,
.shopify-variants-section label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.search-input {
  width: 100%;
  padding: 10px 14px;
  font-size: 13px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  outline: none;
  transition: all 0.15s ease;
}

.search-input:focus {
  border-color: #111;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
}

.shopify-products-list {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  max-height: 180px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.shopify-product-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.12s;
}

.shopify-product-item:last-child {
  border-bottom: none;
}

.shopify-product-item:hover {
  background: #fafafa;
}

.shopify-product-item.selected {
  background: #f0fdf4;
  border-left: 3px solid #2c9a58;
}

.product-thumb {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid #e5e5e5;
  background: #f9fafb;
}

.shopify-product-item .product-info {
  display: flex;
  flex-direction: column;
}

.shopify-product-item .title {
  font-size: 13px;
  font-weight: 600;
  color: #111;
}

.shopify-product-item .variants-count {
  font-size: 11px;
  color: #666;
}

.no-results {
  padding: 20px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.shopify-variants-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.variants-list {
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  max-height: 150px;
  overflow-y: auto;
}

.variant-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.12s;
}

.variant-item:last-child {
  border-bottom: none;
}

.variant-item:hover {
  background: #fafafa;
}

.variant-item.selected {
  background: #f0fdf4;
  border-left: 3px solid #2c9a58;
}

.variant-details {
  display: flex;
  flex-direction: column;
}

.variant-title {
  font-size: 13px;
  font-weight: 600;
  color: #111;
}

.variant-sku {
  font-size: 11px;
  color: #666;
}

.variant-price {
  font-size: 13px;
  font-weight: 600;
  color: #111;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #e5e5e5;
  background: #fafafa;
}

.discard-btn {
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.discard-btn:hover {
  background: #f5f5f5;
  border-color: #ccc;
  color: #333;
}
</style>

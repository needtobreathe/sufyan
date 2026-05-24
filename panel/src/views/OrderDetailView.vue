<template>
  <AdminLayout pageTitle="Sipariş Detayı">
    <div class="detail-header">
      <div class="detail-header-left">
        <button class="back-btn" @click="handleBack">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Geri
        </button>
        <div class="title-with-status">
          <h2>Sipariş #{{ order._id.slice(-6).toUpperCase() }}</h2>
          <span :class="['status-badge', 'status-' + order.status]">{{ statusLabels[order.status] }}</span>
        </div>
        
        <div v-if="autoSaveStatus !== 'idle'" class="autosave-indicator" :class="autoSaveStatus">
          <div v-if="autoSaveStatus === 'saving'" class="spinner-mini"></div>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          {{ autoSaveStatus === 'saving' ? 'Değişiklikler kaydediliyor...' : 'Tüm değişiklikler kaydedildi' }}
        </div>

        <div v-if="otherViewers.length > 0" class="presence-tag">
          <span class="pulse-dot"></span>
          <span>{{ otherViewers.map(v => v.userName).join(', ') }} de şu an inceliyor</span>
        </div>
      </div>

      <div class="detail-header-right">
        <div class="header-actions-group">
          <button v-if="order.status === 'pending' || order.status === '1'" class="btn btn-success" @click="handleConfirm">
            Onayla
          </button>
          <button v-if="order.status === 'approved' || order.status === '2'" class="btn btn-success" @click="handlePrepare">
            Hazırla
          </button>
          
          <div class="status-quick-update">
            <button class="btn btn-outline-status" @click="showStatusList = !showStatusList">
              Durum: {{ statusLabels[order.status] }}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div v-if="showStatusList" class="status-list-dropdown">
              <div 
                v-for="s in selectableStatuses" 
                :key="s.key" 
                class="status-list-item"
                :class="{ active: order.status === s.key }"
                @click="handleStatusSelect(s.key)"
              >
                {{ s.label }}
              </div>
            </div>
          </div>

          <button v-if="order.status !== 'cancelled' && order.status !== '9'" class="btn btn-outline-danger" @click="handleCancel">
            İptal Et
          </button>
          <button class="btn btn-outline-danger" @click="handleDelete">
             Sil
          </button>
        </div>
        
        <div class="header-actions-group secondary">
          
          <button class="btn btn-primary" @click="handleSave()">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v13a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            Kaydet
          </button>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="tabs-container">
      <button 
        v-for="tab in ['genel', 'history']" 
        :key="tab"
        :class="['tab-btn', { active: activeTab === tab }]"
        @click="activeTab = tab"
      >
        {{ tabLabels[tab] }}
      </button>
    </div>

    <div class="tab-content" v-if="activeTab === 'genel'">
      <div class="detail-grid">
        <!-- Left Column -->
        <div class="detail-col">
          <!-- Customer Info -->
          <div class="detail-card">
            <div class="card-header">
              <h3>Müşteri Bilgileri</h3>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Müşteri Adı</label>
                <input type="text" v-model="order.fullName" class="form-input" />
              </div>
              <div class="form-group">
                <label>Telefon</label>
                <div class="phone-input-group">
                  <input type="text" v-model="order.phone" class="form-input" placeholder="05XX XXX XX XX" />
                  <div class="phone-actions">
                    <button class="phone-btn wp" title="WhatsApp" @click="openWp">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.031 6.172c-2.32 0-4.208 1.888-4.208 4.208 0 0.816 0.232 1.576 0.632 2.216l-0.672 2.456 2.512-0.656c0.552 0.32 1.184 0.504 1.864 0.504 2.32 0 4.208-1.888 4.208-4.208s-1.888-4.208-4.208-4.208zM15.424 12.56c-0.144 0.408-0.72 0.744-1.008 0.792-0.28 0.048-0.536 0.088-1.528-0.304-1.224-0.488-2.008-1.72-2.072-1.808-0.056-0.088-0.504-0.672-0.504-1.28s0.32-0.912 0.432-1.032c0.112-0.12 0.248-0.152 0.328-0.152s0.16 0 0.232 0.008c0.072 0 0.168-0.024 0.264 0.208 0.096 0.232 0.328 0.8 0.36 0.856 0.032 0.056 0.048 0.12 0.016 0.184s-0.048 0.104-0.104 0.168c-0.056 0.064-0.12 0.144-0.168 0.192s-0.104 0.104-0.04 0.216c0.064 0.112 0.28 0.464 0.6 0.752 0.416 0.368 0.76 0.48 0.872 0.544s0.184 0.048 0.256-0.032c0.072-0.088 0.312-0.36 0.392-0.48 0.08-0.12 0.16-0.104 0.272-0.064s0.704 0.328 0.824 0.392c0.12 0.064 0.2 0.096 0.232 0.144 0.032 0.056 0.032 0.32-0.112 0.728zM12.072 1.976c-5.504 0-9.96 4.456-9.96 9.968 0 1.744 0.456 3.44 1.32 4.952l-1.4 5.104 5.224-1.368c1.456 0.8 3.104 1.224 4.816 1.224 5.504 0 9.96-4.456 9.96-9.968s-4.456-9.968-9.96-9.968zM12.072 20.328c-1.576 0-3.112-0.424-4.448-1.224l-0.32-0.192-3.304 0.864 0.88-3.216-0.208-0.328c-0.88-1.4-1.344-3.024-1.344-4.688 0-4.632 3.776-8.408 8.416-8.408 2.248 0 4.36 0.872 5.952 2.464s2.464 3.704 2.464 5.944c0.008 4.64-3.768 8.416-8.408 8.416z"></path>
                      </svg>
                    </button>
                    <button class="phone-btn call" title="Ara" @click="openCall">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.81 12.81 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
              <div class="form-group">
                <div class="form-row mini-grid" style="grid-template-columns: 1fr 1fr;">
                  <div class="form-group">
                    <label>İl</label>
                    <div class="search-select-wrap">
                      <input 
                        type="text" 
                        v-model="citySearch" 
                        class="form-input"
                        placeholder="Şehir Ara..." 
                        @focus="showCityList = true"
                        @blur="handleCityBlur"
                      />
                      <div v-if="showCityList" class="search-dropdown">
                        <div 
                          v-for="c in filteredCities" 
                          :key="c.sehir_id" 
                          class="search-option"
                          @mousedown="selectCity(c)"
                        >
                          {{ c.name }}
                        </div>
                        <div v-if="filteredCities.length === 0" class="no-results">Sonuç bulunamadı</div>
                      </div>
                    </div>
                  </div>
                  <div class="form-group">
                    <label>İlçe</label>
                    <div class="search-select-wrap">
                      <input 
                        type="text" 
                        v-model="districtSearch" 
                        class="form-input"
                        placeholder="İlçe Ara..." 
                        :disabled="!order.province"
                        @focus="showDistrictList = true"
                        @blur="handleDistrictBlur"
                      />
                      <div v-if="showDistrictList" class="search-dropdown">
                        <div 
                          v-for="d in filteredDistricts" 
                          :key="d.ilce_id" 
                          class="search-option"
                          @mousedown="selectDistrict(d)"
                        >
                          {{ d.name }}
                        </div>
                        <div v-if="filteredDistricts.length === 0" class="no-results">Sonuç bulunamadı</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            <div class="form-group">
              <label>Açık Adres</label>
              <textarea v-model="order.address" class="form-input form-textarea" placeholder="Teslimat adresi..."></textarea>
            </div>
          </div>
        </div>

        <!-- Right Column - Cart Section (Moved up) -->
        <div class="detail-col">
          <div class="detail-card cart-card">
            <div class="card-header">
              <h3>Sepet Bilgileri</h3>
            </div>

            <div class="cart-table-wrapper">
              <table class="cart-table">
                <thead>
                  <tr>
                    <th>Ürün</th>
                    <th width="60">Adet</th>
                    <th width="100">Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(item, i) in order.items" :key="i">
                    <td data-label="Ürün">
                      <div class="product-cell-content">
                        <strong>{{ resolveProductName(order, item) }}</strong>
                      </div>
                    </td>
                    <td data-label="Adet">
                      <input type="number" v-model.number="item.qty" class="form-input" style="width: 80px;" min="1" />
                    </td>
                    <td data-label="Tutar">
                      <div style="display: flex; align-items: center; gap: 4px;">
                        <input type="number" v-model.number="item.price" class="form-input" style="width: 100px;" /> TL
                      </div>
                    </td>

                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Row - Order Info -->
      <div class="detail-card order-info-card" style="margin-top: 24px;">
        <h3>Sipariş Bilgileri</h3>
        <div class="form-row" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));">
          <div class="form-group">
            <label>Durum</label>
            <select v-model="order.status" class="form-input">
              <option v-for="status in selectableStatuses" :key="status.key" :value="status.key">{{ status.label }}</option>
              <option v-if="order.status && !selectableStatuses.some(s => s.key === order.status)" :value="order.status">
                {{ statusLabels[order.status] || order.status }}
              </option>
            </select>
          </div>

          <div class="form-group" v-if="order.status === 'future' || order.status === '16'">
            <label>İleri Tarih</label>
            <input type="date" v-model="order.futureDate" class="form-input" />
          </div>
          <div class="form-group" v-else>
            <label>Sipariş Tarihi</label>
            <input type="text" :value="formatDate(order.createdAt)" class="form-input" readonly />
          </div>
          <div class="form-group">
            <label>Sipariş Kaynağı (Site)</label>
            <input type="text" :value="getSiteName(order.site_id)" class="form-input" readonly />
          </div>
        </div>
      </div>
    </div>

    <!-- Other Tabs (Placeholders for now) -->

    <div class="tab-content" v-if="activeTab === 'history'">
      <div class="detail-card">
        <h3>Sipariş Geçmişi</h3>
        <div class="notes-list">
          <div v-for="(log, i) in systemLogs" :key="i" class="note-item system-log">
            <div class="note-meta">
              <strong>{{ log.changedBy }}</strong>
              <span>{{ log.time }}</span>
            </div>
            <div class="note-text">{{ log.details }}</div>
          </div>
          <div v-if="!systemLogs.length" class="empty-notes">Geçmiş kaydı bulunamadı.</div>
        </div>
      </div>
    </div>

    <!-- Sipariş İptal Modali -->
    <div v-if="showCancelModal" class="modal-overlay" @click.self="showCancelModal = false">
      <div class="wp-modal" style="max-width: 400px">
        <div class="modal-header">
          <h3>Siparişi İptal Et</h3>
          <button class="close-btn" @click="showCancelModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 12px; font-size: 14px; color: #475569;">Lütfen iptal sebebini seçiniz:</p>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label v-for="reason in cancelReasons" :key="reason" style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px;" :style="{ background: selectedCancelReason === reason ? '#eff6ff' : '#fff', borderColor: selectedCancelReason === reason ? '#3b82f6' : '#e2e8f0' }">
              <input type="radio" :value="reason" v-model="selectedCancelReason" name="cancelReason" style="margin: 0;">
              <span style="font-size: 14px; font-weight: 500; color: #1e293b;">{{ reason }}</span>
            </label>
          </div>
        </div>
        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 12px; padding: 16px 20px; border-top: 1px solid #f1f5f9; background: #f8fafc;">
          <button @click="showCancelModal = false" style="background: #f1f5f9; color: #475569; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Vazgeç</button>
          <button :disabled="!selectedCancelReason" @click="confirmCancel" style="background: #ef4444; color: #fff; padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">İptal Et</button>
        </div>
      </div>
    </div>


    <!-- Ödeme Yöntemi Seçim Modali -->
    <div v-if="showPaymentModal" class="modal-overlay" @click.self="showPaymentModal = false">
      <div class="wp-modal" style="max-width: 400px">
        <div class="modal-header">
          <h3>Ödeme Yöntemi Seçin</h3>
          <button class="close-btn" @click="showPaymentModal = false">&times;</button>
        </div>
        <div class="modal-body" style="padding: 20px;">
          <p style="margin-bottom: 20px; font-size: 14px; color: #475569; text-align: center;">
            Siparişi onaylamadan önce ödeme yöntemini seçiniz:
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <button class="confirm-btn" style="height: 100px; flex-direction: column; gap: 10px; background: #f0fdf4; border-color: #bbf7d0; color: #15803d; width: 100%;" @click="confirmApprovalWithPayment('nakit')">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="6" width="20" height="12" rx="2"></rect>
                <circle cx="12" cy="12" r="2"></circle>
                <path d="M6 12h.01M18 12h.01"></path>
              </svg>
              <strong>Kapıda Nakit</strong>
            </button>
            <button class="confirm-btn" style="height: 100px; flex-direction: column; gap: 10px; background: #eff6ff; border-color: #bfdbfe; color: #1d4ed8; width: 100%;" @click="confirmApprovalWithPayment('kart')">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                <line x1="2" y1="10" x2="22" y2="10"></line>
              </svg>
              <strong>Kapıda Kart</strong>
            </button>
          </div>
        </div>
      </div>
    </div>

  </AdminLayout>
</template>

<script setup>
import { reactive, computed, onMounted, ref, watch, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiFetch } from '@/utils/fetch'
import AdminLayout from '../components/AdminLayout.vue'

const route = useRoute()
const router = useRouter()
const orderId = route.params.id
// Legacy logic removed

const tabLabels = {
  genel: 'Genel Bilgiler',
  history: 'Sipariş Geçmişi'
}

// Searchable Select States
const citySearch = ref('')
const showCityList = ref(false)
const districtSearch = ref('')
const showDistrictList = ref(false)
const leafPages = ref([])

const statusLabels = {
  pending: 'Yeni Sipariş',
  approved: 'Onaylandı',
  preparing: 'Hazırlanıyor',
  shipped: 'Kargoya Verildi',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal',
  future: 'İleri Tarihli',
  test: 'Test',
  '1': 'Yeni Sipariş',
  facebook: 'Facebook DM',
  instagram: 'Instagram DM',
  social: 'Sosyal Medya',
  '3': 'Hazırlanıyor',
  '4': 'Paketlendi',
  '5': 'Kargoya Verildi',
  '6': 'Dağıtımda',
  '7': 'Sorunlu Kargo',
  '8': 'Test Siparişler',
  '9': 'İptal',
  '10': 'Mükerrer Sipariş',
  '11': 'Sahte Sipariş',
  '12': 'Teslim Edildi',
  '13': 'Ulaşılamayanlar',
  '14': 'Instagram DM',
  '15': 'Facebook DM',
  '16': 'İleri Tarihli Sipariş',
  '17': 'test1',
  'returned': 'İade',
  '18': 'İade'
}





const selectableStatuses = computed(() => {
  return [
    { key: 'pending', label: 'Yeni Sipariş' },
    { key: 'approved', label: 'Onaylandı' },
    { key: 'preparing', label: 'Hazırlanıyor' },
    { key: 'facebook', label: 'Facebook DM' },
    { key: 'instagram', label: 'Instagram DM' },
    { key: 'shipped', label: 'Kargolandı' },
    { key: 'delivered', label: 'Teslim Edildi' },
    { key: 'returned', label: 'İade' },
    { key: '13', label: 'Ulaşılamayanlar' },
    { key: '16', label: 'İleri Tarihli Sipariş' }
  ]
})

const handleStatusSelect = async (newStatus) => {
  showStatusList.value = false
  if (order.status === newStatus) return
  
  if (newStatus === 'cancelled') {
    await handleCancel()
  } else if (newStatus === 'future' || newStatus === '16') {
    // Current detail page logic for future is handled by the select v-model and watch
    order.status = newStatus
  } else {
    if (confirm(`Sipariş durumunu "${statusLabels[newStatus]}" olarak değiştirmek istediğinize emin misiniz?`)) {
      await updateStatus(newStatus)
    }
  }
}

const order = reactive({
  _id: '',
  fullName: '',
  phone: '',
  province: '',
  district: '',
  address: '',
  paymentMethod: '',
  status: '',
  createdAt: '',
  country: '1',
  shippingCompany: '',
  trackingNo: '',
  trackingUrl: '',
  futureDate: '',
  shippingFee: 0,
  site_id: '',
  items: [],
  logs: []
})

const loading = ref(false)
const sites = ref([])
const allProducts = ref([])
const cities = ref([])
const districts = ref([])
const autoSaveStatus = ref('idle') // idle, saving, saved
const activeTab = ref('genel')
const otherViewers = ref([])
const showPaymentModal = ref(false)
const showCancelModal = ref(false)
const showStatusList = ref(false)
const selectedCancelReason = ref('')
const cancelReasons = [
  'Müşteri vazgeçti',
  'Mükerrer sipariş / Yanlış sipariş',
  'Fiyat / Kargo bedeli pahalı geldi',
  'Farklı satıcıdan aldı',
  'Ulaşılamıyor',
  'Stok yok'
]

// Watch for status change to 'future' to ensure a date is picked
watch(() => order.status, (newStat) => {
  if ((newStat === 'future' || newStat === '16') && !order.futureDate) {
    // Set to today as default if empty
    order.futureDate = new Date().toISOString().split('T')[0]
  }
})
let saveTimeout = null
let heartbeatId = null
let isInitialLoad = true

const totalAmount = computed(() => {
  const itemsTotal = order.items.reduce((sum, item) => {
    return sum + (item.price || 0)
  }, 0)
  return itemsTotal + (order.shippingFee || 0)
})

const systemLogs = computed(() => {
    return order.logs.filter(log => log.type === 'system' || log.type === 'note')
})

onMounted(async () => {
  await Promise.all([
    fetchOrderData(),
    fetchLeafPages(),
    fetchCities(),
    fetchLogs()
  ])
})

const fetchOrderData = async () => {
  loading.value = true
  try {
    // Fetch reference data in parallel for speed
    await Promise.all([
      fetchAllProducts()
    ])

    // Fetch from Local API (handles legacy proxing in backend if needed)
    const res = await apiFetch(`/api/orders/${orderId}`)
    const data = await res.json()
    
    if (data.success && data.order) {
      Object.assign(order, data.order)
      
      // Map items array if present, otherwise fallback to root fields (for legacy compatibility)
      if (data.order.items && data.order.items.length > 0) {
        order.items = data.order.items.map(item => ({
          name: item.name || '',
          qty: Number(item.qty || 1),
          price: Number(item.price || 0),
          selectedPackage: item.selectedPackage || ''
        }))
      } else {
        // Legacy fallback
        order.items = [{ 
          name: data.order.product_name || data.order.sp_urun || 'Ürün Adı', 
          qty: Number(data.order.quantity || data.order.sp_adet || 1), 
          price: Number(data.order.totalPrice || data.order.sp_toplam || 0), 
          selectedPackage: '' 
        }]
      }

      // Map legacy fields for display if this was a proxied legacy order
      if (data.order.sp_siparis_durumu) {
        order.status = mapLegacyStatus(data.order.sp_siparis_durumu)
      }

      if (order.country) await handleCountryChange(false)
      if (order.province) {
        await handleCityChange(false)
        // Initialize searches
        citySearch.value = cities.value.find(c => c.id == order.province)?.name || ''
        if (order.district) {
          districtSearch.value = districts.value.find(d => d.id == order.district)?.name || ''
        }
      }
      
      await fetchLogs()
    }
  } catch (error) {
    console.error('Sipariş detayı yüklenemedi', error)
  } finally {
    loading.value = false
    setTimeout(() => { isInitialLoad = false }, 1000)
    startPresenceHeartbeat()
  }
}

const fetchLeafPages = async () => {
  try {
    const res = await apiFetch('/api/leaf-pages?limit=1000')
    const data = await res.json()
    if (data.success) {
      leafPages.value = data.leafPages || []
    }
  } catch (err) {
    console.error('Leaf pages fetch error:', err)
  }
}

const resolveProductName = (order, item) => {
  const page = leafPages.value.find(p => p.slug === order.site_id)
  if (page) {
    // Try to find if item.name matches a package name
    const pkg = page.products?.find(p => p.name === item.name)
    if (pkg) {
      return page.productName || item.name
    }
  }

  if (item.name.toLowerCase().includes('kutu') || item.name.toLowerCase().includes('adet')) {
    if (page && page.productName) {
      return page.productName
    }
  }
  return item.name
}

const resolveProductQty = (order, item) => {
  const page = leafPages.value.find(p => p.slug === order.site_id)
  if (page) {
    const pkg = page.products?.find(p => p.name === item.name)
    if (pkg) {
      return pkg.quantity
    }
  }
  return item.qty
}

const fetchCities = async () => {
  try {
    const res = await apiFetch('/api/sites')
    const data = await res.json()
    if (data.success) sites.value = data.sites
  } catch (e) {
    console.error('Siteler çekilemedi', e)
  }
}

onUnmounted(() => {
  if (heartbeatId) clearInterval(heartbeatId)
  
  // Clean up event listeners
  window.removeEventListener('beforeunload', handleForceUnlock)
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  
  handleForceUnlock()
})

const handleForceUnlock = () => {
  // Use navigator.sendBeacon or fetch with keepalive for high reliability on exit
  const url = `${import.meta.env.VITE_API_URL || ''}/api/orders/${orderId}/unlock`
  const token = localStorage.getItem('admin_token')
  
  if (navigator.sendBeacon && token) {
     // sendBeacon doesn't support headers easily, but we can pass token in URL if needed
     // however fetch keepalive is modern and supports headers
  }

  fetch(url, { 
    method: 'POST', 
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    keepalive: true 
  }).catch(() => {})
}

const handleBack = () => {
  handleForceUnlock()
  router.push('/orders')
}

const handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    handleForceUnlock()
  }
}

const startPresenceHeartbeat = () => {
  const sendHeartbeat = async () => {
    try {
      const res = await apiFetch(`/api/orders/${orderId}/lock`, { method: 'POST' })
      const data = await res.json()
      if (data.success && data.activeLocks) {
        otherViewers.value = data.activeLocks
      }
    } catch (error) {
      console.error('Presence error:', error)
    }
  }
  
  sendHeartbeat()
  heartbeatId = setInterval(sendHeartbeat, 5000) // Every 5 seconds
  
  // Add reliability listeners
  window.addEventListener('beforeunload', handleForceUnlock)
  document.addEventListener('visibilitychange', handleVisibilityChange)

}


// Search Select Logic
const filteredCities = computed(() => {
  if (!cities.value) return []
  if (!citySearch.value) return cities.value
  const search = citySearch.value.toLocaleLowerCase('tr')
  return cities.value.filter(c => c && c.name && c.name.toLocaleLowerCase('tr').includes(search))
})

const selectCity = (c) => {
  order.province = c.id
  citySearch.value = c.name
  showCityList.value = false
  order.district = ''
  districtSearch.value = ''
  districts.value = []
  handleCityChange(false)
}

const handleCityBlur = () => {
  setTimeout(() => { showCityList.value = false }, 200)
}

const filteredDistricts = computed(() => {
  if (!districts.value) return []
  if (!districtSearch.value) return districts.value
  const search = districtSearch.value.toLocaleLowerCase('tr')
  return districts.value.filter(d => d && d.name && d.name.toLocaleLowerCase('tr').includes(search))
})

const selectDistrict = (d) => {
  order.district = d.id
  districtSearch.value = d.name
  showDistrictList.value = false
}

const handleDistrictBlur = () => {
  setTimeout(() => { showDistrictList.value = false }, 200)
}

const handleCountryChange = async (reset = true) => {
  try {
    const res = await apiFetch(`/api/cities?country_id=1`)
    const data = await res.json()
    if (data.success) {
      cities.value = data.cities
    }
  } catch (error) {
    console.error('Şehirler yüklenemedi', error)
  }
}

const handleCityChange = async (reset = true) => {
  if (!order.province) return
  if (reset) {
    order.district = ''
    districts.value = []
  }
  try {
    const res = await apiFetch(`/api/districts?city_id=${order.province}`)
    const data = await res.json()
    if (data.success) {
      districts.value = data.districts
    }
  } catch (error) {
    console.error('İlçeler yüklenemedi', error)
  }
}

const fetchLogs = async () => {
    try {
    const res = await apiFetch(`/api/orders/${orderId}/logs`)
    const data = await res.json()
    if (data.success) {
      order.logs = data.logs.map(log => ({
        ...log,
        type: log.action === 'note' ? 'note' : 'system',
        text: `${log.changedBy}: ${log.details}`,
        time: new Date(log.createdAt).toLocaleString('tr-TR')
      }))
    }
  } catch (error) {
    console.error('Loglar yüklenemedi', error)
  }
}

const fetchSites = async () => {
  try {
    const res = await apiFetch('/api/sites')
    const data = await res.json()
    if (data.success) sites.value = data.sites
  } catch (e) {
    console.error('Siteler çekilemedi', e)
  }
}

const getSiteName = (site_id) => {
  if (!site_id) return '-'
  const site = sites.value.find(s => s.subdomain === site_id.toLowerCase())
  return site ? site.name : site_id
}

const fetchAllProducts = async () => {
  if (allProducts.value && allProducts.value.length > 0) return
  try {
    const res = await apiFetch('/api/products')
    const data = await res.json()
    if (data.success && data.products) {
      allProducts.value = data.products
    }
  } catch (error) {
    console.error('Ürünler yüklenemedi', error)
  }
}

const isProductKnown = (name) => {
  if (!name) return false
  return allProducts.value.some(p => p.name.trim().toLowerCase() === name.trim().toLowerCase())
}


const addProduct = () => {
  order.items.push({ name: '', qty: 1, price: 0 })
}


const onProductChange = (item) => {
  const selected = allProducts.value.find(p => p.name.trim().toLowerCase() === item.name.trim().toLowerCase())
  if (selected) {
    item.price = selected.price || 0
    item.qty = 1
  }
}

const openWp = () => {
    const addressStr = order.address || '-';

    const productsText = order.items.map(item => `${item.qty} Adet ${item.name}`).join(', ');
    
    const message = `Sayın ${order.fullName},

Sipariş bilgileriniz aşağıdadır:

Ad Soyad: ${order.fullName}
Telefon: ${order.phone}
Adres: ${addressStr}
Ürün: ${productsText}
Toplam Tutar: ${totalAmount.value} TL

Kapıda nakit mi kapıda kart mı ödeyeceksiniz?

Siparişinizi onaylamanız durumunda yarın kargoya verilecektir.`;

    const encodedMessage = encodeURIComponent(message);
    let targetPhone = order.phone.replace(/[^0-9]/g, '');
    if (targetPhone.startsWith('0')) targetPhone = '9' + targetPhone;
    else if (!targetPhone.startsWith('90')) targetPhone = '90' + targetPhone;

    window.open(`https://wa.me/${targetPhone}?text=${encodedMessage}`, '_blank');
}

const openSms = () => {
  window.location.href = `sms:${order.phone}`
}

const openCall = () => {
  window.location.href = `tel:${order.phone}`
}

const updateStatus = async (newStatus, extraData = null) => {
  loading.value = true
  try {
    const res = await apiFetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        status: newStatus,
        futureDate: newStatus === 'future' || newStatus === '16' ? (extraData || order.futureDate) : null,
        cancellationReason: newStatus === 'cancelled' ? extraData : null
      })
    })
    const data = await res.json()
    if (data.success) {
      await fetchOrderData() // Refresh everything
    } else {
      alert('Durum güncellenemedi: ' + (data.message || 'Hata'))
    }
  } catch (error) {
    console.error('Status update error:', error)
    alert('Durum güncellenirken bağlantı hatası oluştu.')
  } finally {
    loading.value = false
  }
}

const handleConfirm = async () => {
  showPaymentModal.value = true
}

const confirmApprovalWithPayment = async (method) => {
  const methodLabel = method === 'nakit' ? 'Nakit (Kapıda Ödeme)' : 'Kredi Kartı (Kapıda Ödeme)'
  
  loading.value = true
  try {
    const res = await apiFetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        paymentMethod: methodLabel,
        status: 'preparing'
      })
    })
    
    const data = await res.json()
    if (data.success) {
      showPaymentModal.value = false
      await fetchOrderData()
    } else {
      alert(data.message || "Hata oluştu.")
    }
  } catch (error) {
    console.error("Approval error:", error)
  } finally {
    loading.value = false
  }
}

const handlePrepare = async () => {
  if (confirm('Siparişi hazırlamaya almak istediğinize emin misiniz?')) {
    await updateStatus('preparing')
  }
}

const handleCancel = () => {
  selectedCancelReason.value = ''
  showCancelModal.value = true
}

const confirmCancel = async () => {
  if (!selectedCancelReason.value) return;
  await updateStatus('cancelled', selectedCancelReason.value)
  showCancelModal.value = false;
}

const handleDelete = async () => {
  const idStr = String(orderId).slice(-6).toUpperCase();
  if (!confirm(`Sipariş #${idStr} kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`)) return;

  try {
    const res = await apiFetch(`/api/orders/${orderId}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      router.push('/orders');
    } else {
      alert('Sipariş silinemedi: ' + (data.message || 'Hata oluştu'));
    }
  } catch (err) {
    console.error('Delete error:', err);
    alert('Silme işlemi sırasında bağlantı hatası oluştu.');
  }
}

const copyAutomationCode = () => {
  let kargo = 'Yurtiçi Kargo'
  let odeme = 'Havale'
  
  const pMethod = order.paymentMethod || ''
  if (pMethod.includes('Nakit')) {
    kargo = 'PTT Kargo'
    odeme = 'Kapıda Nakit'
  } else if (pMethod.includes('Kart')) {
    kargo = 'Yurtiçi Kargo'
    odeme = 'Kapıda Kart'
  }
  
  const code = `
// 1. Telefon Numarası
const telefonInput = document.getElementById('custGsm');
if(telefonInput) telefonInput.value = ${JSON.stringify(order.phone)};

// 2. Yetkili
const yetkiliInput = document.getElementById('yetkili');
if(yetkiliInput) yetkiliInput.value = ${JSON.stringify(order.fullName)};

// 3. Sevk Adresi
const sevkAdresiInput = document.getElementById('sevkAdresi');
if(sevkAdresiInput) sevkAdresiInput.value = ${JSON.stringify(order.address)};

// 4. Kargo Firması Seçimi
const kargoSelect = document.getElementById('kargoFirma');
if(kargoSelect) kargoSelect.value = ${JSON.stringify(kargo)};

// 5. Ödeme Şekli Seçimi
const odemeSelect = document.getElementById('odemeSekli');
if(odemeSelect) odemeSelect.value = ${JSON.stringify(odeme)};

// Event Tetikleme
[telefonInput, yetkiliInput, sevkAdresiInput, kargoSelect, odemeSelect].forEach(el => {
    if(el) {
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('input', { bubbles: true }));
    }
});
  `.trim()

  navigator.clipboard.writeText(code)
  alert('Otomasyon kodu kopyalandı! Diğer sistemin konsoluna yapıştırabilirsiniz.')
}

const handleSave = async (silent = false) => {
  if (!silent) loading.value = true
  autoSaveStatus.value = 'saving'
  
  try {
    const res = await apiFetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: order.fullName,
          phone: order.phone,
          province: order.province,
          district: order.district,
          address: order.address,
          status: order.status,
          futureDate: order.futureDate,
          items: order.items,
          quantity: order.items.reduce((sum, item) => sum + (item.qty || 0), 0),
          totalPrice: totalAmount.value
        })
      })
      const data = await res.json()
      if (data.success) {
        if (!silent) alert('Sipariş başarıyla kaydedildi!')
        autoSaveStatus.value = 'saved'
        if (!silent) await fetchLogs()
      } else {
        if (!silent) alert(data.message || 'Kayıt sırasında hata oluştu.')
        autoSaveStatus.value = 'idle'
      }
    } catch (error) {
    console.error('Kayıt hatası:', error)
    if (!silent) alert('Bağlantı hatası.')
    autoSaveStatus.value = 'idle'
  } finally {
    if (!silent) loading.value = false
    if (autoSaveStatus.value === 'saved') {
      setTimeout(() => {
        if (autoSaveStatus.value === 'saved') autoSaveStatus.value = 'idle'
      }, 3000)
    }
  }
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('tr-TR')
}
</script>

<style scoped>
/* Order Detail Overhaul Styles */
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  gap: 24px;
}

.detail-header-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s;
}

.back-btn:hover {
  color: #0f172a;
}

.title-with-status {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-with-status h2 {
  font-size: 28px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.5px;
}

.autosave-indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 99px;
  background: #f8fafc;
  color: #64748b;
  width: fit-content;
}

.autosave-indicator.saved {
  color: #15803d;
  background: #f0fdf4;
}

.presence-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #fff1f2;
  color: #be123c;
  padding: 6px 12px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid #ffe4e6;
  width: fit-content;
}

.pulse-dot {
  width: 8px;
  height: 8px;
  background-color: #be123c;
  border-radius: 50%;
  animation: pulse-presence 1.5s infinite;
}

@keyframes pulse-presence {
  0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(190, 18, 60, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(190, 18, 60, 0); }
  100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(190, 18, 60, 0); }
}

.detail-header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
}

.header-actions-group {
  display: flex;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 12px;
  gap: 4px;
}

.header-actions-group.secondary {
  background: transparent;
  padding: 0;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 700;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  white-space: nowrap;
}

.btn-primary { background: #0f172a; color: #fff; }
.btn-primary:hover { background: #1e293b; transform: translateY(-1px); }

.btn-automation {
  background: #f5f3ff;
  color: #6d28d9;
  border: 1px solid #ddd6fe;
}
.btn-automation:hover {
  background: #ede9fe;
  transform: translateY(-1px);
}

.btn-success { background: transparent; color: #15803d; }
.btn-success:hover { background: #dcfce7; color: #14532d; }

.btn-outline-danger { background: transparent; color: #be123c; }
.btn-outline-danger:hover { background: #fff1f2; color: #9f1239; }

/* Tabs */
.tabs-container {
  display: flex;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 12px;
  width: fit-content;
  margin-bottom: 24px;
  gap: 4px;
}

.tab-btn {
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  background: transparent;
  border: none;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover { color: #0f172a; }
.tab-btn.active {
  background: #fff;
  color: #0f172a;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

/* Cards */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.detail-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
}

.detail-card h3 {
  font-size: 14px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 20px;
}

/* Form Styles */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s;
  outline: none;
}

.form-input:focus {
  border-color: #3b82f6;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.05);
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
}

/* Cart Table Overhaul */
.cart-card {
  margin-top: 24px;
}

.cart-table-wrapper {
  border: 1.5px solid #f1f5f9;
  border-radius: 16px;
  overflow: hidden;
}

.cart-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.cart-table th {
  background: #f8fafc;
  padding: 16px 20px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1.5px solid #f1f5f9;
}

.cart-table td {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.total-cell-mini {
  font-size: 16px;
  font-weight: 700;
  color: #475569;
}

.qty-display {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 8px;
  width: fit-content;
}

.price-display {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.phone-input-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.phone-actions {
  display: flex;
  gap: 8px;
}

.phone-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border-radius: 12px;
  border: none;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.phone-btn.wp {
  background: #f0fdf4;
  color: #15803d;
}

.phone-btn.wp:hover {
  background: #dcfce7;
  transform: translateY(-1px);
}

.phone-btn.call {
  background: #eff6ff;
  color: #1d4ed8;
}

.phone-btn.call:hover {
  background: #dbeafe;
  transform: translateY(-1px);
}

/* Status Quick Update */
.status-quick-update {
  position: relative;
}

.btn-outline-status {
  background: #fff;
  border: 1px solid #e2e8f0;
  color: #475569;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.btn-outline-status:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.status-list-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 200px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 6px;
  z-index: 100;
  animation: slide-in-top 0.2s cubic-bezier(0, 0, 0.2, 1);
}

.status-list-item {
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.status-list-item:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.status-list-item.active {
  background: #eff6ff;
  color: #2563eb;
}

@keyframes slide-in-top {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.payment-method-display {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: #f5f7ff;
  border: 1.5px solid #e0e7ff;
  border-radius: 12px;
  color: #1e293b;
  font-size: 14px;
}

.order-info-card {
  border-top: 4px solid #f1f5f9;
}

.total-cell {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -1px;
}

/* Status Badges */
.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 700;
  border-radius: 99px;
  white-space: nowrap;
}

.status-pending, .status-1 { background: #fff7ed; color: #c2410c; }
.status-approved, .status-2 { background: #f0fdf4; color: #15803d; }
.status-preparing, .status-3 { background: #eff6ff; color: #1d4ed8; }
.status-shipped, .status-5 { background: #f5f3ff; color: #6d28d9; }
.status-cancelled, .status-9 { background: #fef2f2; color: #b91c1c; }

/* Modals */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.wp-modal {
  background: #fff;
  border-radius: 24px;
  width: 100%;
  box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  max-height: calc(100vh - 200px);
}

/* Spinner */
.spinner-mini {
  width: 14px;
  height: 14px;
  border: 2px solid #e2e8f0;
  border-top: 2px solid #64748b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (max-width: 1024px) {
  .detail-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .detail-header { flex-direction: column; align-items: flex-start; }
  .detail-header-right { align-items: flex-start; width: 100%; }
  .header-actions-group { width: 100%; }
  .btn { flex: 1; justify-content: center; }
}
/* Payment Toggles */
.qe-payment-toggles { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 5px; }
.qe-pay-btn {
  padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: all 0.2s; text-align: center; background: #fff;
}
.qe-pay-btn.nakit { color: #15803d; }
.qe-pay-btn.nakit.active { background: #dcfce7; border-color: #22c55e; box-shadow: 0 2px 4px rgba(34, 197, 94, 0.1); }
.qe-pay-btn.kart { color: #1d4ed8; }
.qe-pay-btn.kart.active { background: #dbeafe; border-color: #3b82f6; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1); }
.qe-pay-btn:hover:not(.active) { background: #f8fafc; border-color: #cbd5e1; }

.detail-pay-toggles { max-width: 300px; }

</style>

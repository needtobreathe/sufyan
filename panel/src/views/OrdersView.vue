<template>
  <AdminLayout pageTitle="Siparişler">
    <div class="orders-header">
      <div class="header-left">
        <h2>{{ filterTitle }}</h2>
        <span class="orders-count" v-if="searchQuery">
          {{ searchTotal.toLocaleString() }} sonuç bulundu
        </span>
        <span class="orders-count" v-else>
          {{ totalCountForCurrentFilter.toLocaleString() }} sipariş
        </span>
        <span class="update-ts" v-if="lastUpdateTime">Son Güncelleme: {{ lastUpdateTime.toLocaleTimeString() }}</span>
      </div>
      <div class="header-right">
        <div class="header-actions">
          <button class="header-action-btn wp-btn" @click="showWpModal = true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            <span class="btn-text">WP Numaraları</span>
          </button>

          <button class="header-action-btn mute-btn" @click="toggleMute" :title="isMuted ? 'Sesi Aç' : 'Sesi Kapat'">
            <svg v-if="isMuted" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
            <span class="btn-text">{{ isMuted ? 'Sesi Aç' : 'Sesi Kapat' }}</span>
          </button>

          <button class="header-action-btn export-btn" @click="exportToExcel">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span class="btn-text">Excel'e Aktar</span>
          </button>
          
          <div class="date-filter-wrap">
            <input type="date" v-model="selectedDate" class="header-date-input" />
            <button v-if="selectedDate" class="clear-date-btn" @click="selectedDate = ''" title="Filtreyi Temizle">
              &times;
            </button>
          </div>
        </div>

        <div class="search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input type="text" v-model="searchQuery" placeholder="Müşteri, telefon veya sipariş no..." />
        </div>
      </div>
    </div>

    <div class="table-card">
      <table class="data-table" v-if="totalCountForCurrentFilter > 0">
        <thead>
          <tr>
            <th style="width: 40px"></th>
            <th style="width: 120px">Sipariş No</th>
            <th style="width: 180px">Müşteri</th>
            <th>Site</th>
            <th>Ürünler</th>
            <th style="width: 150px">Durum</th>
            <th style="width: 250px">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="order in filteredOrders" :key="order.id">
            <tr :class="{ 'row-active': openQuickEdit === order.id }">
              <td class="quick-edit-cell">
                <div class="dropdown-wrapper">
                  <button 
                    :class="['quick-edit-btn', `qe-btn-${order.id}`]" 
                    @click.stop="toggleQuickEdit(order)" 
                    title="Hızlı Düzenle"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  
                  <Teleport to="body">
                    <div 
                      v-if="openQuickEdit === order.id" 
                      class="quick-edit-dropdown" 
                      :style="{ 
                        position: 'absolute', 
                        top: qePosition.top + 'px', 
                        left: qePosition.left + 'px',
                        zIndex: 999999
                      }" 
                      @click.stop
                    >
                      <div class="qe-header">
                        <span>Adres ve Ödeme Güncelle</span>
                        <button class="qe-close" @click="openQuickEdit = null">&times;</button>
                      </div>
                      
                      <div class="qe-body">
                        <div class="qe-form-group">
                          <label>Müşteri Adı</label>
                          <input type="text" v-model="quickEditData.fullName" />
                        </div>
                        <div class="qe-form-group">
                          <label>Telefon</label>
                          <input type="text" v-model="quickEditData.phone" />
                        </div>
                        
                        <div class="qe-row">
                          <div class="qe-form-group">
                            <label>İl</label>
                            <select v-model="quickEditData.province" @change="fetchDistrictsForQuickEdit">
                              <option value="">İl Seçin</option>
                              <option v-for="city in cities" :key="city.id" :value="city.id">{{ city.name }}</option>
                            </select>
                          </div>
                          <div class="qe-form-group">
                            <label>İlçe</label>
                            <select v-model="quickEditData.district">
                              <option value="">İlçe Seçin</option>
                              <option v-for="dist in qeDistricts" :key="dist.id" :value="dist.id">{{ dist.name }}</option>
                            </select>
                          </div>
                        </div>

                        <div class="qe-form-group">
                          <label>Adres</label>
                          <textarea v-model="quickEditData.address" rows="2"></textarea>
                        </div>


                      </div>
                      
                      <div class="qe-footer">
                        <button class="qe-save-btn" @click="saveQuickEdit" :disabled="isSavingQE">
                          {{ isSavingQE ? 'Kaydediliyor...' : 'Güncelle' }}
                        </button>
                      </div>
                    </div>
                  </Teleport>
                </div>
              </td>
              <td>
                <div class="order-no-col">
                  <div class="order-id">#{{ String(order.id).slice(-6).toUpperCase() }}</div>
                  <div class="order-date">{{ formatDate(order.date) }}</div>
                  <div class="order-time">{{ formatTime(order.date) }}</div>
                </div>
              </td>
              <td>
                <div v-if="getOrderViewer(order.id)" class="viewer-tag" :title="getOrderViewer(order.id) + ' şu an inceliyor'" style="display: block; margin-bottom: 4px;">
                  <span class="pulse-dot-mini"></span>
                  {{ getOrderViewer(order.id) }}
                </div>
                <div class="customer-name"><strong>{{ order.customer }}</strong></div>
                <div class="customer-phone">{{ isLockedByOther(order.id) ? maskPhone(order.phone) : order.phone }}</div>
              </td>
              <td>
                <div class="site-col">
                  <div class="site-referer" v-if="order.referer">{{ order.referer }}</div>
                  <div class="site-subdomain">{{ order.site_id }}</div>
                </div>
              </td>
              <td>
                <div class="product-list-compact">
                  <div v-for="(item, i) in order.items" :key="i" class="product-item-compact">
                    <span class="p-name">{{ resolveProductName(order, item) }}</span>
                    <span class="p-qty">x{{ resolveProductQty(order, item) }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="status-col">
                  <span :class="['status-badge', 'status-' + order.status]">
                    {{ statusLabels[order.status] }}
                  </span>
                  <div class="time-ago-text">{{ timeAgo(order.date) }}</div>
                  <div v-if="order.processedBy" class="status-attribution">
                    {{ order.processedBy }}
                  </div>
                </div>
              </td>
              <td>
                <div class="actions" :class="{ 'is-locked': isLockedByOther(order.id) }">
                  <button 
                    class="action-btn action-view" 
                    :disabled="isLockedByOther(order.id)"
                    @click="!isLockedByOther(order.id) && $router.push('/orders/' + order.id + (order.isLegacy ? '?source=legacy' : ''))"
                  >
                    Görüntüle
                  </button>
                  
                  <button v-if="order.status === 'pending' || order.status === '1'" 
                          class="action-btn action-approve" 
                          :disabled="isLockedByOther(order.id)"
                          @click.stop="approveOrder(order)">
                    Onayla
                  </button>

                  <button v-if="order.status === 'approved' || order.status === '2'" 
                          class="action-btn action-approve" 
                          :disabled="isLockedByOther(order.id)"
                          @click.stop="prepareOrder(order)">
                    Hazırla
                  </button>

                  <button v-if="order.status !== 'cancelled'" 
                          class="action-btn action-cancel" 
                          :disabled="isLockedByOther(order.id)"
                          @click.stop="cancelOrder(order)">
                    İptal
                  </button>

                  <button class="action-btn action-delete" 
                          :disabled="isLockedByOther(order.id)"
                          @click.stop="deleteOrder(order)">
                    Sil
                  </button>

                  <button class="action-btn action-whatsapp" 
                          :disabled="isLockedByOther(order.id)"
                          @click.stop="buildWhatsAppLink(order)">
                    WhatsApp
                  </button>

                  <button class="action-btn action-call" 
                          :disabled="isLockedByOther(order.id)"
                          @click.stop="makeCall(order.phone)">
                    Ara
                  </button>
                </div>
              </td>
            </tr>
            
          </template>
        </tbody>
      </table>


      <div v-if="filteredOrders.length === 0 && !isLoading" class="empty-table">Bu kategoride sipariş bulunamadı.</div>
      <div v-if="isLoading && filteredOrders.length === 0" class="loading-overlay">
        <div class="spinner"></div>
        <span>Yükleniyor...</span>
      </div>
      
      <div v-if="totalPages > 1" class="pagination-container">
        <button 
          class="pagination-btn prev" 
          :disabled="currentPage === 1" 
          @click="goToPage(currentPage - 1)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        
        <div class="pagination-pages">
          <button 
            v-for="p in displayedPages" 
            :key="p"
            class="pagination-btn" 
            :class="{ active: p === currentPage, dots: p === '...' }"
            :disabled="p === '...'"
            @click="p !== '...' && goToPage(p)"
          >
            {{ p }}
          </button>
        </div>

        <button 
          class="pagination-btn next" 
          :disabled="currentPage === totalPages" 
          @click="goToPage(currentPage + 1)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- WhatsApp Numbers Modal -->
    <div v-if="showWpModal" class="modal-overlay" @click.self="showWpModal = false">
      <div class="wp-modal">
        <div class="modal-header">
          <h3>WhatsApp Numaraları</h3>
          <button class="close-btn" @click="showWpModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="wp-status-summary" v-if="currentActiveWp || legacyActiveWp">
            <div class="summary-header">Panel Durumları</div>
            <div class="summary-grid">
              <div class="summary-card" :class="{ 'is-active': currentActiveWp === legacyActiveWp && currentActiveWp }">
                <div class="card-label">Aktif Numara</div>
                <div class="card-value">{{ currentActiveWp || 'Ayarlanmamış' }}</div>
                <div class="card-indicator ours"></div>
              </div>
            </div>
            <div v-if="currentActiveWp && legacyActiveWp && currentActiveWp !== legacyActiveWp" class="sync-warning">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Paneller arası numara uyuşmazlığı var!
            </div>
          </div>

          <div class="wp-list-header">Numara Seçimi</div>
          <div class="wp-list">
            <div v-for="user in wpUsers" :key="user.id" class="wp-item">
              <div class="wp-info">
                <span class="wp-name">{{ user.ad_soyad }}</span>
                <span class="wp-num">{{ user.wp_numara }}</span>
              </div>
              <div class="wp-actions">
                <span v-if="user.wp_numara === currentActiveWp || user.wp_numara === legacyActiveWp" 
                      :class="['wp-status-badge', getWpStatusClass(user.wp_numara)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {{ getWpStatusText(user.wp_numara) }}
                </span>
                <button v-else class="wp-activate-btn" @click="exclusiveActivate(user)" :disabled="savingWp">
                  {{ savingWp === user.id ? '...' : 'Aktif Et' }}
                </button>
              </div>
            </div>
            <div v-if="wpUsers.length === 0" class="empty-wp">
              WP Numarası olan kullanıcı bulunamadı.
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="action-btn" @click="copyAllNumbers" :disabled="wpUsers.length === 0 || savingWp">
            Tümünü Kopyala
          </button>
          <button class="primary-btn" @click="showWpModal = false">Kapat</button>
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
        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 12px;">
          <button class="primary-btn" @click="showCancelModal = false" style="background: #f1f5f9; color: #475569;">Vazgeç</button>
          <button class="primary-btn" :disabled="!selectedCancelReason" @click="confirmCancel" style="background: #ef4444; color: #fff;">İptal Et</button>
        </div>
      </div>
    </div>


    <ShipmentModal 
      :isOpen="showShipmentModal" 
      @close="showShipmentModal = false"
      @success="fetchOrders"
    />
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { apiFetch } from '@/utils/fetch'
import AdminLayout from '../components/AdminLayout.vue'
import ShipmentModal from '../components/ShipmentModal.vue'
import { orderStore } from '../store/orderStore'
import * as XLSX from 'xlsx'

const route = useRoute()

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
  '2': 'Onaylandı',
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

const paymentMethods = [
  { id: 1, label: 'Nakit (Kapıda Ödeme)' },
  { id: 2, label: 'Kredi Kartı (Kapıda Ödeme)' },
]

const cities = ref([])
const districts = ref([])

const isSaving = ref(false)

// Edit form states
const editForm = reactive({
  province: '',
  district: '',
  address: '',
  paymentMethod: ''
})

// Quick Edit States
const openQuickEdit = ref(null)
const qeDistricts = ref([])
const isSavingQE = ref(false)
const quickEditData = reactive({
  id: null,
  fullName: '',
  phone: '',
  address: '',
  province: '',
  district: '',
  paymentMethod: ''
})

const toggleQuickEdit = async (order) => {
  if (openQuickEdit.value === order.id) {
    openQuickEdit.value = null
    return
  }
  
  // Calculate position
  const btn = document.querySelector(`.qe-btn-${order.id}`)
  if (btn) {
    const rect = btn.getBoundingClientRect()
    qePosition.value = {
      top: rect.bottom + window.scrollY + 5,
      left: rect.left + window.scrollX
    }
  }

  openQuickEdit.value = order.id
  quickEditData.id = order.id
  quickEditData.fullName = order.customer
  quickEditData.phone = order.phone
  // The current order object has combined address: `${o.province} / ${o.district || ''} - ${o.address}`
  // We need the raw data from the original order record if possible.
  // Let's fetch the full order details to be accurate
  try {
    const res = await apiFetch(`/api/orders/${order.id}`)
    const data = await res.json()
    if (data.success) {
      const o = data.order
      quickEditData.fullName = o.fullName
      quickEditData.phone = o.phone
      quickEditData.address = o.address
      const foundCity = cities.value.find(c => c.name === o.province || c.id == o.province)
      quickEditData.province = foundCity ? foundCity.id : o.province || ''
      
      if (quickEditData.province) {
        await fetchDistrictsForQuickEdit()
        const foundDist = qeDistricts.value.find(d => d.name === o.district || d.id == o.district)
        quickEditData.district = foundDist ? foundDist.id : o.district || ''
      } else {
        quickEditData.district = o.district || ''
      }
      quickEditData.paymentMethod = o.paymentMethod || 'Kapıda Nakit'
    }
  } catch (err) {
    console.error('Sipariş detayları alınamadı:', err)
  }

  openQuickEdit.value = order.id
}

const fetchDistrictsForQuickEdit = async () => {
  if (!quickEditData.province) {
    qeDistricts.value = []
    return
  }
  try {
    const res = await apiFetch(`/api/districts?city_id=${quickEditData.province}`)
    const data = await res.json()
    if (data.success) {
      qeDistricts.value = data.districts || []
    }
  } catch (err) {
    console.error('İlçeler yüklenemedi:', err)
  }
}

const saveQuickEdit = async () => {
  isSavingQE.value = true
  try {
    const cityName = cities.value.find(c => c.id == quickEditData.province)?.name || quickEditData.province
    const districtName = qeDistricts.value.find(d => d.id == quickEditData.district)?.name || quickEditData.district

    const response = await apiFetch(`/api/orders/${quickEditData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: quickEditData.fullName,
        phone: quickEditData.phone,
        address: quickEditData.address,
        province: cityName,
        district: districtName,
        paymentMethod: quickEditData.paymentMethod
      })
    })
    
    const data = await response.json()
    if (data.success) {
      openQuickEdit.value = null
      await fetchOrders(null, false, true) // Refresh list silently
    } else {
      alert(data.message || 'Hata oluştu')
    }
  } catch (error) {
    alert('İşlem başarısız oldu')
  } finally {
    isSavingQE.value = false
  }
}

const citySearch = ref('')
const showCityList = ref(false)




const handleStatusSelect = async (order, newStatus) => {

  if (order.status === newStatus) return
  
  if (newStatus === 'cancelled') {
    await cancelOrder(order)
  } else if (newStatus === 'future') {
    await setFutureDate(order)
  } else {
    if (confirm(`Sipariş durumunu "${statusLabels[newStatus]}" olarak değiştirmek istediğinize emin misiniz?`)) {
      await updateOrderStatus(order.id, newStatus)
    }
  }
}

const selectableStatuses = computed(() => {
  const selectedStatuses = [
    { key: 'pending', label: 'Yeni Sipariş' },
    { key: 'approved', label: 'Onaylandı' },
    { key: 'preparing', label: 'Hazırlanıyor' },
    { key: 'facebook', label: 'Facebook DM' },
    { key: 'instagram', label: 'Instagram DM' },
    { key: 'shipped', label: 'Kargolandı' },
    { key: 'delivered', label: 'Teslim Edildi' },
    { key: 'returned', label: 'İade' },
    { key: '13', label: 'Ulaşılamayanlar' }
  ]
  return selectedStatuses
})

let heartbeatId = null






const districtSearch = ref('')
const showDistrictList = ref(false)
const qePosition = ref({ top: 0, left: 0 })

const handleGlobalClick = (e) => {
  if (openQuickEdit.value && !e.target.closest('.quick-edit-dropdown') && !e.target.closest('.quick-edit-btn')) {
    openQuickEdit.value = null
  }
}


const orders = ref([])
const leafPages = ref([])
const legacyOrders = ref([])
const searchQuery = ref('')
const selectedDate = ref('')

const currentPage = ref(1)
const totalPages = ref(1)
const totalItems = ref(0)
const hasMore = ref(false)
const isLoading = ref(false)

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR')
}

const formatTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

const timeAgo = (date) => {
  if (!date) return ''
  const now = new Date()
  const d = new Date(date)
  const diffInMs = now - d
  
  if (diffInMs < 0) return 'Az önce' // Handle future dates/clock skew
  
  const diffInMin = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  
  if (diffInMin < 1) return 'Az önce'
  if (diffInMin < 60) return `${diffInMin} dk önce`
  if (diffInHours < 24) {
    const mins = diffInMin % 60
    return mins > 0 ? `${diffInHours} sa ${mins} dk önce` : `${diffInHours} sa önce`
  }
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} gün önce`
}
const loadingMore = ref(false)
const searchTotal = ref(0)
const debouncedSearch = ref(null)
const pollInterval = ref(null)
const lastOrderId = ref(null)
const lastUpdateTime = ref(new Date())
const showPaymentModal = ref(false)
const selectedPaymentOrder = ref(null)
const transitioningOrders = reactive(new Map())
const activeMobileActions = ref(null)
const activeLocks = ref([])
const showShipmentModal = ref(false)
let locksInterval = null
const users = ref([])
const showWpModal = ref(false)
const savingWp = ref(null)
const currentActiveWp = ref('')
const legacyActiveWp = ref('')
const showCancelModal = ref(false)
const cancelOrderId = ref(null)
const selectedCancelReason = ref('')
const cancelReasons = [
  'Müşteri vazgeçti',
  'Mükerrer sipariş / Yanlış sipariş',
  'Fiyat / Kargo bedeli pahalı geldi',
  'Farklı satıcıdan aldı',
  'Ulaşılamıyor',
  'Stok yok'
]
const isMuted = ref(localStorage.getItem('notification_muted') === 'true')

const toggleMute = () => {
  isMuted.value = !isMuted.value
  localStorage.setItem('notification_muted', isMuted.value)

  if (!isMuted.value && 'Notification' in window) {
    if (Notification.permission !== 'granted') {
      Notification.requestPermission()
    }
  }
}

const currentUser = computed(() => {
  const user = localStorage.getItem('admin_user')
  return user ? JSON.parse(user) : { fullName: 'Bilinmiyor' }
})

const activeLocksMap = computed(() => {
  const map = {}
  activeLocks.value.forEach(l => {
    map[l.orderId] = l
  })
  return map
})

const isLockedByOther = (orderId) => {
  const lock = activeLocksMap.value[orderId]
  if (!lock) return false
  // Compare by fullName as the backend uses fullName for userName in lock
  return lock.userName !== currentUser.value.fullName && lock.userName !== currentUser.value.ad_soyad
}

const maskPhone = (phone) => {
  if (!phone) return '-';
  const clean = phone.replace(/\s+/g, '');
  if (clean.length < 7) return phone;
  // Format: 05** *** ** **
  return clean.substring(0, 4) + ' ** *** ** **';
}

// Watch for route query changes (filter or page)
watch(() => route.query, async (newQuery, oldQuery) => {
  if (newQuery.filter !== oldQuery.filter || newQuery.page !== oldQuery.page) {
    currentPage.value = parseInt(newQuery.page) || 1
    await fetchOrders(currentPage.value)
  }
}, { deep: true })

onMounted(() => {

})

const wpUsers = computed(() => {
  return users.value.filter(u => u.wp_numara && u.wp_numara.trim() !== '')
})

const toggleMobileActions = (orderId) => {
  if (activeMobileActions.value === orderId) activeMobileActions.value = null
  else activeMobileActions.value = orderId
}

const fetchSettings = async () => {
  try {
    const res = await apiFetch('/api/settings')
    const data = await res.json()
    if (data.success) {
      currentActiveWp.value = data.settings.active_wp_number || ''
      legacyActiveWp.value = data.settings.legacy_active_wp || ''
    }
  } catch (error) {
    console.error('Ayarlar yüklenemedi:', error)
  }
}

const fetchUsers = async () => {
  try {
    const res = await apiFetch('/api/users')
    const data = await res.json()
    if (data.success) {
      users.value = data.users || []
    }
  } catch (error) {
    console.error('Kullanıcılar yüklenemedi:', error)
  }
}

const copyAllNumbers = () => {
  const numbers = wpUsers.value.map(u => u.wp_numara).join('\n')
  navigator.clipboard.writeText(numbers).then(() => {
    alert('Numaralar kopyalandı!')
  })
}

const exclusiveActivate = async (selectedUser) => {
  savingWp.value = selectedUser.id
  try {
    const res = await apiFetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'active_wp_number', value: selectedUser.wp_numara })
    })
    const data = await res.json()
    
    if (data.success) {
      currentActiveWp.value = selectedUser.wp_numara
      legacyActiveWp.value = selectedUser.wp_numara // Sycned successfully
    }
  } catch (error) {
    console.error('Aktivasyon hatası:', error)
    alert('İşlem sırasında bir hata oluştu')
  } finally {
    savingWp.value = null
  }
}

const getWpStatusClass = (num) => {
  if (num === currentActiveWp.value && num === legacyActiveWp.value) return 'status-both'
  if (num === currentActiveWp.value) return 'status-ours'
  if (num === legacyActiveWp.value) return 'status-legacy'
  return ''
}

const getWpStatusText = (num) => {
  if (num === currentActiveWp.value && num === legacyActiveWp.value) return 'İki Panelde de Aktif'
  if (num === currentActiveWp.value) return 'Aktif'
  if (num === legacyActiveWp.value) return 'Aktif'
  return 'Aktif Edildi'
}
// Legacy API constants removed

onMounted(async () => {
  // Request Browser Notification Permission
  if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission()
  }

  await Promise.all([
    fetchOrders(), 
    fetchLeafPages(),

    fetchSettings(),
    fetchUsers(),
    fetchCities()
  ])
  
  // Set initial page from URL
  if (route.query.page) {
    currentPage.value = parseInt(route.query.page)
  }
  
  await fetchOrders(currentPage.value)
  
  // Setup auto-polling every 5 seconds (Reduced from 30s)
  pollInterval.value = setInterval(() => {
    // Always update counts regardless of page
    orderStore.fetchCounts()
    
    // Only update order list automatically if on page 1
    if (currentPage.value === 1 && !searchQuery.value) {
      fetchOrders(1, false, true)
    }
  }, 5000)

  // Start polling for locks every 5 seconds for real-time accuracy
  fetchLocks()
  locksInterval = setInterval(fetchLocks, 5000)

  document.addEventListener('click', handleGlobalClick)
})

onUnmounted(() => {
  if (pollInterval.value) clearInterval(pollInterval.value)
  if (locksInterval) clearInterval(locksInterval)
  if (heartbeatId) clearInterval(heartbeatId)
  document.removeEventListener('click', handleGlobalClick)
})

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

const fetchLocks = async () => {
  try {
    const res = await apiFetch('/api/orders/locks')
    const data = await res.json()
    if (data.success) {
      activeLocks.value = data.locks || []
    }
  } catch (err) {
    console.error('Locks fetch error:', err)
  }
}

const getOrderViewer = (orderId) => {
  const lock = activeLocks.value.find(l => l.orderId === String(orderId))
  return lock ? lock.userName : null
}





const fetchOrders = async (page = null, append = false, silent = false) => {
  const targetPage = Math.max(1, page || currentPage.value || 1)
  const prevMaxId = lastOrderId.value
  
  try {
    if (!append && !silent) {
      isLoading.value = true
    }
    
    if (page !== null) {
      currentPage.value = page
    }

    const searchParam = searchQuery.value ? `&search=${encodeURIComponent(searchQuery.value)}` : ''
    const dateParam = selectedDate.value ? `&date=${selectedDate.value}` : ''
    const productParam = route.query.product ? `&product=${encodeURIComponent(route.query.product)}` : ''
    
    // Map filter to backend status
    const filter = route.query.filter
    const mapping = {
      new: 'pending',
      pending: 'pending',
      approved: 'approved',
      preparing: 'preparing',
      shipped: 'shipped',
      'to-ship': 'preparing,social,facebook,instagram',
      social: 'social,facebook,instagram',
      instagram: 'instagram',
      facebook: 'facebook',
      ulasilamayan: 'ulasilamayan',
      cancelled: 'cancelled',
      future: 'future',
      test: 'test',
      delivered: 'delivered',
      returned: 'returned'
    }
    const statusVal = mapping[filter] || ''
    const statusParam = statusVal ? `&status=${statusVal}` : ''

    const res = await apiFetch(`/api/orders?page=${targetPage}&limit=50${searchParam}${statusParam}${dateParam}${productParam}`)
    const data = await res.json()

    if (data.success) {
      const mapped = data.orders.map(o => ({
        id: o._id,
        customer: o.fullName,
        phone: o.phone,
        address: `${o.province} / ${o.district || ''} - ${o.address}`,
        paymentMethod: o.paymentMethod,
        items: o.items || [{ name: 'Ürün Adı', qty: 1 }], 
        status: o.status || 'pending',
        date: o.createdAt,
        referer: o.referer || '',
        site_id: o.site_id || '',
        isTest: o.status === 'test',

        total: o.totalPrice || 0,
        note: '',
        processedBy: o.processedBy,
        processedAt: o.processedAt,
        isLegacy: false
      }))

      if (append) {
        orders.value = [...orders.value, ...mapped]
      } else {
        orders.value = mapped
      }

      totalPages.value = data.totalPages || 1
      totalItems.value = data.total || 0
      hasMore.value = (data.currentPage < data.totalPages)
      searchTotal.value = data.total || 0

      // Update last seen ID and notify if new (only on page 1)
      if (targetPage === 1 && orders.value.length > 0) {
        const currentMaxId = orders.value[0].id
        if (prevMaxId && currentMaxId !== prevMaxId && silent) {
          playNewOrderSound()
          showBrowserNotification(orders.value[0])
        }
        lastOrderId.value = currentMaxId
      }
    }
  } catch (e) { 
    console.error("Siparişler çekilemedi", e) 
  } finally {
    isLoading.value = false
    lastUpdateTime.value = new Date()
    orderStore.fetchCounts()
  }
}

const playNewOrderSound = () => {
  if (isMuted.value) return
  try {
    // Simple notification sound
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3')
    audio.play()
  } catch (e) {
    console.warn("Ses dosyası oynatılamadı (browser engeli olabilir)", e)
  }
}

const showBrowserNotification = (order) => {
  console.log("[Notification] Deneniyor...", order.customer);
  if (isMuted.value) { console.log("[Notification] Kapalı (Muted)"); return; }
  if (!('Notification' in window)) { console.log("[Notification] Browser desteklemiyor"); return; }
  
  console.log("[Notification] İzin durumu:", Notification.permission);
  if (Notification.permission === 'granted') {
    const title = '📦 Yeni Sipariş Geldi!'
    const formatCurrency = (val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val)
    const itemsList = (order.items || []).map(i => `${i.qty}x ${i.name}`).join(', ')
    
    const options = {
      body: `${order.customer} - ${formatCurrency(order.total)}\nÜrünler: ${itemsList}`,
      icon: 'https://cdn.myikas.com/images/theme-images/97987e86-d147-4b63-a081-34e07894d6f5/image_180.webp',
      badge: 'https://cdn.myikas.com/images/theme-images/97987e86-d147-4b63-a081-34e07894d6f5/image_180.webp',
      tag: 'new-order-' + order.id,
      vibrate: [200, 100, 200],
      data: { url: '/orders?filter=new' }
    }

    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      console.log("[Notification] Service Worker üzerinden gönderiliyor...");
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, options).then(() => {
          console.log("[Notification] SW Bildirimi başarıyla tetiklendi");
        });
      });
    } else {
      console.log("[Notification] Standart pencere bildirimi olarak gönderiliyor...");
      new Notification(title, options);
    }
  }
}

const testNotificationManual = () => {
  if (Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        alert("Bildirim izni verildi! Lütfen tekrar 'Test Et' butonuna basın.");
      } else {
        alert("Bildirim izni reddedildi. Lütfen tarayıcı ayarlarından izni açın.");
      }
    });
    return;
  }

  alert("Test başlatıldı! 5 saniye içinde bildirimi göndereceğim. Lütfen şimdi ekranı kilitleyin veya uygulamadan çıkıp bekleyin.");
  
  setTimeout(() => {
    showBrowserNotification({
      id: 'test',
      customer: 'Test Kullanıcısı',
      total: 999,
      items: [{ name: 'Test Ürünü', qty: 1 }]
    });
  }, 5000);
}

const goToPage = async (page) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  
  // Update URL
  const query = { ...route.query, page: page }
  router.push({ query })
  
  window.scrollTo({ top: 0, behavior: 'smooth' })
  await fetchOrders(page)
}

const displayedPages = computed(() => {
  const current = currentPage.value
  const total = totalPages.value
  const delta = 2
  const left = current - delta
  const right = current + delta + 1
  const range = []
  const rangeWithDots = []
  let l

  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= left && i < right)) {
      range.push(i)
    }
  }

  for (const i of range) {
    if (l) {
      if (i - l === 2) {
        rangeWithDots.push(l + 1)
      } else if (i - l !== 1) {
        rangeWithDots.push('...')
      }
    }
    rangeWithDots.push(i)
    l = i
  }

  return rangeWithDots
})

const fetchCities = async () => {
  try {
    const res = await apiFetch('/api/cities')
    const d = await res.json()
    if (d.success) {
      cities.value = d.cities.sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    }
  } catch (e) { console.error("Cities fetch error:", e) }
}

const fetchDistricts = async (cityId) => {
  if (!cityId) return
  try {
    const res = await apiFetch(`/api/districts?city_id=${cityId}`)
    const d = await res.json()
    if (d.success) {
      districts.value = d.districts.sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    }
  } catch (e) { console.error("Districts fetch error:", e) }
}

const filteredCities = computed(() => {
  if (!citySearch.value) return cities.value
  const s = citySearch.value.toLocaleLowerCase('tr')
  return cities.value.filter(c => c.name.toLocaleLowerCase('tr').includes(s))
})

const filteredDistricts = computed(() => {
  if (!districtSearch.value) return districts.value
  const s = districtSearch.value.toLocaleLowerCase('tr')
  return districts.value.filter(d => d.name.toLocaleLowerCase('tr').includes(s))
})

const selectCity = async (c, order) => {
  editForm.province = c.id
  citySearch.value = c.name
  showCityList.value = false
  editForm.district = 0
  districtSearch.value = ''
  await fetchDistricts(c.id)
  await handleSaveOrder(order, true)
}

const selectDistrict = async (d, order) => {
  editForm.district = d.id
  districtSearch.value = d.name
  showDistrictList.value = false
  await handleSaveOrder(order, true)
}



const handleSaveOrder = async (order, auto = false) => {
  isSaving.value = order.id
  try {
    let payload = {
      province: cities.value.find(c => c.id === editForm.province)?.name || '',
      district: districts.value.find(d => d.id === editForm.district)?.name || '',
      address: editForm.address,
      paymentMethod: paymentMethods.find(p => p.id === editForm.paymentMethod)?.label || 'Nakit'
    }
    const res = await apiFetch(`/api/orders/${order.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    const d = await res.json()
    if (!d.success) throw new Error(d.message)

    // Update local state
    const target = orders.value.find(o => o.id === order.id)
    if (target) {
      target.address = `${citySearch.value} / ${districtSearch.value} - ${editForm.address}`
      target.city = citySearch.value
      target.district = districtSearch.value
      target.fullAddress = editForm.address
      target.paymentMethod = paymentMethods.find(p => p.id === editForm.paymentMethod)?.label
      target.provinceId = editForm.province
      target.districtId = editForm.district
    }

    if (!auto) {}
  } catch (err) {
    console.error('Save error:', err)
    alert('Hata: ' + err.message)
  } finally {
    isSaving.value = false
  }
}

const exportToExcel = async () => {
  if (route.query.filter === 'to-ship') {
    // Varsayılan sevk ekranı modali mevcutsa çalışır. (Aksi takdirde direkt indirilir)
    if (typeof showShipmentModal !== 'undefined') {
        showShipmentModal.value = true;
        return;
    }
  }

  isLoading.value = true
  try {
    const filter = route.query.filter || ''
    const searchQueryStr = searchQuery.value || ''
    
    const searchParam = searchQueryStr ? `&search=${encodeURIComponent(searchQueryStr)}` : ''
    let dateParam = ''
    if (selectedDate.value) {
      dateParam = `&date=${selectedDate.value}`
    }
    const productParam = route.query.product ? `&product=${encodeURIComponent(route.query.product)}` : ''

    const mapping = {
      new: 'pending',
      pending: 'pending',
      approved: 'approved',
      preparing: 'preparing',
      shipped: 'shipped',
      'to-ship': 'preparing,social,facebook,instagram',
      social: 'social,facebook,instagram',
      instagram: 'instagram',
      facebook: 'facebook',
      ulasilamayan: 'ulasilamayan',
      cancelled: 'cancelled',
      future: 'future',
      test: 'test'
    }
    const statusVal = mapping[filter] || ''
    const statusParam = statusVal ? `&status=${statusVal}` : ''

    // Fetch up to 10.000 orders depending on current filter
    const res = await apiFetch(`/api/orders?page=1&limit=10000${searchParam}${statusParam}${dateParam}${productParam}`)
    const result = await res.json()

    if (!result.success || !result.orders || result.orders.length === 0) {
      alert("Şu anki filtreye uygun aktarılacak sipariş bulunamadı.")
      return
    }

    let filteredForExport = result.orders



    const data = filteredForExport.map(o => ({
      "Ad Soyad": o.fullName || '-',
      "Telefon Numarası": o.phone || '-',
      "İl": o.province || '-',
      "İlçe": o.district || '-',
      "Adres": o.address || '-',
      "Ürün": (o.items || []).map(i => `${i.qty} adet ${i.name}`).join('; '),
      "Fiyat": o.totalPrice || '0',
      "Ödeme yöntemi": o.paymentMethod || '-',
      "Durum": o.status || '-',
      "Tarih": new Date(o.createdAt).toLocaleString('tr-TR')
    }))

    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Siparişler")

    const timestamp = new Date().toISOString().slice(0, 10)
    const fileName = filter ? `${filter}_siparisler_${timestamp}` : `tum_siparisler_${timestamp}`
    XLSX.writeFile(workbook, `${fileName}.xlsx`)

  } catch (err) {
    console.error("Excel export error:", err)
    alert("Excel dosyası oluşturulurken bir hata oluştu.")
  } finally {
    isLoading.value = false
  }
}

watch(searchQuery, (val) => {
  if (debouncedSearch.value) clearTimeout(debouncedSearch.value)
  debouncedSearch.value = setTimeout(() => {
    fetchOrders(1)
  }, 500)
})

watch(selectedDate, () => {
  currentPage.value = 1
  fetchOrders(1)
})

watch(() => route.query, () => {
  fetchOrders(1)
}, { deep: true })

// mapLegacyStatus fully removed

const filterTitle = computed(() => {
  if (route.query.product) return `Ürün Siparişi: ${route.query.product}`
  const f = route.query.filter
  const titles = { 
    new: 'Yeni Siparişler', 
    preparing: 'Hazırlanıyor', 
    social: 'Social DM',
    instagram: 'Instagram DM',
    facebook: 'Facebook DM',
    'to-ship': 'Kargoya Verilecekler',
    cancelled: 'İptal Edilen Siparişler',
    future: 'İleri Tarihli Siparişler',
    ulasilamayan: 'Ulaşılamayan Siparişler',
    shipped: 'Kargoya Verilen Siparişler',
    delivered: 'Tamamlanan Siparişler',
    returned: 'İade Siparişler',
    approved: 'Onaylanan Siparişler'
  }
  return titles[f] || 'Tüm Siparişler'
})

const isToShip = computed(() => route.query.filter === 'to-ship')
const isApproved = computed(() => route.query.filter === 'approved')

const totalCountForCurrentFilter = computed(() => {
  if (route.query.product) {
    const pc = orderStore.counts.productCounts?.find(p => p.name === route.query.product)
    return pc ? pc.count : 0
  }
  const f = route.query.filter
  if (!f) return orderStore.counts.total
  if (f === 'to-ship') return orderStore.counts.toShip
  return orderStore.counts[f] || 0
})

const filteredOrders = computed(() => {
  let result = orders.value

  if (route.query.product) {
    const prodLower = route.query.product.toLowerCase()
    result = result.filter(o => o.items && o.items.some(i => {
      const resolvedName = resolveProductName(o, i).toLowerCase()
      return resolvedName.includes(prodLower)
    }))
  }

  const f = route.query.filter
  if (f) {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (f) {
      case 'new':
        result = result.filter(o => o.status === 'pending' || o.status === '1')
        break
      case 'approved':
        result = result.filter(o => o.status === 'approved' || o.status === '2')
        break
      case 'preparing':
        result = result.filter(o => o.status === 'preparing' || o.status === '3')
        break
      case 'social':
        result = result.filter(o => ['facebook', 'instagram', 'social', '14', '15'].includes(String(o.status)))
        break
      case 'instagram':
        result = result.filter(o => o.status === 'instagram' || o.status === '14')
        break
      case 'facebook':
        result = result.filter(o => o.status === 'facebook' || o.status === '15')
        break
      case 'cancelled':
        result = result.filter(o => ['cancelled', '9', '10', '11'].includes(String(o.status)))
        break
      case 'future':
        result = result.filter(o => o.status === 'future' || o.status === '16')
        break
      case 'ulasilamayan':
        result = result.filter(o => o.status === 'ulasilamayan' || o.status === '13')
        break
      case 'shipped':
        result = result.filter(o => o.status === 'shipped' || o.status === '5')
        break
      case 'to-ship':
        result = result.filter(o => ['preparing', '3', 'facebook', 'instagram', 'social', '14', '15'].includes(String(o.status)))
        break
    }
  }



  return result
})

const updateOrderStatus = async (orderId, newStatus, extraData = null) => {
  try {
    const orderToUpdate = orders.value.find(o => o.id === orderId);
    if (!orderToUpdate) return;

    const oldStatus = orderToUpdate.status;
    orderToUpdate.status = newStatus; // Optimistic Update
    
    // Lock this status for background refreshes for 10 seconds
    transitioningOrders.set(orderId, newStatus);
    setTimeout(() => {
      transitioningOrders.delete(orderId);
    }, 10000); // 10s is enough for DB to propagate

    // Unified status update through backend proxy
    try {
      const res = await apiFetch(`/api/orders/${orderId}/status${orderToUpdate.isLegacy ? '?source=legacy' : ''}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          futureDate: newStatus === 'future' || newStatus === '16' ? (extraData || orderToUpdate.futureDate) : null,
          cancellationReason: newStatus === 'cancelled' ? extraData : null
        })
      });
      
      const data = await res.json();
      if (data.success) {
        fetchOrders(currentPage.value, false, true); // Sync current page
      } else {
        orderToUpdate.status = oldStatus; // Rollback
        alert(data.message || "Durum güncellenemedi.");
      }
    } catch (e) {
      orderToUpdate.status = oldStatus; // Rollback
      throw e;
    }
  } catch (error) {
    console.error("Durum güncellenirken hata oluştu", error);
  }
}

const approveOrder = async (order) => {
  try {
    const res = await apiFetch(`/api/orders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        paymentMethod: 'Kapıda Ödeme',
        status: 'preparing'
      })
    })
    const data = await res.json()
    if (data.success) {
      showPaymentModal.value = false
      selectedPaymentOrder.value = null
      fetchOrders(currentPage.value, false, true)
      orderStore.fetchCounts()
    } else {
      alert(data.message || "Hata oluştu.")
    }
  } catch (error) {
    console.error("Approval error:", error)
  }
}

const prepareOrder = async (order) => {
  if (confirm('Siparişi hazırlamaya almak istediğinize emin misiniz?')) {
    await updateOrderStatus(order.id, 'preparing');
  }
}

const cancelOrder = (order) => {
  cancelOrderId.value = order.id
  selectedCancelReason.value = ''
  showCancelModal.value = true
}

const confirmCancel = async () => {
  if (!selectedCancelReason.value) return;
  await updateOrderStatus(cancelOrderId.value, 'cancelled', selectedCancelReason.value);
  showCancelModal.value = false;
  cancelOrderId.value = null;
}

const setFutureDate = async (order) => {
  const date = prompt("İleri tarih seçin (YYYY-AA-GG):", new Date().toISOString().split('T')[0]);
  if (date) {
    await updateOrderStatus(order.id, 'future', date);
  }
}

const buildWhatsAppLink = (order) => {
    let paymentText = order.paymentMethod === 'kapida_nakit' ? 'Kapıda Nakit' : 'Kapıda Kredi Kartı';
    
    const productsText = order.items.map(item => `${item.qty} Adet ${item.name}`).join(', ');

    const message = `Sayın ${order.customer},

Sipariş bilgileriniz aşağıdadır:

Ad Soyad: ${order.customer}
Telefon: ${order.phone}
Adres: ${order.fullAddress || order.address}
Ürün: ${productsText}
Toplam Tutar: ${order.total} TL

Kapıda nakit mi kapıda kart mı ödeyeceksiniz?

Siparişinizi onaylamanız durumunda yarın kargoya verilecektir.`;

    const encodedMessage = encodeURIComponent(message);
    let targetPhone = order.phone.replace(/[^0-9]/g, '');
    if (targetPhone.startsWith('0')) targetPhone = '9' + targetPhone;
    else if (!targetPhone.startsWith('90')) targetPhone = '90' + targetPhone;

    window.open(`https://wa.me/${targetPhone}?text=${encodedMessage}`, '_blank');
}

const makeCall = (phone) => {
  if (!phone) return;
  const targetPhone = phone.replace(/[^0-9]/g, '');
  window.location.href = `tel:${targetPhone}`;
}

const deleteOrder = async (order) => {
  const idStr = String(order.id).slice(-6).toUpperCase();
  if (!confirm(`Sipariş #${idStr} kalıcı olarak silinsin mi? Bu işlem geri alınamaz.`)) return;

  try {
    const res = await apiFetch(`/api/orders/${order.id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      orders.value = orders.value.filter(o => o.id !== order.id);
      orderStore.fetchCounts();
    } else {
      alert('Sipariş silinemedi: ' + (data.message || 'Hata oluştu'));
    }
  } catch (err) {
    console.error('Delete error:', err);
    alert('Silme işlemi sırasında bağlantı hatası oluştu.');
  }
}
</script>

<style scoped>
.orders-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.orders-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #111;
  margin: 0;
}

.orders-count {
  font-size: 13px;
  color: #666;
}

.update-ts {
  font-size: 11px;
  color: #999;
}

.site-filter-select {
  padding: 6px 12px;
  font-size: 13px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  outline: none;
  min-width: 180px;
}

.site-tag {
  display: inline-block;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 600;
  background: #e3f2fd;
  color: #1565c0;
  border-radius: 4px;
  text-transform: lowercase;
}

.site-tag.none {
  background: #f5f5f5;
  color: #999;
}

.table-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin-top: 10px;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  min-width: 900px;
}

.data-table th {
  padding: 16px 20px;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: left;
  border-bottom: 1.5px solid #f1f5f9;
  background: #f8fafc;
  white-space: nowrap;
}

.data-table td {
  padding: 18px 20px;
  font-size: 14px;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  transition: background 0.2s ease;
}

.data-table tr:hover td {
  background: #fdfdfd;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td {
  background: #fafafa;
}

.order-id {
  font-weight: 600;
  color: #111;
  white-space: nowrap;
}

.order-id-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.time-ago-badge {
  font-size: 10px;
  font-weight: 600;
  color: #ef4444;
  background: #fef2f2;
  padding: 1px 4px;
  border-radius: 4px;
  width: fit-content;
}

.product-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.product-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  background: #f1f5f9;
  border-radius: 8px;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.product-qty {
  font-weight: 700;
  color: #0f172a;
}

.status-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.order-no-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.order-id {
  font-weight: 700;
  color: #1e293b;
  font-size: 14px;
}

.order-date, .order-time {
  font-size: 11px;
  color: #64748b;
}

.customer-name {
  font-size: 14px;
  color: #1e293b;
}

.customer-phone {
  font-size: 12px;
  color: #64748b;
}

.site-col {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.site-referer {
  font-size: 12px;
  font-weight: 600;
  color: #3b82f6;
}

.site-subdomain {
  font-size: 11px;
  color: #94a3b8;
}

.product-list-compact {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-item-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.p-name {
  color: #334155;
  font-weight: 500;
}

.p-qty {
  color: #64748b;
  font-weight: 700;
}

.time-ago-text {
  font-size: 11px;
  color: #ef4444;
  font-weight: 600;
  margin-top: 2px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 99px;
  white-space: nowrap;
  letter-spacing: 0.2px;
}

.status-pending, .status-1 { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
.status-approved, .status-2 { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
.status-preparing, .status-3 { background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
.status-paketlendi, .status-4 { background: #fdf4ff; color: #a21caf; border: 1px solid #fae8ff; }
.status-shipped, .status-5 { background: #f5f3ff; color: #6d28d9; border: 1px solid #ede9fe; }
.status-dagitimda, .status-6 { background: #f0fdfa; color: #0f766e; border: 1px solid #ccfbf1; }
.status-sorunlu, .status-7 { background: #fff1f2; color: #be123c; border: 1px solid #ffe4e6; }
.status-delivered, .status-12 { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }
.status-cancelled, .status-9, .status-10, .status-11 { background: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2; }
.status-ulasilamayan, .status-13 { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
.status-social, .status-14, .status-15 { background: #f0fdfa; color: #0f766e; border: 1px solid #ccfbf1; }
.status-future, .status-16 { background: #fffbeb; color: #b45309; border: 1px solid #fef3c7; }
.status-test, .status-8, .status-17 { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }

.actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: #64748b;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.action-view:hover { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
.action-approve { color: #15803d; border-color: #bbf7d0; }
.action-approve:hover { background: #f0fdf4; border-color: #15803d; }
.action-whatsapp { color: #16a34a; border-color: #bbf7d0; }
.action-whatsapp:hover { background: #f0fdf4; border-color: #16a34a; }
.action-call { color: #2563eb; border-color: #bfdbfe; }
.action-call:hover { background: #eff6ff; border-color: #2563eb; }
.action-cancel { color: #dc2626; border-color: #fecaca; }
.action-cancel:hover { background: #fef2f2; border-color: #dc2626; }
.action-delete { color: #991b1b; border-color: #fecaca; }
.action-delete:hover { background: #fef2f2; border-color: #991b1b; }

.status-dropdown-container {
  position: relative;
  z-index: 10;
}

.status-dropdown-container:focus-within,
.status-dropdown-container:hover {
  z-index: 100;
}

.action-status { color: #6366f1; border-color: #e0e7ff; }
.action-status:hover { background: #eef2ff; border-color: #6366f1; }

.status-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 9999;
  min-width: 170px;
  padding: 6px;
}

.status-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: #4b5563;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.1s;
}

.status-dropdown-item:hover {
  background: #f3f4f6;
  color: #111827;
}

.status-dropdown-item.active {
  background: #f3f4f6;
  font-weight: 600;
  color: #111827;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.empty-table {
  text-align: center;
  padding: 32px;
  font-size: 13px;
  color: #999;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  background: #f5f5f5;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  padding: 0 12px;
  width: 280px;
  transition: all 0.2s;
}

.search-box:focus-within {
  background: #fff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-box svg {
  color: #888;
  margin-right: 8px;
}

.search-box input {
  border: none;
  background: transparent;
  padding: 8px 0;
  font-size: 13px;
  width: 100%;
  outline: none;
}

/* Mobile Responsive Styles */
@media (max-width: 768px) {
  .orders-header {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 12px;
    background: #fff;
    margin: -28px -32px 10px -32px;
    border-bottom: 1px solid #e2e8f0;
  }

  .header-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
  }

  .header-left h2 {
    font-size: 18px;
    text-align: center;
    margin-bottom: 2px;
  }

  .orders-count {
    text-align: center;
    font-size: 12px;
  }

  .header-right {
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .header-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    padding: 0;
    background: transparent;
    width: 100%;
  }

  .header-action-btn {
    width: 100%;
    justify-content: center;
    background: #f1f5f9;
    padding: 8px 4px;
    font-size: 11px;
    height: 38px;
    border-radius: 8px;
  }

  .export-btn {
    display: none !important; /* Hide Excel button on mobile */
  }

  .btn-text {
    font-size: 11px;
    white-space: nowrap;
  }

  .date-filter-wrap {
    width: 100%;
    margin: 0;
    grid-column: span 2; /* Span full width in grid */
  }

  .header-date-input {
    width: 100%;
    height: 38px;
    padding: 8px;
    font-size: 13px;
    text-align: center;
    border-radius: 8px;
  }

  .search-box {
    width: 100% !important;
    max-width: none;
    margin: 0;
    height: 38px;
    border-radius: 8px;
  }

  .search-box input {
    font-size: 13px;
  }

  .primary-btn {
    width: 100%;
    justify-content: center;
    height: 42px;
    border-radius: 8px;
    font-size: 14px;
  }

  .data-table { 
    display: table; 
    min-width: 1000px;
  }

  .table-card { 
    margin: 0 -16px;
    border-radius: 0;
    overflow-x: auto !important;
  }
}

.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 32px 24px;
  border-top: 1px solid #f0f0f0;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.wp-modal {
  background: #fff;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
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

.modal-body {
  padding: 10px 20px;
  overflow-y: auto;
}

.wp-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wp-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.wp-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wp-name {
  font-size: 14px;
  font-weight: 600;
  color: #111;
}

.wp-num {
  font-size: 12px;
  color: #888;
}

.wp-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.wp-status-badge.status-both { background: #e0f2fe; color: #0369a1; } /* Blue */
.wp-status-badge.status-ours { background: #dcf8c6; color: #075e54; } /* Green */
.wp-status-badge.status-legacy { background: #f3e8ff; color: #6b21a8; } /* Purple */

.wp-status-summary {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 20px;
}

.summary-header {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 10px;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.summary-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  padding: 10px;
  border-radius: 8px;
  position: relative;
  overflow: hidden;
}

.summary-card.is-active {
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.card-label {
  font-size: 10px;
  color: #94a3b8;
  margin-bottom: 2px;
}

.card-value {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.card-indicator {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
}

.card-indicator.ours { background: #22c55e; }
.card-indicator.legacy { background: #a855f7; }

.sync-warning {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e2e8f0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #ef4444;
}

.wp-list-header {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  margin-bottom: 10px;
}

.wp-activate-btn {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 600;
  color: #25D366;
  background: transparent;
  border: 1px solid #25D366;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.wp-activate-btn:hover {
  background: #25D366;
  color: #fff;
}

.wp-activate-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.orders-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 20px;
}

.header-left h2 {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 4px;
  letter-spacing: -0.5px;
}

.orders-count {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.update-ts {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 4px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-actions {
  display: flex;
  align-items: center;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 12px;
  gap: 4px;
}

.header-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  height: 36px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
}

.header-action-btn:hover {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.wp-btn {
  color: #166534;
}

.wp-btn:hover {
  background: #dcfce7;
  color: #14532d;
}

.date-filter-wrap {
  position: relative;
  display: flex;
  align-items: center;
}

.header-date-input {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: #ffffff;
  color: #1e293b;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

.header-date-input:focus {
  border-color: #3b82f6;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0 14px;
  width: 320px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.search-box:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.08);
  width: 360px;
}

.search-box svg {
  color: #94a3b8;
  margin-right: 10px;
}

.search-box input {
  border: none;
  background: transparent;
  padding: 10px 0;
  font-size: 14px;
  width: 100%;
  outline: none;
  color: #1e293b;
}

.search-box input::placeholder {
  color: #94a3b8;
}

.primary-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: #0f172a;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.primary-btn:hover {
  background: #1e293b;
  transform: translateY(-1px);
}

.action-btn {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  background: #f5f5f5;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
}

.empty-wp {
  padding: 40px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.pagination-pages {
  display: flex;
  gap: 4px;
}

.pagination-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  padding: 0 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.pagination-btn:hover:not(:disabled):not(.dots) {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
  transform: translateY(-1px);
}

.pagination-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
  box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.2);
}

.status-col, .status-container {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.status-attribution {
  font-size: 10px;
  color: #666;
  font-weight: 500;
  white-space: nowrap;
}

.status-attribution.mobile {
  font-size: 9px;
  margin-top: 2px;
}

.pagination-btn:hover:not(:disabled):not(.dots) {
  border-color: #3b82f6;
  color: #3b82f6;
  background: #eff6ff;
}

.pagination-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #fff;
}

.pagination-btn.dots {
  border: none;
  cursor: default;
  background: transparent;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-btn svg {
  color: inherit;
}

.loading-overlay {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  color: #666;
  font-size: 13px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.viewer-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #fff1f2;
  color: #be123c;
  padding: 6px 12px;
  border-radius: 99px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid #ffe4e6;
  margin-bottom: 8px;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(190, 18, 60, 0.05);
}

.viewer-tag.mini {
  margin-top: 0;
  margin-left: 8px;
  padding: 2px 6px;
  font-size: 10px;
}

.pulse-dot-mini {
  width: 8px;
  height: 8px;
  background-color: #df1111;
  border-radius: 50%;
  display: inline-block;
  animation: pulse-red-mini 1.5s infinite;
}

@keyframes pulse-red-mini {
  0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(223, 17, 17, 0.7); }
  70% { transform: scale(1); box-shadow: 0 0 0 4px rgba(223, 17, 17, 0); }
  100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(223, 17, 17, 0); }
}

/* Expandable Row Styles */
.expand-toggle {
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.expand-toggle:hover { color: #111; }
.expand-toggle svg { transition: transform 0.3s ease; }
.expand-toggle svg.rotated { transform: rotate(180deg); color: #111; }

.row-expanded { background: #f8fafc !important; }

.edit-panel-row { background: #f8fafc !important; }
.edit-panel-container {
  padding: 24px 30px;
  border-top: 1px solid #eef2f6;
  border-bottom: 2px solid #e2e8f0;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.edit-form-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.edit-group {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.edit-group.full { 
  max-width: 600px;
}

.edit-group label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.5px;
}

.edit-group select, 
.edit-group textarea, 
.edit-group input {
  padding: 10px 14px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s;
  background: #fff;
}
.edit-group select:focus, 
.edit-group textarea:focus, 
.edit-group input:focus {
  border-color: #111;
  outline: none;
  box-shadow: 0 0 0 4px rgba(0,0,0,0.03);
}

.search-select-wrap { position: relative; }
.search-dropdown {
  position: absolute;
  top: calc(100% + 5px);
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
}
.search-option {
  padding: 10px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: 0.2s;
}
.search-option:hover { background: #f1f5f9; }

.edit-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.saving-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #059669;
  font-weight: 600;
}

.spinner-mini {
  width: 14px;
  height: 14px;
  border: 2px solid #ecfdf5;
  border-top: 2px solid #059669;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.cancel-btn {
  background: #fff;
  color: #64748b;
  border: 1.5px solid #e2e8f0;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}
.cancel-btn:hover { background: #f8fafc; color: #1e293b; }

@media (max-width: 768px) {
  .edit-form-grid { grid-template-columns: 1fr; }
  .edit-panel-container { padding: 15px; }
}

/* To-Ship View Styles */
.address-cell {
  max-width: 280px;
}
.address-content {
  font-size: 11px;
  color: #555;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  font-weight: 500;
}
.product-qty-ship {
  font-weight: 800;
  color: #111;
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 4px;
  margin-right: 2px;
  border: 1px solid #e2e8f0;
}
.payment-tag-ship {
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 6px;
  white-space: nowrap;
}
.payment-tag-ship.kart { background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
.payment-tag-ship.nakit { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
.total-cell-ship {
  font-weight: 700;
  color: #111;
  font-size: 14px;
}

/* Multi-item alignment styles */
.product-qty-list-ship, .product-list-ship {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.product-qty-tag-ship, .product-item-ship {
  height: 24px;
  display: flex;
  align-items: center;
  font-size: 12px;
  white-space: nowrap;
}
.product-qty-tag-ship {
  font-weight: 800;
  color: #111;
  background: #f1f5f9;
  padding: 0 8px;
  border-radius: 4px;
  border: 1px solid #e2e8f0;
  width: fit-content;
}
.product-item-ship {
  background: #f5f5f5;
  padding: 0 10px;
  border-radius: 4px;
  color: #333;
  width: fit-content;
}

/* Date Filter Styles */
.date-filter-wrap {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0 8px;
  height: 38px;
  transition: all 0.2s;
}

.date-filter-wrap:focus-within {
  border-color: #111;
  box-shadow: 0 0 0 3px rgba(0,0,0,0.05);
}

.header-date-input {
  border: none;
  outline: none;
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  color: #111;
  background: transparent;
  padding: 0 4px;
  cursor: pointer;
}

.clear-date-btn {
  background: #f1f5f9;
  border: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #64748b;
  cursor: pointer;
  margin-left: 4px;
  transition: all 0.2s;
}

.clear-date-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.source-tag {
  display: inline-block;
  padding: 2px 8px;
  background: #f1f5f9;
  color: #475569;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid #e2e8f0;
  text-transform: uppercase;
}

.source-tag.empty {
  background: transparent;
  border: none;
  color: #cbd5e1;
}

.test-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white !important;
  border: none !important;
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 1.2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  white-space: nowrap;
}

.test-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(245, 158, 11, 0.3);
}

.test-btn:active {
  transform: translateY(0);
}

.actions.is-locked {
  opacity: 0.7;
}

.action-btn:disabled {
  cursor: not-allowed;
  filter: grayscale(1);
  opacity: 0.6;
  pointer-events: none;
}

/* Quick Edit Fixes */
.table-card { 
  overflow-x: auto !important; 
  padding-bottom: 20px; 
  -webkit-overflow-scrolling: touch;
}
.data-table { 
  border-collapse: separate; 
  min-width: 1000px; /* Force minimum width for horizontal scroll */
}

.quick-edit-cell { position: relative; }
.dropdown-wrapper { position: relative; }

.quick-edit-btn { 
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px; border: 1px solid #e2e8f0;
  background: #fff; color: #64748b; cursor: pointer; transition: all 0.2s;
}
.quick-edit-btn:hover { background: #f8fafc; color: #1e293b; border-color: #cbd5e1; }

.row-active { 
  background-color: #f0f9ff !important; 
  position: relative;
  z-index: 9999 !important; 
}

.quick-edit-dropdown {
  position: absolute; 
  top: 100%; 
  left: 0; 
  z-index: 10000 !important;
  width: 340px; 
  margin-top: 5px;
  background: #fff; 
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
  padding: 0;
  pointer-events: auto;
}

.qe-header { 
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 16px; border-bottom: 1px solid #f1f5f9;
}
.qe-header span { font-size: 14px; font-weight: 700; color: #1e293b; }
.qe-close { background: none; border: none; font-size: 20px; color: #94a3b8; cursor: pointer; }

.qe-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; }
.qe-form-group { display: flex; flex-direction: column; gap: 4px; }
.qe-form-group label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }
.qe-form-group input, .qe-form-group select, .qe-form-group textarea {
  padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 13px;
  background: #f8fafc; transition: all 0.2s; width: 100%; box-sizing: border-box;
}
.qe-form-group input:focus { border-color: #3b82f6; outline: none; background: #fff; }

.qe-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.qe-payment-toggles { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.qe-pay-btn {
  padding: 8px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.2s; text-align: center; background: #fff;
}
.qe-pay-btn.nakit { color: #15803d; }
.qe-pay-btn.nakit.active { background: #dcfce7; border-color: #22c55e; }
.qe-pay-btn.kart { color: #1d4ed8; }
.qe-pay-btn.kart.active { background: #dbeafe; border-color: #3b82f6; }

.qe-footer { padding: 12px 16px; border-top: 1px solid #f1f5f9; }
.qe-save-btn {
  width: 100%; padding: 10px; background: #1e293b; color: #fff; border: none;
  border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.qe-save-btn:hover { background: #0f172a; }
.qe-save-btn:disabled { opacity: 0.6; cursor: wait; }

</style>

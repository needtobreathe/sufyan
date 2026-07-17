<template>
  <AdminLayout pageTitle="SCPanel Siparişleri">
    <div class="orders-header">
      <div class="header-left">
        <h2>SCPanel {{ filterTitle }}</h2>
        <span class="orders-count" v-if="searchQuery">
          {{ filteredOrders.length.toLocaleString() }} sonuç bulundu
        </span>
        <span class="orders-count" v-else>
          {{ filteredOrders.length.toLocaleString() }} sipariş
        </span>
        <span class="update-ts" v-if="lastUpdateTime">Son Güncelleme: {{ lastUpdateTime.toLocaleTimeString() }}</span>
      </div>
      <div class="header-right">
        <div class="header-actions">
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
      <div v-if="isLoading" class="loading-state">
        <div class="spinner"></div>
        <span>Siparişler yükleniyor...</span>
      </div>
      <div v-else-if="filteredOrders.length === 0" class="empty-state">
        <span>Sipariş bulunamadı.</span>
      </div>
      <div class="table-responsive" v-else>
        <table class="data-table">
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
            <tr v-for="order in paginatedOrders" :key="order._id" :class="{ 'row-active': openQuickEdit === order._id }">
              <td class="quick-edit-cell">
                <div class="dropdown-wrapper">
                  <button 
                    :class="['quick-edit-btn', `qe-btn-${order._id}`]" 
                    @click.stop="toggleQuickEdit(order, $event)" 
                    title="Hızlı Düzenle"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  
                  <Teleport to="body">
                    <div 
                      v-if="openQuickEdit === order._id" 
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
                        <span>Adres Güncelle</span>
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
                  <span class="order-id">#{{ order.yaprakOrderIndex || order._id?.substring(0, 8) }}</span>
                  <span class="order-date">{{ formatDate(order.createdAt) }} {{ formatTime(order.createdAt) }}</span>
                </div>
              </td>
              <td>
                <div class="customer-col">
                  <span class="customer-name">{{ order.fullName }}</span>
                  <a :href="'tel:' + order.phone" class="customer-phone">{{ order.phone }}</a>
                </div>
              </td>
              <td>
                <div class="site-col">
                  <div class="site-referer" v-if="order.referer">{{ order.referer }}</div>
                  <div class="site-subdomain">
                    {{ order.site_id }}
                  </div>
                </div>
              </td>
              <td>
                <div class="product-list-compact">
                  <div v-for="item in order.items" :key="item._id || item.name" class="product-item-compact">
                    <span class="p-name">{{ item.name }}</span>
                    <span class="p-qty">x{{ item.qty }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="status-col">
                  <span :class="['status-badge', 'status-' + order.status, getStatusClass(order.status)]">
                    {{ getStatusText(order.status) }}
                  </span>
                  <div v-if="order.processedBy" class="status-attribution" style="margin-top: 4px;">
                    {{ order.processedBy }}
                  </div>
                </div>
              </td>
              <td>
                <div class="actions">
                  <router-link :to="'/scpanel-orders/' + order._id" class="action-btn action-view" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">
                    Görüntüle
                  </router-link>
                  <button 
                    v-if="order.status !== 'preparing' && order.status !== '3'" 
                    class="action-btn action-approve" 
                    @click="updateStatus(order._id, 'preparing')" 
                    title="Siparişi Onayla"
                  >
                    Onayla
                  </button>
                  <button 
                    v-if="order.status !== 'cancelled' && order.status !== '9' && order.status !== '10' && order.status !== '11'" 
                    class="action-btn action-cancel" 
                    @click="updateStatus(order._id, 'cancelled')" 
                    title="İptal Et"
                  >
                    İptal
                  </button>
                  <button class="action-btn action-call" @click.stop="makeCall(order.phone)">
                    Ara
                  </button>
                  <button class="action-btn action-whatsapp" @click.stop="sendWhatsApp(order)">
                    WhatsApp
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
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
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '../components/AdminLayout.vue'
import { orderStore } from '../store/orderStore'
import * as XLSX from 'xlsx'

const route = useRoute()

const orders = ref([])
const isLoading = ref(true)
const searchQuery = ref('')
const lastUpdateTime = ref(null)
const selectedDate = ref('')

const cities = ref([])
const openQuickEdit = ref(null)
const qePosition = ref({ top: 0, left: 0 })
const quickEditData = ref({
  _id: '',
  fullName: '',
  phone: '',
  province: '',
  district: '',
  address: ''
})
const qeDistricts = ref([])
const isSavingQE = ref(false)

const fetchCities = async () => {
  try {
    const res = await fetch('https://scpanel.siparisyonet.online/api/external/cities')
    const data = await res.json()
    if (data.success) {
      cities.value = data.cities || []
    }
  } catch (error) {
    console.error('Şehirler yüklenemedi:', error)
  }
}

const fetchSCPanelOrders = async () => {
  isLoading.value = true
  try {
    const res = await fetch('https://scpanel.siparisyonet.online/api/external/orders/yaprak-odd')
    const data = await res.json()
    if (data.success) {
      orders.value = data.data || []
      lastUpdateTime.value = new Date()
    }
  } catch (error) {
    console.error('SCPanel siparişleri çekilemedi:', error)
  } finally {
    isLoading.value = false
  }
}

const updateStatus = async (orderId, newStatus) => {
  if (!confirm(`Sipariş durumunu güncellemek istediğinize emin misiniz?`)) return
  try {
    const res = await fetch(`https://scpanel.siparisyonet.online/api/external/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    const data = await res.json()
    if (data.success) {
      alert('Sipariş durumu başarıyla güncellendi.')
      await fetchSCPanelOrders()
      orderStore.fetchSCPanelCounts()
    } else {
      alert('Sipariş durumu güncellenemedi: ' + (data.message || 'Bilinmeyen hata'))
    }
  } catch (error) {
    console.error('Durum güncellenirken hata:', error)
    alert('İstek başarısız oldu.')
  }
}

const toggleQuickEdit = async (order, event) => {
  if (openQuickEdit.value === order._id) {
    openQuickEdit.value = null
    return
  }
  
  openQuickEdit.value = order._id
  quickEditData.value = {
    _id: order._id,
    fullName: order.fullName || '',
    phone: order.phone || '',
    province: '',
    district: '',
    address: order.address || ''
  }
  
  const rect = event.currentTarget.getBoundingClientRect()
  qePosition.value = {
    top: rect.bottom + window.scrollY + 8,
    left: Math.max(8, rect.left + window.scrollX - 100)
  }
  
  const foundCity = cities.value.find(c => c.name === order.province || c.id === order.province)
  if (foundCity) {
    quickEditData.value.province = foundCity.id
    await fetchDistrictsForQuickEdit()
    
    const foundDist = qeDistricts.value.find(d => d.name === order.district || d.id === order.district)
    if (foundDist) {
      quickEditData.value.district = foundDist.id
    }
  }
}

const fetchDistrictsForQuickEdit = async () => {
  const cityId = quickEditData.value.province
  if (!cityId) {
    qeDistricts.value = []
    return
  }
  try {
    const res = await fetch(`https://scpanel.siparisyonet.online/api/external/districts?city_id=${cityId}`)
    const data = await res.json()
    if (data.success) {
      qeDistricts.value = data.districts || []
    }
  } catch (error) {
    console.error('QE districts fetch error:', error)
  }
}

const saveQuickEdit = async () => {
  isSavingQE.value = true
  try {
    const city = cities.value.find(c => c.id == quickEditData.value.province)
    const dist = qeDistricts.value.find(d => d.id == quickEditData.value.district)
    
    const payload = {
      fullName: quickEditData.value.fullName,
      phone: quickEditData.value.phone,
      province: city ? city.name : quickEditData.value.province,
      district: dist ? dist.name : quickEditData.value.district,
      address: quickEditData.value.address
    }
    
    const res = await fetch(`https://scpanel.siparisyonet.online/api/external/orders/${quickEditData.value._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (data.success) {
      openQuickEdit.value = null
      await fetchSCPanelOrders()
      orderStore.fetchSCPanelCounts()
    } else {
      alert('Güncellenemedi: ' + (data.message || 'Hata'))
    }
  } catch (error) {
    console.error('Save QE error:', error)
    alert('Bağlantı hatası.')
  } finally {
    isSavingQE.value = false
  }
}

const exportToExcel = () => {
  const rows = filteredOrders.value.map(o => {
    const productsText = o.items ? o.items.map(i => `${i.qty} x ${i.name}`).join(', ') : '';
    return {
      "Sipariş No": o.yaprakOrderIndex || o._id,
      "Tarih": formatDate(o.createdAt) + ' ' + formatTime(o.createdAt),
      "Müşteri": o.fullName,
      "Telefon": o.phone,
      "Ödeme Yöntemi": o.paymentMethod,
      "Ürünler": productsText,
      "Tutar": (o.totalPrice || 0) + ' TL',
      "İl": o.province,
      "İlçe": o.district,
      "Adres": o.address,
      "Durum": getStatusText(o.status),
      "Referer": o.referer || '',
      "Kaynak": o.source || ''
    }
  })
  
  const worksheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, "SCPanel Siparişleri")
  XLSX.writeFile(workbook, `SCPanel_Siparisleri_${new Date().toISOString().split('T')[0]}.xlsx`)
}

const sendWhatsApp = (order) => {
  const customerName = order.fullName || '';
  const phone = order.phone || '';
  const address = order.address || '';
  
  let productsText = '';
  if (Array.isArray(order.items)) {
    productsText = order.items.map(item => `${item.qty} adet ${item.name}`).join(', ');
  } else {
    productsText = '-';
  }
  
  const total = order.totalPrice || 0;

  const message = `Sayın ${customerName}, \nSipariş bilgileriniz aşağıdadır: \nAd Soyad: ${customerName} \nTelefon: ${phone} \nAdres: ${address} \nÜrün: ${productsText} \nToplam Tutar: ${total} TL \nKapıda nakit mi kapıda kart mı ödeyeceksiniz? \nSiparişinizi onaylamanız durumunda yarın kargoya verilecektir.`;

  const encodedMessage = encodeURIComponent(message);
  let targetPhone = phone.replace(/[^0-9]/g, '');
  if (targetPhone.startsWith('0')) {
    targetPhone = '90' + targetPhone.substring(1);
  } else if (!targetPhone.startsWith('90') && targetPhone.length === 10) {
    targetPhone = '90' + targetPhone;
  }
  
  window.open(`https://wa.me/${targetPhone}?text=${encodedMessage}`, '_blank');
}

const makeCall = (phone) => {
  if (!phone) return;
  const targetPhone = phone.replace(/[^0-9]/g, '');
  window.location.href = `tel:${targetPhone}`;
}

const filterTitle = computed(() => {
  const f = route.query.filter
  if (f === 'preparing') return 'Hazırlanıyor'
  if (f === 'cancelled') return 'İptaller'
  return 'Yeni Siparişler'
})

const filteredOrders = computed(() => {
  let list = orders.value

  // 1. Status Filter
  const f = route.query.filter
  if (f === 'preparing') {
    list = list.filter(o => o.status === 'preparing' || o.status === '3')
  } else if (f === 'cancelled') {
    list = list.filter(o => o.status === 'cancelled' || o.status === '9' || o.status === '10' || o.status === '11')
  } else {
    list = list.filter(o => o.status === 'pending' || o.status === '1' || !o.status)
  }

  // 2. Date Filter
  if (selectedDate.value) {
    list = list.filter(o => o.createdAt && o.createdAt.startsWith(selectedDate.value))
  }

  // 3. Search Filter
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(o => {
      const matchName = o.fullName?.toLowerCase().includes(q)
      const matchPhone = o.phone?.includes(q)
      const matchId = o._id?.toLowerCase().includes(q)
      const matchIndex = o.yaprakOrderIndex?.toString().includes(q)
      const matchItem = o.items?.some(i => i.name?.toLowerCase().includes(q))
      return matchName || matchPhone || matchId || matchIndex || matchItem
    })
  }

  return list
})

// Pagination
const currentPage = ref(1)
const itemsPerPage = 50

const paginatedOrders = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredOrders.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(filteredOrders.value.length / itemsPerPage) || 1
})

const displayedPages = computed(() => {
  const total = totalPages.value
  const current = currentPage.value
  const pages = []
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    
    const start = Math.max(2, current - 1)
    const end = Math.min(total - 1, current + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    
    if (current < total - 2) pages.push('...')
    pages.push(total)
  }
  return pages
})

const goToPage = (page) => {
  currentPage.value = page
}

const getStatusClass = (status) => {
  const mapping = {
    pending: 'pending',
    '1': 'pending',
    preparing: 'preparing',
    '3': 'preparing',
    cancelled: 'cancelled',
    '9': 'cancelled',
    '10': 'cancelled',
    '11': 'cancelled',
  }
  return mapping[status] || 'gray'
}

const getStatusText = (status) => {
  const mapping = {
    pending: 'Yeni Sipariş',
    '1': 'Yeni Sipariş',
    preparing: 'Hazırlanıyor',
    '3': 'Hazırlanıyor',
    cancelled: 'İptal',
    '9': 'İptal',
    '10': 'İptal',
    '11': 'İptal',
  }
  return mapping[status] || status
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR')
}

const formatTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  await fetchSCPanelOrders()
  await fetchCities()
})

watch(() => route.query.filter, () => {
  currentPage.value = 1
  fetchSCPanelOrders()
})

// Close quick edit when clicking outside
const closeQEOnOutsideClick = (e) => {
  if (openQuickEdit.value && !e.target.closest('.quick-edit-dropdown') && !e.target.closest('.quick-edit-btn')) {
    openQuickEdit.value = null
  }
}

onMounted(() => {
  document.addEventListener('click', closeQEOnOutsideClick)
})
</script>

<style scoped>
.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left h2 {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 4px 0;
  letter-spacing: -0.5px;
}

.orders-count {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin-right: 12px;
}

.update-ts {
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  background: #ffffff;
  border: 1.5px solid #e2e8f0;
  color: #475569;
  transition: all 0.2s;
}

.header-action-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
  color: #0f172a;
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
  color: #475569;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  outline: none;
  background: #ffffff;
  transition: all 0.2s;
  height: 38px;
}

.header-date-input:focus {
  border-color: #3b82f6;
}

.clear-date-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  font-size: 16px;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 4px;
}

.clear-date-btn:hover {
  color: #ef4444;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box svg {
  position: absolute;
  left: 14px;
  color: #64748b;
}

.search-box input {
  padding: 10px 16px 10px 38px;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  width: 260px;
  outline: none;
  transition: all 0.2s;
}

.search-box input:focus {
  border-color: #3b82f6;
  background: #ffffff;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.05);
}

.table-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
  margin-top: 10px;
  overflow: hidden;
}

.table-responsive {
  width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
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
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td {
  background: #f8fafc;
}

.quick-edit-cell {
  position: relative;
  text-align: center;
}

.quick-edit-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.quick-edit-btn:hover {
  background: #f1f5f9;
  color: #4f46e5;
}

/* Quick Edit Dropdown Styles */
.quick-edit-dropdown {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 320px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.qe-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 10px;
}

.qe-header span {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.qe-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
}

.qe-close:hover {
  color: #0f172a;
}

.qe-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.qe-form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.qe-form-group label {
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qe-form-group input,
.qe-form-group select,
.qe-form-group textarea {
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  outline: none;
  width: 100%;
  transition: all 0.2s;
}

.qe-form-group input:focus,
.qe-form-group select:focus,
.qe-form-group textarea:focus {
  border-color: #3b82f6;
  background: #ffffff;
}

.qe-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.qe-footer {
  border-top: 1px solid #f1f5f9;
  padding-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.qe-save-btn {
  background: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  width: 100%;
  transition: background 0.2s;
}

.qe-save-btn:hover {
  background: #2563eb;
}

.order-no-col {
  display: flex;
  flex-direction: column;
}

.order-id {
  font-weight: 700;
  color: #0f172a;
}

.order-date {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  margin-top: 2px;
}

.customer-col {
  display: flex;
  flex-direction: column;
}

.customer-name {
  font-weight: 700;
  color: #0f172a;
}

.customer-phone {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  margin-top: 2px;
  text-decoration: none;
}

.customer-phone:hover {
  color: #3b82f6;
}

.site-col {
  display: flex;
  flex-direction: column;
}

.site-referer {
  font-size: 12px;
  color: #64748b;
  word-break: break-all;
}

.site-subdomain {
  font-weight: 700;
  color: #0f172a;
  margin-top: 2px;
}

.product-list-compact {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.product-item-compact {
  font-size: 13px;
  color: #334155;
  display: flex;
  gap: 6px;
}

.p-name {
  font-weight: 600;
}

.p-qty {
  color: #64748b;
  font-weight: 700;
}

.status-col {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
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

.status-pending { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
.status-preparing { background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
.status-cancelled { background: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2; }
.status-gray { background: #f8fafc; color: #475569; border: 1px solid #e2e8f0; }

.status-attribution {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
}

.actions {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
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

/* Pagination Styles */
.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-top: 1px solid #f1f5f9;
  background: #ffffff;
}

.pagination-pages {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0;
}

.pagination-btn:hover:not(:disabled) {
  border-color: #cbd5e1;
  color: #0f172a;
  background: #f8fafc;
}

.pagination-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: #ffffff;
}

.pagination-btn.dots {
  border: none;
  cursor: default;
  background: none;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.loading-state, .empty-state {
  padding: 80px 20px;
  text-align: center;
  color: #64748b;
  font-size: 15px;
  font-weight: 500;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.row-active td {
  background: #f8fafc;
}
</style>

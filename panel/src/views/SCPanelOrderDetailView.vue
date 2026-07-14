<template>
  <AdminLayout pageTitle="SCPanel Sipariş Detayı">
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <span>Sipariş bilgileri yükleniyor...</span>
    </div>
    <div v-else-if="!order" class="error-container">
      <span>Sipariş bulunamadı.</span>
      <button class="btn btn-primary" @click="handleBack">Geri Dön</button>
    </div>
    <div v-else>
      <div class="detail-header">
        <div class="detail-header-left">
          <button class="back-btn" @click="handleBack">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Geri
          </button>
          <div class="title-with-status">
            <h2>Sipariş #{{ order.yaprakOrderIndex || order._id?.substring(0, 8) }}</h2>
            <span :class="['status-badge', getStatusClass(order.status)]">{{ getStatusText(order.status) }}</span>
          </div>
        </div>

        <div class="detail-header-right">
          <div class="header-actions-group">
            <button 
              v-if="order.status !== 'preparing' && order.status !== '3'" 
              class="btn btn-success" 
              @click="updateStatus('preparing')"
            >
              Onayla
            </button>
            <button 
              v-if="order.status !== 'cancelled' && order.status !== '9' && order.status !== '10' && order.status !== '11'" 
              class="btn btn-danger" 
              @click="updateStatus('cancelled')"
            >
              İptal Et
            </button>
            <button class="btn btn-primary" @click="handleSave">
              Kaydet
            </button>
          </div>
        </div>
      </div>

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
                <div class="phone-group">
                  <input type="text" v-model="order.phone" class="form-input" />
                  <div class="phone-actions">
                    <button class="phone-btn wp" title="WhatsApp" @click="openWp">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.031 6.172c-2.32 0-4.208 1.888-4.208 4.208 0 0.816 0.232 1.576 0.632 2.216l-0.672 2.456 2.512-0.656c0.552 0.32 1.184 0.504 1.864 0.504 2.32 0 4.208-1.888 4.208-4.208s-1.888-4.208-4.208-4.208zM15.424 12.56c-0.144 0.408-0.72 0.744-1.008 0.792-0.28 0.048-0.536 0.088-1.528-0.304-1.224-0.488-2.008-1.72-2.072-1.808-0.056-0.088-0.504-0.672-0.504-1.28s0.32-0.912 0.432-1.032c0.112-0.12 0.248-0.152 0.328-0.152s0.16 0 0.232 0.008c0.072 0 0.168-0.024 0.264 0.208 0.096 0.232 0.328 0.8 0.36 0.856 0.032 0.056 0.048 0.12 0.016 0.184s-0.048 0.104-0.104 0.168c-0.056 0.064-0.12 0.144-0.168 0.192s-0.104 0.104-0.04 0.216c0.064 0.112 0.28 0.464 0.6 0.752 0.416 0.368 0.76 0.48 0.872 0.544s0.184 0.048 0.256-0.032c0.072-0.088 0.312-0.36 0.392-0.48 0.08-0.12 0.16-0.104 0.272-0.064s0.704 0.328 0.824 0.392c0.12 0.064 0.2 0.096 0.232 0.144 0.032 0.056 0.032 0.32-0.112 0.728zM12.072 1.976c-5.504 0-9.96 4.456-9.96 9.968 0 1.744 0.456 3.44 1.32 4.952l-1.4 5.104 5.224-1.368c1.456 0.8 3.104 1.224 4.816 1.224 5.504 0 9.96-4.456 9.96-9.968s-4.456-9.968-9.96-9.968zM12.072 20.328c-1.576 0-3.112-0.424-4.448-1.224l-0.32-0.192-3.304 0.864 0.88-3.216-0.208-0.328c-0.88-1.4-1.344-3.024-1.344-4.688 0-4.632 3.776-8.408 8.416-8.408 2.248 0 4.36 0.872 5.952 2.464s2.464 3.704 2.464 5.944c0.008 4.64-3.768 8.416-8.408 8.416z"></path>
                      </svg>
                    </button>
                    <button class="phone-btn call" title="Ara" @click="openCall">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.81 12.81 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Ödeme Yöntemi</label>
                <input type="text" v-model="order.paymentMethod" class="form-input" />
              </div>
              <div class="form-group">
                <label>Sipariş Tarihi</label>
                <div class="display-val disabled">{{ formatDate(order.createdAt) }} {{ formatTime(order.createdAt) }}</div>
              </div>
            </div>
          </div>

          <!-- Address Info -->
          <div class="detail-card">
            <div class="card-header">
              <h3>Adres Bilgileri</h3>
            </div>
            <div class="form-row">
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
                      :key="c.id" 
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
                      :key="d.id" 
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
            <div class="form-group">
              <label>Adres Detayı</label>
              <textarea v-model="order.address" class="form-input form-textarea" rows="3"></textarea>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="detail-col">
          <!-- Products Info -->
          <div class="detail-card">
            <div class="card-header flex-header">
              <h3>Sipariş Edilen Ürünler</h3>
              <button class="add-item-btn" @click="addNewItem">+ Ürün Ekle</button>
            </div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Ürün Adı</th>
                  <th style="width: 100px; text-align: center;">Adet</th>
                  <th style="width: 120px; text-align: right;">Birim Fiyat</th>
                  <th style="width: 40px;"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in order.items" :key="item._id || index">
                  <td>
                    <input type="text" v-model="item.name" class="form-input mini" />
                  </td>
                  <td>
                    <input type="number" v-model.number="item.qty" class="form-input mini text-center" />
                  </td>
                  <td>
                    <input type="number" v-model.number="item.price" class="form-input mini text-right" />
                  </td>
                  <td style="text-align: center;">
                    <button class="remove-item-btn" @click="removeItem(index)" title="Ürünü Çıkar">&times;</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div class="total-row">
              <span>Toplam Tutar:</span>
              <strong class="price-val">{{ computedTotalPrice }} TL</strong>
            </div>
          </div>

          <!-- Technical Details -->
          <div class="detail-card">
            <div class="card-header">
              <h3>Teknik Detaylar</h3>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Referer (Domain)</label>
                <div class="display-val tech-val">{{ order.referer || '-' }}</div>
              </div>
              <div class="form-group">
                <label>IP Adresi</label>
                <div class="display-val tech-val">{{ order.ip_address || '-' }}</div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Device ID</label>
                <div class="display-val tech-val">{{ order.device_id || '-' }}</div>
              </div>
              <div class="form-group">
                <label>Kaynak (Source)</label>
                <div class="display-val tech-val">{{ order.source || '-' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '../components/AdminLayout.vue'
import { orderStore } from '../store/orderStore'
import { apiFetch } from '@/utils/fetch'

const route = useRoute()
const router = useRouter()

const order = ref(null)
const isLoading = ref(true)

const cities = ref([])
const districts = ref([])
const showCityList = ref(false)
const showDistrictList = ref(false)
const citySearch = ref('')
const districtSearch = ref('')

const fetchCities = async () => {
  try {
    const res = await apiFetch('/api/cities?country_id=1')
    const data = await res.json()
    if (data.success) {
      cities.value = data.cities || []
      await initializeCityAndDistrict()
    }
  } catch (error) {
    console.error('Şehirler yüklenemedi:', error)
  }
}

const fetchDistricts = async (cityId) => {
  if (!cityId) return
  try {
    const res = await apiFetch(`/api/districts?city_id=${cityId}`)
    const data = await res.json()
    if (data.success) {
      districts.value = data.districts || []
    }
  } catch (error) {
    console.error('İlçeler yüklenemedi:', error)
  }
}

const filteredCities = computed(() => {
  if (!cities.value) return []
  if (!citySearch.value) return cities.value
  const search = citySearch.value.toLocaleLowerCase('tr')
  return cities.value.filter(c => c && c.name && c.name.toLocaleLowerCase('tr').includes(search))
})

const filteredDistricts = computed(() => {
  if (!districts.value) return []
  if (!districtSearch.value) return districts.value
  const search = districtSearch.value.toLocaleLowerCase('tr')
  return districts.value.filter(d => d && d.name && d.name.toLocaleLowerCase('tr').includes(search))
})

const selectCity = async (c) => {
  if (!order.value) return
  order.value.province = c.id
  citySearch.value = c.name
  showCityList.value = false
  
  order.value.district = ''
  districtSearch.value = ''
  districts.value = []
  
  await fetchDistricts(c.id)
}

const handleCityBlur = () => {
  setTimeout(() => { showCityList.value = false }, 200)
}

const selectDistrict = (d) => {
  if (!order.value) return
  order.value.district = d.id
  districtSearch.value = d.name
  showDistrictList.value = false
}

const handleDistrictBlur = () => {
  setTimeout(() => { showDistrictList.value = false }, 200)
}

const initializeCityAndDistrict = async () => {
  if (!order.value || cities.value.length === 0) return
  
  const foundCity = cities.value.find(c => c.name === order.value.province || c.id === order.value.province)
  if (foundCity) {
    order.value.province = foundCity.id
    citySearch.value = foundCity.name
    
    await fetchDistricts(foundCity.id)
    
    if (order.value.district) {
      const foundDist = districts.value.find(d => d.name === order.value.district || d.id === order.value.district)
      if (foundDist) {
        order.value.district = foundDist.id
        districtSearch.value = foundDist.name
      } else {
        districtSearch.value = order.value.district
      }
    }
  } else {
    citySearch.value = order.value.province || ''
    districtSearch.value = order.value.district || ''
  }
}

const fetchOrderDetail = async () => {
  isLoading.value = true
  try {
    const res = await fetch('https://scpanel.siparisyonet.online/api/external/orders/yaprak-odd')
    const data = await res.json()
    if (data.success && Array.isArray(data.data)) {
      const match = data.data.find(o => o._id === route.params.id)
      if (match) {
        order.value = match
        await initializeCityAndDistrict()
      }
    }
  } catch (error) {
    console.error('Sipariş detayı yüklenemedi:', error)
  } finally {
    isLoading.value = false
  }
}

const updateStatus = async (newStatus) => {
  if (!order.value) return
  if (!confirm(`Sipariş durumunu güncellemek istediğinize emin misiniz?`)) return
  
  try {
    const res = await fetch(`https://scpanel.siparisyonet.online/api/external/orders/${order.value._id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })
    const data = await res.json()
    if (data.success) {
      alert('Sipariş durumu başarıyla güncellendi.')
      await fetchOrderDetail()
      orderStore.fetchSCPanelCounts()
    } else {
      alert('Sipariş durumu güncellenemedi: ' + (data.message || 'Hata'))
    }
  } catch (error) {
    console.error('Durum güncellenirken hata:', error)
    alert('Bağlantı hatası oluştu.')
  }
}

const handleSave = async () => {
  if (!order.value) return
  isLoading.value = true
  
  // Update total price explicitly
  order.value.totalPrice = computedTotalPrice.value

  // Map province ID and district ID back to their names
  const cityName = cities.value.find(c => c.id == order.value.province)?.name || order.value.province
  const districtName = districts.value.find(d => d.id == order.value.district)?.name || order.value.district

  const payload = {
    ...order.value,
    province: cityName,
    district: districtName
  }

  try {
    const res = await fetch(`https://scpanel.siparisyonet.online/api/external/orders/${order.value._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json()
    if (data.success) {
      alert('Sipariş bilgileri başarıyla güncellendi.')
      await fetchOrderDetail()
      orderStore.fetchSCPanelCounts()
    } else {
      alert('Sipariş güncellenemedi: ' + (data.message || 'Hata'))
    }
  } catch (error) {
    console.error('Sipariş kaydedilirken hata:', error)
    alert('Bağlantı hatası oluştu.')
  } finally {
    isLoading.value = false
  }
}

const computedTotalPrice = computed(() => {
  if (!order.value || !Array.isArray(order.value.items)) return 0
  return order.value.items.reduce((sum, item) => sum + (Number(item.price || 0) * Number(item.qty || 1)), 0)
})

const addNewItem = () => {
  if (!order.value) return
  if (!order.value.items) order.value.items = []
  order.value.items.push({
    name: 'Yeni Ürün',
    qty: 1,
    price: 0
  })
}

const removeItem = (index) => {
  if (!order.value?.items) return
  order.value.items.splice(index, 1)
}

const handleBack = () => {
  router.back()
}

const openWp = () => {
  if (!order.value?.phone) return
  let p = order.value.phone
  p = p.replace(/\D/g, '')
  if (p.startsWith('0')) {
    p = '90' + p.substring(1)
  } else if (!p.startsWith('90') && p.length === 10) {
    p = '90' + p
  }
  window.open(`https://wa.me/${p}`, '_blank')
}

const openCall = () => {
  if (!order.value?.phone) return
  window.location.href = 'tel:' + order.value.phone
}

const getStatusClass = (status) => {
  const mapping = {
    pending: 'yellow',
    '1': 'yellow',
    preparing: 'blue',
    '3': 'blue',
    cancelled: 'red',
    '9': 'red',
    '10': 'red',
    '11': 'red',
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
  await fetchOrderDetail()
  await fetchCities()
})
</script>

<style scoped>
.loading-container, .error-container {
  padding: 80px;
  text-align: center;
  color: #666;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #333;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.detail-header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}

.back-btn:hover {
  color: #0f172a;
}

.title-with-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-with-status h2 {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: -0.5px;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 20px;
}

.status-badge.yellow {
  background: #fff8e6;
  color: #b27a00;
}

.status-badge.blue {
  background: #e6f0ff;
  color: #0052cc;
}

.status-badge.red {
  background: #ffebe6;
  color: #de350b;
}

.status-badge.gray {
  background: #f4f5f7;
  color: #5e6c84;
}

.detail-header-right {
  display: flex;
  align-items: center;
}

.header-actions-group {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 700;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.btn-primary {
  background: #0f172a;
  color: #fff;
}

.btn-primary:hover {
  background: #1e293b;
}

.btn-success {
  background: #10b981;
  color: #fff;
}

.btn-success:hover {
  background: #059669;
}

.btn-danger {
  background: #ef4444;
  color: #fff;
}

.btn-danger:hover {
  background: #dc2626;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.detail-col {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.detail-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
}

.card-header h3 {
  font-size: 14px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin: 0 0 20px 0;
}

.flex-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flex-header h3 {
  margin-bottom: 0;
}

.add-item-btn {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #334155;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.add-item-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

.display-val {
  padding: 12px 14px;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  min-height: 45px;
  display: flex;
  align-items: center;
}

.display-val.disabled {
  background: #f1f5f9;
  color: #64748b;
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

.form-input.mini {
  padding: 8px 10px;
  font-size: 13px;
  border-radius: 8px;
}

.form-textarea {
  min-height: 100px;
  resize: vertical;
  line-height: 1.4;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.tech-val {
  word-break: break-all;
  font-family: monospace;
  font-size: 12px;
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.phone-group {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.phone-group .form-input {
  flex: 1;
}

.phone-actions {
  display: flex;
  gap: 6px;
}

.phone-btn {
  background: none;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  width: 45px;
  height: 45px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.phone-btn.wp {
  color: #25d366;
}

.phone-btn.wp:hover {
  background: #e8fbed;
  border-color: #25d366;
}

.phone-btn.call {
  color: #4f8cff;
}

.phone-btn.call:hover {
  background: #e6f0ff;
  border-color: #4f8cff;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th {
  text-align: left;
  font-size: 11px;
  color: #888;
  padding: 8px;
  border-bottom: 1.5px solid #e2e8f0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.items-table td {
  padding: 10px 8px;
  font-size: 14px;
  color: #1e293b;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.remove-item-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #ef4444;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  transition: color 0.1s;
}

.remove-item-btn:hover {
  color: #b91c1c;
}

.total-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  font-size: 14px;
  color: #475569;
}

.price-val {
  font-size: 18px;
  color: #0f172a;
  font-weight: 800;
}

/* Search Select Dropdown Styles */
.search-select-wrap {
  position: relative;
  width: 100%;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  max-height: 220px;
  overflow-y: auto;
  z-index: 100;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  margin-top: 4px;
}

.search-option {
  padding: 10px 14px;
  font-size: 13px;
  color: #334155;
  cursor: pointer;
  transition: background 0.1s;
}

.search-option:hover {
  background: #f1f5f9;
}

.no-results {
  padding: 10px 14px;
  font-size: 13px;
  color: #64748b;
  text-align: center;
}

@media (max-width: 1024px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>

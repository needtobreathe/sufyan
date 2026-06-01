<template>
  <AdminLayout pageTitle="Sipariş Oluştur">
    <div class="create-order-wrap">
      <!-- No more steps, just a single page -->

      <div class="main-content-grid">
        <!-- Form Section -->
        <div class="form-section">
          <div class="form-cards-stack">
            <!-- Customer Details -->
            <div class="form-card">
              <div class="card-header">
                <div class="icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                <h2>Müşteri & Teslimat</h2>
              </div>
              
              <div class="form-grid">
                <div class="input-group">
                  <label>Ad Soyad</label>
                  <input v-model="order.fullName" type="text" placeholder="Müşteri adını girin..." />
                </div>
                <div class="input-group">
                  <label>Telefon</label>
                  <input v-model="order.phone" type="tel" placeholder="05xx xxx xx xx" />
                </div>
                <div class="input-group">
                  <label>Şehir</label>
                  <div class="search-select-wrap">
                    <input 
                      type="text" 
                      v-model="citySearch" 
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
                <div class="input-group">
                  <label>İlçe</label>
                  <div class="search-select-wrap">
                    <input 
                      type="text" 
                      v-model="districtSearch" 
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
                <div class="input-group full">
                  <label>Açık Adres</label>
                  <textarea v-model="order.address" rows="3" placeholder="Mahalle, sokak, bina..."></textarea>
                </div>
              </div>
            </div>

            <!-- Products & Payment -->
            <div class="form-card" style="margin-top: 24px;">
              <div class="card-header">
                <div class="icon-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg></div>
                <h2>Ürünler & Ödeme</h2>
              </div>

              <div class="products-area">
                <div v-for="(item, idx) in order.products" :key="idx" class="product-item-card">
                  <div class="prod-row-main">
                    <div class="prod-select">
                      <label>Ürün</label>
                      <select v-model="item.id" @change="onProductChange(idx)">
                        <option :value="''">Seçin</option>
                        <option v-for="p in productList" :key="p.id" :value="p.id">{{ p.name }}</option>
                      </select>
                    </div>
                    <div class="prod-qty">
                      <label>Adet</label>
                      <input v-model.number="item.quantity" type="number" min="1" />
                    </div>
                    <div class="prod-price">
                       <label>Toplam Tutar</label>
                      <div class="currency-wrap">
                        <input v-model.number="item.price" type="number" step="0.01" />
                        <span>TL</span>
                      </div>
                    </div>
                    <button v-if="order.products.length > 1" @click="removeProductRow(idx)" class="remove-btn">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>
                  <div class="prod-item-footer">
                  </div>
                </div>

                <button @click="addProductRow" class="add-prod-btn">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Yeni Ürün Ekle
                </button>
              </div>

              <div class="divider"></div>


            </div>
          </div>
        </div>

        <!-- Mobile Only Settings Card (Shows before sidebar on small screens) -->
        <div class="form-section mobile-settings-card">
          <div class="form-card">
            <div class="card-header">
              <div class="icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <h2>Sipariş Ayarları</h2>
            </div>
            <div class="extra-field">
              <label>Sipariş Durumu</label>
              <select v-model="order.status">
                <option v-for="st in statusOptions" :key="st.id" :value="st.id">{{ st.label }}</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Sidebar / Summary Section -->
        <div class="summary-section">
          <div class="summary-card">
            <h3>Sipariş Özeti</h3>
            <div class="stats-box">
              <div class="stat-row">
                <span>Ara Toplam</span>
                <span>{{ itemsTotal.toFixed(2) }} TL</span>
              </div>
              <div class="stat-row">
                <span>Kargo Bedeli</span>
                <div class="shipping-fee-wrap">
                  <input type="number" v-model.number="order.shippingFee" class="shipping-input" />
                  <span class="currency">TL</span>
                </div>
              </div>
              <div class="stat-divider"></div>
              <div class="stat-row total">
                <span>Toplam</span>
                <span class="total-price">{{ totalPrice.toFixed(2) }} TL</span>
              </div>
            </div>

            <div class="extra-field">
              <label>Sipariş Durumu</label>
              <select v-model="order.status">
                <option v-for="st in statusOptions" :key="st.id" :value="st.id">{{ st.label }}</option>
              </select>
            </div>


            <div class="nav-actions">
              <button @click="submitOrder" :disabled="loading" class="btn-primary submit">
                {{ loading ? 'Oluşturuluyor...' : 'Siparişi Tamamla' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Floating Bar -->
      <div class="mobile-bottom-bar">
        <div class="m-total">
          <label>Toplam</label>
          <span>{{ totalPrice.toFixed(2) }} TL</span>
        </div>
        <div class="m-btns">
          <button @click="submitOrder" :disabled="loading" class="m-btn-submit">
            {{ loading ? '...' : 'Tamamla' }}
          </button>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { apiFetch } from '@/utils/fetch'
import AdminLayout from '../components/AdminLayout.vue'

const router = useRouter()
const loading = ref(false)

// Data arrays
const cities = ref([])
const districts = ref([])
const productList = ref([])

// Searchable Select States
const citySearch = ref('')
const showCityList = ref(false)
const districtSearch = ref('')
const showDistrictList = ref(false)

const order = ref({
  fullName: '',
  phone: '',
  province: 0,
  district: 0,
  address: '',
  paymentMethod: 1,
  siteId: 'manual',
  status: '1',
  products: [
    { id: '', quantity: 1, price: 0 }
  ],
  note: '',
  shippingFee: 0
})

const statusOptions = [
  { id: '1', label: 'Yeni Sipariş' },
  { id: '2', label: 'Onaylandı' },
  { id: '3', label: 'Hazırlanıyor' },
  { id: '4', label: 'Paketlendi' },
  { id: '5', label: 'Kargoya Verildi' },
  { id: '14', label: 'Instagram DM' },
  { id: '15', label: 'Facebook DM' },
  { id: '16', label: 'İleri Tarihli' },
  { id: '9', label: 'İptal' }
]

// Phone Formatting Watcher
watch(() => order.value.phone, (newVal, oldVal) => {
  if (!newVal) return
  
  // Remove all non-digits
  let digits = newVal.replace(/\D/g, '')
  
  // Prepend '0' if it starts with '5'
  if (digits.length > 0 && digits[0] === '5') {
    digits = '0' + digits
  }
  
  // Limit to 11 digits (typical 05XX XXX XX XX)
  if (digits.length > 11) digits = digits.slice(0, 11)
  
  let formatted = ''
  if (digits.length > 0) {
    formatted = digits.slice(0, 4) // 0532
    if (digits.length > 4) formatted += ' ' + digits.slice(4, 7) // 0532 123
    if (digits.length > 7) formatted += ' ' + digits.slice(7, 9) // 0532 123 45
    if (digits.length > 9) formatted += ' ' + digits.slice(9, 11) // 0532 123 45 67
  }
  
  if (formatted !== newVal) {
    order.value.phone = formatted
  }
})

// Search Select Logic
const filteredCities = computed(() => {
  if (!citySearch.value) return cities.value
  return cities.value.filter(c => c.name.toLocaleLowerCase('tr').includes(citySearch.value.toLocaleLowerCase('tr')))
})

const selectCity = (c) => {
  order.value.province = c.id
  citySearch.value = c.name
  showCityList.value = false
  order.value.district = 0
  districtSearch.value = ''
  fetchDistricts()
}

const handleCityBlur = () => {
  setTimeout(() => { showCityList.value = false }, 200)
}

const filteredDistricts = computed(() => {
  if (!districtSearch.value) return districts.value
  return districts.value.filter(d => d.name.toLocaleLowerCase('tr').includes(districtSearch.value.toLocaleLowerCase('tr')))
})

const selectDistrict = (d) => {
  order.value.district = d.id
  districtSearch.value = d.name
  showDistrictList.value = false
}

const handleDistrictBlur = () => {
  setTimeout(() => { showDistrictList.value = false }, 200)
}

const itemsTotal = computed(() => {
  return order.value.products.reduce((acc, item) => acc + (item.price || 0), 0)
})

const totalPrice = computed(() => {
  return itemsTotal.value + (order.value.shippingFee || 0)
})

const addProductRow = () => {
  order.value.products.push({ id: 0, quantity: 1, price: 0 })
}

const removeProductRow = (idx) => {
  order.value.products.splice(idx, 1)
}

const getProductPackages = (id) => {
  const p = productList.value.find(item => item.id === id)
  if (!p || !p.urun_paketler) return []
  try {
    const pkgs = JSON.parse(p.urun_paketler)
    return Array.isArray(pkgs) ? pkgs : []
  } catch (e) { return [] }
}

const onProductChange = (idx) => {
  const item = order.value.products[idx]
  const p = productList.value.find(prod => prod.id === item.id)
  if (p) {
    item.price = p.price || 0
    item.quantity = 1
  }
}

const fetchCities = async () => {
  const res = await apiFetch('/api/cities')
  const d = await res.json()
  if (d.success) cities.value = d.cities
}

const fetchDistricts = async () => {
  if (!order.value.province) return
  const res = await apiFetch(`/api/districts?city_id=${order.value.province}`)
  const d = await res.json()
  if (d.success) districts.value = d.districts
}

const fetchProducts = async () => {
  const res = await apiFetch('/api/products')
  const d = await res.json()
  if (d.success) productList.value = d.products
}

const submitOrder = async () => {
  if (!order.value.fullName || !order.value.phone) {
    alert('Lütfen müşteri bilgilerini (Ad ve Telefon) eksiksiz doldurun.')
    return
  }

  const valid = order.value.products.filter(p => !!p.id)
  if (valid.length === 0) {
    alert('En az bir geçerli ürün seçmelisiniz.')
    return
  }

  loading.value = true
  try {
    const mappedItems = valid.map(p => {
      const prod = productList.value.find(pr => pr.id === p.id)
      return {
        name: prod ? prod.name : 'Bilinmeyen Ürün',
        qty: p.quantity,
        price: p.price
      }
    })

    const cityName = cities.value.find(c => c.id === order.value.province)?.name || '';
    const districtName = districts.value.find(d => d.id === order.value.district)?.name || '';

    const res = await apiFetch('/api/orders/manual', {
      method: 'POST',
      body: JSON.stringify({
        ...order.value,
        province: cityName,
        district: districtName,
        items: mappedItems,
        totalPrice: totalPrice.value
      })
    })
    const d = await res.json()
    if (d.success) {
      alert('Sipariş başarıyla oluşturuldu!')
      router.push('/orders')
    } else {
      alert('Hata: ' + d.message)
    }
  } catch (err) {
    alert('Sistem hatası oluştu.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCities()
  fetchProducts()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

.create-order-wrap {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  font-family: 'Outfit', sans-serif;
  color: #111;
  padding-bottom: 50px;
  overflow-x: hidden;
  position: relative;
}

.create-order-wrap * {
  box-sizing: border-box;
}

/* Layout Grid */
.main-content-grid {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 30px;
  align-items: start;
}

/* Form Styles */
.form-card {
  background: #fff;
  border-radius: 20px;
  padding: 30px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 10px 25px rgba(0,0,0,0.03);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
}

.icon-wrap {
  width: 44px;
  height: 44px;
  background: #f8fafc;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111;
}

.icon-wrap svg { width: 22px; height: 22px; }

.card-header h2 {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-group.full { grid-column: span 2; }

.input-group label {
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input-group input, 
.input-group select, 
.input-group textarea {
  padding: 12px 16px;
  border: 1.5px solid #edf2f7;
  border-radius: 12px;
  font-size: 15px;
  outline: none;
  transition: all 0.2s;
  background: #fbfbfb;
}

.input-group input:focus, 
.input-group select:focus, 
.input-group textarea:focus {
  border-color: #111;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(0,0,0,0.03);
}

/* Product Area */
.product-item-card {
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 15px;
}

.prod-row-main {
  display: grid;
  grid-template-columns: 1fr 80px 120px 40px;
  gap: 15px;
  align-items: flex-end;
}

.prod-row-main label {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  display: block;
  margin-bottom: 5px;
}

.prod-row-main select, 
.prod-row-main input {
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  width: 100%;
}

.currency-wrap {
  position: relative;
}

.currency-wrap span {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
}

.remove-btn {
  background: #fee2e2;
  color: #ef4444;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.2s;
}

.remove-btn:hover { background: #ef4444; color: #fff; }
.remove-btn svg { width: 18px; height: 18px; }

.prod-item-footer {
  margin-top: 15px;
  text-align: right;
  font-size: 13px;
  color: #64748b;
  border-top: 1px dashed #e2e8f0;
  padding-top: 10px;
}

.prod-item-footer strong { color: #111; font-size: 15px; }

.add-prod-btn {
  width: 100%;
  padding: 15px;
  background: #fff;
  border: 2px dashed #e5ccff;
  color: #7c3aed;
  border-radius: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  transition: 0.2s;
  margin-bottom: 25px;
}

.add-prod-btn:hover {
  background: #f5f3ff;
  border-color: #7c3aed;
}

.add-prod-btn svg { width: 18px; height: 18px; }

/* Searchable Select */
.search-select-wrap {
  position: relative;
}

.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #edf2f7;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  z-index: 1000;
  max-height: 250px;
  overflow-y: auto;
  margin-top: 4px;
}

.search-option {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
}

.search-option:hover {
  background: #f8fafc;
}

.no-results {
  padding: 10px 16px;
  font-size: 13px;
  color: #94a3b8;
  text-align: center;
}

/* Payment Options */
.payment-section h3 {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 15px 0;
}

.payment-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.pay-option input { display: none; }

.pay-card {
  border: 1.5px solid #edf2f7;
  border-radius: 14px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: 0.2s;
  background: #fbfbfb;
}

.pay-card svg { width: 24px; height: 24px; color: #94a3b8; }
.pay-card span { font-weight: 600; font-size: 14px; }

input:checked + .pay-card {
  border-color: #111;
  background: #f8fafc;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
}

input:checked + .pay-card svg { color: #111; }

.shipping-fee-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}

.shipping-input {
  width: 70px;
  padding: 4px 8px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  font-size: 13px;
  text-align: right;
  outline: none;
}

.shipping-input:focus {
  border-color: #111;
}

.currency {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

/* Sidebar Summary */
.summary-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid #f0f0f0;
  border-radius: 20px;
  padding: 25px;
  position: sticky;
  top: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.02);
}

.summary-card h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.stats-box {
  background: #fbfbfb;
  border-radius: 14px;
  padding: 20px;
  border: 1px solid #f1f5f9;
  margin-bottom: 20px;
}

.stat-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
  color: #64748b;
}

.free-text {
  color: #10b981;
  font-weight: 600;
}

.stat-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 15px 0;
}

.stat-row.total {
  margin-bottom: 0;
  color: #111;
  font-weight: 800;
}

.total-price {
  font-size: 20px;
  color: #111;
}

.extra-field {
  margin-bottom: 15px;
}

.extra-field label {
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  display: block;
  margin-bottom: 6px;
  text-transform: uppercase;
}

.extra-field select, 
.extra-field textarea {
  width: 100%;
  padding: 10px;
  border: 1.5px solid #edf2f7;
  border-radius: 10px;
  font-size: 14px;
}

.nav-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 25px;
}

.btn-primary {
  background: #111;
  color: #fff;
  border: none;
  padding: 16px;
  border-radius: 14px;
  font-weight: 700;
  font-size: 15px;
  cursor: pointer;
  transition: 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 15px rgba(0,0,0,0.1);
}

.btn-primary:hover {
  background: #333;
  transform: translateY(-2px);
  box-shadow: 0 12px 20px rgba(0,0,0,0.15);
}

.btn-primary.submit {
  background: #111;
}

.btn-back {
  background: #fff;
  border: 1.5px solid #edf2f7;
  padding: 12px;
  border-radius: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.btn-back:hover { background: #f8fafc; }

/* Mobile Bar */
.mobile-bottom-bar {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  z-index: 100;
  padding: 16px 20px;
  box-shadow: 0 -10px 25px rgba(0,0,0,0.06);
  border-top: 1px solid #f0f0f0;
  align-items: center;
  justify-content: space-between;
}

.m-total label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
.m-total span { display: block; font-size: 18px; font-weight: 800; color: #111; }

.m-btns { display: flex; gap: 10px; }

.m-btn-next, .m-btn-submit {
  background: #111;
  color: #fff;
  border: none;
  padding: 0 20px;
  height: 48px;
  border-radius: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
}

.m-btn-back {
  width: 48px;
  height: 48px;
  border: 1.5px solid #edf2f7;
  background: #fff;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.m-btn-next svg, .m-btn-back svg { width: 18px; height: 18px; }

.settings-card {
  margin-top: 24px;
}
@media (max-width: 1024px) {
  .main-content-grid {
    grid-template-columns: 1fr;
    display: block; /* Ensure no grid overflow */
    width: 100%;
  }
  .summary-section {
    display: none;
  }
  .mobile-bottom-bar {
    display: flex;
  }
}

@media (max-width: 768px) {
  .create-order-wrap {
    padding: 0 8px 100px 8px;
    overflow-x: hidden;
  }
  .main-content-grid {
    display: block;
    width: 100%;
  }
  .form-grid {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  .input-group.full {
    grid-column: span 1;
  }
  .form-card { 
    padding: 16px 12px; 
    border-radius: 16px;
    width: 100% !important;
    max-width: 100% !important;
    border: none;
    box-shadow: none;
  }
  .icon-wrap { width: 36px; height: 36px; }
  .icon-wrap svg { width: 18px; height: 18px; }
  .card-header h2 { font-size: 18px; }
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
  .product-item-card {
    padding: 12px;
    margin-left: 0;
    margin-right: 0;
    width: 100%;
  }
  .prod-row-main {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .prod-qty, .prod-price {
    width: 100% !important;
    margin-left: 0 !important;
  }
  .remove-btn {
    width: 100% !important;
    height: 48px !important;
    margin-top: 4px;
  }
  .payment-grid {
    grid-template-columns: 1fr;
  }
  .stats-box {
    padding: 15px;
  }
  .total-price {
    font-size: 18px;
  }
  .btn-primary.full-width {
    padding: 14px;
    font-size: 14px;
  }
}
</style>

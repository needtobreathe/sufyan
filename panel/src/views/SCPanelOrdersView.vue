<template>
  <AdminLayout pageTitle="SCPanel Siparişleri">
    <div class="orders-header">
      <div class="header-left">
        <h2>SCPanel - {{ filterTitle }}</h2>
        <div class="meta-info">
          <span class="orders-count" v-if="searchQuery">
            {{ filteredOrders.length }} sonuç bulundu
          </span>
          <span class="orders-count" v-else>
            {{ filteredOrders.length }} sipariş
          </span>
          <span class="update-ts" v-if="lastUpdateTime">Son Güncelleme: {{ lastUpdateTime.toLocaleTimeString('tr-TR') }}</span>
        </div>
      </div>
      <div class="header-right">
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
      <table class="data-table" v-else>
        <thead>
          <tr>
            <th style="width: 120px">Sipariş No</th>
            <th style="width: 180px">Müşteri</th>
            <th style="width: 120px">Site</th>
            <th>Ürünler</th>
            <th style="width: 120px">Durum</th>
            <th style="width: 120px">Tutar</th>
            <th>Adres</th>
            <th style="width: 250px">İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in filteredOrders" :key="order._id">
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
              <div class="site-subdomain">
                {{ order.site_id }}
              </div>
            </td>
            <td>
              <div class="items-col">
                <div v-for="item in order.items" :key="item._id || item.name" class="item-row">
                  <span class="item-name">{{ item.name }}</span>
                  <span class="item-qty">x{{ item.qty }}</span>
                </div>
              </div>
            </td>
            <td>
              <span :class="['status-badge', getStatusClass(order.status)]">
                {{ getStatusText(order.status) }}
              </span>
            </td>
            <td>
              <span class="total-price">{{ order.totalPrice || 0 }} TL</span>
            </td>
            <td>
              <div class="address-text" :title="order.address">
                <span class="address-region" v-if="order.province !== 'Belirtilmedi'">{{ order.province }} / {{ order.district }}</span>
                <span class="address-details">{{ order.address }}</span>
              </div>
            </td>
            <td>
              <div class="actions-col">
                <router-link :to="'/scpanel-orders/' + order._id" class="action-btn view-btn" style="text-decoration: none; display: inline-flex; align-items: center; justify-content: center;">
                  Görüntüle
                </router-link>
                <button 
                  v-if="order.status !== 'preparing' && order.status !== '3'" 
                  class="action-btn prep-btn" 
                  @click="updateStatus(order._id, 'preparing')" 
                  title="Siparişi Onayla"
                >
                  Onayla
                </button>
                <button 
                  v-if="order.status !== 'cancelled' && order.status !== '9' && order.status !== '10' && order.status !== '11'" 
                  class="action-btn cancel-btn" 
                  @click="updateStatus(order._id, 'cancelled')" 
                  title="İptal Et"
                >
                  İptal
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '../components/AdminLayout.vue'
import { orderStore } from '../store/orderStore'

const route = useRoute()

const orders = ref([])
const isLoading = ref(true)
const searchQuery = ref('')
const lastUpdateTime = ref(null)

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
      // Yenile
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

const filterTitle = computed(() => {
  const f = route.query.filter
  if (f === 'preparing') return 'Hazırlanıyor'
  if (f === 'cancelled') return 'İptal'
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
    // default/new
    list = list.filter(o => o.status === 'pending' || o.status === '1' || !o.status)
  }

  // 2. Search Filter
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

onMounted(() => {
  fetchSCPanelOrders()
})

// Refetch on filter changes
watch(() => route.query.filter, () => {
  fetchSCPanelOrders()
})
</script>

<style scoped>
.orders-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.header-left h2 {
  font-size: 20px;
  font-weight: 700;
  color: #111;
  margin: 0 0 4px 0;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.orders-count {
  font-size: 13px;
  color: #666;
}

.update-ts {
  font-size: 11px;
  color: #999;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-box svg {
  position: absolute;
  left: 12px;
  color: #888;
}

.search-box input {
  padding: 8px 12px 8px 34px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  font-size: 13px;
  width: 250px;
  background: #fff;
  transition: border-color 0.15s;
}

.search-box input:focus {
  outline: none;
  border-color: #333;
}

.table-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e5e5e5;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.loading-state, .empty-state {
  padding: 60px;
  text-align: center;
  color: #666;
  font-size: 14px;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #333;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
  padding: 14px 16px;
  font-size: 13px;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
}

.data-table tr:last-child td {
  border-bottom: none;
}

.data-table tr:hover td {
  background: #fafafa;
}

.order-no-col {
  display: flex;
  flex-direction: column;
}

.order-id {
  font-weight: 600;
  color: #111;
}

.order-date {
  font-size: 11px;
  color: #888;
  margin-top: 2px;
}

.customer-col {
  display: flex;
  flex-direction: column;
}

.customer-name {
  font-weight: 600;
  color: #111;
}

.customer-phone {
  font-size: 11px;
  color: #4f8cff;
  text-decoration: none;
  margin-top: 2px;
}

.customer-phone:hover {
  text-decoration: underline;
}

.site-subdomain {
  display: inline-block;
  padding: 2px 6px;
  background: #f0f0f0;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #555;
}

.items-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.item-name {
  font-weight: 500;
}

.item-qty {
  color: #888;
  font-size: 11px;
  font-weight: 600;
}

.total-price {
  font-weight: 600;
  color: #111;
}

.address-text {
  max-width: 300px;
  display: flex;
  flex-direction: column;
}

.address-region {
  font-weight: 600;
  font-size: 11px;
  color: #555;
  margin-bottom: 2px;
}

.address-details {
  font-size: 12px;
  color: #666;
  word-break: break-word;
  white-space: normal;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 600;
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

.actions-col {
  display: flex;
  gap: 8px;
  align-items: center;
}

.action-btn {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.view-btn {
  background: #f4f5f7;
  color: #333;
}

.view-btn:hover {
  background: #ebecf0;
}

.prep-btn {
  background: #e6f0ff;
  color: #0052cc;
}

.prep-btn:hover {
  background: #d2e4ff;
}

.cancel-btn {
  background: #ffebe6;
  color: #de350b;
}

.cancel-btn:hover {
  background: #ffd5cc;
}

/* Modal Styling */
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
  animation: fadeIn 0.2s ease-out;
}

.modal-card {
  background: #fff;
  width: 600px;
  max-width: 90%;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  animation: slideUp 0.25s ease-out;
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #111;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  color: #999;
  cursor: pointer;
}

.modal-close:hover {
  color: #333;
}

.modal-body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 20px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-section h4 {
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 4px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-item {
  font-size: 13px;
  display: flex;
  flex-direction: column;
}

.detail-item .label {
  color: #888;
  font-size: 11px;
  margin-bottom: 2px;
}

.detail-item .val {
  font-weight: 500;
  color: #111;
}

.detail-item .val a {
  color: #4f8cff;
  text-decoration: none;
}

.detail-item .val a:hover {
  text-decoration: underline;
}

.modal-items-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 5px;
}

.modal-items-table th {
  text-align: left;
  font-size: 11px;
  color: #888;
  padding: 8px;
  background: #fafafa;
}

.modal-items-table td {
  padding: 8px;
  font-size: 13px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-total {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  font-size: 14px;
}

.modal-total strong {
  font-size: 16px;
  color: #111;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content shipment-modal">
      <div class="modal-header">
        <h3>Sevkiyat Özeti & Excel Hazırlama</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>
      
      <div class="modal-body" v-if="!loading">
        <div class="shipment-summary-grid">
          <div class="summary-box">
            <span class="label">Toplam Sipariş</span>
            <span class="value">{{ data.summary.total_count }}</span>
          </div>
          <div class="summary-box">
            <span class="label">Toplam Ciro</span>
            <span class="value">{{ formatTL(data.summary.total_revenue) }}</span>
          </div>
        </div>

        <div class="rep-summary-list">
          <h4>Temsilci Bazlı Dağılım</h4>
          <div class="rep-tags">
            <div v-for="rep in data.summary.reps" :key="rep.name" class="rep-tag">
              <span class="rep-name">{{ rep.name }}</span>
              <span class="rep-count">{{ rep.count }}</span>
            </div>
          </div>
        </div>

        <div class="shipment-table-container">
          <div class="table-header-actions">
            <h4>Seçili Siparişler</h4>
            <div class="bulk-actions">
              <label class="select-all">
                <input type="checkbox" :checked="allSelected" @change="toggleSelectAll" />
                Hepsini Seç
              </label>
            </div>
          </div>
          <table class="modal-table">
            <thead>
              <tr>
                <th width="40">Seç</th>
                <th>Müşteri</th>
                <th>Tutar</th>
                <th>Temsilci</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in data.orders" :key="order.id" :class="{ selected: selectedOrders.includes(order.id) }">
                <td><input type="checkbox" :value="order.id" v-model="selectedOrders" /></td>
                <td>
                  <div class="cust-info">
                    <span class="name">{{ order.customer }}</span>
                    <span class="location">{{ order.city }} / {{ order.district }}</span>
                  </div>
                </td>
                <td>{{ formatTL(order.revenue) }}</td>
                <td class="rep-cell">{{ order.representative }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-else class="modal-loading">
        Veriler Hazırlanıyor...
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="downloadExcel(false)">Excel İndir (Hepsini)</button>
        <div class="right-actions">
          <button class="btn btn-primary" :disabled="selectedOrders.length === 0" @click="processShipment">
            Kargoya Gönder ({{ selectedOrders.length }} Seçili)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { apiFetch } from '@/utils/fetch'

import * as XLSX from 'xlsx'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close', 'success'])

const loading = ref(false)
const data = ref({ summary: { total_count: 0, total_revenue: 0, reps: [] }, orders: [] })
const selectedOrders = ref([])

const close = () => emit('close')

const fetchData = async () => {
  loading.value = true
  selectedOrders.value = []
  try {
    const res = await apiFetch('/api/get_shipping_orders.php')
    const json = await res.json()
    if (json.success) {
      data.value = json
      selectedOrders.value = json.orders.map(o => o.id)
    } else {
       console.error('PHP Error:', json.message);
    }
  } catch (e) {
    alert('Veriler yüklenemedi. Lütfen PHP dosyalarını doğru yüklediğinizden ve tabloyu oluşturduğunuzdan emin olun.')
  } finally {
    loading.value = false
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) fetchData()
})

const allSelected = computed(() => 
  data.value.orders.length > 0 && 
  selectedOrders.value.length === data.value.orders.length
)

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedOrders.value = []
  } else {
    selectedOrders.value = data.value.orders.map(o => o.id)
  }
}

const formatTL = (val) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val)
}

const downloadExcel = async (onlySelected = false) => {
  const ordersToExport = onlySelected 
    ? data.value.orders.filter(o => selectedOrders.value.includes(o.id))
    : data.value.orders;
  
  if (ordersToExport.length === 0) return;

  const exportData = ordersToExport.map(o => ({
    "Ad Soyad": o.customer,
    "Telefon Numarası": o.phone,
    "İl": o.city,
    "İlçe": o.district,
    "Adres": o.address,
    "Ürün": o.products,
    "Fiyat": o.revenue,
    "Ödeme yöntemi": "Kapıda Kartla Temassız Ödeme",
    "Sipariş Notu": o.last_note
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sevkiyat Listesi");
  
  const timestamp = new Date().toLocaleString('tr-TR').replace(/[:/ ]/g, '_');
  XLSX.writeFile(workbook, `sevkiyat_listesi_${timestamp}.xlsx`);

  await apiFetch('/api/process_shipment.php', {
    method: 'POST',
    body: JSON.stringify({ 
      order_ids: ordersToExport.map(o => o.id), 
      type: 'export' 
    })
  });
}

const processShipment = async () => {
  if (!confirm(`${selectedOrders.value.length} sipariş kargoya verildi olarak işaretlenecek. Emin misiniz?`)) return;

  try {
    const res = await apiFetch('/api/process_shipment.php', {
      method: 'POST',
      body: JSON.stringify({ 
        order_ids: selectedOrders.value, 
        type: 'shipment' 
      })
    });
    const json = await res.json();
    if (json.success) {
      alert('Siparişler başarıyla kargoya gönderildi.');
      downloadExcel(true);
      emit('success');
      close();
    } else {
      alert('Hata: ' + json.message);
    }
  } catch (e) {
    alert('Bağlantı hatası oluştu');
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.modal-content.shipment-modal {
  background: white;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 40px rgba(0,0,0,0.2);
  overflow: hidden;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 { font-size: 18px; font-weight: 700; color: #111; }

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.shipment-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-box {
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-box .label { font-size: 12px; color: #64748b; font-weight: 600; }
.summary-box .value { font-size: 20px; font-weight: 800; color: #111; }

.rep-summary-list { margin-bottom: 24px; }
.rep-summary-list h4 { font-size: 14px; margin-bottom: 12px; color: #64748b; }

.rep-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.rep-tag {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 6px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.rep-name { font-size: 13px; font-weight: 500; }
.rep-count { background: #111; color: white; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 700; }

.shipment-table-container { border: 1px solid #f0f0f0; border-radius: 12px; overflow: hidden; }
.table-header-actions {
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.table-header-actions h4 { font-size: 14px; color: #111; }
.select-all { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; cursor: pointer; }

.modal-table { width: 100%; border-collapse: collapse; }
.modal-table th { text-align: left; padding: 10px 16px; font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; background: #fafafa; }
.modal-table td { padding: 12px 16px; border-bottom: 1px solid #f8fafc; font-size: 14px; }
.modal-table tr.selected { background: #f0f9ff; }

.cust-info { display: flex; flex-direction: column; }
.cust-info .name { font-weight: 600; color: #1e293b; }
.cust-info .location { font-size: 12px; color: #64748b; }

.rep-cell { font-weight: 500; color: #3b82f6; }

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
}

.btn {
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary { background: #fff; border: 1px solid #e2e8f0; color: #1e293b; }
.btn-secondary:hover { background: #f8fafc; }

.btn-primary { background: #111; color: white; }
.btn-primary:hover { background: #334155; }
.btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }

.close-btn { background: none; border: none; font-size: 24px; color: #94a3b8; cursor: pointer; }
.modal-loading { padding: 60px; text-align: center; color: #64748b; font-weight: 600; }
</style>

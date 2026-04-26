<template>
  <AdminLayout pageTitle="Güvenlik & İşlem Geçmişi">
    <div class="security-container">
      <div class="header-section">
        <div class="header-info">
          <h2>İşlem Günlükleri</h2>
          <p>Excel indirme ve toplu sevkiyat işlemlerinin takibi ve geri alınması.</p>
        </div>
      </div>

      <div class="logs-table-container">
        <table class="security-table">
          <thead>
            <tr>
              <th>Tarih</th>
              <th>Kullanıcı</th>
              <th>İşlem Tipi</th>
              <th style="text-align: center;">Adet</th>
              <th style="text-align: right;">Ciro</th>
              <th>Durum</th>
              <th style="text-align: center;">Aksiyon</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id" :class="{ 'reverted-row': log.is_reverted }">
              <td class="date-cell">
                <span class="full-date">{{ formatDateFull(log.created_at) }}</span>
                <span class="time">{{ formatTime(log.created_at) }}</span>
              </td>
              <td class="user-cell">
                <div class="user-info">
                  <span class="avatar">{{ log.user_name.charAt(0) }}</span>
                  <span class="name">{{ log.user_name }}</span>
                </div>
              </td>
              <td>
                <span :class="['type-pill', log.type]">
                  {{ log.type === 'shipment' ? 'Sevkiyat (Status Update)' : 'Excel İndirme' }}
                </span>
              </td>
              <td style="text-align: center; font-weight: 700;">{{ log.count }}</td>
              <td style="text-align: right; font-weight: 600;">{{ formatTL(log.revenue) }}</td>
              <td>
                <span v-if="log.is_reverted" class="status-badge reverted">Geri Alındı</span>
                <span v-else class="status-badge active">Tamamlandı</span>
              </td>
              <td style="text-align: center;">
                <button 
                  v-if="log.type === 'shipment' && !log.is_reverted" 
                  class="revert-btn" 
                  @click="revertAction(log.id)"
                  :disabled="revertingId === log.id"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 10h10a5 5 0 0 1 5 5v2"/><polyline points="9 14 3 10 9 6"/>
                  </svg>
                  Geri Al
                </button>
                <span v-else-if="log.is_reverted" class="reverted-text">İşlem Geri Alındı</span>
                <span v-else>-</span>
              </td>
            </tr>
            <tr v-if="logs.length === 0 && !loading">
              <td colspan="7" class="empty-row">Henüz bir işlem kaydı bulunmuyor.</td>
            </tr>
            <tr v-if="loading">
              <td colspan="7" class="loading-row">Günlükler yükleniyor...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '@/utils/fetch'
import AdminLayout from '../components/AdminLayout.vue'

const logs = ref([])
const loading = ref(false)
const revertingId = ref(null)

const fetchLogs = async () => {
  loading.value = true
  try {
    const res = await apiFetch('/api/get_shipment_logs.php')
    const data = await res.json()
    if (data.success) {
      logs.value = data.logs
    }
  } catch (e) {
    console.error('Loglar yüklenemedi', e)
  } finally {
    loading.value = false
  }
}

const revertAction = async (logId) => {
  if (!confirm('Bu sevkiyat işlemini geri almak istediğinize emin misiniz? Siparişler eski statülerine dönecektir.')) return;
  
  revertingId.value = logId
  try {
    const res = await apiFetch('/api/undo_shipment.php', {
      method: 'POST',
      body: JSON.stringify({ log_id: logId })
    })
    const data = await res.json()
    if (data.success) {
      alert('İşlem başarıyla geri alındı.')
      fetchLogs()
    } else {
      alert('Hata: ' + data.message)
    }
  } catch (e) {
    alert('Bağlantı hatası oluştu')
  } finally {
    revertingId.value = null
  }
}

const formatTL = (val) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val)
}

const formatDateFull = (ts) => {
  return new Date(ts * 1000).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const formatTime = (ts) => {
  return new Date(ts * 1000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

onMounted(fetchLogs)
</script>

<style scoped>
.security-container {
  max-width: 1200px;
  margin: 0 auto;
}

.header-section {
  background: white;
  padding: 32px;
  border-radius: 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
  border: 1px solid #f0f0f0;
}

.header-section h2 { font-size: 24px; font-weight: 800; color: #111; margin-bottom: 8px; }
.header-section p { color: #64748b; font-size: 15px; }

.logs-table-container {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
  border: 1px solid #f0f0f0;
}

.security-table { width: 100%; border-collapse: collapse; }
.security-table th {
  text-align: left;
  padding: 16px 24px;
  background: #fafafa;
  font-size: 12px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  border-bottom: 1px solid #f0f0f0;
}

.security-table td { padding: 20px 24px; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
.security-table tr:hover { background: #fafafa; }
.security-table tr.reverted-row { opacity: 0.6; background: #fffcfc; }

.date-cell { display: flex; flex-direction: column; gap: 2px; }
.full-date { font-weight: 600; color: #1e293b; font-size: 14px; }
.time { font-size: 12px; color: #94a3b8; }

.user-cell .user-info { display: flex; align-items: center; gap: 10px; }
.avatar {
  width: 32px;
  height: 32px;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: #475569;
  font-size: 13px;
  text-transform: uppercase;
}
.name { font-weight: 500; font-size: 14px; color: #1e293b; }

.type-pill {
  padding: 4px 12px;
  border-radius: 30px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}
.type-pill.shipment { background: #ecfdf5; color: #059669; }
.type-pill.export { background: #fef3c7; color: #d97706; }

.status-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}
.status-badge.active { background: #f0f9ff; color: #0369a1; }
.status-badge.reverted { background: #fee2e2; color: #991b1b; }

.revert-btn {
  background: #111;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  margin: 0 auto;
}
.revert-btn:hover { background: #ef4444; }
.revert-btn:disabled { background: #ccc; cursor: not-allowed; }

.reverted-text { font-size: 12px; color: #94a3b8; font-style: italic; }
.empty-row, .loading-row { padding: 60px !important; text-align: center; color: #94a3b8; }
</style>

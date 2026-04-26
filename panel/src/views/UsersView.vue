<template>
  <AdminLayout pageTitle="Kullanıcılar">
    <div class="page-header">
      <h2>Kullanıcı Listesi</h2>
      <button class="primary-btn" @click="$router.push('/users/add')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Yeni Kullanıcı
      </button>
    </div>

    <div class="table-card">
      <div v-if="loading" class="loading-state">Yükleniyor...</div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Ad Soyad</th>
            <th>E-posta</th>
            <th>Telefon (WP)</th>
            <th>Rol</th>
            <th>Durum</th>
            <th>İşlemler</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td class="user-name">
              <div class="user-avatar">{{ (user.ad_soyad || '?').charAt(0) }}</div>
              {{ user.ad_soyad }}
            </td>
            <td>{{ user.mail }}</td>
            <td>{{ user.wp_numara }}</td>
            <td>
              <span :class="['role-badge', user.kt_etiket ? 'role-' + user.kt_etiket : 'role-staff']">
                {{ user.kt_baslik }}
              </span>
            </td>
            <td>
              <span :class="['status-badge', user.durum == 1 ? 'status-active' : 'status-inactive']">
                {{ user.durum == 1 ? 'Aktif' : 'Pasif' }}
              </span>
            </td>
            <td>
              <div class="actions">
                <button class="action-btn action-edit" @click="$router.push('/users/' + user.id + '/edit')">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Düzenle
                </button>
                <button class="action-btn action-toggle" @click="toggleStatus(user)">
                  {{ user.durum == 1 ? 'Pasife Al' : 'Aktife Al' }}
                </button>
                <button class="action-btn action-delete" @click="deleteUser(user.id)">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                  Sil
                </button>
              </div>
            </td>
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
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '../components/AdminLayout.vue'
import { apiFetch } from '@/utils/fetch'

const route = useRoute()
const router = useRouter()

const users = ref([])
const loading = ref(true)

// Pagination states
const currentPage = ref(parseInt(route.query.page) || 1)
const totalPages = ref(1)

const fetchUsers = async (page = currentPage.value) => {
  loading.value = true
  try {
    const res = await apiFetch(`/api/users?page=${page}&limit=50`)
    const data = await res.json()
    if (data.success) {
      users.value = data.users
      totalPages.value = data.totalPages || 1
      currentPage.value = data.currentPage || 1
    }
  } catch (error) {
    console.error('Kullanıcılar yüklenemedi:', error)
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
    fetchUsers(p)
  }
})

onMounted(() => {
  fetchUsers()
})

const toggleStatus = async (user) => {
  const newStatus = user.durum == 1 ? 0 : 1
  try {
    const res = await apiFetch('/api/users/save', {
      method: 'POST',
      body: JSON.stringify({ id: user.id, durum: newStatus })
    })
    const data = await res.json()
    if (data.success) {
      user.durum = newStatus
    }
  } catch (error) {
    alert('Durum güncellenemedi')
  }
}

const deleteUser = async (id) => {
  if (confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
    try {
      const res = await apiFetch('/api/users/save', {
        method: 'POST',
        body: JSON.stringify({ id, durum: 0 })
      })
      const data = await res.json()
      if (data.success) {
        users.value = users.value.filter(u => u.id !== id)
      }
    } catch (error) {
      alert('Kullanıcı silinemedi')
    }
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.page-header h2 {
  flex: 1;
  font-size: 18px;
  font-weight: 600;
  color: #111;
  margin: 0;
}

.table-card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  overflow: hidden;
  overflow-x: auto;
}

.loading-state {
  padding: 40px;
  text-align: center;
  color: #888;
  font-size: 14px;
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
  white-space: nowrap;
}

.data-table td {
  padding: 12px 16px;
  font-size: 13px;
  color: #333;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: middle;
  white-space: nowrap;
}

.data-table td:first-child {
  width: 100%;
  white-space: normal;
}

.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: #fafafa; }

.user-name {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #111;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #111;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.role-badge {
  display: inline-block;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 20px;
}

.role-danger { background: #fee2e2; color: #991b1b; }
.role-warning { background: #fef3c7; color: #92400e; }
.role-success { background: #dcfce7; color: #166534; }
.role-info { background: #e0f2fe; color: #075985; }
.role-primary { background: #ede7f6; color: #4527a0; }

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 20px;
}

.status-active { background: #e8f5e9; color: #2e7d32; }
.status-inactive { background: #f1f1f1; color: #888; }

.actions { display: flex; gap: 6px; }

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid #e5e5e5;
  border-radius: 5px;
  background: #fff;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
}

.action-edit { color: #555; }
.action-edit:hover { background: #f5f5f5; border-color: #ccc; color: #111; }

.action-toggle { color: #1565c0; border-color: #bbdefb; }
.action-toggle:hover { background: #e3f2fd; border-color: #1565c0; }

.action-delete { color: #d32f2f; border-color: #ffcdd2; }
.action-delete:hover { background: #ffebee; border-color: #d32f2f; }

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
  transition: background 0.12s;
}

.primary-btn:hover { background: #333; }

.pagination-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 15px;
  border-top: 1px solid #e5e5e5;
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
</style>

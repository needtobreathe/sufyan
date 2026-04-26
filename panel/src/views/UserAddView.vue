<template>
  <AdminLayout :pageTitle="isEdit ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle'">
    <div class="detail-header">
      <div class="detail-header-left">
        <button class="back-btn" @click="$router.push('/users')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Geri
        </button>
        <h2>{{ isEdit ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı Ekle' }}</h2>
      </div>
      <div class="header-actions">
        <button class="discard-btn" @click="$router.push('/users')">Vazgeç</button>
        <button class="save-btn" @click="handleSave" :disabled="saving">
          <svg v-if="!saving" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span v-else class="loader-small"></span>
          Kaydet
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading-state">Yükleniyor...</div>
    <div v-else class="page-grid">
      <!-- Left -->
      <div class="page-main">
        <div class="form-card">
          <div class="card-title">Genel Bilgiler</div>
          <div class="form-row">
            <div class="form-group">
              <label>Kullanıcı Adı <span class="required">*</span></label>
              <input type="text" v-model="form.kadi" class="form-input" placeholder="kullanici_adi" />
            </div>
            <div class="form-group">
              <label>Ad Soyad <span class="required">*</span></label>
              <input type="text" v-model="form.ad_soyad" class="form-input" placeholder="Ad Soyad" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>E-posta</label>
              <input type="email" v-model="form.mail" class="form-input" placeholder="ornek@mail.com" />
            </div>
            <div class="form-group">
              <label>WP Numara</label>
              <input type="text" v-model="form.wp_numara" class="form-input" placeholder="05XX XXX XX XX" />
            </div>
          </div>
        </div>

        <div class="form-card">
          <div class="card-title">Güvenlik & Bildirim</div>
          <div class="form-row">
            <div class="form-group">
              <label>Şifre <span class="required" v-if="!isEdit">*</span></label>
              <input type="password" v-model="form.sifre" class="form-input" :placeholder="isEdit ? 'Değiştirmek için yeni şifre girin' : 'Şifre belirleyin'" />
            </div>
            <div class="form-group">
              <label>Dil</label>
              <select v-model="form.dil" class="form-input">
                <option :value="1">Türkçe</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>ntfy Bildirim Kanalı (Opsiyonel)</label>
              <input type="text" v-model="form.ntfyTopic" class="form-input" placeholder="siparis_ozel_kanal_isminiz" />
              <div class="field-desc">Otomatik girişli bildirimler için telefonunuzdaki ntfy kanal adını buraya yazın.</div>
            </div>
          </div>
        </div>


      </div>

      <!-- Right -->
      <div class="page-side">
        <div class="form-card">
          <div class="card-title">Kullanıcı Tipi</div>
          <select v-model="form.kullanici_tipi" class="form-input" required>
            <option value="" disabled>Seçiniz</option>
            <option v-for="type in userTypes" :key="type.kt_id" :value="type.kt_id">
              {{ type.kt_baslik }}
            </option>
          </select>
        </div>

        <div class="form-card">
          <div class="card-title">Durum</div>
          <div class="toggle-group">
            <button :class="['toggle-option', { active: form.durum == 1 }]" @click="form.durum = 1">
              <span class="toggle-dot active-dot"></span> Aktif
            </button>
            <button :class="['toggle-option', { active: form.durum == 0 }]" @click="form.durum = 0">
              <span class="toggle-dot inactive-dot"></span> Pasif
            </button>
          </div>
        </div>

        <div class="form-card summary-card" v-if="form.ad_soyad">
          <div class="card-title">Önizleme</div>
          <div class="preview-user">
            <div class="preview-avatar">{{ form.ad_soyad.charAt(0) }}</div>
            <div>
              <div class="preview-name">{{ form.ad_soyad }}</div>
              <div class="preview-email">{{ form.mail || 'E-posta girilmedi' }}</div>
            </div>
          </div>
          <div class="preview-meta">
            <span class="role-badge role-primary">{{ selectedTypeName }}</span>
            <span :class="['status-badge', form.durum == 1 ? 'st-active' : 'st-inactive']">{{ form.durum == 1 ? 'Aktif' : 'Pasif' }}</span>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '../components/AdminLayout.vue'
import { apiFetch } from '@/utils/fetch'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)

const loading = ref(true)
const saving = ref(false)
const userTypes = ref([])
const sites = ref([])

const systemPermissions = [
  { value: 'siparis_yonetimi', label: 'Sipariş Yönetimi' },
  { value: 'siparis_olusturma', label: 'Sipariş Oluşturma' },
  { value: 'kargo_yonetimi', label: 'Kargo Yönetimi' },
  { value: 'icerik_yonetimi', label: 'İçerik Yönetimi' },
  { value: 'web_reklam_yonetimi', label: 'Web & Reklam Yönetimi' },
  { value: 'rapor_yonetimi', label: 'Raporlar' },
  { value: 'sistem_yonetimi', label: 'Sistem Yönetimi' },
]

const form = reactive({
  id: null,
  kadi: '',
  ad_soyad: '',
  mail: '',
  wp_numara: '',
  sifre: '',
  kullanici_tipi: '',
  dil: 1,
  yetkiler: ['genel'],
  k_siteler: [],
  k_ilgili_siteler: [],
  durum: 1,
  ntfyTopic: '',
})

const selectedTypeName = computed(() => {
  const t = userTypes.value.find(x => x.kt_id == form.kullanici_tipi)
  return t ? t.kt_baslik : 'Tip Seçilmedi'
})

const fetchData = async () => {
  loading.value = true
  try {
    // Parallel fetches
    const [typesRes, sitesRes] = await Promise.all([
      apiFetch('/api/user-types'),
      apiFetch('/api/sites-list')
    ])
    
    const [typesData, sitesData] = await Promise.all([
      typesRes.json(),
      sitesRes.json()
    ])
    
    if (typesData.success) userTypes.value = typesData.types
    if (sitesData.success) sites.value = sitesData.sites
    
    if (isEdit.value) {
      const userRes = await apiFetch(`/api/users?id=${route.params.id}`)
      const userData = await userRes.json()
      if (userData.success) {
        const u = userData.user
        form.id = u.id
        form.kadi = u.kadi
        form.ad_soyad = u.ad_soyad
        form.mail = u.mail
        form.wp_numara = u.wp_numara
        form.kullanici_tipi = u.kullanici_tipi
        form.dil = u.dil
        form.durum = u.durum
        form.yetkiler = u.yetkiler || ['genel']
        form.k_siteler = u.k_siteler ? u.k_siteler.split(',') : []
        form.k_ilgili_siteler = u.k_ilgili_siteler ? u.k_ilgili_siteler.split(',') : []
        form.ntfyTopic = u.ntfyTopic || ''
        // Important: clear password field on edit
        form.sifre = ''
      }
    }
  } catch (error) {
    console.error('Veriler yüklenemedi:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})


const handleSave = async () => {
  if (!form.kadi || !form.ad_soyad || (!isEdit.value && !form.sifre) || !form.kullanici_tipi) {
    alert('Lütfen zorunlu alanları doldurun.')
    return
  }
  
  saving.value = true
  try {
    // Auto-select all sites as requested
    const allSiteIds = sites.value.map(s => s.site_id.toString())
    form.k_siteler = allSiteIds
    form.k_ilgili_siteler = allSiteIds

    // If it's an admin-like type, give full permissions, otherwise standard
    // Admin type is 1 in legacy, but we'll use a safer approach:
    // If Admin (kt_id 1), grant all, else grant base set
    if (form.kullanici_tipi == 1) {
      form.yetkiler = ['genel', ...systemPermissions.map(p => p.value)]
    } else {
      form.yetkiler = ['genel', 'siparis_yonetimi', 'siparis_olusturma']
    }

    const res = await apiFetch('/api/users/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (data.success) {
      router.push('/users')
    } else {
      alert(data.message || 'Hata oluştu')
    }
  } catch (error) {
    alert('Sunucu hatası oluştu')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

.detail-header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-actions { display: flex; gap: 8px; }

.detail-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #111;
  margin: 0;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
}

.back-btn:hover { background: #f5f5f5; color: #111; }

.discard-btn {
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #888;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
}

.discard-btn:hover { background: #f5f5f5; color: #555; }

.save-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: #111;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.save-btn:hover:not(:disabled) { background: #333; }
.save-btn:disabled { opacity: 0.7; cursor: not-allowed; }

/* Layout */
.page-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
  align-items: start;
}

.page-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Cards */
.form-card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 24px;
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  font-weight: 600;
  color: #111;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.presets {
  display: flex;
  gap: 6px;
}

.preset-btn {
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 600;
  color: #555;
  background: #f0f0f0;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  cursor: pointer;
  text-transform: none;
  letter-spacing: normal;
  transition: all 0.12s;
}

.preset-btn:hover {
  background: #e5e5e5;
  color: #111;
}

/* Form */
.form-group { margin-bottom: 16px; flex: 1; }
.form-group:last-child { margin-bottom: 0; }

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #555;
  margin-bottom: 6px;
}

.required { color: #d32f2f; }

.form-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 13px;
  color: #111;
  background: #fafafa;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  outline: none;
  transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #111;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(17,17,17,0.06);
}

.form-row {
  display: flex;
  gap: 14px;
  margin-bottom: 16px;
}

.field-desc {
  font-size: 12px;
  color: #888;
  margin-bottom: 12px;
  margin-top: -8px;
}

/* Permissions & Sites */
.permissions-grid, .sites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.perm-checkbox, .site-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: background 0.15s;
}

.perm-checkbox:hover, .site-checkbox:hover {
  background: #f9f9f9;
}

.perm-checkbox input, .site-checkbox input {
  display: none;
}

.checkbox-box {
  width: 18px;
  height: 18px;
  border: 2px solid #ddd;
  border-radius: 4px;
  position: relative;
  transition: all 0.15s;
  flex-shrink: 0;
}

.perm-checkbox input:checked + .checkbox-box, 
.site-checkbox input:checked + .checkbox-box {
  background: #111;
  border-color: #111;
}

.perm-checkbox input:checked + .checkbox-box::after,
.site-checkbox input:checked + .checkbox-box::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.perm-checkbox span, .site-checkbox span {
  font-size: 13px;
  color: #444;
}

/* Toggle */
.toggle-group { display: flex; gap: 8px; }

.toggle-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #999;
  background: #fafafa;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.toggle-option.active {
  color: #111;
  background: #fff;
  border-color: #111;
  font-weight: 600;
}

.toggle-dot { width: 8px; height: 8px; border-radius: 50%; }
.active-dot { background: #2e7d32; }
.inactive-dot { background: #bbb; }

/* Preview */
.preview-user {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.preview-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #111;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.preview-name {
  font-size: 14px;
  font-weight: 600;
  color: #111;
}

.preview-email {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.preview-meta {
  display: flex;
  gap: 8px;
}

.role-badge {
  display: inline-block;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 20px;
}

.role-primary { background: #ede7f6; color: #4527a0; }

.status-badge {
  display: inline-block;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 20px;
}

.st-active { background: #e8f5e9; color: #2e7d32; }
.st-inactive { background: #f1f1f1; color: #888; }

.loading-state {
  padding: 100px;
  text-align: center;
  color: #888;
}

.loader-small {
  width: 12px;
  height: 12px;
  border: 2px solid #fff;
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 992px) {
  .page-grid { grid-template-columns: 1fr; }
  .form-row { flex-direction: column; gap: 0; }
}
</style>

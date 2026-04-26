<template>
  <AdminLayout :pageTitle="isEdit ? 'Subdomain Düzenle' : 'Yeni Subdomain Bağla'">
    <div class="detail-header">
      <div class="detail-header-left">
        <button class="back-btn" @click="$router.push('/sites')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Geri
        </button>
        <h2>{{ isEdit ? 'Subdomain Bağlantısını Düzenle' : 'Yeni Subdomain Bağla' }}</h2>
      </div>
      <div class="header-actions">
        <button class="discard-btn" @click="$router.push('/sites')">Vazgeç</button>
        <button class="save-btn" @click="handleSave" :disabled="loading">
          <svg v-if="!loading" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {{ loading ? 'Kaydediliyor...' : 'Kaydet' }}
        </button>
      </div>
    </div>

    <div class="page-grid">
      <!-- Left: Content -->
      <div class="page-main">
        <div class="form-card">
          <div class="card-title">Bağlantı Bilgileri</div>
          
          <div class="form-group">
            <label>Bağlantı Adı <span class="required">*</span></label>
            <input type="text" v-model="form.name" class="form-input" placeholder="Örn: Ana Kampanya Domaini" />
          </div>

          <div class="form-group">
            <label>Subdomain Adı</label>
            <div class="input-with-suffix">
              <input type="text" v-model="form.subdomain" class="form-input" placeholder="Örn: kampanya" />
            </div>
            <span class="form-hint">Sadece subdomain adı (Örn: `kampanya`)</span>
          </div>

          <div class="form-group">
            <label>Özel Domain (Opsiyonel)</label>
            <input type="text" v-model="form.customDomain" class="form-input" placeholder="Örn: kampanya-sitesi.com" />
            <span class="form-hint">Eğer subdomain yerine direkt domain bağlayacaksanız burayı doldurun.</span>
          </div>

          <div class="form-group">
            <label>Yönlendirilecek İçerik <span class="required">*</span></label>
            <div class="toggle-group">
              <button 
                class="toggle-option" 
                :class="{ active: targetType === 'dynamic' }" 
                @click="targetType = 'dynamic'"
              >
                <span class="toggle-dot" :class="targetType === 'dynamic' ? 'active-dot' : 'inactive-dot'"></span>
                Dinamik Yaprak Sayfa
              </button>
              <button 
                class="toggle-option" 
                :class="{ active: targetType === 'legacy' }" 
                @click="targetType = 'legacy'"
              >
                <span class="toggle-dot" :class="targetType === 'legacy' ? 'active-dot' : 'inactive-dot'"></span>
                Klasör (Legacy)
              </button>
            </div>
          </div>

          <!-- Dynamic Page Selector -->
          <div class="form-group animate-fade" v-if="targetType === 'dynamic'">
            <label>Yaprak Sayfa Seçin <span class="required">*</span></label>
            <select v-model="form.leafPageId" class="form-input form-select">
              <option value="">Sayfa Seçiniz...</option>
              <option v-for="page in leafPages" :key="page._id" :value="page._id">
                {{ page.name }} ({{ page.slug }})
              </option>
            </select>
          </div>

          <!-- Legacy Folder Selector -->
          <div class="form-group animate-fade" v-if="targetType === 'legacy'">
            <label>Klasör Adı <span class="required">*</span></label>
            <input type="text" v-model="form.folder" class="form-input" placeholder="Örn: default" />
            <span class="form-hint">`pages/` içindeki klasör adı.</span>
          </div>
        </div>

        <div class="form-card">
          <div class="card-title">Takip & Piksel</div>
          <div class="form-group">
            <label>Facebook / Google Piksel Kodu</label>
            <textarea v-model="form.pixelCode" class="form-input form-textarea-sm" placeholder="&lt;script&gt;...&lt;/script&gt;"></textarea>
            <span class="form-hint">Bu domaine özel takip kodlarını buraya ekleyin.</span>
          </div>
          <div class="form-group">
            <label>Meta Pixel ID (Conversions API)</label>
            <input type="text" v-model="form.metaPixelId" class="form-input" placeholder="123456789..." />
          </div>
          <div class="form-group">
            <label>Meta Access Token (Conversions API)</label>
            <input type="text" v-model="form.metaAccessToken" class="form-input" placeholder="EAAB..." />
          </div>
          <div class="form-group">
            <label>Meta Test Event Code (Optional)</label>
            <input type="text" v-model="form.metaTestCode" class="form-input" placeholder="TEST12345" />
          </div>
        </div>
      </div>

      <div class="page-side">
        <div class="form-card summary-card">
          <div class="card-title">Önizleme</div>
          <div class="preview-address" v-if="form.customDomain || form.subdomain">
            <span class="protocol">https://</span>
            <span class="domain">{{ form.customDomain || form.subdomain }}</span>
          </div>
          <div class="preview-target" v-if="targetType === 'dynamic' && selectedPageName">
             <div class="target-label">Yönlendirme:</div>
             <div class="target-value">{{ selectedPageName }}</div>
          </div>
          <div class="preview-target" v-else-if="targetType === 'legacy' && form.folder">
             <div class="target-label">Yönlendirme:</div>
             <div class="target-value">Klasör: {{ form.folder }}</div>
          </div>
        </div>

        <div class="form-card hint-card">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <p>Wildcard DNS kaydınızın (A *) aktif olduğundan emin olun. Aksi takdirde domain çalışmayacaktır.</p>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiFetch } from '@/utils/fetch'
import AdminLayout from '../components/AdminLayout.vue'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)

const form = reactive({
  name: '',
  subdomain: '',
  customDomain: '',
  folder: '',
  leafPageId: '',
  pixelCode: '',
  metaPixelId: '',
  metaAccessToken: '',
  metaTestCode: ''
})

const targetType = ref('dynamic')
const leafPages = ref([])
const loading = ref(false)

const selectedPageName = computed(() => {
    if (!leafPages.value || leafPages.value.length === 0) return ''
    const page = leafPages.value.find(p => p._id === form.leafPageId)
    return page ? page.name : ''
})

onMounted(async () => {
  await loadLeafPages()
  if (isEdit.value) {
    try {
      const res = await apiFetch(`/api/sites/${route.params.id}`)
      const data = await res.json()
      if (data.success && data.site) {
        form.name = data.site.name || ''
        form.subdomain = data.site.subdomain || ''
        form.customDomain = data.site.customDomain || ''
        form.folder = data.site.folder || ''
        form.leafPageId = data.site.leafPageId || ''
        form.pixelCode = data.site.pixelCode || ''
        form.metaPixelId = data.site.metaPixelId || ''
        form.metaAccessToken = data.site.metaAccessToken || ''
        form.metaTestCode = data.site.metaTestCode || ''
        
        if (form.folder && !form.leafPageId) {
            targetType.value = 'legacy'
        } else {
            targetType.value = 'dynamic'
        }
      }
    } catch (e) {
      console.error("Detaylar yüklenemedi", e)
    }
  }
})

const loadLeafPages = async () => {
  loading.value = true
  try {
    const res = await apiFetch('/api/leaf-pages')
    const data = await res.json()
    if (data.success) leafPages.value = data.leafPages || []
  } catch (e) {
    console.error("Sayfalar yüklenemedi", e)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!form.name || (!form.subdomain && !form.customDomain)) {
    alert('Lütfen ad ve subdomain/domain alanlarından en az birini doldurun.')
    return
  }

  if (targetType.value === 'dynamic' && !form.leafPageId) {
      alert('Lütfen bir yaprak sayfa seçin.')
      return
  }

  if (targetType.value === 'legacy' && !form.folder) {
      alert('Lütfen bir klasör adı girin.')
      return
  }

  // Clean up unused target data before saving
  const payload = { ...form }
  if (targetType.value === 'dynamic') payload.folder = ''
  if (targetType.value === 'legacy') payload.leafPageId = null

  loading.value = true
  try {
    const url = isEdit.value ? `/api/sites/${route.params.id}` : '/api/sites'
    const method = isEdit.value ? 'PUT' : 'POST'

    const res = await apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    const data = await res.json()
    if (data.success) {
      router.push('/sites')
    } else {
      alert(data.message || 'Hata oluştu')
    }
  } catch (e) {
    console.error("Kaydedilemedi", e)
    alert('Bir hata oluştu.')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.input-with-suffix {
  display: flex;
  align-items: center;
  background: #fafafa;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  overflow: hidden;
}

.input-with-suffix .form-input {
    border: none;
    background: transparent;
    flex: 1;
}

.suffix {
    padding: 0 12px;
    color: #888;
    font-size: 13px;
    font-weight: 600;
    background: #f0f0f0;
    height: 38px;
    display: flex;
    align-items: center;
    border-left: 1px solid #e5e5e5;
}

.preview-address {
    margin-bottom: 12px;
    font-size: 14px;
    font-family: monospace;
}

.preview-address .protocol { color: #aaa; }
.preview-address .domain { color: #1565c0; font-weight: 600; }

.preview-target {
    border-top: 1px solid #f0f0f0;
    padding-top: 10px;
}

.target-label { font-size: 11px; color: #888; font-weight: 600; text-transform: uppercase; }
.target-value { font-size: 13px; color: #111; font-weight: 600; margin-top: 2px; }

.detail-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.detail-header-left { display: flex; align-items: center; gap: 14px; }
.header-actions { display: flex; gap: 8px; }
.detail-header h2 { font-size: 18px; font-weight: 600; color: #111; margin: 0; }

.back-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; font-size: 13px; font-weight: 500; color: #666; background: #fff; border: 1px solid #e5e5e5; border-radius: 6px; cursor: pointer; }
.back-btn:hover { background: #f5f5f5; color: #111; }

.discard-btn { padding: 8px 16px; font-size: 13px; font-weight: 500; color: #888; background: #fff; border: 1px solid #e5e5e5; border-radius: 6px; cursor: pointer; }
.save-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 20px; font-size: 13px; font-weight: 600; color: #fff; background: #111; border: none; border-radius: 6px; cursor: pointer; }
.save-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.page-grid { display: grid; grid-template-columns: 1fr 280px; gap: 20px; align-items: start; }
.page-main { display: flex; flex-direction: column; gap: 20px; }
.form-card { background: #fff; border: 1px solid #e5e5e5; border-radius: 8px; padding: 24px; }
.card-title { font-size: 12px; font-weight: 700; color: #111; margin-bottom: 18px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; text-transform: uppercase; letter-spacing: 0.5px; }

.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: #555; margin-bottom: 8px; }
.required { color: #d32f2f; }

.form-input { width: 100%; padding: 10px 12px; font-size: 13px; border: 1px solid #e5e5e5; border-radius: 6px; outline: none; box-sizing: border-box; }
.form-select { appearance: none; background: #fafafa url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 12px center; }

.form-textarea-sm { height: 80px; resize: vertical; }
.form-hint { display: block; font-size: 11px; color: #888; margin-top: 6px; line-height: 1.4; }

.toggle-group { display: flex; gap: 8px; }
.toggle-option { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; font-size: 13px; font-weight: 500; color: #666; background: #fafafa; border: 1px solid #e5e5e5; border-radius: 8px; cursor: pointer; transition: all 0.2s; }
.toggle-option.active { color: #111; background: #fff; border-color: #111; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

.toggle-dot { width: 8px; height: 8px; border-radius: 50%; }
.active-dot { background: #22c55e; box-shadow: 0 0 8px rgba(34,197,94,0.4); }
.inactive-dot { background: #cbd5e1; }

.animate-fade { animation: fadeIn 0.3s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

.hint-card { display: flex; gap: 10px; background: #f8fafc; border-color: #e2e8f0; }
.hint-card svg { color: #64748b; flex-shrink: 0; }
.hint-card p { font-size: 12px; color: #64748b; line-height: 1.5; margin: 0; }

@media (max-width: 900px) { .page-grid { grid-template-columns: 1fr; } }
</style>

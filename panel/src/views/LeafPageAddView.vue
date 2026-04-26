<template>
  <AdminLayout :pageTitle="isEdit ? 'Yaprak Sayfayı Düzenle' : 'Yeni Yaprak Sayfa'">
    <div class="detail-header">
      <div class="detail-header-left">
        <button class="back-btn" @click="$router.push('/leaf-pages')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Geri
        </button>
        <h2>{{ isEdit ? 'Sayfayı Düzenle' : 'Yeni Sayfa Oluştur' }}</h2>
      </div>
      <div class="header-actions">
        <button class="discard-btn" @click="$router.push('/leaf-pages')">Vazgeç</button>
        <button class="save-btn" @click="handleSave" :disabled="saving">
          {{ saving ? 'Kaydediliyor...' : 'Kaydet' }}
        </button>
      </div>
    </div>

    <div class="page-grid">
      <div class="page-main">
        <!-- Temel Bilgiler -->
        <div class="form-card">
          <div class="card-title">Genel Bilgiler</div>
          
          <div class="form-group">
            <label>Sayfa Adı <span class="required">*</span></label>
            <input type="text" v-model="form.name" class="form-input" placeholder="Örn: Yaz İndirimi Kampanyası" />
          </div>

          <div class="form-group">
            <label>Subdomain / Alt Alan Adı <span class="required">*</span></label>
            <div class="input-with-host">
              <input type="text" v-model="form.slug" class="form-input" placeholder="kampanya" />
              <span class="host-suffix">.siparisyonet.store</span>
            </div>
            <span class="form-hint">Müşterileriniz ürüne bu adresten ulaşacaktır.</span>
          </div>

          <div class="form-group">
            <label>Ürün Adı <span class="required">*</span></label>
            <input type="text" v-model="form.productName" class="form-input" placeholder="Örn: Akıllı Saat Siyah" />
          </div>


        </div>

        <!-- Paket Yönetimi -->
        <div class="form-card">
          <div class="card-header">
            <div class="card-title">Paket Yönetimi</div>
            <button class="add-btn" @click="addPackage">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Paket Ekle
            </button>
          </div>
          
          <div class="packages-list">
            <div v-if="form.products.length === 0" class="empty-state-mini">
              Henüz paket eklenmedi. En az bir paket eklemelisiniz.
            </div>
            <div v-for="(pkg, index) in form.products" :key="index" class="package-item-box">
              <div class="package-item-header">
                <div class="pkg-header-left">
                  <span class="package-index">Paket #{{ index + 1 }}</span>
                  <label class="default-badge" :class="{ 'is-active': pkg.isDefault }">
                    <input type="radio" :name="'default-pkg'" :checked="pkg.isDefault" @change="setDefaultPackage(index)" />
                    <span>{{ pkg.isDefault ? 'Varsayılan' : 'Varsayılan Yap' }}</span>
                  </label>
                </div>
                <button class="remove-pkg-btn" @click="removePackage(index)">×</button>
              </div>
              
              <div class="package-item-grid">
                <!-- Paket Görseli -->
                <div class="pkg-img-col">
                  <div class="pkg-img-preview" @click="triggerPackageImageUpload(index)">
                    <img v-if="pkg.image" :src="getImageUrl(pkg.image)" />
                    <div v-else class="img-placeholder">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <span>Seç</span>
                    </div>
                  </div>
                </div>
                
                <div class="pkg-info-col">
                  <div class="form-group-compact">
                    <label>Paket Adı (Buton Yazısı)</label>
                    <input type="text" v-model="pkg.name" class="form-input" placeholder="Örn: 2 Adet Avantajlı" />
                  </div>
                  <div class="pkg-row-inner">
                    <div class="form-group-compact">
                      <label>Adet</label>
                      <input type="number" v-model.number="pkg.quantity" class="form-input" placeholder="1" />
                    </div>
                    <div class="form-group-compact">
                      <label>Fiyat (₺)</label>
                      <input type="number" v-model.number="pkg.price" class="form-input" placeholder="0" />
                    </div>
                  </div>
                </div>
              </div>
              <input type="file" :ref="el => packageImageInputs[index] = el" @change="handlePackageImageUpload(index, $event)" style="display: none" accept="image/*" />
            </div>
          </div>
        </div>

        <!-- Sayfa Bileşenleri (Görsel & Form Yönetimi) -->
        <div class="form-card">
          <div class="card-header">
            <div class="card-title">Sayfa Bileşenleri</div>
            <div class="header-actions-inline">
              <button class="add-btn" @click="triggerFileInput" :disabled="importing">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Görsel Ekle
              </button>
              <button class="import-btn" @click="handleUrlImport" :disabled="importing">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                {{ importing ? 'Aktarılıyor...' : 'URL\'den Aktar' }}
              </button>
            </div>
            <input type="file" ref="fileInput" @change="handleFileUpload" style="display: none" accept="image/*" />
          </div>

          <div class="components-list">
            <div 
              v-for="(comp, index) in form.components" 
              :key="index" 
              class="component-item"
              :class="{ 'is-form': comp.type === 'form' }"
            >
              <div class="comp-drag-handle">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2">
                  <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
                  <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
                </svg>
              </div>

              <div class="comp-preview">
                <img v-if="comp.type === 'image'" :src="getImageUrl(comp.content)" class="preview-img" />
                <div v-else class="form-preview-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
              </div>

              <div class="comp-info">
                <span class="comp-type">{{ comp.type === 'form' ? 'SİPARİŞ FORMU' : 'GÖRSEL' }}</span>
                <span class="comp-name" v-if="comp.type === 'image'">{{ comp.content.split('/').pop() }}</span>
                <span class="comp-name" v-else>Aktif Satış Formu</span>
              </div>

              <div class="comp-actions">
                <button class="action-btn" @click="moveComponent(index, -1)" :disabled="index === 0" title="Yukarı Taşı">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                </button>
                <button class="action-btn" @click="moveComponent(index, 1)" :disabled="index === form.components.length - 1" title="Aşağı Taşı">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>
                <button v-if="comp.type !== 'form'" class="action-btn delete" @click="removeComponent(index)" title="Kaldır">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Takip Kodları -->
        <div class="form-card">
          <div class="card-title">Takip & Piksel</div>
          <div class="form-group">
            <label>Tarayıcı Piksel / Header Kodları</label>
            <textarea v-model="form.pixelCode" class="form-input form-textarea" placeholder="&lt;script&gt;...&lt;/script&gt;"></textarea>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>TikTok Pixel ID (Events API)</label>
              <input type="text" v-model="form.tiktokPixelId" class="form-input" placeholder="D72GN7JC..." />
            </div>
            <div class="form-group">
              <label>TikTok Access Token (Events API)</label>
              <input type="text" v-model="form.tiktokAccessToken" class="form-input" placeholder="e9ceff2..." />
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
      </div>

      <div class="page-side">
        <div class="form-card summary-card">
          <div class="card-title">Önizleme Bilgileri</div>
          <div class="preview-item">
            <span class="label">Adres:</span>
            <span class="value" style="font-size: 11px;">{{ form.slug || '...' }}.siparisyonet.store</span>
          </div>
          <div class="preview-item">
            <span class="label">Ürün:</span>
            <span class="value text-truncate">{{ form.productName || 'Belirtilmedi' }}</span>
          </div>
          <div class="preview-item">
            <span class="label">Paket Sayısı:</span>
            <span class="value">{{ form.products.length }}</span>
          </div>
          <div class="preview-item">
            <span class="label">Bileşenler:</span>
            <span class="value">{{ form.components.length }}</span>
          </div>
        </div>

        <div class="form-card hint-card">
          <p>Bileşenleri sürükleyerek veya butonlarla sıralayarak sayfa yapısını dilediğiniz gibi oluşturabilirsiniz.</p>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { apiFetch, getImageUrl } from '@/utils/fetch'
import AdminLayout from '../components/AdminLayout.vue'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)

const fileInput = ref(null)
const mainImageInput = ref(null)
const packageImageInputs = ref([])
const form = reactive({
  name: '',
  slug: '',
  productName: '',
  productPrice: 0,
  productId: null,
  phone: '',
  products: [
    { name: '1 Adet', quantity: 1, price: 0, image: '' } // Default package
  ],
  pixelCode: '',
  tiktokPixelId: '',
  tiktokAccessToken: '',
  metaPixelId: '',
  metaAccessToken: '',
  metaTestCode: '',
  mainImage: '',
  components: [
    { type: 'form', title: 'Sipariş Formu' } // Default component
  ]
})

const loading = ref(false)
const saving = ref(false)
const importing = ref(false)

onMounted(async () => {
  if (isEdit.value) {
    await loadPageData()
  }
})

const loadPageData = async () => {
  loading.value = true
  try {
    const res = await apiFetch(`/api/leaf-pages/${route.params.id}`)
    const data = await res.json()
    if (data.success && data.page) {
      const p = data.page
      form.name = p.name || ''
      form.slug = p.slug || ''
      form.productName = p.productName || ''
      form.productPrice = p.productPrice || 0
      form.productId = data.page.productId
      form.phone = data.page.phone || ''
      form.products = data.page.products || []
      form.pixelCode = p.pixelCode || ''
      form.tiktokPixelId = p.tiktokPixelId || ''
      form.tiktokAccessToken = p.tiktokAccessToken || ''
      form.metaPixelId = p.metaPixelId || ''
      form.metaAccessToken = p.metaAccessToken || ''
      form.metaTestCode = p.metaTestCode || ''
      form.mainImage = p.mainImage || ''
      if (p.components && p.components.length > 0) {
        form.components = p.components
      }
    }
  } catch (e) {
    console.error("Sayfa verisi yüklenemedi", e)
  } finally {
    loading.value = false
  }
}

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('image', file)

  try {
    const res = await apiFetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.success) {
      form.components.push({
        type: 'image',
        content: data.url
      })
    } else {
      alert(data.message || 'Yükleme hatası')
    }
  } catch (err) {
    console.error('Yükleme hatası:', err)
    alert('Resim yüklenemedi.')
  } finally {
    event.target.value = '' // Reset input
  }
}

const triggerMainImageUpload = () => {
  mainImageInput.value.click()
}

const handleMainImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('image', file)

  try {
    const res = await apiFetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.success) {
      form.mainImage = data.url
    } else {
      alert(data.message || 'Yükleme hatası')
    }
  } catch (err) {
    console.error('Yükleme hatası:', err)
    alert('Resim yüklenemedi.')
  } finally {
    event.target.value = '' // Reset input
  }
}
const addPackage = () => {
  form.products.push({
    name: '',
    quantity: 1,
    price: 0,
    image: '',
    isDefault: form.products.length === 0 // First one is default by default
  })
}

const setDefaultPackage = (index) => {
  form.products.forEach((p, i) => {
    p.isDefault = (i === index)
  })
}

const removePackage = (index) => {
  form.products.splice(index, 1)
}

const triggerPackageImageUpload = (index) => {
  const el = packageImageInputs.value[index]
  if (el) el.click()
}

const handlePackageImageUpload = async (index, event) => {
  const file = event.target.files[0]
  if (!file) return

  const formData = new FormData()
  formData.append('image', file)

  try {
    const res = await apiFetch('/api/upload', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    if (data.success) {
      form.products[index].image = data.url
    } else {
      alert(data.message || 'Yükleme hatası')
    }
  } catch (err) {
    console.error('Yükleme hatası:', err)
    alert('Resim yüklenemedi.')
  } finally {
    event.target.value = ''
  }
}

const removeComponent = (index) => {
  if (form.components[index].type === 'form') return
  form.components.splice(index, 1)
}

const moveComponent = (index, direction) => {
  const newIndex = index + direction
  if (newIndex < 0 || newIndex >= form.components.length) return
  
  const element = form.components.splice(index, 1)[0]
  form.components.splice(newIndex, 0, element)
}

const handleUrlImport = async () => {
  const url = prompt('Görsellerini çekmek istediğiniz sayfanın tam adresini (URL) girin:')
  if (!url || !url.startsWith('http')) return

  importing.value = true
  try {
    const res = await apiFetch('/api/import-images', {
      method: 'POST',
      body: JSON.stringify({ url })
    })
    const data = await res.json()
    if (data.success && data.images) {
      if (data.images.length === 0) {
        alert('Sayfada aktarılacak görsel bulunamadı.')
        return
      }
      // Insert at the beginning of the list (top) in reverse order to maintain source sequence
      [...data.images].reverse().forEach(imgUrl => {
        form.components.unshift({
          type: 'image',
          content: imgUrl
        })
      })
      alert(`${data.images.length} adet görsel başarıyla aktarıldı.`)
    } else {
      alert(data.message || 'Aktarma hatası')
    }
  } catch (err) {
    console.error('Import error:', err)
    alert('İçe aktarma sırasında bir hata oluştu.')
  } finally {
    importing.value = false
  }
}

const handleSave = async () => {
  if (!form.name || !form.slug || !form.productName) {
    alert('Lütfen zorunlu alanları (*) doldurun.')
    return
  }

  if (form.products.length === 0) {
    alert('Lütfen en az bir paket ekleyin.')
    return
  }

  saving.value = true
  try {
    const url = isEdit.value ? `/api/leaf-pages/${route.params.id}` : '/api/leaf-pages'
    const method = isEdit.value ? 'PUT' : 'POST'

    const res = await apiFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    
    const data = await res.json()
    if (data.success) {
      router.push('/leaf-pages')
    } else {
      alert(data.message || 'Kaydedilemedi')
    }
  } catch (e) {
    console.error("Kaydetme hatası", e)
    alert('Bir hata oluştu.')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.detail-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.detail-header-left { display: flex; align-items: center; gap: 14px; }
.header-actions { display: flex; gap: 8px; }
.detail-header h2 { font-size: 18px; font-weight: 600; color: #111; margin: 0; }

.back-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; font-size: 13px; color: #666; background: #fff; border: 1px solid #e5e5e5; border-radius: 6px; cursor: pointer; }
.discard-btn { padding: 8px 16px; font-size: 13px; color: #888; background: #fff; border: 1px solid #e5e5e5; border-radius: 6px; cursor: pointer; }
.save-btn { padding: 8px 20px; font-size: 13px; font-weight: 600; color: #fff; background: #111; border: none; border-radius: 6px; cursor: pointer; }
.save-btn:disabled { opacity: 0.6; }

.page-grid { display: grid; grid-template-columns: 1fr 300px; gap: 20px; }
.page-main { display: flex; flex-direction: column; gap: 20px; }
.form-card { background: #fff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 24px; }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.card-title { font-size: 12px; font-weight: 700; color: #111; text-transform: uppercase; letter-spacing: 0.5px; }

.form-group { margin-bottom: 20px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: #555; margin-bottom: 8px; }
.required { color: #d32f2f; }

.form-input { width: 100%; padding: 10px 12px; font-size: 13px; border: 1px solid #e5e5e5; border-radius: 6px; outline: none; box-sizing: border-box; }
.form-select { appearance: none; background: #fafafa url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") no-repeat right 12px center; }
.form-textarea { height: 100px; resize: vertical; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 10px; }
@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } }

.input-with-host { display: flex; align-items: center; border: 1px solid #e5e5e5; border-radius: 6px; overflow: hidden; background: #fff; }
.input-with-host .form-input { border: none; flex: 1; border-radius: 0; }
.input-with-host .host-suffix { padding: 0 12px; background: #f8fafc; border-left: 1px solid #e2e8f0; color: #64748b; font-size: 13px; font-weight: 600; height: 38px; display: flex; align-items: center; pointer-events: none; }

.product-info-box { margin-top: 12px; padding: 12px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; }
.info-row { font-size: 12px; color: #475569; margin-bottom: 4px; }

/* Components List */
.header-actions-inline { display: flex; gap: 8px; }
.add-btn, .import-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; font-size: 12px; font-weight: 600; border-radius: 6px; cursor: pointer; transition: all 0.2s; }
.add-btn { color: #111; background: #f5f5f5; border: 1px solid #ddd; }
.add-btn:hover { background: #eee; }
.import-btn { color: #fff; background: #f27a1a; border: none; }
.import-btn:hover { background: #e66c0d; }
.add-btn:disabled, .import-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.components-list { display: flex; flex-direction: column; gap: 10px; }
.component-item { display: flex; align-items: center; gap: 14px; padding: 12px; background: #fff; border: 1px solid #eee; border-radius: 10px; transition: all 0.2s; }
.component-item.is-form { background: #f8fafc; border-color: #e2e8f0; }
.component-item:hover { border-color: #ddd; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }

.comp-drag-handle { cursor: grab; }
.comp-preview { width: 50px; height: 50px; border-radius: 6px; overflow: hidden; background: #f5f5f5; display: flex; align-items: center; justify-content: center; border: 1px solid #eee; flex-shrink: 0; }
.preview-img { width: 100%; height: 100%; object-fit: cover; }
.form-preview-icon { color: #64748b; }

.comp-info { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.comp-type { font-size: 10px; font-weight: 700; color: #94a3b8; }
.comp-name { font-size: 13px; color: #334155; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.comp-actions { display: flex; gap: 6px; }
.action-btn { width: 28px; height: 28px; border-radius: 4px; border: 1px solid #eee; background: #fff; color: #666; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.action-btn:hover:not(:disabled) { border-color: #ccc; color: #111; background: #f9f9f9; }
.action-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.action-btn.delete:hover { border-color: #fecaca; color: #dc2626; background: #fef2f2; }

.text-truncate { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }

.summary-card .preview-item { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
.summary-card .preview-item .label { color: #888; }
.summary-card .preview-item .value { font-weight: 600; color: #111; }

.hint-card { background: #fffbeb; border-color: #fef3c7; }
.hint-card p { font-size: 12px; color: #92400e; margin: 0; line-height: 1.5; }

@media (max-width: 900px) { .page-grid { grid-template-columns: 1fr; } }

/* Main Image Upload Styling */
.main-image-upload-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  border: 1px dashed #e2e8f0;
  margin-top: 8px;
}

.main-image-preview {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.main-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-main-img {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  background: rgba(220, 38, 38, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  z-index: 10;
}

.upload-controls {
  display: flex;
  gap: 8px;
}

.upload-mini-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.upload-mini-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

/* Package System Styles */
.packages-list { display: flex; flex-direction: column; gap: 12px; margin-top: 12px; }
.empty-state-mini { padding: 20px; text-align: center; color: #94a3b8; font-size: 13px; background: #f8fafc; border-radius: 8px; border: 1px dashed #e2e8f0; }
.package-item-box { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
.package-item-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
.pkg-header-left { display: flex; align-items: center; gap: 10px; }
.package-index { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; }

.default-badge { display: flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 20px; background: #fff; border: 1px solid #e2e8f0; cursor: pointer; transition: all 0.2s; }
.default-badge input { display: none; }
.default-badge span { font-size: 10px; font-weight: 700; color: #64748b; }
.default-badge.is-active { background: #f97316; border-color: #f97316; }
.default-badge.is-active span { color: #fff; }
.remove-pkg-btn { background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; line-height: 1; }
.remove-pkg-btn:hover { color: #ef4444; }

.package-item-grid { display: grid; grid-template-columns: 80px 1fr; gap: 16px; padding: 12px; }
.pkg-img-col { width: 80px; height: 80px; }
.pkg-img-preview { width: 100%; height: 100%; border-radius: 8px; border: 1px solid #e2e8f0; cursor: pointer; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f1f5f9; position: relative; }
.pkg-img-preview img { width: 100%; height: 100%; object-fit: cover; }
.pkg-img-preview .img-placeholder { display: flex; flex-direction: column; align-items: center; gap: 4px; color: #94a3b8; }
.pkg-img-preview .img-placeholder span { font-size: 10px; font-weight: 600; }

.pkg-info-col { flex: 1; display: flex; flex-direction: column; gap: 8px; }
.form-group-compact { margin: 0; }
.form-group-compact label { display: block; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
.pkg-row-inner { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
</style>

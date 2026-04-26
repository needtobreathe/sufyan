<template>
  <AdminLayout :pageTitle="isEdit ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'">
    <div class="detail-header">
      <div class="detail-header-left">
        <button class="back-btn" @click="$router.push('/products')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Geri
        </button>
        <h2>{{ isEdit ? 'Ürün Düzenle' : 'Yeni Ürün Ekle' }}</h2>
      </div>
      <div class="header-actions">
        <button class="discard-btn" @click="$router.push('/products')">Vazgeç</button>
        <button class="save-btn" @click="handleSave">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Kaydet
        </button>
      </div>
    </div>

    <div class="page-grid">
      <!-- Left: Content -->
      <div class="page-main">
        <!-- Genel Bilgiler -->
        <div class="form-card">
          <div class="card-title">Genel Bilgiler</div>
          <div class="form-group">
            <label>Ürün Adı <span class="required">*</span></label>
            <input type="text" v-model="form.name" class="form-input" placeholder="Ürün adını girin" />
          </div>
          <div class="form-group">
            <label>Satış Fiyatı <span class="required">*</span></label>
            <div class="input-with-prefix">
              <span class="input-prefix">₺</span>
              <input type="number" v-model.number="form.price" class="form-input has-prefix" placeholder="0" />
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Sidebar -->
      <div class="page-side">
        <div class="form-card">
          <div class="card-title">Yayın Durumu</div>
          <div class="toggle-group">
            <button :class="['toggle-option', { active: form.active }]" @click="form.active = true">
              <span class="toggle-dot active-dot"></span> Aktif
            </button>
            <button :class="['toggle-option', { active: !form.active }]" @click="form.active = false">
              <span class="toggle-dot inactive-dot"></span> Pasif
            </button>
          </div>
        </div>

        <div class="form-card hint-card">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <p>Kaydet butonuna bastığınızda ürün otomatik olarak listeye eklenecektir.</p>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '../components/AdminLayout.vue'
import { apiFetch, getImageUrl } from '../utils/fetch'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)

const form = reactive({
  id: null,
  name: '',
  price: 0,
  active: true
})

const fetchProduct = async () => {
  if (!isEdit.value) return
  
  try {
    const response = await apiFetch('/api/products?id=' + route.params.id)
    const data = await response.json()
    if (data.success) {
      const p = data.products.find(x => x.id == route.params.id)
      if (p) {
        form.id = p.id
        form.name = p.name
        form.price = p.price
        form.active = p.active
      }
    }
  } catch (error) {
    console.error('Ürün yüklenemedi:', error)
  }
}

const handleSave = async () => {
  if (!form.name || !form.price) {
    alert('Lütfen zorunlu alanları doldurun.')
    return
  }

  try {
    const response = await apiFetch('/api/products/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: form.id,
        name: form.name,
        price: form.price,
        active: form.active,
        packages: [] // Explicitly clear packages on save
      })
    })
    const data = await response.json()
    if (data.success) {
      alert(data.message)
      router.push('/products')
    } else {
      alert(data.message || 'Ürün kaydedilemedi')
    }
  } catch (error) {
    alert('Bir hata oluştu')
  }
}

onMounted(fetchProduct)
</script>

<style scoped>
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
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
  transition: background 0.12s, color 0.12s;
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

.save-btn:hover { background: #333; }

.page-grid {
  display: grid;
  grid-template-columns: 1fr 280px;
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

/* Card & Form */
.form-card {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 20px;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  color: #111;
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group { margin-bottom: 20px; }
.form-group:last-child { margin-bottom: 0; }
.form-group label { display: block; font-size: 13px; font-weight: 600; color: #555; margin-bottom: 8px; }
.required { color: #d32f2f; margin-left: 2px; }

.form-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  color: #111;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  outline: none;
  transition: all 0.15s;
}

.form-input:focus {
  border-color: #111;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(17,17,17,0.06);
}

.form-hint {
  display: block;
  font-size: 11px;
  color: #888;
  margin-top: 6px;
  line-height: 1.4;
}

/* Price input */
.input-with-prefix { position: relative; }

.input-prefix {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  font-weight: 600;
  color: #999;
  pointer-events: none;
}

.has-prefix { padding-left: 28px; }

input[type=number] { -moz-appearance: textfield; appearance: textfield; }
input[type=number]::-webkit-outer-spin-button,
input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; appearance: none; margin: 0; }

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

/* Hint */
.hint-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 18px;
  background: #f9f9f9;
  border-color: #eee;
}

.hint-card svg { color: #aaa; flex-shrink: 0; margin-top: 1px; }
.hint-card p { font-size: 12px; color: #999; line-height: 1.5; margin: 0; }

.mt-4 { margin-top: 16px; }
.m-0 { margin: 0; }
.mb-4 { margin-bottom: 16px; }

.card-header-flex {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.add-package-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #111;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.scrape-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: #2e7d32;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.scrape-btn:hover { background: #1b5e20; }
.scrape-btn:disabled { background: #9e9e9e; cursor: not-allowed; }

/* Packages Redesign */
.packages-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.package-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.package-card:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.package-card.is-default {
  border-color: #111;
  background: #fdfdfd;
}

.package-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.package-number {
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.package-header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.default-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  user-select: none;
}

.default-toggle input {
  accent-color: #111;
  width: 14px;
  height: 14px;
}

.package-card.is-default .toggle-label {
  color: #111;
}

.delete-pkg-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid #fee2e2;
  color: #ef4444;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.delete-pkg-btn:hover:not(:disabled) {
  background: #fef2f2;
  border-color: #fca5a5;
  transform: scale(1.05);
}

.delete-pkg-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.package-card-body {
  display: grid;
  grid-template-columns: 1fr 120px;
  gap: 24px;
  padding: 20px;
}

.package-main-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.package-specs {
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 16px;
}

.text-center { text-align: center; }

.package-visual {
  display: flex;
  flex-direction: column;
}

.package-img-wrap {
  position: relative;
  width: 120px;
  height: 90px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  background: #fff;
}

.package-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.remove-img-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0,0,0,0.6);
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: all 0.2s;
}

.remove-img-btn:hover { background: rgba(0,0,0,0.8); }

.package-img-empty {
  width: 120px;
  height: 90px;
  border: 2px dashed #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #94a3b8;
  cursor: pointer;
  background: #f8fafc;
  transition: all 0.2s;
}

.package-img-empty:hover {
  border-color: #cbd5e1;
  color: #64748b;
  background: #fff;
}

.package-img-empty span { font-size: 11px; font-weight: 500; }

.mb-0 { margin-bottom: 0 !important; }
.mb-6 { margin-bottom: 24px !important; }

.spinner-sm {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.remove-package-btn:hover:not(:disabled) {
  background: #ffebee;
}

.remove-package-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.default-radio {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  margin-top: 8px;
  cursor: pointer;
}

.package-image-section {
  margin-top: 12px;
  border-top: 1px solid #eee;
  padding-top: 12px;
}

.package-image-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #eee;
  border-radius: 6px;
  overflow: hidden;
}

.package-image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.clear-img-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 24px;
  height: 24px;
  background: rgba(0,0,0,0.5);
  color: #fff;
  border: none;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.package-image-placeholder {
  width: 100%;
  aspect-ratio: 21 / 9;
  background: #fff;
  border: 1px dashed #ccc;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  color: #666;
  font-size: 11px;
  font-weight: 500;
}

.package-image-placeholder:hover {
  background: #fafafa;
  border-color: #999;
}

@media (max-width: 768px) {
  .page-grid { grid-template-columns: 1fr; }
  .form-row, .package-row { grid-template-columns: 1fr; flex-direction: column; gap: 8px; }
  .remove-package-btn { margin-bottom: 0; align-self: flex-end; }
}
</style>

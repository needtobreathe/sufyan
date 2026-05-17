<template>
  <AdminLayout pageTitle="Genel Ayarlar">
    <div class="settings-container">
      <div class="form-card">
        <div class="card-header">
          <div class="card-title">Piksel Ayarları (Tüm Sayfalar)</div>
          <button class="save-btn" @click="saveSettings('global_pixel')" :disabled="saving === 'global_pixel'">
            {{ saving === 'global_pixel' ? 'Kaydediliyor...' : 'Kaydet' }}
          </button>
        </div>
        <div class="form-group">
          <label>Global Piksel / Header Kodları</label>
          <textarea 
            v-model="settings.global_pixel" 
            class="form-input form-textarea" 
            placeholder="Piksel kodlarını buraya yapıştırın (örn: &lt;script&gt;...&lt;/script&gt;)"
          ></textarea>
          <span class="form-hint">Buraya eklenen kodlar istisnasız tüm landing page ve başarı sayfalarının &lt;head&gt; bölümüne eklenecektir.</span>
        </div>
      </div>

      <div class="form-card">
        <div class="card-header">
          <div class="card-title">Teşekkürler Sayfası Head Kodu</div>
          <button class="save-btn" @click="saveSettings('success_head_code')" :disabled="saving === 'success_head_code'">
            {{ saving === 'success_head_code' ? 'Kaydediliyor...' : 'Kaydet' }}
          </button>
        </div>
        <div class="form-group">
          <label>Teşekkürler (Başarı) Sayfası Özel Head Kodları</label>
          <textarea 
            v-model="settings.success_head_code" 
            class="form-input form-textarea" 
            placeholder="Sadece teşekkürler sayfasına eklenecek kodları buraya yapıştırın (örn: &lt;script&gt;...&lt;/script&gt;)"
          ></textarea>
          <span class="form-hint">Buraya eklenen kodlar <strong>sadece</strong> sipariş sonrası teşekkürler (success) sayfasının &lt;head&gt; bölümüne eklenecektir. Landing page'lere eklenmez.</span>
        </div>
      </div>

      <div class="form-card">
        <div class="card-header">
          <div class="card-title">WhatsApp Ayarları</div>
          <button class="save-btn" @click="saveSettings('active_wp_number')" :disabled="saving === 'active_wp_number'">
            {{ saving === 'active_wp_number' ? 'Kaydediliyor...' : 'Kaydet' }}
          </button>
        </div>
        <div class="form-group">
          <label>Varsayılan WhatsApp Onay Numarası</label>
          <input 
            type="text" 
            v-model="settings.active_wp_number" 
            class="form-input" 
            placeholder="90544... (Sadece Rakamlar)"
          />
          <span class="form-hint">Ürün veya sayfa bazlı numara girilmediğinde bu numara kullanılır.</span>
        </div>
      </div>

      <div class="form-card">
        <div class="card-header">
          <div class="card-title">Tüm Ürünler Sayfası Ayarları</div>
          <button class="save-btn" @click="saveSettings('urunler_scrolling_text')" :disabled="saving === 'urunler_scrolling_text'">
            {{ saving === 'urunler_scrolling_text' ? 'Kaydediliyor...' : 'Kaydet' }}
          </button>
        </div>
        <div class="form-group">
          <label>Kayan Yazı Metni (HTML Destekler)</label>
          <textarea 
            v-model="settings.urunler_scrolling_text" 
            class="form-input form-textarea" 
            style="min-height: 120px;"
            placeholder="Örn: <span>🚚 ÜCRETSİZ KARGO</span>"
          ></textarea>
          <span class="form-hint">Tüm ürünler sayfasının en üstünde akan metin. Her duyuruyu &lt;span&gt; içine almanız önerilir.</span>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { apiFetch } from '@/utils/fetch'
import AdminLayout from '../components/AdminLayout.vue'

const settings = reactive({
  global_pixel: '',
  success_head_code: '',
  active_wp_number: '',
  urunler_scrolling_text: ''
})

const saving = ref(null)

const fetchSettings = async () => {
  try {
    const res = await apiFetch('/api/settings')
    const data = await res.json()
    if (data.success) {
      settings.global_pixel = data.settings.global_pixel || ''
      settings.success_head_code = data.settings.success_head_code || ''
      settings.active_wp_number = data.settings.active_wp_number || ''
      settings.urunler_scrolling_text = data.settings.urunler_scrolling_text || ''
    }
  } catch (error) {
    console.error('Ayarlar yüklenemedi:', error)
  }
}

const saveSettings = async (key) => {
  saving.value = key
  try {
    const res = await apiFetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: settings[key] })
    })
    const data = await res.json()
    if (data.success) {
      alert('Ayar başarıyla kaydedildi.')
    } else {
      alert('Hata: ' + data.message)
    }
  } catch (error) {
    alert('Bağlantı hatası')
  } finally {
    saving.value = null
  }
}

onMounted(fetchSettings)
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-card {
  background: white;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.02);
  border: 1px solid #f0f0f0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-title {
  font-size: 18px;
  font-weight: 800;
  color: #111;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.form-input {
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  transition: all 0.2s;
  background: #f8fafc;
}

.form-input:focus {
  outline: none;
  border-color: #111;
  background: white;
  box-shadow: 0 0 0 4px rgba(0,0,0,0.02);
}

.form-textarea {
  min-height: 200px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 13px;
  line-height: 1.6;
}

.form-hint {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.save-btn {
  background: #111;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.save-btn:hover {
  background: #333;
  transform: translateY(-1px);
}

.save-btn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
}
</style>

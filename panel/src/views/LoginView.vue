<template>
  <div class="login-wrapper">
    <div class="login-container">
      <div class="login-content">
        <header class="login-header">
          <div class="brand">
            <span class="brand-name">Sipariş Yönet</span>
            <div class="brand-divider"></div>
          </div>
          <h1>Yönetim Paneli</h1>
          <p>Devam etmek için lütfen giriş yapın.</p>
        </header>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-field">
            <label for="username">Kullanıcı Adı</label>
            <input
              id="username"
              v-model="username"
              type="text"
              placeholder="Adınızı giriniz"
              autocomplete="username"
              required
            />
          </div>

          <div class="form-field">
            <label for="password">Şifre</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
          </div>

          <transition name="fade">
            <div v-if="error" class="error-alert">
              {{ error }}
            </div>
          </transition>

          <button type="submit" :disabled="loading" class="submit-btn">
            <span v-if="!loading">Giriş Yap</span>
            <span v-else class="spinner"></span>
          </button>
        </form>

        <footer class="login-footer">
          <p>
            &copy; {{ new Date().getFullYear() }} Sipariş Yönet. Tüm hakları
            saklıdır.
          </p>
        </footer>
      </div>
    </div>
    <div class="login-decoration"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { apiFetch } from "@/utils/fetch";

const router = useRouter();
const route = useRoute();
const username = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

onMounted(() => {
  // --- Otomatik Giriş (Auto-Login) Mantığı ---
  const queryToken = route.query.token;
  const redirectPath = route.query.redirect || "/";

  if (queryToken) {
    loading.value = true;
    // Token'ı doğrudan kaydet ve yönlendir
    // Not: Token geçerliliği ilk sayfada (router.beforeEach) zaten kontrol edilecek
    localStorage.setItem("admin_token", queryToken);
    // opsiyonel: Kullanıcı bilgisini temizle veya token'dan çöz (şablon gereği boş bırakıyoruz)
    localStorage.removeItem("admin_user");

    // Kısa bir bekleme (UI akışı için)
    setTimeout(() => {
      router.push(redirectPath);
    }, 500);
  }
});

const handleLogin = async () => {
  error.value = "";
  loading.value = true;

  try {
    const res = await apiFetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    });

    const data = await res.json();

    if (data.success && data.token) {
      localStorage.setItem("admin_token", data.token);
      localStorage.setItem("admin_user", JSON.stringify(data.user));
      router.push("/");
    } else {
      error.value = data.message || "Giriş bilgileri hatalı.";
    }
  } catch (e) {
    error.value = "Sunucu bağlantısı kurulamadı.";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap");

.login-wrapper {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background-color: #ffffff;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif;
}

.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.login-content {
  width: 100%;
  max-width: 400px;
}

.login-header {
  margin-bottom: 48px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 32px;
}

.brand-name {
  font-weight: 600;
  letter-spacing: 2px;
  font-size: 14px;
  color: #1a1a1a;
}

.brand-divider {
  height: 1px;
  flex: 1;
  background-color: #e5e5e5;
}

h1 {
  font-size: 32px;
  font-weight: 500;
  color: #1a1a1a;
  margin: 0 0 12px 0;
  letter-spacing: -0.5px;
}

.login-header p {
  color: #666;
  font-size: 16px;
  margin: 0;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-field label {
  font-size: 14px;
  font-weight: 500;
  color: #1a1a1a;
}

input {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  background: #f9f9f9;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  font-size: 15px;
  color: #1a1a1a;
  transition: all 0.2s ease;
}

input:focus {
  outline: none;
  background: #fff;
  border-color: #1a1a1a;
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.05);
}

.error-alert {
  background-color: #fff1f2;
  border: 1px solid #fecdd3;
  color: #e11d48;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
}

.submit-btn {
  height: 52px;
  background-color: #1a1a1a;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s ease, transform 0.1s active;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 12px;
}

.submit-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.submit-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-decoration {
  background-color: #f5f5f5;
  background-image: radial-gradient(#d1d1d1 1px, transparent 1px);
  background-size: 40px 40px;
  position: relative;
}

.login-decoration::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, #ffffff, transparent);
}

.login-footer {
  margin-top: 64px;
}

.login-footer p {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .login-wrapper {
    grid-template-columns: 1fr;
  }
  .login-decoration {
    display: none;
  }
}
</style>

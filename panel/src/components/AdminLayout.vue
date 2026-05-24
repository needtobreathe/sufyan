<template>
  <div :class="['layout', { 'sidebar-hidden': !sidebarVisible }]">
    <!-- Mobile Overlay -->
    <div v-if="sidebarVisible" class="sidebar-overlay" @click="sidebarVisible = false"></div>
    <!-- Sidebar -->
    <aside :class="['sidebar', { collapsed: !sidebarVisible }]">
      <div class="sidebar-header">
        <div class="brand">
          <span class="brand-name">Yönetim Paneli</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <button class="collapse-all-btn" @click="toggleAll">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline v-if="allOpen" points="18 15 12 9 6 15"/>
            <polyline v-else points="6 9 12 15 18 9"/>
          </svg>
          {{ allOpen ? 'Hepsini Kapat' : 'Hepsini Aç' }}
        </button>
        <!-- Genel -->
        <div class="nav-group">
          <button class="nav-group-toggle" @click="toggleGroup('genel')">
            <span>Genel</span>
            <svg :class="{ rotated: openGroups.genel }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div class="nav-group-items" v-show="openGroups.genel">
            <router-link to="/" class="nav-item" :class="{ active: $route.path === '/' }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
              </svg>
              Dashboard
            </router-link>
            <router-link to="/reports" class="nav-item" :class="{ active: $route.path === '/reports' }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
              Raporlar
            </router-link>
            <router-link to="/daily-report" class="nav-item" :class="{ active: $route.path === '/daily-report' }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Günlük Rapor
            </router-link>

          </div>
        </div>

        <!-- Siparişler -->
        <div class="nav-group">
          <button class="nav-group-toggle" @click="toggleGroup('siparisler')">
            <span>Siparişler</span>
            <svg :class="{ rotated: openGroups.siparisler }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div class="nav-group-items" v-show="openGroups.siparisler">
            <router-link to="/orders/create" class="nav-item" :class="{ active: $route.path === '/orders/create' }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              <span>Sipariş Oluştur</span>
            </router-link>
            <router-link to="/orders" class="nav-item" :class="{ active: $route.path === '/orders' && !$route.query.filter }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
              </svg>
              <span>Tüm Siparişler</span>
              <span v-if="orderCounts.total > 0" class="badge">{{ orderCounts.total }}</span>
            </router-link>
            <router-link to="/orders?filter=new" class="nav-item" :class="{ active: $route.query.filter === 'new' }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Yeni Siparişler</span>
              <span v-if="orderCounts.new > 0" class="badge yellow">{{ orderCounts.new }}</span>
            </router-link>
            <router-link to="/orders?filter=to-ship" class="nav-item" :class="{ active: $route.query.filter === 'to-ship' }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
              <span>Kargoya Verilecekler</span>
              <span v-if="orderCounts.toShip > 0" class="badge green">{{ orderCounts.toShip }}</span>
            </router-link>
            <router-link to="/orders?filter=preparing" class="nav-item" :class="{ active: $route.query.filter === 'preparing' }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 7h-9l-3 3H2v10h18V7z"/>
                <path d="M2 10h18"/>
              </svg>
              <span>Hazırlanıyor</span>
              <span v-if="orderCounts.preparing > 0" class="badge blue">{{ orderCounts.preparing }}</span>
            </router-link>
            <router-link to="/orders?filter=cancelled" class="nav-item" :class="{ active: $route.query.filter === 'cancelled' }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              <span>İptal</span>
              <span v-if="orderCounts.cancelled > 0" class="badge red">{{ orderCounts.cancelled }}</span>
            </router-link>

            <router-link to="/orders?filter=future" class="nav-item" :class="{ active: $route.query.filter === 'future' }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
                <path d="M12 14v4"/>
                <path d="M12 18h4"/>
              </svg>
              <span>İleri Tarihli Siparişler</span>
              <span v-if="orderCounts.future > 0" class="badge yellow">{{ orderCounts.future }}</span>
            </router-link>

            <router-link to="/orders?filter=facebook" class="nav-item" :class="{ active: $route.query.filter === 'facebook' }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
              <span>Facebook DM</span>
              <span v-if="orderCounts.facebook > 0" class="badge blue">{{ orderCounts.facebook }}</span>
            </router-link>

            <router-link to="/orders?filter=instagram" class="nav-item" :class="{ active: $route.query.filter === 'instagram' }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <span>Instagram DM</span>
              <span v-if="orderCounts.instagram > 0" class="badge" style="background: #e1306c;">{{ orderCounts.instagram }}</span>
            </router-link>

            <router-link to="/orders?filter=ulasilamayan" class="nav-item" :class="{ active: $route.query.filter === 'ulasilamayan' }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
              <span>Ulaşılamayan</span>
              <span v-if="orderCounts.ulasilamayan > 0" class="badge gray">{{ orderCounts.ulasilamayan }}</span>
            </router-link>

            <router-link to="/orders?filter=shipped" class="nav-item" :class="{ active: $route.query.filter === 'shipped' }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="3" width="15" height="13"/>
                <polyline points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                <circle cx="5.5" cy="18.5" r="2.5"/>
                <circle cx="18.5" cy="18.5" r="2.5"/>
              </svg>
              <span>Kargoya Verildi</span>
              <span v-if="orderCounts.shipped > 0" class="badge green">{{ orderCounts.shipped }}</span>
            </router-link>
            <router-link to="/orders?filter=delivered" class="nav-item" :class="{ active: $route.query.filter === 'delivered' }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>Tamamlanan</span>
              <span v-if="orderCounts.delivered > 0" class="badge green">{{ orderCounts.delivered }}</span>
            </router-link>
            <router-link to="/orders?filter=returned" class="nav-item" :class="{ active: $route.query.filter === 'returned' }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
              <span>İade</span>
              <span v-if="orderCounts.returned > 0" class="badge red">{{ orderCounts.returned }}</span>
            </router-link>
          </div>
        </div>

        <!-- Ürün Siparişleri -->
        <div class="nav-group">
          <button class="nav-group-toggle" @click="toggleGroup('urunSiparisleri')">
            <span>Ürün Siparişleri</span>
            <svg :class="{ rotated: openGroups.urunSiparisleri }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div class="nav-group-items" v-show="openGroups.urunSiparisleri">
            <template v-if="orderCounts.productCounts && orderCounts.productCounts.length > 0">
              <router-link 
                v-for="prod in orderCounts.productCounts" 
                :key="prod.name"
                :to="'/orders?product=' + encodeURIComponent(prod.name)" 
                class="nav-item" 
                :class="{ active: $route.query.product === prod.name }">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                  <line x1="7" y1="7" x2="7.01" y2="7"></line>
                </svg>
                <span>{{ prod.name }}</span>
                <span v-if="prod.count > 0" class="badge gray">{{ prod.count }}</span>
              </router-link>
            </template>
            <div v-else class="nav-item" style="color:#666; font-size:11px; padding-left:16px;">
              Ürün bulunamadı
            </div>
          </div>
        </div>

        <template v-if="isAdmin">
          <!-- Kullanıcılar -->
          <div class="nav-group">
            <button class="nav-group-toggle" @click="toggleGroup('kullanicilar')">
              <span>Kullanıcılar</span>
              <svg :class="{ rotated: openGroups.kullanicilar }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div class="nav-group-items" v-show="openGroups.kullanicilar">
              <router-link to="/users" class="nav-item" :class="{ active: $route.path === '/users' }">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                </svg>
                Tüm Kullanıcılar
              </router-link>
              <router-link to="/users/add" class="nav-item" :class="{ active: $route.path === '/users/add' }">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="8.5" cy="7" r="4"/>
                  <line x1="20" y1="8" x2="20" y2="14"/>
                  <line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                Kullanıcı Ekle
              </router-link>
            </div>
          </div>

          <!-- Yaprak Sayfalar -->
          <div class="nav-group">
            <button class="nav-group-toggle" @click="toggleGroup('yaprakSayfalar')">
              <span>Yaprak Sayfalar</span>
              <svg :class="{ rotated: openGroups.yaprakSayfalar }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div class="nav-group-items" v-show="openGroups.yaprakSayfalar">
              <router-link to="/leaf-pages" class="nav-item" :class="{ active: $route.path === '/leaf-pages' }">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="9" y1="3" x2="9" y2="21"/>
                </svg>
                Tüm Sayfalar
              </router-link>
              <router-link to="/leaf-pages/add" class="nav-item" :class="{ active: $route.path === '/leaf-pages/add' || $route.path.includes('/leaf-pages/') && $route.path.includes('/edit') }">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                Yeni Ekle / Simülatör
              </router-link>
            </div>
          </div>

          <!-- Ayarlar -->
          <div class="nav-group">
            <button class="nav-group-toggle" @click="toggleGroup('ayarlar')">
              <span>Ayarlar</span>
              <svg :class="{ rotated: openGroups.ayarlar }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            <div class="nav-group-items" v-show="openGroups.ayarlar">
              <router-link to="/settings" class="nav-item" :class="{ active: $route.path === '/settings' }">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
                Genel Ayarlar
              </router-link>
              <router-link to="/security" class="nav-item" :class="{ active: $route.path === '/security' }">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Güvenlik
              </router-link>
            </div>
          </div>
        </template>
      </nav>

      <div class="sidebar-footer">
        <button @click="handleLogout" class="logout-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Çıkış Yap
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main">
      <header class="topbar">
        <div class="topbar-left">
          <button class="topbar-btn" @click="sidebarVisible = !sidebarVisible" title="Sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div class="breadcrumb">
            <span class="breadcrumb-item">Ana Sayfa</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <span class="breadcrumb-item active">{{ pageTitle }}</span>
          </div>
        </div>
        <div class="search-wrapper">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input v-model="searchQuery" type="text" placeholder="Ara..." class="search-input" />
        </div>
      </header>

      <div class="content">
        <slot></slot>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { orderStore } from '../store/orderStore'

defineProps({
  pageTitle: { type: String, default: 'Dashboard' }
})

const router = useRouter()
const route = useRoute()

const savedGroups = localStorage.getItem('sidebar_groups')
const defaultGroups = { genel: true, siparisler: true, urunSiparisleri: true, kullanicilar: true, siteler: true, yaprakSayfalar: true, ayarlar: true }

const openGroups = reactive(
  savedGroups ? { ...defaultGroups, ...JSON.parse(savedGroups) } : { ...defaultGroups }
)

const orderCounts = computed(() => orderStore.counts)
let countsInterval = null

onMounted(() => {
  orderStore.fetchCounts()
  countsInterval = setInterval(() => orderStore.fetchCounts(), 10000)
})

onUnmounted(() => {
  if (countsInterval) clearInterval(countsInterval)
})

const allOpen = computed(() => Object.values(openGroups).every(v => v))

const toggleGroup = (group) => {
  openGroups[group] = !openGroups[group]
  localStorage.setItem('sidebar_groups', JSON.stringify(openGroups))
}

const toggleAll = () => {
  const newState = !allOpen.value
  Object.keys(openGroups).forEach(k => openGroups[k] = newState)
  localStorage.setItem('sidebar_groups', JSON.stringify(openGroups))
}

const searchQuery = ref('')
const sidebarVisible = ref(localStorage.getItem('sidebar_visible') !== 'false')

// Persist sidebar state
watch(sidebarVisible, (val) => {
  localStorage.setItem('sidebar_visible', val)
})

const handleLogout = () => {
  localStorage.removeItem('admin_token')
  localStorage.removeItem('admin_user')
  router.push('/login')
}

const currentUser = computed(() => {
  const user = localStorage.getItem('admin_user')
  return user ? JSON.parse(user) : { role: 2, type: 2, kullanici_tipi: 2 }
})

const isAdmin = computed(() => {
  const u = currentUser.value
  return u.role === 1 || u.role === '1' || 
         u.type === 1 || u.type === '1' || 
         u.kullanici_tipi === 1 || u.kullanici_tipi === '1' ||
         u.role === 'admin' || u.type === 'admin'
})
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: #fafafa;
}

.sidebar {
  width: 220px;
  background: #111;
  border-right: none;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  transition: transform 0.25s ease;
}

.sidebar.collapsed {
  transform: translateX(-220px);
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #222;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-icon {
  width: 32px;
  height: 32px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #111;
}

.brand-name {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.3px;
}

.brand-dot {
  color: #4f8cff;
}

.sidebar-nav {
  padding: 8px 10px;
  flex: 1;
  overflow-y: auto;
}

.collapse-all-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 6px 12px;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: 500;
  color: #555;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.12s;
}

.collapse-all-btn:hover {
  color: #999;
}

.nav-group {
  margin-bottom: 4px;
}

.nav-group-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 600;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: color 0.12s;
}

.nav-group-toggle:hover {
  color: #888;
}

.nav-group-toggle svg {
  transition: transform 0.2s;
}

.nav-group-toggle svg.rotated {
  transform: rotate(180deg);
}

.nav-group-items {
  padding: 2px 0 6px 0;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px 8px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #999;
  text-decoration: none;
  border-radius: 6px;
  transition: background 0.12s, color 0.12s;
}

.nav-item:hover {
  background: #1a1a1a;
  color: #fff;
}

.nav-item.active {
  background: #222;
  color: #fff;
}

.nav-item .badge {
  margin-left: auto;
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 10px;
  background: #333;
  color: #fff;
  min-width: 18px;
  text-align: center;
}

.nav-item .badge.yellow { background: #f59e0b; color: #fff; }
.nav-item .badge.blue { background: #3b82f6; color: #fff; }
.nav-item .badge.purple { background: #8b5cf6; color: #fff; }
.nav-item .badge.red { background: #ef4444; color: #fff; }
.nav-item .badge.orange { background: #f97316; color: #fff; }
.nav-item .badge.gray { background: #6b7280; color: #fff; }
.nav-item .badge.green { background: #10b981; color: #fff; }

.sidebar-footer {
  padding: 12px 10px;
  border-top: 1px solid #222;
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 12px;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.logout-btn:hover {
  background: #1a1a1a;
  color: #e57373;
}

.main {
  flex: 1;
  margin-left: 220px;
  transition: margin-left 0.25s ease;
}

.sidebar-hidden .main {
  margin-left: 0;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 32px;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  gap: 20px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.topbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: #fff;
  color: #666;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
  flex-shrink: 0;
}

.topbar-btn:hover {
  background: #f5f5f5;
  color: #111;
  border-color: #ccc;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.breadcrumb svg {
  color: #ccc;
}

.breadcrumb-item {
  font-size: 13px;
  color: #999;
}

.breadcrumb-item.active {
  color: #111;
  font-weight: 600;
}

.search-wrapper {
  position: relative;
  width: 100%;
  max-width: 400px;
  flex: 2;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #bbb;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 34px;
  font-size: 13px;
  border: 1px solid #e5e5e5;
  border-radius: 6px;
  background: #fafafa;
  color: #111;
  outline: none;
  transition: border-color 0.15s, background 0.15s;
}

.search-input:focus {
  border-color: #111;
  background: #fff;
}

.search-input::placeholder {
  color: #bbb;
}

.content {
  padding: 28px 32px;
}

.sidebar-overlay {
  display: none;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-220px);
    z-index: 100;
  }
  .sidebar:not(.collapsed) {
    transform: translateX(0);
  }
  .sidebar.collapsed {
    transform: translateX(-220px);
  }
  .main {
    margin-left: 0 !important;
  }
  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 99;
  }
  .breadcrumb {
    display: none;
  }
  .topbar {
    padding: 12px 16px;
  }
  .content {
    padding: 20px 16px;
  }
  .main {
    overflow-x: hidden;
    width: 100%;
  }
}
</style>

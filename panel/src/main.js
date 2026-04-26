import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

// Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered', reg))
      .catch(err => console.error('Service Worker registration failed', err))
  })
}

createApp(App).use(router).mount('#app')

import { reactive } from 'vue'
import { apiFetch } from '@/utils/fetch'

export const orderStore = reactive({
  counts: {
    total: 0,
    new: 0,
    preparing: 0,
    social: 0,
    cancelled: 0,
    future: 0,
    ulasilamayan: 0,
    shipped: 0,
    delivered: 0,
    returned: 0,
    today: 0,
    week: 0,
    month: 0,
    approved: 0,
    instagram: 0,
    facebook: 0,
    toShip: 0
  },
  scpanelCounts: {
    new: 0,
    preparing: 0,
    cancelled: 0
  },
  async fetchCounts() {
    try {
      const res = await apiFetch('/api/get_order_counts.php')
      const data = await res.json()
      if (data.success) {
        Object.assign(this.counts, data.counts)
      }
    } catch (e) {
      console.error("Sipariş sayıları çekilemedi", e)
    }
  },
  async fetchSCPanelCounts() {
    try {
      const res = await fetch('https://scpanel.siparisyonet.online/api/external/orders/yaprak-odd')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        const orders = data.data
        let newCount = 0
        let prepCount = 0
        let cancCount = 0
        orders.forEach(o => {
          if (o.status === 'pending' || o.status === '1' || !o.status) {
            newCount++
          } else if (o.status === 'preparing' || o.status === '3') {
            prepCount++
          } else if (o.status === 'cancelled' || o.status === '9' || o.status === '10' || o.status === '11') {
            cancCount++
          }
        })
        this.scpanelCounts.new = newCount
        this.scpanelCounts.preparing = prepCount
        this.scpanelCounts.cancelled = cancCount
      }
    } catch (e) {
      console.error("SCPanel sipariş sayıları çekilemedi", e)
    }
  }
})

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
  }
})

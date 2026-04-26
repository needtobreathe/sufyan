const BASE_URL = import.meta.env.VITE_API_URL || 'https://backend.siparisyonet.store';

// URL sonundaki olası / işaretini temizleyerek standart bir başlangıç oluşturur
const cleanBase = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

/**
 * Görsel URL'lerini oluşturur.
 * Örn: 'uploads/resim.jpg' -> 'https://backend.siparisyonet.store/uploads/resim.jpg'
 */
export const getImageUrl = (url) => {
  if (!url) return '';
  
  // Eğer gelen url zaten tam bir linkse (http ile başlıyorsa) olduğu gibi döndür
  if (url.startsWith('http')) return url;
  
  // Gelen url'in başında / yoksa ekleyerek birleştir
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  
  return `${cleanBase}${cleanUrl}`;
};

/**
 * API isteklerini yönetir ve yetkilendirme (Auth) başlıklarını ekler.
 */
export const apiFetch = async (url, options = {}) => {
  const token = localStorage.getItem('admin_token');
  
  // Header (Başlık) ayarları
  const headers = {
    ...options.headers,
    'Authorization': token ? `Bearer ${token}` : '',
  };

  // Eğer gönderilen veri FormData (dosya yükleme vb.) değilse JSON tipini belirt
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // API isteği için tam adresi oluştur
  const fullUrl = url.startsWith('http') 
    ? url 
    : `${cleanBase}${url.startsWith('/') ? url : '/' + url}`;
  
  try {
    const response = await fetch(fullUrl, { ...options, headers });

    // 401 Unauthorized (Oturum aşımı) kontrolü
    if (response.status === 401 && !url.includes('/api/login')) {
      localStorage.removeItem('admin_token');
      window.location.href = '/login';
      return;
    }

    return response;
  } catch (error) {
    console.error('API isteği sırasında bir hata oluştu:', error);
    throw error;
  }
};
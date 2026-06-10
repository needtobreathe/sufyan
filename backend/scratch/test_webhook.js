const axios = require('axios');

const payload = {
  id: 123456789,
  name: "#TEST-SHOPIFY-100",
  total_price: "1499.00",
  current_total_price: "1499.00",
  payment_gateway_names: ["Cash on Delivery (COD)"],
  shipping_address: {
    first_name: "Test",
    last_name: "Shopify Siparis",
    phone: "05443574234",
    city: "Kadikoy",
    province: "Istanbul",
    address1: "Test mahallesi test sokak no 1",
    address2: ""
  },
  line_items: [
    {
      title: "Hürrem Yağı",
      variant_title: "4+2 Adet",
      variant_id: 53027628941536, // Veritabanındaki shopifyVariantId ile eşleşir!
      quantity: 1,
      price: "1499.00"
    }
  ]
};

axios.post('http://localhost:5005/api/webhooks/shopify/orders', payload)
  .then(res => {
    console.log('Success:', res.data);
    console.log('\nSipariş başarıyla yerel sunucuya gönderildi.');
    console.log('Şimdi yerel yönetim panelinde (http://localhost:5173) en son gelen siparişi kontrol edin.');
    console.log('Adet kısmının 6 olduğunu ve ürün adının "Hürrem Yağı" olarak temizlendiğini göreceksiniz!');
  })
  .catch(err => {
    console.error('Error:', err.response ? err.response.data : err.message);
  });

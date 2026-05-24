const mongoose = require('mongoose');
const GlobalSetting = require('./models/GlobalSetting');
require('dotenv').config();

const uri = process.env.MONGODB_URI;

mongoose.connect(uri, { dbName: 'sufyan-yaprak' }).then(async () => {
    console.log("MongoDB bağlandı.");
    const pixelHtml = `<!-- TikTok Pixel Code Start -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
  ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],
  ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}; 
  for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
  ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},
  ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";
  ttq._i=ttq._i||{},ttq._i[e]=[],ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
  n=document.createElement("script");n.type="text/javascript";n.async=!0;n.src=r+"?sdkid="+e+"&lib="+t;
  e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};

  ttq.load('D87O7NJC77U6OC337MDG');
  ttq.page();
}(window, document, 'ttq');
</script>
<!-- TikTok Pixel Code End -->

<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '1569504034797907');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=1569504034797907&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->`;

    await GlobalSetting.findOneAndUpdate(
        { key: 'global_pixel' },
        { value: pixelHtml },
        { upsert: true, new: true }
    );
    console.log("Global piksel başarıyla güncellendi (TikTok + Meta).");
    process.exit(0);
}).catch(err => {
    console.error("Hata:", err);
    process.exit(1);
});

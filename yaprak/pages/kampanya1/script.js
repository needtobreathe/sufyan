document.addEventListener('DOMContentLoaded', () => {
    // Phone Validation Constants
    const VALID_PREFIXES = [
        '501', '505', '506', '507', '508', '510', '516', 
        '530', '531', '532', '533', '534', '535', '536', '537', '538', '539', 
        '540', '541', '542', '543', '544', '545', '546', '547', '548', '549', 
        '551', '552', '553', '554', '555', '559', '561'
    ];

    const phoneErrorModal = document.getElementById('phoneErrorModal');
    const closeModalBtn = document.getElementById('closeModal');
    const fixPhoneBtn = document.getElementById('fixPhoneBtn');
    const phoneInput = document.getElementById('phone');
    const modalPhoneInput = document.getElementById('modalPhoneInput');

    const showPhoneError = () => {
        if (phoneErrorModal) {
            // Sync current invalid phone to modal input
            if (phoneInput && modalPhoneInput) {
                modalPhoneInput.value = phoneInput.value;
                modalPhoneInput.classList.remove('error');
            }
            phoneErrorModal.classList.add('active');
            
            // Focus after a short delay for smooth transition
            setTimeout(() => {
                if (modalPhoneInput) modalPhoneInput.focus();
            }, 300);
        }
    };

    const hidePhoneError = () => {
        if (phoneErrorModal) {
            phoneErrorModal.classList.remove('active');
        }
    };

    const showDuplicateOrderModal = () => {
        // Remove existing modal if any
        const existing = document.getElementById('duplicateOrderModal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'duplicateOrderModal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:99999;backdrop-filter:blur(4px);';
        
        modal.innerHTML = `
            <div style="background:#fff;border-radius:16px;padding:32px 24px;max-width:380px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);animation:dupModalIn 0.3s ease;">
                <div style="width:64px;height:64px;background:#fff3cd;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                </div>
                <h3 style="margin:0 0 8px;font-size:18px;color:#1a1a1a;font-weight:700;">Siparişiniz Alınmıştır</h3>
                <p style="margin:0 0 24px;font-size:14px;color:#666;line-height:1.6;">Siparişiniz daha önce başarıyla alınmıştır. Müşteri temsilcimiz en kısa sürede sizinle iletişime geçecektir.</p>
                <button id="closeDupModal" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;padding:12px 32px;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;width:100%;">Tamam</button>
            </div>
        `;

        // Add animation keyframes
        if (!document.getElementById('dupModalStyle')) {
            const style = document.createElement('style');
            style.id = 'dupModalStyle';
            style.textContent = '@keyframes dupModalIn{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}';
            document.head.appendChild(style);
        }

        document.body.appendChild(modal);
        
        document.getElementById('closeDupModal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    };

    if (closeModalBtn) closeModalBtn.addEventListener('click', hidePhoneError);
    if (fixPhoneBtn) fixPhoneBtn.addEventListener('click', () => {
        if (!modalPhoneInput) return;

        const val = modalPhoneInput.value;
        if (validatePhoneNumber(val)) {
            // If valid, sync to main input and submit form
            if (phoneInput) phoneInput.value = val;
            hidePhoneError();
            
            // Trigger main form submission
            if (orderForm) {
                const event = new Event('submit', { cancelable: true, bubbles: true });
                orderForm.dispatchEvent(event);
            }
        } else {
            // Still invalid, show error state in modal
            modalPhoneInput.classList.add('error');
            setTimeout(() => modalPhoneInput.classList.remove('error'), 500);
        }
    });

    // Close modal on outside click
    if (phoneErrorModal) {
        phoneErrorModal.addEventListener('click', (e) => {
            if (e.target === phoneErrorModal) hidePhoneError();
        });
    }

    const validatePhoneNumber = (phone) => {
        const cleanPhone = phone.replace(/\D/g, ''); // Numbers only
        
        // Must start with 0 and be 11 digits long
        if (cleanPhone.length !== 11 || cleanPhone[0] !== '0') {
            return false;
        }

        // Extract prefix (e.g., 532)
        const prefix = cleanPhone.substring(1, 4);
        return VALID_PREFIXES.includes(prefix);
    };

    // Form Submission Handling
    const orderForm = document.getElementById('orderForm');
    let isSubmitting = false;
    
    if (orderForm) {
        orderForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (isSubmitting) return;
            isSubmitting = true;
            
            const formData = new FormData(this);
            const orderData = Object.fromEntries(formData.entries());
            
            /* 
            // Trigger Facebook Purchase event on button press (Now handled on success.html)
            if (typeof trackPurchase === 'function') {
                trackPurchase(orderData.totalPrice);
            }
            */
            
            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> İşleniyor...';
            submitBtn.disabled = true;
            // Clean phone number (remove spaces) before sending to API
            if (orderData.phone) {
                const rawPhone = orderData.phone.replace(/\s/g, '');
                
                // Validate Phone Number
                if (!validatePhoneNumber(rawPhone)) {
                    showPhoneError();
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    isSubmitting = false;
                    return; // Stop submission
                }
                
                orderData.phone = rawPhone;
            }
            // Append the Device ID and Site ID so we know who ordered and from where
            orderData.device_id = localStorage.getItem('device_id') || 'unknown';
            
            // Use window.SITE_ID from the renderer, fallback to URL/Hostname guessing if missing
            orderData.siteId = window.SITE_ID || siteId;

            // Capture tt_test_id from URL for testing server-side events
            const urlParams = new URLSearchParams(window.location.search);
            const ttTestId = urlParams.get('tt_test_id');
            if (ttTestId) orderData.tt_test_id = ttTestId;

            const rawPrice = String(orderData.totalPrice || "0").replace(',', '.');
            const totalPrice = parseFloat(rawPrice) || 0;
            const productName = orderData.product_name || 'Ürün';
            const eventId = 'tt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
            
            // Add eventId to orderData for backend deduplication
            orderData.eventId = eventId;

            try {
                const apiBase = window.API_BASE_URL || '';
                const response = await fetch(apiBase + '/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });
                
                const result = await response.json();
                if (result.success) {
                    // Trigger tracking pixels here instead of success.html
                    if (typeof fbq === 'function') {
                        const fbOptions = { eventID: eventId };
                        if (window.META_TEST_CODE) fbOptions.test_event_code = window.META_TEST_CODE;
                        
                        fbq('track', 'Purchase', { 
                            value: totalPrice, 
                            currency: 'TRY', 
                            content_name: productName, 
                            content_type: 'product' 
                        }, fbOptions);
                        console.log('%c[META PİKSEL] 🔥 Purchase eventi başarıyla ateşlendi! ID:', 'background: #1877F2; color: white; padding: 4px;', eventId);
                    }
                    if (typeof ttq !== 'undefined') {
                        const ttPayload = {
                            "contents": [
                                {
                                    "content_name": productName,
                                    "content_id": window.SITE_ID || 'default',
                                    "content_type": "product_group"
                                }
                            ],
                            "value": totalPrice,
                            "currency": "TRY"
                        };
                        ttq.track('Purchase', ttPayload, { event_id: eventId });
                        console.log('%c[TİKTOK PİKSEL] 🎵 Purchase eventi ateşlendi! ID:', 'background: #000000; color: #00F2FE; padding: 4px;', eventId);
                    }

                    // Merging API result (contains productPhone) with submitted order data
                    const finalOrderData = { ...orderData, ...result };
                    // Save order data for WhatsApp confirmation on the next page
                    sessionStorage.setItem('lastOrder', JSON.stringify(finalOrderData));
                    
                    // Redirect to success page after giving pixels 400ms to fire
                    setTimeout(() => {
                        window.location.href = 'success.html';
                    }, 400);
                } else if (result.duplicate) {
                    // 24 saat kuralı: Mükerrer sipariş engellendi
                    if (typeof showDuplicateOrderModal === 'function') {
                        showDuplicateOrderModal();
                    } else {
                        alert(result.message || 'Siparişiniz daha önce alınmıştır. Müşteri temsilcimiz en kısa sürede sizinle iletişime geçecektir.');
                    }
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    isSubmitting = false;
                } else {
                    alert('Hata: ' + result.message);
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    isSubmitting = false;
                }
            } catch (error) {
                alert('Bağlantı hatası oluştu. Lütfen tekrar deneyin.');
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                isSubmitting = false;
            }
        });
    }


    const provinceSelect = document.getElementById('province');
    const districtSelect = document.getElementById('district');

    // Auto-format phone number for both inputs
    const formatPhoneInput = (input) => {
        if (!input) return;
        input.addEventListener('input', (e) => {
            let val = e.target.value.replace(/\D/g, ''); // Sadece rakamlar
            if (val.length > 0 && val[0] !== '0') {
                val = '0' + val; // Sıfırla başlamıyorsa ekle
            }

            // Limit to 11 digits
            if (val.length > 11) {
                val = val.substring(0, 11);
            }
            
            // Format: 0XXX XXX XX XX
            let formatted = '';
            if (val.length > 0) {
                formatted += val.substring(0, 4);
                if (val.length > 4) {
                    formatted += ' ' + val.substring(4, 7);
                    if (val.length > 7) {
                        formatted += ' ' + val.substring(7, 9);
                        if (val.length > 9) {
                            formatted += ' ' + val.substring(9, 11);
                        }
                    }
                }
            }
            
            const cursorPosition = e.target.selectionStart;
            const oldLength = e.target.value.length;
            
            e.target.value = formatted;
            
            // Preserve cursor position if editing in the middle
            if (cursorPosition < oldLength) {
                e.target.setSelectionRange(cursorPosition, cursorPosition);
            }
        });
    };

    formatPhoneInput(phoneInput);
    formatPhoneInput(modalPhoneInput);

    /* 
    // Province/District logic removed for form simplification
    fetchProvinces(); 
    */

    // Scroll to form functionality
    const scrollToForm = () => {
        const target = document.getElementById('siparis-formu');
        target.scrollIntoView({ behavior: 'smooth' });
        
        // Trigger AddToCart when user shows intent to buy
        if (typeof ttq !== 'undefined') {
            ttq.track('AddToCart', {
                "contents": [
                    {
                        "content_name": document.title,
                        "content_id": window.SITE_ID || 'default',
                        "content_type": "product_group"
                    }
                ]
            });
        }
    };

    // Attach click events to all images, banners, and the sticky banner
    document.querySelectorAll('.landing-img, .custom-cta-banner').forEach(el => {
        el.style.cursor = 'pointer';
        el.addEventListener('click', scrollToForm);
    });

    const stickyBanner = document.getElementById('stickyBanner');
    if (stickyBanner) {
        stickyBanner.addEventListener('click', scrollToForm);
    }

    // Trigger ViewContent on Page Load
    if (typeof ttq !== 'undefined') {
        ttq.track('ViewContent', {
            "contents": [
                {
                    "content_name": document.title,
                    "content_id": window.SITE_ID || 'default',
                    "content_type": "product_group"
                }
            ]
        });
    }

    // Persistent Countdown Timer Logic
    const timerElement = document.getElementById('countdownTimer');
    const TIMER_DURATION_MS = 30 * 60 * 1000; // 30 minutes in milliseconds

    const updateTimer = () => {
        let expirationTime = localStorage.getItem('kampanya_bitis_zamani');
        const now = new Date().getTime();

        // If not set or already expired, set a new expiration time (now + 30 mins)
        if (!expirationTime || now > expirationTime) {
            expirationTime = now + TIMER_DURATION_MS;
            localStorage.setItem('kampanya_bitis_zamani', expirationTime);
        }

        const distance = expirationTime - now;

        // Calculate minutes and seconds
        let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        // Safety bounds
        if (minutes < 0) minutes = 0;
        if (seconds < 0) seconds = 0;
        
        timerElement.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    // Update timer every second
    if (timerElement) {
        updateTimer(); // Initial call
        setInterval(updateTimer, 1000);
    }

    // Active Viewer Count Logic
    const viewerElement = document.getElementById('viewerCount');
    let currentViewers = 43;

    const updateViewers = () => {
        // Randomly go up or down by 1-3 people
        const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
        currentViewers += change;
        
        // Keep it realistic between 35 and 55
        if (currentViewers < 35) currentViewers = 35;
        if (currentViewers > 55) currentViewers = 55;
        
        viewerElement.textContent = currentViewers;
    };

    // Update viewers every 3 to 6 seconds
    if (viewerElement) {
        setInterval(updateViewers, Math.floor(Math.random() * 3000) + 3000);
    }

    // Hide Sticky Banner When Form is Visible
    const formSection = document.getElementById('siparis-formu');
    if (stickyBanner && formSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Form is in view, hide banner
                    stickyBanner.classList.add('hidden');
                } else {
                    // Form is out of view, show banner
                    stickyBanner.classList.remove('hidden');
                }
            });
        }, {
            root: null,
            threshold: 0.1 // Trigger when 10% of the form is visible
        });

        observer.observe(formSection);
    }

    // ==========================================
    // Analytics & Tracking System
    // ==========================================
    const Analytics = {
        apiUrl: (window.API_BASE_URL || '') + '/api/app-state', // Evasive endpoint name for AdBlockers
        deviceId: null,
        sessionId: null,
        visitCount: 1,
        startTime: Date.now(),
        imageTimers: {}, 
        imageDurations: {}, 
        formProgress: {},
        siteId: 'default',
        
        init() {
            this.setupSession();
            
            // Extract siteId from Hostname or URL
            const host = window.location.hostname;
            const pathParts = window.location.pathname.split('/');
            let siteId = 'default';

            if (host !== 'localhost' && host !== '127.0.0.1' && !host.match(/^\d+\.\d+\.\d+\.\d+$/)) {
                const hostParts = host.split('.');
                if (hostParts.length > 2) siteId = hostParts[0];
            }
            if (pathParts.length > 1 && pathParts[1] === 'p') {
                siteId = pathParts[2] || 'default';
            }
            this.siteId = window.SITE_ID || siteId;
            
            // UTM Parameter Extraction
            const queryParams = new URLSearchParams(window.location.search);
            const utmSource = queryParams.get('utm_source') || null;
            const utmMedium = queryParams.get('utm_medium') || null;
            const utmCampaign = queryParams.get('utm_campaign') || null;
            const utmContent = queryParams.get('utm_content') || null;

            this.trackEvent('page_view', {
                url: window.location.href,
                referrer: document.referrer || 'direct', // Geliş Kaynağı
                userAgent: navigator.userAgent,
                screenResolution: `${window.screen.width}x${window.screen.height}`,
                utm: {
                    source: utmSource,
                    medium: utmMedium,
                    campaign: utmCampaign,
                    content: utmContent
                }
            });
            this.setupScrollTracking();
            this.setupScrollDepth();
            this.setupClickTracking();
            this.setupFormTracking();
            this.setupFormErrors();
            this.setupUnloadTracking();
            this.setupExitIntent();
            this.setupHeartbeat();
        },

        setupSession() {
            // Persistent Device ID (Tarayıcı hafızasında saklanır)
            let deviceId = localStorage.getItem('device_id');
            if (!deviceId) {
                deviceId = 'dev_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
                localStorage.setItem('device_id', deviceId);
            }
            this.deviceId = deviceId;
            
            // Unique Session ID (Sadece bu sekme/ziyaret için geçerli)
            this.sessionId = 'sess_' + Math.random().toString(36).substring(2, 15);
            
            // Ziyaret Sayacı (Kullanıcı siteye kaçıncı kez giriyor?)
            let visits = parseInt(localStorage.getItem('visit_count') || '0');
            if (!sessionStorage.getItem('session_active')) {
                visits += 1;
                localStorage.setItem('visit_count', visits);
                sessionStorage.setItem('session_active', 'true');
            }
            this.visitCount = visits;
        },

        trackEvent(eventName, eventData = {}) {
            const payload = {
                device_id: this.deviceId,
                session_id: this.sessionId,
                visit_count: this.visitCount,
                event_name: eventName,
                timestamp: new Date().toISOString(),
                data: eventData,
                siteId: this.siteId
            };
            
            // 1. Internal Analytics (Our Dashboard)
            if (navigator.sendBeacon) {
                navigator.sendBeacon(this.apiUrl, JSON.stringify(payload));
            } else {
                fetch(this.apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    keepalive: true
                }).catch(() => {});
            }

            try {
                if (typeof ttq !== 'undefined') {
                    // ttq.page() is already called in the global pixel script
                }
            } catch (e) {}
        },

        setupScrollTracking() {
            const images = document.querySelectorAll('.landing-img');
            
            // Ekranda en az %50'si görünürse tetiklensin
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const imgSrc = entry.target.getAttribute('src');
                    
                    if (entry.isIntersecting) {
                        // Görsel ekrana girdi, kronometreyi başlat
                        this.imageTimers[imgSrc] = Date.now();
                        this.trackEvent('image_view_start', { image: imgSrc });
                    } else {
                        // Görsel ekrandan çıktı, süreyi hesapla
                        if (this.imageTimers[imgSrc]) {
                            const duration = Date.now() - this.imageTimers[imgSrc];
                            this.imageDurations[imgSrc] = (this.imageDurations[imgSrc] || 0) + duration;
                            delete this.imageTimers[imgSrc];
                            
                            this.trackEvent('image_view_end', { 
                                image: imgSrc, 
                                duration_ms: duration, // Bu bakıştaki süre
                                total_duration_ms: this.imageDurations[imgSrc] // Toplam bakış süresi
                            });
                        }
                    }
                });
            }, { threshold: 0.5 }); 

            images.forEach(img => observer.observe(img));
        },

        setupScrollDepth() {
            let maxPercent = 0;
            const milestones = [25, 50, 75, 90, 100]; // Hedef yüzdeler
            const trackedMilestones = new Set();

            document.addEventListener('scroll', () => {
                const scrollTop = window.scrollY || document.documentElement.scrollTop;
                const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                const scrollPercent = (scrollTop / docHeight) * 100;
                
                if (scrollPercent > maxPercent) {
                    maxPercent = scrollPercent;
                }

                milestones.forEach(milestone => {
                    if (maxPercent >= milestone && !trackedMilestones.has(milestone)) {
                        trackedMilestones.add(milestone);
                        this.trackEvent('scroll_depth', {
                            percentage: milestone
                        });
                    }
                });
            }, { passive: true });
        },

        setupHeartbeat() {
            // Canlı kullanıcı takibi için her 15 saniyede sinyal gönder
            setInterval(() => {
                this.trackEvent('heartbeat', { status: 'active' });
            }, 15000);
        },

        setupClickTracking() {
            document.querySelectorAll('.landing-img, .custom-cta-banner, #stickyBanner').forEach(el => {
                el.addEventListener('click', () => {
                    const target = el.id || el.getAttribute('src') || 'banner';
                    this.trackEvent('click_cta', { target_clicked: target });
                });
            });
        },

        setupFormTracking() {
            const formInputs = document.querySelectorAll('#orderForm input, #orderForm select, #orderForm textarea');
            
            // Kullanıcı bir inputtan diğerine geçerken (blur) veriyi canlı yakala
            formInputs.forEach(input => {
                input.addEventListener('blur', (e) => {
                    if (e.target.value) {
                        this.formProgress[e.target.name] = e.target.value;
                        this.trackEvent('form_input_filled', {
                            field_name: e.target.name,
                            current_value: e.target.value,
                            form_progress: this.formProgress // O ana kadar doldurulan tüm form
                        });
                    }
                });
            });

            // Siparişi tamamla butonuna basıldığında başarılı submit işlemi (script.js başında takip ediliyor)
        },

        setupFormErrors() {
            const formInputs = document.querySelectorAll('#orderForm input, #orderForm select, #orderForm textarea');
            
            formInputs.forEach(input => {
                input.addEventListener('invalid', (e) => {
                    this.trackEvent('form_validation_error', {
                        field_name: e.target.name,
                        current_value: e.target.value,
                        error_type: e.target.validity.patternMismatch ? 'pattern' : e.target.validity.valueMissing ? 'required' : 'other',
                        form_progress: this.formProgress
                    });
                }, true); // Use capturing phase for 'invalid' event
            });
        },

        setupUnloadTracking() {
            // Kullanıcı sekmeyi kapatırken, siteyi simge durumuna küçültürken veya başka sekmeye geçerken
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') {
                    const timeSpent = Date.now() - this.startTime;
                    this.trackEvent('site_leave_or_hide', { 
                        total_time_spent_ms: timeSpent,
                        last_active_images: Object.keys(this.imageTimers) // Çıktığı an ekranda ne vardı?
                    });
                } else {
                    this.trackEvent('site_return', {});
                }
            });
        },

        setupExitIntent() {
            let hasTriggered = false;
            document.addEventListener('mouseleave', (e) => {
                // Sadece fare yukarıdan (clientY < 10) çıkarsa yani kapatmaya / geri gitmeye yönelirse
                if (!hasTriggered && e.clientY < 10) {
                    hasTriggered = true;
                    this.trackEvent('exit_intent_detected', {
                        time_spent_so_far_ms: Date.now() - this.startTime
                    });
                }
            });
        }
    };

    // Sistemi Başlat
    Analytics.init();
});

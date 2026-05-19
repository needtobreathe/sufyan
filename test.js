const net = require('net');

// Parametreler
const TARGET_HOST = '194.146.36.252'; // Test edilecek hedef adres (placeholder)
const START_PORT = 1;
const END_PORT = 600000;
const TIMEOUT = 1000; // Milisaniye cinsinden zaman aşımı (hız için 1 sn idealdir)
const CONCURRENCY_LIMIT = 500; // Aynı anda denenecek maksimum bağlantı sayısı

// Tek bir portu test eden fonksiyon
function checkPort(port, host) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        
        socket.setTimeout(TIMEOUT);
        
        socket.once('connect', () => {
            socket.destroy();
            resolve({ port, status: 'open' });
        });
        
        socket.once('timeout', () => {
            socket.destroy();
            resolve({ port, status: 'closed' });
        });
        
        socket.once('error', () => {
            socket.destroy();
            resolve({ port, status: 'closed' });
        });
        
        socket.connect(port, host);
    });
}

// Belirli bir eşzamanlılık limitine göre kuyruk yönetimi yapan tarayıcı
async function runScanner() {
    console.log(`🚀 ${TARGET_HOST} üzerinde ${START_PORT}-${END_PORT} arası port taraması başlatılıyor...`);
    console.time('Tarama Süresi');
    
    const ports = [];
    for (let i = START_PORT; i <= END_PORT; i++) {
        ports.push(i);
    }
    
    let activeWorkers = 0;
    let index = 0;
    
    const results = [];
    
    return new Promise((resolve) => {
        function next() {
            if (index >= ports.length && activeWorkers === 0) {
                console.timeEnd('Tarama Süresi');
                resolve(results);
                return;
            }
            
            while (activeWorkers < CONCURRENCY_LIMIT && index < ports.length) {
                const currentPort = ports[index++];
                activeWorkers++;
                
                // Canlı izleme logu
                // console.log(`🔍 Deneniyor: ${currentPort}`);
                
                checkPort(currentPort, TARGET_HOST).then((res) => {
                    activeWorkers--;
                    if (res.status === 'open') {
                        console.log(`✅ AÇIK PORT BULUNDU: ${res.port}`);
                        results.push(res.port);
                    }
                    next();
                });
            }
        }
        
        next();
    });
}

runScanner().then((openPorts) => {
    console.log('\n--- Tarama Tamamlandı ---');
    console.log('Açık Portlar:', openPorts);
});

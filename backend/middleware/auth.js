const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        let token = req.headers.authorization?.split(' ')[1];
        
        // Fallback for navigator.sendBeacon or simple POSTs
        if (!token && req.body && req.body.token) {
            token = req.body.token;
        }
        if (!token && req.query && req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Yetkisiz erişim' });
        }

        // Check if token matches a hardcoded legacy token
        const legacyToken = process.env.LEGACY_TOKEN || 'yaprak_legacy_static_token_123';
        if (token === legacyToken) {
            req.user = { id: 'legacy_system', role: 'admin' };
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yaprak_secret_key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Geçersiz oturum' });
    }
};

module.exports = auth;

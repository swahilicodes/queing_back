const { DynamicIp } = require('../models');

async function getIpByPurpose(purpose) {
    if (typeof purpose !== 'string' || !purpose.trim()) {
        const fallback = process.env.JEEVA_API_IP || '192.168.235.65';
        const strObj = new String(fallback);
        strObj.ip = fallback;
        return strObj;
    }

    const cleanPurpose = purpose.trim().toLowerCase();

    // 1. Environment variable override (e.g. JEEVA_API_IP from .env)
    if (cleanPurpose === 'jeeva' && process.env.JEEVA_API_IP) {
        const ipVal = process.env.JEEVA_API_IP;
        const strObj = new String(ipVal);
        strObj.ip = ipVal;
        return strObj;
    }

    // 2. Try fetching from dynamic IP database table if available
    try {
        const ipRecord = await DynamicIp.findOne({
            where: {
                purpose: cleanPurpose
            }
        });

        if (ipRecord && ipRecord.ip) {
            const ipVal = ipRecord.ip;
            const strObj = new String(ipVal);
            strObj.ip = ipVal;
            return strObj;
        }
    } catch (err) {
        // Table might not exist or DB error; fallback safely
    }

    // 3. Default fallback
    const fallbackIp = cleanPurpose === 'jeeva'
        ? (process.env.JEEVA_API_IP || '192.168.235.65')
        : '127.0.0.1';

    const strObj = new String(fallbackIp);
    strObj.ip = fallbackIp;
    return strObj;
}

module.exports = { getIpByPurpose };

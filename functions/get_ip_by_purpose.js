const { DynamicIp } = require('../models');

async function getIpByPurpose(purpose) {
    if (typeof purpose !== 'string' || !purpose.trim()) {
        return null;
    }

    const cleanPurpose = purpose.trim().toLowerCase();

    const ip = await DynamicIp.findOne({
        where: {
            purpose: cleanPurpose
        }
    });

    return ip; // null if not found
}

module.exports = { getIpByPurpose };

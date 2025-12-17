const express = require('express');
const Sequelize = require('sequelize');
const router = express.Router();
const { TokenBackup } = require('../models'); // Adjust path if needed

const Op = Sequelize.Op;

// Route
router.get('/token_stats', async (req, res) => {
    const { duration = 'month', clinic, start_date, end_date,status } = req.query;
    try {
        const dateRange = getDateRange(duration,start_date,end_date);
        const where = {
            createdAt: {
                [Op.between]: [dateRange.start, dateRange.end],
            },
            ...(status !== 'all' && { status: status })
        };

        if (clinic) {
            where.clinic = clinic;
        }

        const tokens = await TokenBackup.findAll({ where });
        const stats = calculateStatistics(tokens, duration, dateRange);

        res.json(stats);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Calculate correct date range for different durations
// function getDateRange(duration) {
//     const now = new Date();
//     const start = new Date();
//     const end = new Date();

//     switch (duration.toLowerCase()) {
//         case 'day':
//             start.setHours(0, 0, 0, 0);
//             end.setHours(23, 59, 59, 999);
//             break;

//         case 'week':
//             const day = now.getDay(); // 0 = Sunday, 1 = Monday
//             const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
//             start.setDate(diff);
//             start.setHours(0, 0, 0, 0);

//             end.setDate(diff + 6);
//             end.setHours(23, 59, 59, 999);
//             break;

//         case 'month':
//             start.setDate(1);
//             start.setHours(0, 0, 0, 0);

//             end.setMonth(end.getMonth() + 1, 0); // last day of current month
//             end.setHours(23, 59, 59, 999);
//             break;

//         case 'year':
//             start.setMonth(0, 1);
//             start.setHours(0, 0, 0, 0);

//             end.setMonth(11, 31);
//             end.setHours(23, 59, 59, 999);
//             break;

//         case 'all':
//         default:
//             return { start: new Date(0), end: new Date() };
//     }

//     return { start, end };
// }

function getDateRange(duration, start_date, end_date) {
    const now = new Date();
    const start = new Date();
    const end = new Date();

    switch (duration.toLowerCase()) {
        case 'day':
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;

        case 'week':
            const day = now.getDay(); // 0 = Sunday, 1 = Monday
            const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
            start.setDate(diff);
            start.setHours(0, 0, 0, 0);

            end.setDate(diff + 6);
            end.setHours(23, 59, 59, 999);
            break;

        case 'month':
            start.setDate(1);
            start.setHours(0, 0, 0, 0);

            end.setMonth(end.getMonth() + 1, 0); // last day of current month
            end.setHours(23, 59, 59, 999);
            break;

        case 'year':
            start.setMonth(0, 1);
            start.setHours(0, 0, 0, 0);

            end.setMonth(11, 31);
            end.setHours(23, 59, 59, 999);
            break;

        case 'custom':
            if (start_date!=="" && end_date !=="") {
                let start = new Date(start_date)
                let end = new Date(end_date)
                start.setHours(0, 0, 0, 0)
                end.setHours(23, 59, 59, 999)
                return {
                    start: start,
                    end: end
                };
            } else if(end_date === "" && start_date !== "") {
                let start = new Date(start_date)
                //let end = new Date(end_date)
                start.setHours(0, 0, 0, 0)
                //end.setHours(23, 59, 59, 999)
                return {
                    start: start,
                    end: start
                };
                //throw new Error("Custom range requires both start_date and end_date.");
            }else if(end_date !== "" && start_date === "") {
                //let start = new Date(start_date)
                let end = new Date(end_date)
                //start.setHours(0, 0, 0, 0)
                end.setHours(23, 59, 59, 999)
                return {
                    start: end,
                    end: end
                };
                //throw new Error("Custom range requires both start_date and end_date.");
            }

        case 'all':
        default:
            return { start: new Date(0), end: new Date() };
    }

    return { start, end };
}


// Format Date to YYYY-MM-DD
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// Duration Formatter
function formatTimeDuration(ms) {
    if (!ms || ms <= 0) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    const remainingHours = hours % 24;
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds % 60;

    const parts = [];
    if (days) parts.push(`${days}d`);
    if (remainingHours) parts.push(`${remainingHours}h`);
    if (remainingMinutes) parts.push(`${remainingMinutes}m`);
    if (remainingSeconds && parts.length < 2) parts.push(`${remainingSeconds}s`);

    return parts.join(' ') || 'less than a second';
}

// Compute statistics
// Compute statistics
function calculateStatistics(tokens, duration, dateRange) {
    const stats = {
        duration: duration.toLowerCase(),
        total_tickets: tokens.length,
        medical_tickets: 0,
        account_tickets: 0,
        clinic_tickets: 0,
        peak_times: [],
        output_times: {
            medical: 'N/A',
            account: 'N/A',
            clinic: 'N/A',
            doctor: 'N/A'
        }
    };

    if (duration === 'day') {
        stats.date = formatDate(dateRange.start);
    } else if (['week', 'month', 'year'].includes(duration)) {
        stats.period = {
            from: formatDate(dateRange.start),
            to: formatDate(dateRange.end),
        };
    }

    // Count ticket types
    for (let token of tokens) {
        if (token.stage === 'meds') stats.medical_tickets++;
        if (token.stage === 'accounts') stats.account_tickets++;
        if (token.stage === 'nurse_station') stats.clinic_tickets++;
    }

    // Peak times
    const hourlyCount = {};
    for (let token of tokens) {
        const hour = new Date(token.createdAt).getHours();
        hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
    }

    stats.peak_times = Object.entries(hourlyCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([h]) => `${h}:00 - ${parseInt(h) + 1}:00,[${hourlyCount[h]}]`);

    // Output time calculations
    const medTimes = [];
    const accTimes = [];
    const clinicTimes = [];
    const docTimes = [];

    for (let token of tokens) {
        if (token.createdAt && token.med_time) {
            const t = new Date(token.med_time) - new Date(token.createdAt);
            if (t > 0) medTimes.push(t);
        }

        if (token.createdAt && token.account_time) {
            const t = new Date(token.account_time) - new Date(token.createdAt);
            if (t > 0) accTimes.push(t);
        }

        if (token.account_time && token.clinic_time) {
            const t = new Date(token.clinic_time) - new Date(token.account_time);
            if (t > 0) clinicTimes.push(t);
        }

        if (token.clinic_time && token.station_time) {
            const t = new Date(token.station_time) - new Date(token.clinic_time);
            if (t > 0) docTimes.push(t);
        }
    }

    if (medTimes.length)
        stats.output_times.medical = formatTimeDuration(medTimes.reduce((a, b) => a + b) / medTimes.length);
    if (accTimes.length)
        stats.output_times.account = formatTimeDuration(accTimes.reduce((a, b) => a + b) / accTimes.length);
    if (clinicTimes.length)
        stats.output_times.clinic = formatTimeDuration(clinicTimes.reduce((a, b) => a + b) / clinicTimes.length);
    if (docTimes.length)
        stats.output_times.doctor = formatTimeDuration(docTimes.reduce((a, b) => a + b) / docTimes.length);

    return stats;
}

module.exports = router;

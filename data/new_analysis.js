// const express = require('express');
// const Sequelize = require('sequelize')
// const router = express.Router();
// const { TokenBackup } = require('../models'); // Adjust path to your model

// router.get('/token_stats', async (req, res, next) => {
//     const { duration = 'all', clinic } = req.query;
    
//     try {
//         // Calculate date range based on duration
//         const dateRange = calculateDateRange(duration);
        
//         // Build where clause
//         const where = {
//             dateTime: {
//                 [Sequelize.Op.between]: [dateRange.start, dateRange.end]
//             }
//         };
        
//         if (clinic) {
//             where.clinic = clinic;
//         }
        
//         // Fetch all relevant tokens
//         const tokens = await TokenBackup.findAll({ where });
        
//         // Group tokens by day of week
//         const tokensByDay = groupTokensByDay(tokens);
        
//         // Calculate statistics for each day
//         const result = calculateDayStatistics(tokensByDay);
        
//         res.json(result);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// // Helper functions (same as in previous example)
// function calculateDateRange(duration) {
//     const now = new Date();
//     const start = new Date(now);
    
//     switch (duration.toLowerCase()) {
//         case 'day':
//             start.setHours(0, 0, 0, 0);
//             return { start, end: now };
//         case 'week':
//             start.setDate(now.getDate() - 6);
//             start.setHours(0, 0, 0, 0);
//             return { start, end: now };
//         case 'month':
//             start.setMonth(now.getMonth() - 1);
//             return { start, end: now };
//         case 'year':
//             start.setFullYear(now.getFullYear() - 1);
//             return { start, end: now };
//         case 'all':
//         default:
//             return { start: new Date(0), end: now };
//     }
// }

// function groupTokensByDay(tokens) {
//     const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
//     const grouped = {};
    
//     days.forEach(day => {
//         grouped[day] = [];
//     });
    
//     tokens.forEach(token => {
//         const date = new Date(token.dateTime);
//         const dayName = days[date.getDay()];
//         grouped[dayName].push(token);
//     });
    
//     return grouped;
// }

// function calculateDayStatistics(tokensByDay) {
//     const result = [];
//     const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
//     days.forEach(day => {
//         const dayTokens = tokensByDay[day] || [];
        
//         if (dayTokens.length === 0) {
//             result.push({
//                 day,
//                 total_tickets: 0,
//                 medical_tickets: 0,
//                 account_tickets: 0,
//                 clinic_ticket: 0,
//                 peak_times: [],
//                 output_times: {
//                     medical_time: null,
//                     account_time: null,
//                     clinic_time: null,
//                     doctor_time: null
//                 }
//             });
//             return;
//         }
        
//         // Calculate ticket counts
//         const medicalTickets = dayTokens.filter(t => t.stage === 'meds').length;
//         const accountTickets = dayTokens.filter(t => t.stage === 'accounts').length;
//         const clinicTickets = dayTokens.filter(t => t.stage === 'nurse_station').length;
        
//         // Calculate peak times (top 2 hours with most tickets)
//         const hourCounts = {};
//         dayTokens.forEach(token => {
//             const hour = new Date(token.dateTime).getHours();
//             hourCounts[hour] = (hourCounts[hour] || 0) + 1;
//         });
        
//         const peakTimes = Object.entries(hourCounts)
//             .sort((a, b) => b[1] - a[1])
//             .slice(0, 2)
//             .map(([hour]) => `${hour}:00 - ${parseInt(hour)+1}:00`);
        
//         // Calculate average output times
//         const medicalTimes = [];
//         const accountTimes = [];
//         const clinicTimes = [];
//         const doctorTimes = [];
        
//         dayTokens.forEach(token => {
//             if (token.createdAt && token.med_time) {
//                 const tima = (new Date(token.med_time) - new Date(token.createdAt)) / (1000 * 60)
//                 if(tima > 0){
//                     medicalTimes.push(tima)  
//                 }
//             }
//             if (token.med_time && token.account_time) {
//                 const tima = (new Date(token.account_time) - new Date(token.med_time)) / (1000 * 60);
//                 if(tima > 0){
//                     accountTimes.push(tima)  
//                 }
//             }
//             if (token.account_time && token.clinic_time) {
//                 const tima = (new Date(token.clinic_time) - new Date(token.account_time)) / (1000 * 60);
//                 if(tima > 0){
//                     clinicTimes.push(tima);
//                 }
//             }
//             if (token.clinic_time && token.station_time) {
//                 const tima = doctorTimes.push(new Date(token.station_time) - new Date(token.clinic_time)) / (1000 * 60);
//                 if(tima > 0){
//                     doctorTimes.push(tima)  
//                 }
//             }
//         });
//         const avgMedicalTime = medicalTimes.length > 0 ? 
//             Math.round(medicalTimes.reduce((a, b) => a + b, 0) / medicalTimes.length) : null;
//         const avgAccountTime = accountTimes.length > 0 ? 
//             Math.round(accountTimes.reduce((a, b) => a + b, 0) / accountTimes.length) : null;
//         const avgClinicTime = clinicTimes.length > 0 ? 
//             Math.round(clinicTimes.reduce((a, b) => a + b, 0) / clinicTimes.length) : null;
//         const avgDoctorTime = doctorTimes.length > 0 ? 
//             Math.round(doctorTimes.reduce((a, b) => a + b, 0) / doctorTimes.length) : null;
        
//         result.push({
//             day,
//             total_tickets: dayTokens.length,
//             medical_tickets: medicalTickets,
//             account_tickets: accountTickets,
//             clinic_ticket: clinicTickets,
//             peak_times: peakTimes,
//             output_times: {
//                 medical_time: avgMedicalTime !== null ? `${avgMedicalTime} mins` : 'N/A',
//                 account_time: avgAccountTime !== null ? `${avgAccountTime} mins` : 'N/A',
//                 clinic_time: avgClinicTime !== null ? `${avgClinicTime} mins` : 'N/A',
//                 doctor_time: avgDoctorTime !== null ? `${avgDoctorTime} mins` : 'N/A'
//             }
//         });
//     });
    
//     return result;
// }

// module.exports = router;

// const express = require('express');
// const Sequelize = require('sequelize');
// const router = express.Router();
// const { TokenBackup } = require('../models'); // Adjust path to your model

// router.get('/token_stats', async (req, res, next) => {
//     const { duration = 'year', clinic } = req.query;
    
//     try {
//         // Calculate date range based on duration
//         const dateRange = calculateDateRange(duration);
        
//         // Build where clause
//         const where = {
//             dateTime: {
//                 [Sequelize.Op.between]: [dateRange.start, dateRange.end]
//             }
//         };
        
//         if (clinic) {
//             where.clinic = clinic;
//         }
        
//         // Fetch all relevant tokens
//         const tokens = await TokenBackup.findAll({ where });
        
//         // Calculate statistics
//         const result = calculateStatistics(tokens, duration, dateRange);
        
//         res.json(result);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// function calculateDateRange(duration) {
//     let now = new Date();
//     let start = new Date(now);
    
//     switch (duration.toLowerCase()) {
//         case 'day':
//             let end = new Date();
//             end.setHours(0, 0, 0, 0); // today at 00:00

//             start = new Date(end); // now it's safe to use `end` here
//             start.setDate(start.getDate() - 1); // yesterday at 00:00
//             console.log(start,end)
//         return { start, end };

//         case 'week':
//             start.setDate(now.getDate() - 6);
//             start.setHours(0, 0, 0, 0);
//             return { start, end: now };
//         case 'month':
//             start.setMonth(now.getMonth() - 1);
//             return { start, end: now };
//         case 'year':
//             start.setFullYear(now.getFullYear() - 1);
//             return { start, end: now };
//         case 'all':
//         default:
//             return { start: new Date(0), end: now };
//     }
// }

// function formatDate(date) {
//     return date.toISOString().split('T')[0];
// }

// function calculateStatistics(tokens, duration, dateRange) {
//     const result = {
//         duration: duration.toLowerCase(),
//         total_tickets: 0,
//         medical_tickets: 0,
//         account_tickets: 0,
//         clinic_tickets: 0,
//         peak_times: [],
//         output_times: {
//             medical_time: 'N/A',
//             account_time: 'N/A',
//             clinic_time: 'N/A',
//             doctor_time: 'N/A'
//         }
//     };

//     // Add date/duration specific fields
//     if (duration.toLowerCase() === 'day') {
//         const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
//         result.day = dayNames[dateRange.start.getDay()];
//         result.date = formatDate(dateRange.start);
//     } else if (['week', 'month', 'year'].includes(duration.toLowerCase())) {
//         result.period = {
//             from: formatDate(dateRange.start),
//             to: formatDate(dateRange.end)
//         };
//     }

//     if (tokens.length === 0) {
//         return result;
//     }

//     // Calculate ticket counts
//     result.medical_tickets = tokens.filter(t => t.stage === 'meds').length;
//     result.account_tickets = tokens.filter(t => t.stage === 'accounts').length;
//     result.clinic_tickets = tokens.filter(t => t.stage === 'nurse_station').length;
//     result.total_tickets = tokens.length;

//     // Calculate peak times (top 2 hours with most tickets)
//     const hourCounts = {};
//     tokens.forEach(token => {
//         const hour = new Date(token.dateTime).getHours();
//         hourCounts[hour] = (hourCounts[hour] || 0) + 1;
//     });

//     result.peak_times = Object.entries(hourCounts)
//         .sort((a, b) => b[1] - a[1])
//         .slice(0, 2)
//         .map(([hour]) => `${hour}:00 - ${parseInt(hour)+1}:00`);

//     // Calculate average output times in minutes
//     const medicalTimes = [];
//     const accountTimes = [];
//     const clinicTimes = [];
//     const doctorTimes = [];

//     tokens.forEach(token => {
//         // Medical time: createdAt -> med_time
//         if (token.createdAt && token.med_time) {
//             const timeDiff = (new Date(token.med_time) - new Date(token.createdAt)) / (1000 * 60);
//             console.log(timeDiff)
//             if (timeDiff > 0) {
//                 medicalTimes.push(timeDiff);
//             }
//         }
//         // Account time: med_time -> account_time
//         if (token.med_time && token.account_time) {
//             const timeDiff = (new Date(token.account_time) - new Date(token.med_time)) / (1000 * 60);
//             console.log(timeDiff)
//             if (timeDiff > 0) {
//                 accountTimes.push(timeDiff);
//             }
//         }
//         // Clinic time: account_time -> clinic_time
//         if (token.account_time && token.clinic_time) {
//             const timeDiff = (new Date(token.clinic_time) - new Date(token.account_time)) / (1000 * 60);
//             console.log(timeDiff)
//             if (timeDiff > 0) {
//                 clinicTimes.push(timeDiff);
//             }
//         }
//         // Doctor time: clinic_time -> station_time
//         if (token.clinic_time && token.station_time) {
//             const timeDiff = (new Date(token.station_time) - new Date(token.clinic_time)) / (1000 * 60);
//             console.log(timeDiff)
//             if (timeDiff > 0) {
//                 doctorTimes.push(timeDiff);
//             }
//         }
//     });

//     // Format average times
//     if (medicalTimes.length > 0) {
//         const avg = Math.round(medicalTimes.reduce((a, b) => a + b, 0) / medicalTimes.length);
//         result.output_times.medical_time = `${avg} minute${avg !== 1 ? 's' : 0}`;
//     }
//     if (accountTimes.length > 0) {
//         const avg = Math.round(accountTimes.reduce((a, b) => a + b, 0) / accountTimes.length);
//         result.output_times.account_time = `${avg} minute${avg !== 1 ? 's' : 0}`;
//     }
//     if (clinicTimes.length > 0) {
//         const avg = Math.round(clinicTimes.reduce((a, b) => a + b, 0) / clinicTimes.length);
//         result.output_times.clinic_time = `${avg} minute${avg !== 1 ? 's' : 0}`;
//     }
//     if (doctorTimes.length > 0) {
//         const avg = Math.round(doctorTimes.reduce((a, b) => a + b, 0) / doctorTimes.length);
//         result.output_times.doctor_time = `${avg} minute${avg !== 1 ? 's' : 0}`;
//     }

//     return result;
// }

// module.exports = router;

// const express = require('express');
// const Sequelize = require('sequelize');
// const router = express.Router();
// const { TokenBackup } = require('../models'); // Adjust path to your model

// router.get('/token_stats', async (req, res, next) => {
//     const { duration = 'month', clinic } = req.query;
    
//     try {
//         // Calculate date range based on duration
//         const dateRange = calculateDateRange(duration);
        
//         // Build where clause
//         const where = {
//             dateTime: {
//                 [Sequelize.Op.between]: [dateRange.start, dateRange.end]
//             }
//         };
        
//         if (clinic) {
//             where.clinic = clinic;
//         }
        
//         // Fetch all relevant tokens
//         const tokens = await TokenBackup.findAll({ where });
        
//         // Calculate statistics
//         const result = calculateStatistics(tokens, duration, dateRange);
        
//         res.json(result);
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// });

// function calculateDateRange(duration) {
//     const now = new Date();
//     let start = new Date(now);
//     let end = new Date(now);
    
//     switch (duration.toLowerCase()) {
//         case 'day':
//             start.setHours(0, 0, 0, 0);
//             end.setHours(23, 59, 59, 999);
//             return { start, end };

//         case 'week':
//             // Start of week (Sunday)
//             start.setDate(now.getDate() - now.getDay());
//             start.setHours(0, 0, 0, 0);
//             // End of week (Saturday)
//             end.setDate(start.getDate() + 6);
//             end.setHours(23, 59, 59, 999);
//             return { start, end };
            
//         case 'month':
//             // Start of month
//             start.setDate(1);
//             start.setHours(0, 0, 0, 0);
//             // End of month
//             end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
//             end.setHours(23, 59, 59, 999);
//             return { start, end };
            
//         case 'year':
//             // Start of year
//             start = new Date(now.getFullYear(), 0, 1);
//             start.setHours(0, 0, 0, 0);
//             // End of year
//             end = new Date(now.getFullYear(), 11, 31);
//             end.setHours(23, 59, 59, 999);
//             return { start, end };
            
//         case 'all':
//         default:
//             return { start: new Date(0), end: now };
//     }
// }

// function formatDate(date) {
//     return date.toISOString().split('T')[0];
// }

// function formatTimeDuration(ms) {
//     if (!ms || ms <= 0) return 'N/A';
    
//     const seconds = Math.floor(ms / 1000);
//     const minutes = Math.floor(seconds / 60);
//     const hours = Math.floor(minutes / 60);
//     const days = Math.floor(hours / 24);
    
//     let remainingSeconds = seconds % 60;
//     let remainingMinutes = minutes % 60;
//     let remainingHours = hours % 24;
    
//     const parts = [];
    
//     if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
//     if (remainingHours > 0) parts.push(`${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`);
//     if (remainingMinutes > 0) parts.push(`${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`);
//     if (remainingSeconds > 0 && parts.length < 2) {
//         parts.push(`${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`);
//     }
    
//     return parts.join(' and ') || 'less than a second';
// }

// function calculateStatistics(tokens, duration, dateRange) {
//     const result = {
//         duration: duration.toLowerCase(),
//         total_tickets: 0,
//         medical_tickets: 0,
//         account_tickets: 0,
//         clinic_tickets: 0,
//         peak_times: [],
//         output_times: {
//             medical: 'N/A',
//             account: 'N/A',
//             clinic: 'N/A',
//             doctor: 'N/A'
//         }
//     };

//     // Add date/duration specific fields
//     if (duration.toLowerCase() === 'day') {
//         const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
//         result.day = dayNames[dateRange.start.getDay()];
//         result.date = formatDate(dateRange.start);
//     } else if (['week', 'month', 'year'].includes(duration.toLowerCase())) {
//         result.period = {
//             from: formatDate(dateRange.start),
//             to: formatDate(dateRange.end)
//         };
//     }

//     if (tokens.length === 0) {
//         return result;
//     }

//     // Calculate ticket counts
//     result.medical_tickets = tokens.filter(t => t.stage === 'meds').length;
//     result.account_tickets = tokens.filter(t => t.stage === 'accounts').length;
//     result.clinic_tickets = tokens.filter(t => t.stage === 'nurse_station').length;
//     result.total_tickets = tokens.length;

//     // Calculate peak times (top 2 hours with most tickets)
//     const hourCounts = {};
//     tokens.forEach(token => {
//         const hour = new Date(token.dateTime).getHours();
//         hourCounts[hour] = (hourCounts[hour] || 0) + 1;
//     });

//     result.peak_times = Object.entries(hourCounts)
//         .sort((a, b) => b[1] - a[1])
//         .slice(0, 2)
//         .map(([hour]) => `${hour}:00 - ${parseInt(hour)+1}:00`);

//     // Calculate average output times in milliseconds
//     const medicalTimes = [];
//     const accountTimes = [];
//     const clinicTimes = [];
//     const doctorTimes = [];

//     tokens.forEach(token => {
//         // Medical time: createdAt -> med_time
//         if (token.createdAt && token.med_time) {
//             const timeDiff = new Date(token.med_time) - new Date(token.createdAt);
//             if (timeDiff > 0) medicalTimes.push(timeDiff);
//         }
//         // Account time: med_time -> account_time
//         if (token.med_time && token.account_time) {
//             const timeDiff = new Date(token.account_time) - new Date(token.med_time);
//             if (timeDiff > 0) accountTimes.push(timeDiff);
//         }
//         // Clinic time: account_time -> clinic_time
//         if (token.account_time && token.clinic_time) {
//             const timeDiff = new Date(token.clinic_time) - new Date(token.account_time);
//             if (timeDiff > 0) clinicTimes.push(timeDiff);
//         }
//         // Doctor time: clinic_time -> station_time
//         if (token.clinic_time && token.station_time) {
//             const timeDiff = new Date(token.station_time) - new Date(token.clinic_time);
//             if (timeDiff > 0) doctorTimes.push(timeDiff);
//         }
//     });

//     // Format average times
//     if (medicalTimes.length > 0) {
//         const avg = medicalTimes.reduce((a, b) => a + b, 0) / medicalTimes.length;
//         result.output_times.medical = formatTimeDuration(avg);
//     }
//     if (accountTimes.length > 0) {
//         const avg = accountTimes.reduce((a, b) => a + b, 0) / accountTimes.length;
//         result.output_times.account = formatTimeDuration(avg);
//     }
//     if (clinicTimes.length > 0) {
//         const avg = clinicTimes.reduce((a, b) => a + b, 0) / clinicTimes.length;
//         result.output_times.clinic = formatTimeDuration(avg);
//     }
//     if (doctorTimes.length > 0) {
//         const avg = doctorTimes.reduce((a, b) => a + b, 0) / doctorTimes.length;
//         result.output_times.doctor = formatTimeDuration(avg);
//     }

//     return result;
// }

// module.exports = router;

const express = require('express');
const Sequelize = require('sequelize');
const router = express.Router();
const { TokenBackup } = require('../models'); // Adjust path to your model

router.get('/token_stats', async (req, res, next) => {
    const { duration = 'month', clinic } = req.query;
    
    try {
        // Calculate date range based on duration
        const dateRange = calculateDateRange(duration);
        
        // Build where clause
        const where = {
            dateTime: {
                [Sequelize.Op.between]: [dateRange.start, dateRange.end]
            }
        };
        
        if (clinic) {
            where.clinic = clinic;
        }
        
        // Fetch all relevant tokens
        const tokens = await TokenBackup.findAll({ where });
        
        // Calculate statistics
        const result = calculateStatistics(tokens, duration, dateRange);
        
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

function calculateDateRange(duration) {
    // Set to East African Time (UTC+3)
    const now = new Date();
    const timezoneOffset = 3 * 60 * 60 * 1000; // UTC+3 in milliseconds
    
    // Adjust current time to EAT
    const nowEAT = new Date(now.getTime() + timezoneOffset);
    
    let start = new Date(nowEAT);
    let end = new Date(nowEAT);
    
    switch (duration.toLowerCase()) {
        case 'day':
            start.setUTCHours(0, 0, 0, 0);
            end.setUTCHours(23, 59, 59, 999);
            // Adjust back to local time for queries
            start = new Date(start.getTime() - timezoneOffset);
            end = new Date(end.getTime() - timezoneOffset);
            return { start, end };

        case 'week':
            // Get current week's Monday (ISO week starts on Monday)
            const day = nowEAT.getUTCDay();
            const diff = nowEAT.getUTCDate() - day + (day === 0 ? -6 : 1);
            start = new Date(nowEAT);
            start.setUTCDate(diff);
            start.setUTCHours(0, 0, 0, 0);
            
            // End of week (Sunday)
            end = new Date(start);
            end.setUTCDate(start.getUTCDate() + 6);
            end.setUTCHours(23, 59, 59, 999);
            
            // Adjust back to local time for queries
            start = new Date(start.getTime() - timezoneOffset);
            end = new Date(end.getTime() - timezoneOffset);
            return { start, end };
            
        case 'month':
            // Start of current month in EAT
            start = new Date(Date.UTC(nowEAT.getUTCFullYear(), nowEAT.getUTCMonth(), 1));
            start.setUTCHours(0, 0, 0, 0);
            
            // End of current month in EAT
            end = new Date(Date.UTC(nowEAT.getUTCFullYear(), nowEAT.getUTCMonth() + 1, 0));
            end.setUTCHours(23, 59, 59, 999);
            
            // Adjust back to local time for queries
            start = new Date(start.getTime() - timezoneOffset);
            end = new Date(end.getTime() - timezoneOffset);
            return { start, end };
            
        case 'year':
            // Start of current year in EAT
            start = new Date(Date.UTC(nowEAT.getUTCFullYear(), 0, 1));
            start.setUTCHours(0, 0, 0, 0);
            
            // End of current year in EAT
            end = new Date(Date.UTC(nowEAT.getUTCFullYear(), 11, 31));
            end.setUTCHours(23, 59, 59, 999);
            
            // Adjust back to local time for queries
            start = new Date(start.getTime() - timezoneOffset);
            end = new Date(end.getTime() - timezoneOffset);
            return { start, end };
            
        case 'all':
        default:
            return { start: new Date(0), end: now };
    }
}

function formatDate(date) {
    const options = {
        timeZone: 'Africa/Nairobi',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };
    return new Date(date).toLocaleDateString('en-CA', options); // en-CA gives YYYY-MM-DD format
}

function formatTimeDuration(ms) {
    if (!ms || ms <= 0) return 'N/A';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    let remainingSeconds = seconds % 60;
    let remainingMinutes = minutes % 60;
    let remainingHours = hours % 24;
    
    const parts = [];
    
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (remainingHours > 0) parts.push(`${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`);
    if (remainingMinutes > 0) parts.push(`${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`);
    if (remainingSeconds > 0 && parts.length < 2) {
        parts.push(`${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''}`);
    }
    
    return parts.join(' and ') || 'less than a second';
}

function calculateStatistics(tokens, duration, dateRange) {
    const result = {
        duration: duration.toLowerCase(),
        total_tickets: 0,
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

    // Add date/duration specific fields
    if (duration.toLowerCase() === 'day') {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        result.day = dayNames[dateRange.start.getDay()];
        result.date = formatDate(dateRange.start);
    } else if (['week', 'month', 'year'].includes(duration.toLowerCase())) {
        result.period = {
            from: formatDate(dateRange.start),
            to: formatDate(dateRange.end)
        };
    }

    if (tokens.length === 0) {
        return result;
    }

    // Calculate ticket counts
    result.medical_tickets = tokens.filter(t => t.stage === 'meds').length;
    result.account_tickets = tokens.filter(t => t.stage === 'accounts').length;
    result.clinic_tickets = tokens.filter(t => t.stage === 'nurse_station').length;
    result.total_tickets = tokens.length;

    // Calculate peak times (top 2 hours with most tickets)
    const hourCounts = {};
    tokens.forEach(token => {
        const hour = new Date(token.dateTime).getUTCHours(); // Use UTC hours for consistency
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    result.peak_times = Object.entries(hourCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 2)
        .map(([hour]) => {
            const hourNum = parseInt(hour);
            const nextHour = (hourNum + 1) % 24;
            return `${hourNum}:00 - ${nextHour}:00`;
        });

    // Calculate average output times in milliseconds
    const medicalTimes = [];
    const accountTimes = [];
    const clinicTimes = [];
    const doctorTimes = [];

    tokens.forEach(token => {
        // Medical time: createdAt -> med_time
        if (token.createdAt && token.med_time) {
            const timeDiff = new Date(token.med_time) - new Date(token.createdAt);
            if (timeDiff > 0) medicalTimes.push(timeDiff);
        }
        // Account time: med_time -> account_time
        if (token.med_time && token.account_time) {
            const timeDiff = new Date(token.account_time) - new Date(token.med_time);
            if (timeDiff > 0) accountTimes.push(timeDiff);
        }
        // Clinic time: account_time -> clinic_time
        if (token.account_time && token.clinic_time) {
            const timeDiff = new Date(token.clinic_time) - new Date(token.account_time);
            if (timeDiff > 0) clinicTimes.push(timeDiff);
        }
        // Doctor time: clinic_time -> station_time
        if (token.clinic_time && token.station_time) {
            const timeDiff = new Date(token.station_time) - new Date(token.clinic_time);
            if (timeDiff > 0) doctorTimes.push(timeDiff);
        }
    });

    // Format average times
    if (medicalTimes.length > 0) {
        const avg = medicalTimes.reduce((a, b) => a + b, 0) / medicalTimes.length;
        result.output_times.medical = formatTimeDuration(avg);
    }
    if (accountTimes.length > 0) {
        const avg = accountTimes.reduce((a, b) => a + b, 0) / accountTimes.length;
        result.output_times.account = formatTimeDuration(avg);
    }
    if (clinicTimes.length > 0) {
        const avg = clinicTimes.reduce((a, b) => a + b, 0) / clinicTimes.length;
        result.output_times.clinic = formatTimeDuration(avg);
    }
    if (doctorTimes.length > 0) {
        const avg = doctorTimes.reduce((a, b) => a + b, 0) / doctorTimes.length;
        result.output_times.doctor = formatTimeDuration(avg);
    }

    return result;
}

module.exports = router;
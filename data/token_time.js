const express = require('express');
const Sequelize = require('sequelize');
const router = express.Router();
const { TokenBackup } = require('../models'); // Adjust path if needed

const Op = Sequelize.Op;

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
            if (start_date && end_date) {
                let start = new Date(start_date);
                let end = new Date(end_date);
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                return { start, end };
            } else if (start_date) {
                let start = new Date(start_date);
                start.setHours(0, 0, 0, 0);
                return { start, end: start };
            } else if (end_date) {
                let end = new Date(end_date);
                end.setHours(23, 59, 59, 999);
                return { start: end, end };
            }
            throw new Error("Custom range requires at least one of start_date or end_date.");

        case 'all':
        default:
            return { start: new Date(0), end: new Date() };
    }

    return { start, end };
}

router.get('/token_count_per_hour', async (req, res) => {
    const { duration = 'day', start, end } = req.query;
    try {
        let startTime, endTime;

        // Set time range based on duration
        if (duration.toLowerCase() === 'day' && !start && !end) {
            const today = new Date();
            const targetDate = today.toISOString().split('T')[0];
            startTime = new Date(`${targetDate}T03:00:00.000Z`); // 06:00 AM EAT = 03:00 AM UTC
            endTime = new Date(`${targetDate}T14:59:59.999Z`); // 05:59 PM EAT = 02:59 PM UTC
        } else {
            const { start: rangeStart, end: rangeEnd } = getDateRange(duration, start, end);
            const start_date = rangeStart.toISOString().split('T')[0];
            const end_date = rangeEnd.toISOString().split('T')[0];
            startTime = new Date(`${start_date}T03:00:00.000Z`); // 06:00 AM EAT = 03:00 AM UTC
            endTime = new Date(`${end_date}T14:59:59.999Z`); // 05:59 PM EAT = 02:59 PM UTC
        }

        // Main query for hourly counts - separate queries for better reliability
        const allTokens = await TokenBackup.findAll({
            where: {
                createdAt: {
                    [Op.between]: [startTime, endTime],
                    [Op.ne]: null
                }
            },
            attributes: [
                [
                    Sequelize.literal(`DATE_FORMAT(CONVERT_TZ(createdAt, '+00:00', '+03:00'), '%H:00')`),
                    'hour'
                ],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_tokens']
            ],
            group: ['hour'],
            raw: true
        });
        //console.log('all tokens are ',allTokens)
        // New queries for each stage based on time fields only
        const medsTokens = await TokenBackup.findAll({
            where: {
                createdAt: {
                    [Op.between]: [startTime, endTime],
                    [Op.ne]: null
                },
                stage: {
                    [Op.in]: ["meds","accounts","nurse_station","clinic"]
                }
            },
            attributes: [
                [
                    Sequelize.literal(`DATE_FORMAT(CONVERT_TZ(med_time, '+00:00', '+03:00'), '%H:00')`),
                    'hour'
                ],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_tokens']
            ],
            group: ['hour'],
            raw: true
        });
        //console.log('medical tickets are ',medsTokens)

        const accountsTokens = await TokenBackup.findAll({
            where: {
                account_time: {
                    [Op.between]: [startTime, endTime],
                    [Op.ne]: null
                }
            },
            attributes: [
                [
                    Sequelize.literal(`DATE_FORMAT(CONVERT_TZ(account_time, '+00:00', '+03:00'), '%H:00')`),
                    'hour'
                ],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_tokens']
            ],
            group: ['hour'],
            raw: true
        });

        const nurseStationTokens = await TokenBackup.findAll({
            where: {
                station_time: {
                    [Op.between]: [startTime, endTime],
                    [Op.ne]: null
                }
            },
            attributes: [
                [
                    Sequelize.literal(`DATE_FORMAT(CONVERT_TZ(station_time, '+00:00', '+03:00'), '%H:00')`),
                    'hour'
                ],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_tokens']
            ],
            group: ['hour'],
            raw: true
        });

        const clinicTokens = await TokenBackup.findAll({
            where: {
                clinic_time: {
                    [Op.between]: [startTime, endTime],
                    [Op.ne]: null
                }
            },
            attributes: [
                [
                    Sequelize.literal(`DATE_FORMAT(CONVERT_TZ(clinic_time, '+00:00', '+03:00'), '%H:00')`),
                    'hour'
                ],
                [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_tokens']
            ],
            group: ['hour'],
            raw: true
        });

        // Initialize result structure for 06:00 to 17:00 (12 hours)
        const stages = ['all', 'meds', 'accounts', 'nurse_station', 'clinic'];
        const result = stages.map(stage => ({
            stage,
            tickets: Array.from({ length: 12 }, (_, i) => {
                const hour = (i + 6).toString().padStart(2, '0'); // 06 to 17
                return { [`${hour}:00`]: 0 };
            })
        }));

        // Process all tokens (for 'all' stage)
        allTokens.forEach(token => {
            const hour = token.hour;
            const count = parseInt(token.total_tokens, 10);
            const stageObj = result.find(s => s.stage === 'all');
            if (stageObj && hour) {
                const hourIndex = parseInt(hour.split(':')[0], 10) - 6;
                if (hourIndex >= 0 && hourIndex < 12) {
                    stageObj.tickets[hourIndex][hour] = count;
                }
            }
        });

        // Process meds tokens
        medsTokens.forEach(token => {
            const hour = token.hour;
            const count = parseInt(token.total_tokens, 10);
            const stageObj = result.find(s => s.stage === 'meds');
            if (stageObj && hour) {
                const hourIndex = parseInt(hour.split(':')[0], 10) - 6;
                if (hourIndex >= 0 && hourIndex < 12) {
                    stageObj.tickets[hourIndex][hour] = count;
                }
            }
        });

        // Process accounts tokens
        accountsTokens.forEach(token => {
            const hour = token.hour;
            const count = parseInt(token.total_tokens, 10);
            const stageObj = result.find(s => s.stage === 'accounts');
            if (stageObj && hour) {
                const hourIndex = parseInt(hour.split(':')[0], 10) - 6;
                if (hourIndex >= 0 && hourIndex < 12) {
                    stageObj.tickets[hourIndex][hour] = count;
                }
            }
        });

        // Process nurse_station tokens
        nurseStationTokens.forEach(token => {
            const hour = token.hour;
            const count = parseInt(token.total_tokens, 10);
            const stageObj = result.find(s => s.stage === 'nurse_station');
            if (stageObj && hour) {
                const hourIndex = parseInt(hour.split(':')[0], 10) - 6;
                if (hourIndex >= 0 && hourIndex < 12) {
                    stageObj.tickets[hourIndex][hour] = count;
                }
            }
        });

        // Process clinic tokens
        clinicTokens.forEach(token => {
            const hour = token.hour;
            const count = parseInt(token.total_tokens, 10);
            const stageObj = result.find(s => s.stage === 'clinic');
            if (stageObj && hour) {
                const hourIndex = parseInt(hour.split(':')[0], 10) - 6;
                if (hourIndex >= 0 && hourIndex < 12) {
                    stageObj.tickets[hourIndex][hour] = count;
                }
            }
        });

        // Add days data if duration is not 'day'
        if (duration.toLowerCase() !== 'day') {
            const daysQuery = await TokenBackup.findAll({
                where: {
                    createdAt: {
                        [Op.between]: [startTime, endTime],
                        [Op.ne]: null
                    }
                },
                attributes: [
                    [
                        Sequelize.literal(`DAYNAME(CONVERT_TZ(createdAt, '+00:00', '+03:00'))`),
                        'day'
                    ],
                    [Sequelize.fn('COUNT', Sequelize.col('id')), 'total_tokens']
                ],
                group: ['day'],
                raw: true
            });

            const daysMap = {
                'Monday': 0,
                'Tuesday': 0,
                'Wednesday': 0,
                'Thursday': 0,
                'Friday': 0,
                'Saturday': 0,
                'Sunday': 0
            };

            daysQuery.forEach(dayData => {
                const dayName = dayData.day;
                const count = parseInt(dayData.total_tokens, 10);
                if (daysMap.hasOwnProperty(dayName)) {
                    daysMap[dayName] = count;
                }
            });

            const daysResult = {
                stage: 'Days',
                tickets: [
                    { 'Monday': daysMap['Monday'] },
                    { 'Tuesday': daysMap['Tuesday'] },
                    { 'Wednesday': daysMap['Wednesday'] },
                    { 'Thursday': daysMap['Thursday'] },
                    { 'Friday': daysMap['Friday'] },
                    { 'Saturday': daysMap['Saturday'] },
                    { 'Sunday': daysMap['Sunday'] }
                ]
            };

            result.push(daysResult);
        }

        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
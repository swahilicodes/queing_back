const express = require('express')
const router = express.Router();
const { TokenBackup } = require('../models/index')
const { Op, fn, col } = require('sequelize')
const Sequelize = require('sequelize')

router.get('/token_analytics', async (req, res, next) => {
    try {
        const tokens = await TokenBackup.findAll({
            order: [
                ['createdAt','DESC']
            ]
        })
        const results = []
        const result = await Promise.all(
            tokens.map(async (item) => {
                const filteredTokens = tokens.filter((data) => data.date === item.date);
                const completed = filteredTokens.filter((data) => data.med_time !== null).length;
                const uncompleted = filteredTokens.filter((data) => data.med_time === null).length;
        
                const date = new Date(item.date);
                const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const day = daysOfWeek[date.getDay()];
        
                const totalTokensForDate = await TokenBackup.count({
                    where: { date: item.date.toString() },
                });
        
                return {
                    completed,
                    uncompleted,
                    total: totalTokensForDate,
                    day,
                    date: item.date,
                };
            })
        );
        for (let value of result) {
            if (results.map((item)=> item.date).includes(value.date)) {
            } else {
                results.push(value);
            }
        }
        res.json(results.splice(0, 7))
    } catch (error) {
        next(error); // Passes the error to the error-handling middleware
    }
})
router.get('/stage_analytics', async (req, res, next) => {
    const {stage,time_factor} = req.query
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1); // First day of this month
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
    const startOfYear = new Date(new Date().getFullYear(), 0, 1); // Jan 1st of this year
    const endOfYear = new Date(new Date().getFullYear() + 1, 0, 1);
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 (Sunday) to 6 (Saturday)
    const diffToSunday = -dayOfWeek;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() + diffToSunday);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    const meda = []
    const accounta = []
    const stationa = []
    const clinica = []
    const formatDate = (date) => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      };
    try {
        const tokens = await TokenBackup.findAll({
            order: [
                ['createdAt','ASC']
            ],
            where: {
                //...(stage !== "all" && { stage }),
                createdAt: time_factor==="month"?{[Op.between]: [startOfMonth,endOfMonth]}: time_factor==="year"?{[Op.between]: [startOfYear,endOfYear]}:{[Op.between]: [startOfWeek, endOfWeek]}
            }
        })
        const formatedDate = (currentMilliseconds) => {
            const hours = Math.floor((currentMilliseconds / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((currentMilliseconds / (1000 * 60)) % 60);
            const seconds = Math.floor((currentMilliseconds / 1000) % 60);
            const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            return formattedTime
        }
        const result = await Promise.all(
            tokens.map(async (item) => {
                const filteredTokens = tokens.filter((data) => data.date === item.date);
                // const uncompleted = filteredTokens.filter((data) => data[keyValue()] === null).length;
                // const completed = filteredTokens.filter((data) => data[keyValue()] !== null).length;
                const meds = filteredTokens.filter((data) => data.med_time!== null).length;
                const accounts = filteredTokens.filter((data) => data.account_time!== null).length;
                const stations = filteredTokens.filter((data) => data.station_time!== null).length;
                const clinics = filteredTokens.filter((data) => data.clinic_time!== null).length;
        
                const date = new Date(item.date);
                const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const day = daysOfWeek[date.getDay()];
        
                const totalTokensForDate = await TokenBackup.count({
                    where: {
                        //...(stage !== "all" && { stage }),
                        date: item.date.toString(),
                        //createdAt: time_factor==="month"?{[Op.between]: [startOfMonth,endOfMonth]}: time_factor==="year"?{[Op.between]: [startOfYear,endOfYear]}:{[Op.between]: [startOfWeek, endOfWeek]}
                    }
                });
                let meda = [], accounta = [], stationa = [], clinica = [];

                const med = item.med_time && item.createdAt ? 
                            new Date(item.med_time).getTime() - new Date(item.createdAt).getTime() : 0;
                const account = item.account_time && item.med_time ? 
                                new Date(item.account_time).getTime() - new Date(item.med_time).getTime() : 0;
                const station = item.station_time && item.account_time ? 
                                new Date(item.station_time).getTime() - new Date(item.account_time).getTime() : 0;
                const clinic = item.clinic_time && item.station_time ? 
                            new Date(item.clinic_time).getTime() - new Date(item.station_time).getTime() : 0;

                // Collect times
                meda.push(med);
                accounta.push(account);
                stationa.push(station);
                clinica.push(clinic);

                // Calculate averages
                const sum_med = meda.reduce((acc, cur) => acc + (cur < 0 ? 0 : cur), 0);
                const sum_account = accounta.reduce((acc, cur) => acc + (cur < 0 ? 0 : cur), 0);
                const sum_station = stationa.reduce((acc, cur) => acc + (cur < 0 ? 0 : cur), 0);
                const sum_clinic = clinica.reduce((acc, cur) => acc + (cur < 0 ? 0 : cur), 0);

                const average_med = sum_med / meda.length || 0;
                const average_account = sum_account / accounta.length || 0;
                const average_station = sum_station / stationa.length || 0;
                const average_clinic = sum_clinic / clinica.length || 0;
        
                return {
                    med_total: meds,
                    account_total: accounts,
                    clinic_total: clinics,
                    station_total: stations,
                    total: totalTokensForDate,
                    day,
                    date: item.date,
                    stage: item.stage,
                    med_time: (isNaN(sum_med / meds) || !isFinite(sum_med / meds)) ? 0 : (sum_med / meds),
                    account_time: (isNaN(sum_account / accounts) || !isFinite(sum_account / accounts)) ? 0 : (sum_account / accounts),
                    station_time: (isNaN(sum_station / stations) || !isFinite(sum_station / stations)) ? 0 : (sum_station / stations),
                    clinic_time: (isNaN(sum_clinic / clinics) || !isFinite(sum_clinic / clinics)) ? 0 : (sum_clinic / clinics),

                    id: item.id
                };
            })
        );
        const uniqueData = Array.from(
            result.reduce((map, obj) => {
              const key = `${obj.id}-${obj.date}`;
              if (!map.has(obj.date)) {
                map.set(obj.date, obj);
              }
              return map;
            }, new Map()).values()
          );
        if(time_factor==="month" || time_factor==="year" || time_factor==="all"){
            const sum = uniqueData.reduce((accumulator, current) => accumulator + current.total, 0); 
            const meds = uniqueData.reduce((accumulator, current) => accumulator + current.med_total, 0); 
            const accounts = uniqueData.reduce((accumulator, current) => accumulator + current.account_total, 0); 
            const stations = uniqueData.reduce((accumulator, current) => accumulator + current.station_total, 0); 
            const clinics = uniqueData.reduce((accumulator, current) => accumulator + current.clinic_total, 0); 
            const uncompleted = uniqueData.reduce((accumulator, current) => accumulator + current.uncompleted, 0);
            const date = uniqueData.reduce((accumulator, current) => accumulator + current.date, 0); 
            const med_time = uniqueData.reduce((accumulator, current) => accumulator + parseFloat(current.med_time), 0); 
            const account_time = uniqueData.reduce((accumulator, current) => accumulator + parseFloat(current.account_time), 0); 
            const station_time = uniqueData.reduce((accumulator, current) => accumulator + parseFloat(current.station_time), 0); 
            const clinic_time = uniqueData.reduce((accumulator, current) => accumulator + parseFloat(current.clinic_time), 0); 
            const id = uniqueData.reduce((accumulator, current) => accumulator + current.id, 0); 
            res.json([{
                med_total: meds,
                account_total: accounts,
                station_total: stations,
                clinic_total: clinics,
                total: sum,
                day: time_factor==="month"?`${formatDate(startOfMonth)} - ${formatDate(endOfMonth)}`:`${formatDate(startOfYear)} - ${formatDate(endOfYear)}`,
                date,
                stage,
                med_time: formatedDate(med_time),
                account_time: formatedDate(account_time),
                station_time: formatedDate(station_time),
                clinic_time: formatedDate(clinic_time),
                id
            }]);
        }else if(time_factor==="week"){
            const result = await Promise.all(
                uniqueData.map((item)=> {
                   return {
                    med_total: item.med_total,
                    account_total: item.account_total,
                    station_total: item.station_total,
                    clinic_total: item.clinic_total,
                    total: item.total,
                    day: item.day,
                    date: item.date,
                    stage: item.stage,
                    med_time: formatedDate(item.med_time),
                    account_time: formatedDate(item.account_time),
                    station_time: formatedDate(item.station_time),
                    clinic_time: formatedDate(item.clinic_time),
                    id: item.id
                   } 
                })
            )
            res.json(result)
        }
        // }
    } catch (error) {
        next(error); // Passes the error to the error-handling middleware
    }
})
module.exports = router;
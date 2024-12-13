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
                ['createdAt','DESC']
            ],
            where: {
                stage,
                createdAt: time_factor==="month"?{[Op.between]: [startOfMonth,endOfMonth]}: time_factor==="year"?{[Op.between]: [startOfYear,endOfYear]}:{[Op.between]: [startOfWeek, endOfWeek]}
            }
        })
        const results = []
        const keyValue = () => {
            if(stage==="meds"){
                return 'med_time'
            }else if(stage==='accounts'){
                return 'account_time'
            }else if(stage==='nurse_station'){
                return 'station_time'
            }else if(stage==="clinic"){
                return 'clinic_time'
            }else{
                return null
            }
        }
        const keyValue01 = () => {
            if(stage==="meds"){
                return 'createdAt'
            }else if(stage==='accounts'){
                return 'med_time'
            }else if(stage==='nurse_station'){
                return 'account_time'
            }else if(stage==="clinic"){
                return 'station_time'
            }else{
                return null
            }
        }
        const result = await Promise.all(
            tokens.map(async (item) => {
                const filteredTokens = tokens.filter((data) => data.date === item.date);
                const uncompleted = filteredTokens.filter((data) => data[keyValue()] === null).length;
                const completed = filteredTokens.filter((data) => data[keyValue()] !== null).length;
        
                const date = new Date(item.date);
                const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const day = daysOfWeek[date.getDay()];
        
                const totalTokensForDate = await TokenBackup.count({
                    where: { date: item.date.toString() },
                });
                const meds_time = (new Date(item[keyValue()]) - new Date(item[keyValue01()])) / (1000 * 60 * 60)
        
                return {
                    completed,
                    uncompleted,
                    total: totalTokensForDate,
                    day,
                    date: item.date,
                    stage: item.stage,
                    diff_time: meds_time <0 ?0 : meds_time
                };
            })
        );
        for (let value of result) {
            if (results.map((item)=> item.date).includes(value.date)) {
            } else {
                results.push(value);
            }
        }
        if (time_factor === "month" || time_factor === "year") {
            const sum = results.reduce((accumulator, current) => accumulator + current.total, 0);
            const sum_complete = results.reduce((accumulator, current) => accumulator + current.completed, 0);
            const sum_uncomplete = results.reduce((accumulator, current) => accumulator + current.uncompleted, 0);
            const total_time = results.reduce((accumulator, current) => accumulator + current.diff_time, 0);
            const average = total_time/results.map((item)=> item.diff_time).length
            res.json([{ 
                total: sum,
                completed: sum_complete,
                uncompleted: sum_uncomplete,
                day: time_factor==="year"?`${formatDate(startOfYear)}-${formatDate(endOfYear)}`:`${formatDate(startOfMonth)}-${endOfMonth}`,
                date: new Date(),
                stage: stage,
                average: average,
            }]);
        } else {
            res.json(results);
        }
    } catch (error) {
        next(error); // Passes the error to the error-handling middleware
    }
})
module.exports = router;
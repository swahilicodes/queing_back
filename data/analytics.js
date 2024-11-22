const express = require('express')
const router = express.Router();
const { TokenBackup } = require('../models/index')
const { Op, fn, col } = require('sequelize')
const Sequelize = require('sequelize')

router.get('/token_analytics', async (req, res, next) => {
    function removeDuplicates(arr){
        const uniqueTokens = Array.from(
            arr.reduce((map, current) => {
                const existing = map.get(current.date);
                if (!existing || new Date(current.date) > new Date(existing.date)) {
                  map.set(current.date, current); // Keep the more recent token.
                }
                return map;
              }, new Map())
              .values() // Extract the unique values from the map.
          );
          return uniqueTokens
    }
    try {
        const tokens = await TokenBackup.findAll()
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
        res.json(results)
    } catch (error) {
        next(error); // Passes the error to the error-handling middleware
    }
})
module.exports = router;
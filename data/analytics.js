const express = require('express')
const router = express.Router();
const { TokenBackup } = require('../models/index')
const { Op, fn, col } = require('sequelize')
const Sequelize = require('sequelize')

router.get('/token_analytics', async (req, res, next) => {
    function removeDuplicates(arr){
        const uniqueTokens = Array.from(
            arr
              .reduce((map, current) => {
                const existing = map.get(current.token);
                if (!existing || new Date(current.date) > new Date(existing.date)) {
                  map.set(current.token, current); // Keep the more recent token.
                }
                return map;
              }, new Map())
              .values() // Extract the unique values from the map.
          );
          return uniqueTokens
    }
    try {
        const tokens = await TokenBackup.findAll()
        const result = await Promise.all(
            tokens.map(async (item) => {
                const complete = tokens.filter((data) => data.date === item.date && data.med_time !== null)
                const uncomplete = tokens.filter((data) => data.date === item.date && data.med_time === null)
                const total = tokens.length
                const date = new Date(item.createdAt);
                const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                const day = daysOfWeek[date.getDay()];
                return {
                    completed: complete.length,
                    uncompleted: uncomplete.length,
                    total: total,
                    day: day,
                }
            })
        )
        const list = removeDuplicates(result)
        res.json(list)
    } catch (error) {
        next(error); // Passes the error to the error-handling middleware
    }
})
module.exports = router;
const express = require('express')
const router = express.Router()
const { PriorCode } = require('../models/index')

router.post("/create_code", async (req,res)=> {
    const {code} = req.body
    try{
        const codee = await PriorCode.create({code})
        res.json(codee)
    } catch (error){
        res.status(500).json({error: error})
    }
})

module.exports = router
const express = require("express")
const router = express.Router()
const {InTime} = require('../models/index')

router.post("/create_rest",async (req,res)=> {
    const {time} = req.body
    try{
        if(!time){
            return res.status(400).json({error: "Time is Required"})
        }else{
            const tima = await InTime.findOne({
               order: [['createdAt', 'ASC']]
            })
            if(tima){
                tima.update({
                    time: time
                })
                res.json(tima)
            }else{
                const tma = await InTime.create({
                    time: time
                })
                res.json(tma)
            }
        }
    }catch(error){
        res.status(500).json({error: error})
    }
})
// get time
router.get("/get_rest",async (req,res)=> {
    try{
       const tima = await InTime.findOne({
            order: [['createdAt', 'ASC']]
        })
        res.json(tima)
    }catch(error){

    }
})

module.exports = router
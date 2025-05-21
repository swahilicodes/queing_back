const express = require('express')
const router = express.Router();
const { Audio } = require('../models/index')
const cron = require('node-cron')
const {Op} = require('sequelize')
const Sequelize = require('sequelize')
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 30 });

router.post("/create_speaker", async (req,res)=> {
const { ticket_no, counter, stage, station } = req.body
const cacheKey = `${ticket_no}:${counter}:${stage}`;
try{
    const existingAudio = await Audio.findOne({
      ticket_no,
      counter,
      stage,
      createdAt: { $gte: new Date(Date.now() - 10 * 1000) }
    });
    if (existingAudio) {
      return res.status(400).json({ error: "Audio creation rate limit exceeded. Try again after 30 seconds." });
    }else{
        const plai = await Audio.create({
        ticket_no,
        stage,
        station,
        counter
    })
    res.json(plai)
    }
}catch(error){
    res.status(500).json({error: error})
}
})
// get all speakers
router.get("/get_speakers", async (req,res)=> {
const { station } = req.query
try{
    if(station.trim()===""){
        const speaks = await Audio.findAll()
        res.json(speaks)
    }else{
        const speaks = await Audio.findAll({
            where: {station: station}
        })
        res.json(speaks)
    }
}catch(error){
    res.status(500).json({error: error})
}
})
// get all speakers
router.post("/delete_play", async (req,res)=> {
const { id } = req.body
try{
    if(!id){
        res.status(400).json({error: "id is required"})
    }else{
        const play = await Audio.findOne({
            where: {id}
        })
        if(play){
          await play.destroy()
          res.json(play)
        }
    }
}catch(error){
    res.status(500).json({error: error})
}
})
module.exports = router
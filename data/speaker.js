const express = require('express')
const router = express.Router();
const { Play } = require('../models/index')
const cron = require('node-cron')
const {Op} = require('sequelize')

router.post("/create_speaker", async (req,res)=> {
const { ticket_no, counter, stage, station } = req.body
try{
    const plai = await Play.create({
        ticket_no,
        stage,
        station,
        counter
    })
    res.json(plai)
}catch(error){
    res.status(500).json({error: error})
}
})
// get all speakers
router.get("/get_speakers", async (req,res)=> {
const { station } = req.query
try{
    if(station.trim()===""){
        const speaks = await Play.findAll()
        res.json(speaks)
    }else{
        const speaks = await Play.findAll({
            where: {station: station}
        })
        res.json(speaks)
    }
}catch(error){
    res.status(500).json({error: error})
}
})
cron.schedule('*/15 * * * * *', async () => {
    try {
        const plays = await Play.findAll();
        const activeStations = new Set();
        for (const play of plays) {
          if (play.talking) {
            activeStations.add(play.station);
          }
        }
        for (const play of plays) {
          if (!activeStations.has(play.station)) {
            play.talking = true;
            await play.save();
            console.log(`Updated play with ID: ${play.id} from station: ${play.station}`);
            activeStations.add(play.station);
            setTimeout(()=> {
                play.destroy()
                console.log(`${play.id} deleted successfully`)
            },60000)
          }
        }
    } catch (error) {
      console.error('Error running the cron job:', error);
    }
  });
module.exports = router
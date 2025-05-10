const express = require('express');
const router = express.Router();
const { Active,Device } = require('../models/index')

router.post('/activate', async (req, res, next) => {
    const {page, video, device} = req.body
    try{
        const act = await Active.findOne({
            where: {page: page}
        })
        if(act){
            console.log('device found')
            if(page==='/clinic_queue'){
                if(!device){
                    res.status(400).json({ error: "device cannot be empty" });  
                }  else{
                    act.update({
                        isActive: !act.isActive,
                        video: video,
                        device: device
                    })
                    res.json(act)
                }
            }else{
                act.update({
                    isActive: !act.isActive,
                    video: video
                })
                res.json(act)
            }
        }else{
            console.log('device not found')
            if(page==='/clinic_queue'){
                console.log('this is clinic queue')
                if(!device){
                    console.log('device cannot be empty')
                    return res.status(400).json({ error: "device cannot be empty" });
                }else{
                    console.log('this is inside clinic queue')
                    const att = await Active.create({
                        isActive: true,
                        page: page,
                        video: video,
                        device: device
                    })
                    res.json(att)  
                }
            }else{
                console.log('next active stage')
                const att = await Active.create({
                    isActive: true,
                    page: page,
                    video: video,
                    device: device
                })
                res.json(att)
            }
        }
    }catch (error) {
        res.status(500).json({ error: error });
    }
});
router.get('/get_active', async (req, res, next) => {
    const page = req.query.page
    try{
        const act = await Active.findOne({
            where: {page: page}
        })
        if(act){
            res.json(act)
        }
    }catch (error) {
        res.status(500).json({ error: error });
    }
});
router.get('/get_clinic_devices', async (req, res, next) => {
    try{
        const act = await Device.findAll({
            where: {default_page: "/clinic_queue"}
        })
        res.json(act)
    }catch (error) {
        res.status(500).json({ error: error });
    }
});

module.exports = router;
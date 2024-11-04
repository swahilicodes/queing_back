const express = require('express');
const router = express.Router();
const { Active } = require('../models/index')

router.post('/activate', async (req, res, next) => {
    const page = req.body.page
    try{
        //res.status(400).json('the page is ',page)
        const act = await Active.findOne({
            where: {page: page}
        })
        if(act){
            act.update({
                isActive: !act.isActive
            })
            res.json(act)
        }else{
            const att = await Active.create({
                isActive: true,
                page: page
            })
            res.json(att)
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
        res.json(act)
    }catch (error) {
        res.status(500).json({ error: error });
    }
});

module.exports = router;
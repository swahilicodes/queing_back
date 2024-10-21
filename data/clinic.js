const express = require('express');
const { Clinic } = require('../models/index')
const router = express.Router();
const { Op } = require('sequelize')
const bcrypt = require("bcryptjs");
const { default: axios } = require('axios');


router.post('/create_clinic', async (req, res) => {
    const { cliniciname,clinicicode, status, deptcode } = req.body;
    console.log(clinicicode,cliniciname)
    try {
        if(cliniciname.trim() === ''){
            return res.status(400).json({ error: 'clinic name is required' });
        }if(clinicicode.trim() === ''){
            return res.status(400).json({ error: 'clinic code is required' });
        }else{
            const clinic = await Clinic.findOne({
                where: {clinicicode}
            })
            if(clinic){
                return res.status(400).json({ error: 'clinic exists' });  
            }else{
                const data = await Clinic.create(req.body)
                res.json(data)
            }
        }
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// get jeeva clinics
router.get('/jeeva_clinics', async (req, res) => {
    try {
        axios.get("http://192.168.235.65/dev/jeeva_api/swagger/clinics").then((data)=> {
            if(data.status === 200){
                res.json(data.data)
            }else{
                res.json(data.status)
            }
        }).catch((error)=> {
            res.status(500).json({ error: error });
        })
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// get clinics
router.get('/get_clinics', async (req, res) => {
    try {
        const clinics = await Clinic.findAll()
        res.json(clinics)
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

module.exports = router;
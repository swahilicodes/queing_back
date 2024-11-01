const express = require('express');
const { AttendClinic } = require('../models/index')
const router = express.Router();
const { Op } = require('sequelize')


router.post('/create_attendant_clinic', async (req, res) => {
    const { clinic,clinic_code, attendant_id } = req.body;
    try {
        if(clinic.trim() === ''){
            return res.status(400).json({ error: 'clinic is required' });
        }if(clinic_code.trim() === ''){
            return res.status(400).json({ error: 'clinic_code is required' });
        }if(attendant_id.trim() === ''){
            return res.status(400).json({ error: 'attendant_id is required' });
        }else{
            const service = await AttendClinic.findOne({
                where: {clinic_code, attendant_id}
            })
            if(service){
                return res.status(400).json({ error: 'clinic exists' });   
            }else{
                const newService = await AttendClinic.create(req.body)
                res.json(newService);
            }
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
router.get('/get_clinics', async (req, res) => {
    const { attendant_id } = req.query;
    try {
        if(attendant_id.trim() === ''){
            return res.status(400).json({ error: 'attendant_id is required' });
        }else{
            const service = await AttendClinic.findAll({
                where: {attendant_id}
            })
            res.json(service)
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
router.get('/delete_clinic', async (req, res) => {
    const { attendant_id, clinic_code } = req.query;
    try {
        if(attendant_id.trim() === ''){
            return res.status(400).json({ error: 'attendant_id is required' });
        }else if(clinic_code.trim() === ''){
            return res.status(400).json({ error: 'clinic_code is required' });
        }else{
            const clinic = await AttendClinic.findOne({
                where: {clinic_code, attendant_id}
            })
            if(clinic){
                clinic.destroy()
                res.json(clinic)
            }
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
module.exports = router;
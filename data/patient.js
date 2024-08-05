const express = require('express');
const { Patient, Queue } = require('../models/index')
const router = express.Router();


router.post('/register_patient', async (req, res) => {
    const { name, clinic, mr_no,age, sex , reg_date, reg_time,consult_date, consult_time, doctor, consult_doctor} = req.body;
    try {
        if(name.trim() === ''){
            return res.status(400).json({ error: 'name is required' });
        }else{
        const pat = await Patient.findOne({
            where: {mr_no}
        })
        if(!pat){
            const patient = await Patient.create(req.body)
            res.json(patient);
        }else{
            console.log('patient exists')
        }
        }
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

// get patients
router.get('/get_patients', async (req, res) => {
    try {
        const patient = await Patient.findAll()
        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
module.exports = router;
const express = require('express');
const { Patient } = require('../models/index')
const router = express.Router();


router.post('/register_patient', async (req, res) => {
    const { name, clinic, age, sex , reg_date, reg_time,consult_date, consult_time, doctor, consult_doctor, patient_type, patient_category, examption_category,initial_diagnosis,credit_company_name,membership_id,emp_id,comp_name,paid_status,paid_amount,amount_to_be_paid,visit,created_by,comp_amount} = req.body;
    try {
        if(name.trim() === ''){
            return res.status(400).json({ error: 'name is required' });
        }else{
        const patient = await Patient.create(req.body)
        res.json(patient);
        }
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
module.exports = router;
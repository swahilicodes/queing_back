const express = require('express');
const { Queue } = require('../models/index')
const router = express.Router();


router.post('/create_queue', async (req, res) => {
    const { name, clinic, age, sex , reg_date, reg_time,consulting_doctor,ticket_no,status} = req.body;
    try {
        if(name.trim() === ''){
            return res.status(400).json({ error: 'name is required' });
        }else if(clinic.trim() === ''){
            return res.status(400).json({ error: 'clinic is required' });
        }else if(age.trim() === ''){
            return res.status(400).json({ error: 'age is required' });
        }else if(sex.trim() === ''){
            return res.status(400).json({ error: 'sex is required' });
        }else if(reg_date === undefined || reg_date === null){
            return res.status(400).json({ error: 'registration date is required' });
        }else if(reg_time === undefined || reg_time === null || reg_time === ""){
            return res.status(400).json({ error: 'registration time is required' });
        }else if(consulting_doctor.trim() === ''){
            return res.status(400).json({ error: 'consulting_doctor is required' });
        }else if(ticket_no.trim() === ''){
            return res.status(400).json({ error: 'ticket_no is required' });
        }else if(status.trim() === ''){
            return res.status(400).json({ error: 'status is required' });
        }else{
        const queue = await Queue.create(req.body)
        res.json(queue);
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});

// get queues
router.get('/getAll', async (req, res, next) => {
    try {
        const queue = await Queue.findAll()
        res.json(queue);
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
module.exports = router;
const express = require('express');
const { Patient, Queue } = require('../models/index')
const router = express.Router();


router.post('/register_patient', async (req, res) => {
    const { name, clinic, mr_no,age, sex,status, reg_date, reg_time,consult_date, consult_time, doctor, consult_doctor} = req.body;
    try {
        if(name.trim() === ''){
            return res.status(400).json({ error: 'name is required' });
        }else{
        const pat = await Patient.findOne({
            where: {mr_no}
        })
        if(pat){
            return
        }else{
            const patient = await Patient.create(req.body)
            res.json(patient);
        }
        }
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

// get patients
router.get('/get_patients', async (req, res) => {
    const {clinic,status} = req.params
    console.log('clinic name ',req.query.clinic)
    try {
        const patient = await Patient.findAll({
            where: {clinic:`${req.query.clinic}`,status:`${req.query.status}`}
        })
        res.json(patient);
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// get queues
router.get('/getCatPatients', async (req, res, next) => {
    const category = req.query.category
    const status = req.query.status
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    console.log("status is ",status,category)
    try {
        if(status.trim()===""){
            const curr = await Patient.findAndCountAll({
                // where: {category},
                where: {clinic:category,status:"waiting"},
                offset: offset,
                limit: pageSize,
                order: [['id', 'ASC']]
            })
            res.json({
                data: curr.rows,
                totalItems: curr.count,
                totalPages: Math.ceil(curr.count / pageSize),
              });
        }else{
            const curr = await Patient.findAndCountAll({
                // where: {clinic},
                where: {clinic:category,status},
                offset: offset,
                limit: pageSize,
                order: [['id', 'ASC']]
            })
            res.json({
                data: curr.rows,
                totalItems: curr.count,
                totalPages: Math.ceil(curr.count / pageSize),
              });
        }
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// edit patient
router.put('/edit_patient/:id', async (req, res, next) => {
    const id = req.params.id
    const status = req.body
        try {
            const ticket = await Patient.findOne({
                where: { id }
            })
            if(!ticket){
                return res.status(400).json({ error: 'ticket not found' });
            }else {
                ticket.update({
                    status: status.status
                })
                res.json(ticket)
            }
        } catch (err) {
            res.status(500).json({ error: err });
        }
    });
module.exports = router;
const express = require('express');
const { Dokta, User, Counter, Patient, Ticket } = require('../models/index')
const router = express.Router();
const { Op } = require('sequelize')
const bcrypt = require("bcryptjs")


router.post('/create_dokta', async (req, res) => {
    const { name, phone,room, clinic, clinic_code } = req.body;
    let newPass = await bcrypt.hash(phone,6)
    console.log('clinic is ',clinic)
    try {
        if(name.trim() === ''){
            return res.status(400).json({ error: 'name is required' });
        }else if(phone.trim() === ''){
            return res.status(400).json({ error: 'phone is required' });
        }else if(clinic.trim() ===""){
            return res.status(400).json({ error: 'clinic is required' });
        }else if(clinic_code.trim() ===""){
            return res.status(400).json({ error: 'clinic code is required' });
        }else if(room.trim() === ''){
            return res.status(400).json({ error: 'room is required' });
        }else{
            const att = await Dokta.findOne({
                where: {phone}
            })
            const user = await User.findOne({
                where: {phone}
            })
            if(att !== null){
                return res.status(400).json({ error: 'Doctor exists' });  
            }else if(user){
                return res.status(400).json({ error: 'user exists' }); 
            }else{
                const newAtt = await Dokta.create({
                    name,
                    phone,
                    service: "clinic",
                    room,
                    clinic_code,
                    clinic,
                    role: "doctor",
                    password: newPass
                })
                await User.create({
                    name,
                    phone,
                    counter:room,
                    clinic,
                    role: "doctor",
                    password:newPass,
                    service: "clinic",
                    counter:room,
                    display_photo: null
                })
                res.json(newAtt)
            }
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
router.get('/get_doktas', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const clinic_code = req.query.clinic_code;
    const offset = (page - 1) * pageSize;
    try {
        const curr = await Dokta.findAndCountAll({
            where: {clinic_code},
            offset: offset,
            limit: pageSize,
            order: [['id', 'ASC']]
        })
        res.json({
            data: curr.rows,
            totalItems: curr.count,
            totalPages: Math.ceil(curr.count / pageSize),
          });
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
router.get('/get_free_doktas', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const clinic_code = req.query.clinic_code;
    const offset = (page - 1) * pageSize;
    try {
        const curr = await Dokta.findAndCountAll({
            where: {clinic_code,current_patient: {[Op.eq]: null}},
            offset: offset,
            limit: pageSize,
            order: [['id', 'ASC']]
        })
        res.json({
            data: curr.rows,
            totalItems: curr.count,
            totalPages: Math.ceil(curr.count / pageSize),
          });
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
router.put('/delete_dokta/:id', async (req, res) => {
    const id = req.params.id
    try {
        const service = await Dokta.findByPk(id);
        if (!service) {
        return res.status(404).json({ error: 'doctor not found' });
        }else{
            const user = await User.findOne({
                where: {phone: service.phone}
            })
            if(user){
                await user.destroy()
                await service.destroy();
                res.status(204).end();
            }
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
// Finish Patient
router.post('/finish_patient', async (req, res) => {
    const {doctor_id, patient_id} = req.body
    try {
        const doc = await Dokta.findOne({
            where: {phone: doctor_id}
        });
        const tic = await Ticket.findOne({
            where: {mr_no: patient_id, stage: "clinic"}
        });
        if (!doc) {
        return res.status(404).json({ error: 'doctor not found' });
        }else if (!tic){
            return res.status(404).json({ error: 'patient not found' });
        }else{
            tic.update({
                stage: "out",
            })
            doc.update({
                current_patient: null
            })
            res.json(doc)
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});

module.exports = router;
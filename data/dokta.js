const express = require('express');
const { Dokta, User, Counter, Patient, Ticket, TokenBackup } = require('../models/index')
const router = express.Router();
const { Op } = require('sequelize')
const bcrypt = require("bcryptjs")
const axios = require('axios')


router.post('/create_dokta', async (req, res) => {
    const { name, phone,room, clinic, clinic_code } = req.body;
    let newPass = await bcrypt.hash(phone,6)
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
    const selected_clinic = req.query.selected_clinic;
    const clinics = req.query.clinics;
    const offset = (page - 1) * pageSize;
    try {
        if(selected_clinic.trim() !== ""){
            const curr = await Dokta.findAndCountAll({
                where: {clinic_code: selected_clinic,current_patient: {[Op.eq]: null}},
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
            const curr = await Dokta.findAndCountAll({
                where: {clinic_code: {[Op.in]: clinics},current_patient: {[Op.eq]: null}},
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
    const now = new Date();

    const formattedDate = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
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
            axios.get(`http://192.168.235.65/dev/jeeva_api/swagger/billing/${tic.mr_no}/${formattedDate}/${tic.clinic_code}`).then(async (data)=> {
                if(data.data && data.data.status === 'Failure'){
                    tic.update({
                        stage: "out",
                        doctor_id: doctor_id,
                        clinic_time: new Date()
                    })
                    doc.update({
                        current_patient: null
                    })
                    const backup = await TokenBackup.findOne({
                        where: {ticket_no: tic.ticket_no}
                    })
                    if(backup){
                        backup.update({
                            stage: "out",
                            doctor_id: doctor_id,
                        clinic_time: new Date()
                        })
                        res.json(backup)
                    }
                }else if(data.data && data.data.status === "Billed"){
                    tic.update({
                        stage: "out",
                        doctor_id: doctor_id,
                        clinic_time: new Date()
                    })
                    doc.update({
                        current_patient: null
                    })
                    const backup = await TokenBackup.findOne({
                        where: {ticket_no: tic.ticket_no}
                    })
                    if(backup){
                        backup.update({
                            stage: "out",
                            doctor_id: doctor_id,
                        clinic_time: new Date()
                        })
                        res.json(backup)
                    }
                }else{
                    tic.update({
                        stage: "accounts",
                        doctor_id: doctor_id,
                        clinic_time: new Date()
                    })
                    doc.update({
                        current_patient: null
                    })
                    const backup = await TokenBackup.findOne({
                        where: {ticket_no: tic.ticket_no}
                    })
                    if(backup){
                        backup.update({
                            stage: "accounts",
                            doctor_id: doctor_id,
                        clinic_time: new Date()
                        })
                        res.json(backup)
                    }
                }
            }).catch((error)=> {
            return res.status(400).json({ error: error });
        })
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
// Finish Patient
router.get('/verify_vipimo', async (req, res) => {
    const {mr_no, clinic_code} = req.body
    const now = new Date();

    const formattedDate = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
    try {
        if(mr_no.trim() == ""){
            return res.status(400).json({ error: 'mr no not provided' }); 
        }else if(clinic_code.trim() == ""){
            return res.status(400).json({ error: 'clinic code not provided' }); 
        }else{
            axios.get(`http://192.168.235.65/dev/jeeva_api/swagger/billing/${mr_no}/${formattedDate}/${clinic_code}`).then((data)=> {
                console.log('the data is ',data.data)
                return res.json(data.data)
            }).catch((error)=> {
            return res.status(400).json({ error: error });
        })
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});

module.exports = router;
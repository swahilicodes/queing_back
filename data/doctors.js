const express = require('express');
const { Doctor, User, Counter, Patient } = require('../models/index')
const router = express.Router();
const { Op } = require('sequelize')
const bcrypt = require("bcryptjs")
const app = express();
const socketIo = require('socket.io');
const http = require("http")
const server = http.createServer(app);
const io = socketIo(server);


router.post('/create_doctor', async (req, res) => {
    const { name, phone, service,room, clinic } = req.body;
    let newPass = await bcrypt.hash(phone,6)
    let role
    console.log('clinic is ',clinic)
    try {
        if(name.trim() === ''){
            return res.status(400).json({ error: 'name is required' });
        }else if(phone.trim() === ''){
            return res.status(400).json({ error: 'phone is required' });
        }else if(service.trim() === ''){
            return res.status(400).json({ error: 'service is required' });
        }else if(service.trim() ==="clinic" && clinic.trim()===""){
            return res.status(400).json({ error: 'clinic is required' });
        }else if(room.trim() === ''){
            return res.status(400).json({ error: 'room is required' });
        }else{
            const att = await Doctor.findOne({
                where: {phone}
            })
            const user = await User.findOne({
                where: {phone}
            })
            if(att){
                return res.status(400).json({ error: 'Doctor exists' });  
            }else if(user){
                return res.status(400).json({ error: 'user exists' }); 
            }else{
                const newAtt = await Doctor.create({
                    name,
                    phone,
                    service,
                    room,
                    clinic: service !== "clinic"?null:clinic,
                    role: service==="meds"?"medical_recorder":service==="accounts"?"accountant":service==="payment"?"cashier":"doctor",
                    password: newPass
                })
                await User.create({
                    name,
                    phone,
                    clinic: service !== "clinic"?null:clinic,
                    role:service==="meds"?"medical_recorder":service==="accounts"?"accountant":service==="payment"?"cashier":"doctor",
                    password:newPass,
                    service,
                    counter: room
                })
                res.json(newAtt)
            }
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
router.get('/get_doctors', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    try {
        const curr = await Doctor.findAndCountAll({
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
router.get('/get_all_doctors', async (req, res) => {
    try {
        const curr = await Doctor.findAll()
        res.json(curr);
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
router.put('/delete_doctor/:id', async (req, res) => {
    const id = req.params.id
    try {
        const service = await Doctor.findByPk(id);
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
router.put('/edit_counter/:id', async (req, res) => {
    const id = req.params.id
    const newData = req.body
    console.log(newData)
    try {
        if(newData.name.trim()===""){
            return res.status(404).json({ error: 'name is empty' }); 
        }else{
            const service = await Counter.findByPk(id);
            if (!service) {
            return res.status(404).json({ error: 'service not found' });
            }
            await service.update(newData);
            //res.status(204).end();
            res.json(service);   
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
router.put('/edit_doctor/:id', async (req, res) => {
    const id = req.params.id
    const newData = req.body
    try {
        if(!newData.fields.name.trim()===""){
            return res.status(404).json({ error: 'name is empty' }); 
        }else{
            const service = await Doctor.findByPk(id);
            if (!service) {
            return res.status(404).json({ error: 'service not found' });
            }else{
                const user = await User.findOne({
                    where: {phone: service.phone}
                });
                const counter = await Counter.findOne({
                    where: {name: newData.fields.service}
                });
                if(!user || ! counter){
                    return res.status(404).json({ error: 'user not found' });  
                }else{
                    const pass = await bcrypt.hash(newData.fields.phone,6)
                    if(newData.fields.phone === user.phone){
                        await service.update({
                            name: newData.fields.name,
                            phone: newData.fields.phone,
                            service: newData.fields.service,
                            room: newData.fields.service !=="clinic"?counter.namba:newData.fields.counter,
                            role:newData.fields.service==="meds"?"medical_recorder":newData.fields.service==="accounts"?"accountant":newData.fields.service==="payment"?"cashier":"doctor",
                        });
                        await user.update({
                            name: newData.fields.name,
                            phone: newData.fields.phone,
                            service: newData.fields.service,
                            counter: newData.fields.service !=="clinic"?counter.namba:newData.fields.counter,
                            role:newData.fields.service==="meds"?"medical_recorder":newData.fields.service==="accounts"?"accountant":newData.fields.service==="payment"?"cashier":"doctor",
                        });
                        res.json(service);
                    }else{
                        await service.update({
                            name: newData.fields.name,
                            phone: newData.fields.phone,
                            service: newData.fields.service,
                            room: newData.fields.service !=="clinic"?counter.namba:newData.fields.counter,
                            password: pass,
                            role:newData.fields.service==="meds"?"medical_recorder":newData.fields.service==="accounts"?"accountant":newData.fields.service==="payment"?"cashier":"doctor",
                        });
                        await user.update({
                            name: newData.fields.name,
                            phone: newData.fields.phone,
                            service: newData.fields.service,
                            counter: newData.fields.service !=="clinic"?counter.namba:newData.fields.counter,
                            password: pass,
                            role:newData.fields.service==="meds"?"medical_recorder":newData.fields.service==="accounts"?"accountant":newData.fields.service==="payment"?"cashier":"doctor",
                        });
                        //res.status(204).end();
                        res.json(service);
                    }
                }
            }   
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});

// get doctor patient
router.get('/doctor_patient', async (req, res) => {
    const {phone} = req.query
    try{
        if(!phone){
            return res.status(400).json({ error: 'phone is required' });
        }else{
            const doctor = await Doctor.findOne({
                where: {phone}
            })
            if(doctor){
                const user = await Patient.findOne({
                    where: {mr_no: doctor.dataValues.current_patient,status: "waiting",stage:"clinic"}
                })
                res.json(user)
            }
        }
    }catch(err) {
        res.status(500).json({ error: err }); 
    }
})
// get doctor patient
router.get('/finish_doctor_patient', async (req, res) => {
    const {phone} = req.query
    console.log('phone is ',phone)
    try{
        if(!phone){
            return res.status(400).json({ error: 'phone is required' });
        }else{
            const doctor = await Doctor.findOne({
                where: {phone}
            })
            if(doctor){
                const pat = await Patient.findOne({
                    where: {mr_no: doctor.dataValues.current_patient,stage:"clinic",status:"waiting"}
                })
                if(pat){
                    doctor.update({
                        current_patient: null
                    })
                    pat.update({
                        status:"done"
                    })
                    res.json(doctor)
                }
            }
        }
    }catch(err) {
        res.status(500).json({ error: err }); 
    }
})

module.exports = router;
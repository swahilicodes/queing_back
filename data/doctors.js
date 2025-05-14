const express = require('express');
const { Doctor, User, Counter, Patient } = require('../models/index')
const router = express.Router();
const { Op } = require('sequelize')
const bcrypt = require("bcryptjs")


router.post('/create_doctor', async (req, res) => {
    const { name, phone, service,room, clinic, clinic_code } = req.body;
    let newPass = await bcrypt.hash(phone,6)
    let role
    try {
        if(name.trim() === ''){
            return res.status(400).json({ error: 'name is required' });
        }else if(phone.trim() === ''){
            return res.status(400).json({ error: 'phone is required' });
        }else if(service.trim() === ''){
            return res.status(400).json({ error: 'service is required' });
        }else if(service.trim() ==="nurse_station" && clinic.trim()===""){
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
                return res.status(400).json({ error: 'Attendant exists' });  
            }else if(user){
                return res.status(400).json({ error: 'user exists' }); 
            }else{
                const newAtt = await Doctor.create({
                    name,
                    phone,
                    service,
                    counter: room,
                    clinic_code,
                    clinic: service !== "nurse_station"?null:clinic,
                    role: service==="meds"?"medical_recorder":service==="accounts"?"accountant":service==="payment"?"cashier":"nurse",
                    password: newPass
                })
                await User.create({
                    name,
                    phone,
                    clinic_code,
                    clinic: service !== "nurse_station"?null:clinic,
                    role:service==="meds"?"medical_recorder":service==="accounts"?"accountant":service==="payment"?"cashier":"nurse",
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

// Edit doctor
router.put('/edit_doctor/:id', async (req, res) => {
  const id = req.params.id;
  const newData = req.body;

  try {
    const doctor = await Doctor.findOne({ where: { id } });
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    const user = await User.findOne({ where: { phone: doctor.phone } });
    if (!user) {
      return res.status(404).json({ error: "User linked to doctor not found" });
    }

    const hashed = await bcrypt.hash(user.phone, 6);

    // Update user
    await user.update({
      name: newData.fields.name || user.name,
      service: newData.fields.service || user.service,
      counter: newData.fields.counter || user.counter,
      role: newData.fields.role || user.role,
      password: newData.fields.ispass === "true" ? hashed : user.password
    });

    // Update doctor
    await doctor.update({
      name: newData.fields.name || doctor.name,
      service: newData.fields.service || doctor.service,
      counter: newData.fields.counter || doctor.counter,
      clinic: newData.fields.clinic || doctor.clinic,
      clinic_code: newData.fields.clinic_code || doctor.clinic_code,
      role: newData.fields.role || doctor.role,
      password: newData.fields.ispass === "true" ? hashed : doctor.password
    });

    // Reload doctor to get latest changes
    await doctor.reload();

    res.json({ message: "Doctor and user updated successfully", doctor });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: err.message });
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
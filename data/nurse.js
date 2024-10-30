const express = require('express');
const { Nurse, User } = require('../models/index')
const router = express.Router();
const { Op } = require('sequelize')
const bcrypt = require("bcryptjs")


router.post('/create_nurse', async (req, res) => {
    const { name, phone, service,room } = req.body;
    let newPass = await bcrypt.hash(phone,6)
    try {
        if(name.trim() === ''){
            return res.status(400).json({ error: 'name is required' });
        }if(phone.trim() === ''){
            return res.status(400).json({ error: 'phone is required' });
        }if(service.trim() === ''){
            return res.status(400).json({ error: 'service is required' });
        }if(room.trim() === ''){
            return res.status(400).json({ error: 'room is required' });
        }else{
            const att = await Nurse.findOne({
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
                const newAtt = await Nurse.create({
                    name,
                    phone,
                    service,
                    room,
                    role:"nurse",
                    password: newPass
                })
                await User.create({
                    name,
                    phone,
                    role:"nurse",
                    password:newPass,
                    service,
                    room
                })
                res.json(newAtt)
            }
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
router.get('/get_nurses', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    try {
        const curr = await Nurse.findAndCountAll({
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
router.put('/delete_nurse/:id', async (req, res) => {
    const id = req.params.id
    try {
        const service = await Nurse.findByPk(id);
        if (!service) {
        return res.status(404).json({ error: 'nurse not found' });
        }
        await service.destroy();
        res.status(204).end();
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

module.exports = router;
const express = require('express');
const { Room } = require('../models/index')
const router = express.Router();
const { Op } = require('sequelize')


router.post('/create_room', async (req, res) => {
    const { namba, clinic, clinic_code} = req.body;
    try {
        if(namba.trim() === ''){
            return res.status(400).json({ error: 'room number is required' });
        }else if(clinic.trim() === ''){
            return res.status(400).json({ error: 'clinic is required' });
        }else if(clinic_code === "nurse_station" && clinic.trim()===''){
            return res.status(400).json({ error: 'clinic code is required' });
        }else{
            const services = await Room.findAll()
            if(services.length > 0){
                const service01 = await Room.findOne({
                    where: {clinic_code,namba}
                })
                if(service01){
                    return res.status(400).json({ error: 'counter exists' }); 
                }else{
                    const newService = await Room.create(
                        {
                            namba,
                            clinic,
                            clinic_code
                        }
                    )
                    res.json(newService);
                }  
            }else{
                const newService = await Room.create(
                    {
                        namba,
                        clinic,
                        clinic_code
                    }
                )
                res.json(newService);
            }
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
router.get('/get_rooms', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const clinic_code = req.query.clinic_code
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    try {
        const curr = await Room.findAndCountAll({
            where: {clinic_code: clinic_code},
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
router.get('/get_all_counters', async (req, res) => {
    try {
        const curr = await Counter.findAll()
        res.json(curr);
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
router.put('/delete_counter/:id', async (req, res) => {
    const id = req.params.id
    try {
        const service = await Counter.findByPk(id);
        if (!service) {
        return res.status(404).json({ error: 'service not found' });
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
        if(newData.service.trim()===""){
            return res.status(404).json({ error: 'service is empty' }); 
        }if(newData.namba.trim()===""){
            return res.status(404).json({ error: 'number is empty' }); 
        }else if(newData.service==="clinic" && newData.sub_service.trim()===""){
            return res.status(404).json({ error: 'clinic is empty' });
        } else{
            const service = await Counter.findByPk(id);
            if (!service) {
            return res.status(404).json({ error: 'service not found' });
            }
            await service.update({
                service: newData.service,
                namba: newData.namba,
                subservice: newData.sub_service !=="clinic"?null:newData.sub_service
            });
            //res.status(204).end();
            res.json(service);   
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});

module.exports = router;
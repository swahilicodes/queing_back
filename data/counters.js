const express = require('express');
const { Counter } = require('../models/index')
const router = express.Router();
const { Op } = require('sequelize')


router.post('/create_counter', async (req, res) => {
    const { name, namba } = req.body;
    try {
        if(name.trim() === ''){
            return res.status(400).json({ error: 'name is required' });
        }else if(namba.trim() === ''){
            return res.status(400).json({ error: 'number is required' });
        }else{
            const service = await Counter.findOne({
                where: {namba}
            })
            if(service){
                return res.status(400).json({ error: 'counter exists' });   
            }else{
                const newService = await Counter.create(req.body)
                res.json(newService);
            }
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
router.get('/get_counters', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    try {
        const curr = await Counter.findAndCountAll({
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
    console.log(newData)
    try {
        if(newData.name.trim()===""){
            return res.status(404).json({ error: 'name is empty' }); 
        }if(newData.namba.trim()===""){
            return res.status(404).json({ error: 'number is empty' }); 
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
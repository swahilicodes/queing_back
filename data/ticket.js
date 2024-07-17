const express = require('express');
const { Ticket } = require('../models/index')
const router = express.Router();
const { Op } = require('sequelize')


router.post('/create_ticket', async (req, res) => {
    const { phone,category} = req.body;
    let ticket_no
    try {
        if(category.trim() === ''){
            return res.status(400).json({ error: 'category is required' });
        }else if(phone.trim() === ''){
            return res.status(400).json({ error: 'phone is required' });
        }else{
            const lastTicket = await Ticket.findOne({
                order: [['createdAt', 'DESC']]
              });
            if(!lastTicket){
                ticket_no= "001"
            }else{
                const lastTicketNumber = lastTicket.ticket_no;
                const numericPart = parseInt(lastTicketNumber, 10);
                ticket_no = (numericPart + 1).toString().padStart(3, '0');
            }
            const ticket = await Ticket.create({
                category,
                phone,
                ticket_no,
                status: "waiting"
            })
            res.json(ticket);
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});

// get queues
router.get('/getTickets', async (req, res, next) => {
    try {
        const queue = await Ticket.findAll({
            where: {status: "waiting"}
        })
        res.json(queue);
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// get queues
router.get('/getCatTickets', async (req, res, next) => {
    const category = req.query.category
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    try {
        const curr = await Ticket.findAndCountAll({
            where: {category},
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
        res.status(500).json({ error: err });
    }
});
// get queues
router.get('/getWeekTickets', async (req, res, next) => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    try {
        const queue = await Ticket.findAll({
            where: {
                createdAt: {
                  [Op.between]: [sevenDaysAgo, today]
                }
              }
        })
        res.json(queue);
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// get queues
router.get('/getMonthTickets', async (req, res, next) => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 30);
    try {
        const queue = await Ticket.findAll({
            where: {
                createdAt: {
                  [Op.between]: [sevenDaysAgo, today]
                }
              }
        })
        res.json(queue);
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// get queues
router.get('/getTodayTickets', async (req, res, next) => {
const today = new Date();
today.setHours(0, 0, 0, 0);
const endOfDay = new Date(today);
endOfDay.setHours(23, 59, 59, 999);
    try {
        const queue = await Ticket.findAll({
            where: {
                createdAt: {
                  [Op.between]: [today, endOfDay]
                }
              }
        })
        res.json(queue);
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
module.exports = router;
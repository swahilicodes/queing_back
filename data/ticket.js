const express = require('express');
const { Ticket, Attendant } = require('../models/index')
const router = express.Router();
const { Op } = require('sequelize')
const app = express();
const socketIo = require('socket.io');
const http = require("http");
const { off } = require('process');
const server = http.createServer(app);
const io = socketIo(server);


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
            where: {status: "waiting"},
            limit: 10
        })
        res.json(queue);
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// get all queues
router.get('/getAllTickets', async (req, res, next) => {
    try {
        const queue = await Ticket.findAll({
            where: {status: "waiting"},
        })
        res.json(queue);
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// get queues
router.get('/getCatTickets', async (req, res, next) => {
    const category = req.query.category
    const status = req.query.status
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    console.log("status is ",status,category)
    try {
        if(status.trim()===""){
            const curr = await Ticket.findAndCountAll({
                // where: {category},
                where: {category,status:"waiting"},
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
            const curr = await Ticket.findAndCountAll({
                // where: {category},
                where: {category,status},
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
// get waiting
router.get('/getWaitingTickets', async (req, res, next) => {
    const category = req.query.category
    const status = req.query.status
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    try {
        const curr = await Ticket.findAndCountAll({
            // where: {category},
            where: {category,status:"waiting"},
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
// get queues counter
router.get('/getTicketCounter', async (req, res, next) => {
    const service = req.query.category
    try {
        const curr = await Attendant.findOne({
            where: {service: service},
        })
        res.json(curr);
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
// edit ticket
router.put('/edit_ticket/:id', async (req, res, next) => {
const id = req.params.id
const status = req.body
    try {
        const ticket = await Ticket.findOne({
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
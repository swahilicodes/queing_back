const express = require('express');
const { Ticket } = require('../models/index')
const router = express.Router();


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
                ticket_no
            })
            res.json(ticket);
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});

// get queues
router.get('/getAll', async (req, res, next) => {
    try {
        const queue = await Queue.findAll()
        res.json(queue);
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
module.exports = router;
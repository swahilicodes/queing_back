const express = require('express')
const router = express.Router()
const axios = require('axios')
const {Op} = require('sequelize')
const { Ticket, Attendant, Counter, Dokta, TokenBackup, InTime,PriorCode } = require('../models/index')

router.get("/today_ticks", async (req, res) => {
    // Set time boundaries in local time (UTC+3)
    const now = new Date();
    const offsetMs = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

    const startOfDay = new Date(now.getTime() + offsetMs);
    startOfDay.setUTCHours(0, 0, 0, 0); // set time in UTC, shifted

    const endOfDay = new Date(now.getTime() + offsetMs);
    endOfDay.setUTCHours(23, 59, 59, 999);

    console.log("startOfDay:", startOfDay, "endOfDay:", endOfDay);

    try {
        const count = await Ticket.findAll({
            where: {
                createdAt: {
                    [Op.between]: [startOfDay, endOfDay]
                }
            }
        });
        res.json(count.length);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

router.post('/create_ticket', async (req, res) => {
    const { phone, category, hasMedical, isNHIF } = req.body;
    let ticket_no
    let back_no
    try {
        if (hasMedical) {
                    //console.log(data.data.data)
                    const lastTicket = await Ticket.findOne({
                        order: [['createdAt', 'DESC']]
                    });
                    if (!lastTicket) {
                        ticket_no = "001"
                    } else {
                        const lastTicketNumber = lastTicket.ticket_no;
                        const numericPart = parseInt(lastTicketNumber, 10);
                        ticket_no = (numericPart + 1).toString().padStart(3, '0');
                    }
                    const duplicate = await Ticket.findOne({
                        where: { ticket_no: ticket_no }
                    })
                    if (duplicate) {
                        const numericPart = parseInt(duplicate.ticket_no, 10);
                        ticket_no = (numericPart + 1).toString().padStart(3, '0');
                        const ticket = await Ticket.create({
                            phone: phone,
                            ticket_no,
                            category: category,
                            stage:
                                category === "insurance"
                                    ? isNHIF
                                        ? "accounts"
                                        : "meds"
                                    : "accounts",
                            category: category,
                            status:
                                category === "insurance"
                                    ? isNHIF
                                        ? "insurance"
                                        : "waiting"
                                    : "waiting",
                        })
                        const lastBackup = await TokenBackup.findOne({
                            order: [['createdAt', 'DESC']]
                        });
                        if (lastBackup) {
                            const lastTicketNumber = lastBackup.ticket_no;
                            const numericPart = parseInt(lastTicketNumber, 10);
                            back_no = (numericPart + 1).toString().padStart(3, '0');
                            const backup = await TokenBackup.create({
                                phone: phone,
                                ticket_no,
                                category: category,
                                stage:
                                    category === "insurance"
                                        ? isNHIF
                                            ? "accounts"
                                            : "meds"
                                        : "accounts",
                                category: category,
                                status:
                                    category === "insurance"
                                        ? isNHIF
                                            ? "insurance"
                                            : "waiting"
                                        : "waiting",
                            })
                            res.json(ticket);
                        } else {
                            const backup = await TokenBackup.create({
                                phone: phone,
                                ticket_no,
                                category: category,
                                stage:
                                    category === "insurance"
                                        ? isNHIF
                                            ? "accounts"
                                            : "meds"
                                        : "accounts",
                                category: category,
                                status:
                                    category === "insurance"
                                        ? isNHIF
                                            ? "insurance"
                                            : "waiting"
                                        : "waiting",
                            })
                            res.json(ticket);
                        }
                    } else {
                        const ticket = await Ticket.create({
                            phone: phone,
                            ticket_no,
                            category: category,
                            stage:
                                category === "insurance"
                                    ? isNHIF
                                        ? "accounts"
                                        : "meds"
                                    : "accounts",
                            category: category,
                            status:
                                category === "insurance"
                                    ? isNHIF
                                        ? "insurance"
                                        : "waiting"
                                    : "waiting",
                        })
                        const lastBackup = await TokenBackup.findOne({
                            order: [['createdAt', 'DESC']]
                        });
                        if (lastBackup) {
                            const lastTicketNumber = lastBackup.ticket_no;
                            const numericPart = parseInt(lastTicketNumber, 10);
                            back_no = (numericPart + 1).toString().padStart(3, '0');
                            const backup = await TokenBackup.create({
                                phone: phone,
                                ticket_no,
                                category: category,
                                stage:
                                    category === "insurance"
                                        ? isNHIF
                                            ? "accounts"
                                            : "meds"
                                        : "accounts",
                                category: category,
                                status:
                                    category === "insurance"
                                        ? isNHIF
                                            ? "insurance"
                                            : "waiting"
                                        : "waiting",
                            })
                            res.json(ticket);
                        } else {
                            const backup = await TokenBackup.create({
                                phone: phone,
                                ticket_no,
                                category: category,
                                stage:
                                    category === "insurance"
                                        ? isNHIF
                                            ? "accounts"
                                            : "meds"
                                        : "accounts",
                                category: category,
                                status:
                                    category === "insurance"
                                        ? isNHIF
                                            ? "insurance"
                                            : "waiting"
                                        : "waiting",
                            })
                            res.json(ticket);
                        }
                    }
        } else {
            if (phone.trim() === '') {
                return res.status(400).json({ error: 'phone is required' });
            } else {
                const lastTicket = await Ticket.findOne({
                    order: [['createdAt', 'DESC']]
                });
                if (!lastTicket) {
                    ticket_no = "001"
                } else {
                    const lastTicketNumber = lastTicket.ticket_no;
                    const numericPart = parseInt(lastTicketNumber, 10);
                    ticket_no = (numericPart + 1).toString().padStart(3, '0');
                }
                const duplicate = await Ticket.findOne({
                    where: { ticket_no: ticket_no }
                })
                if (duplicate) {
                    const numericPart = parseInt(duplicate.ticket_no, 10);
                    ticket_no = (numericPart + 1).toString().padStart(3, '0');
                    const ticket = await Ticket.create({
                        phone,
                        ticket_no,
                        category: category,
                        stage:
                            category === "insurance"
                                ? isNHIF
                                    ? "accounts"
                                    : "meds"
                                : "meds",
                        category: category,
                        status:
                            category === "insurance"
                                ? isNHIF
                                    ? "insurance"
                                    : "waiting"
                                : "waiting",
                    })
                    const lastBackup = await TokenBackup.findOne({
                        order: [['createdAt', 'DESC']]
                    });
                    if (lastBackup) {
                        const lastTicketNumber = lastBackup.ticket_no;
                        const numericPart = parseInt(lastTicketNumber, 10);
                        back_no = (numericPart + 1).toString().padStart(3, '0');
                        const backup = await TokenBackup.create({
                            phone: phone,
                            ticket_no,
                            category: category,
                            stage:
                                category === "insurance"
                                    ? isNHIF
                                        ? "accounts"
                                        : "meds"
                                    : "meds",
                            category: category,
                            status:
                                category === "insurance"
                                    ? isNHIF
                                        ? "insurance"
                                        : "waiting"
                                    : "waiting",
                        })
                        res.json(ticket);
                    } else {
                        const backup = await TokenBackup.create({
                            phone: phone,
                            ticket_no,
                            category: category,
                            stage:
                                category === "insurance"
                                    ? isNHIF
                                        ? "accounts"
                                        : "meds"
                                    : "meds",
                            category: category,
                            status:
                                category === "insurance"
                                    ? isNHIF
                                        ? "insurance"
                                        : "waiting"
                                    : "waiting",
                        })
                        res.json(ticket);
                    }
                } else {
                    const ticket = await Ticket.create({
                        phone,
                        ticket_no,
                        category: category,
                        stage:
                            category === "insurance"
                                ? isNHIF
                                    ? "accounts"
                                    : "meds"
                                : "meds",
                        category: category,
                        status:
                            category === "insurance"
                                ? isNHIF
                                    ? "insurance"
                                    : "waiting"
                                : "waiting",
                    })
                    const lastBackup = await TokenBackup.findOne({
                        order: [['createdAt', 'DESC']]
                    });
                    if (lastBackup) {
                        const lastTicketNumber = lastBackup.ticket_no;
                        const numericPart = parseInt(lastTicketNumber, 10);
                        back_no = (numericPart + 1).toString().padStart(3, '0');
                        const backup = await TokenBackup.create({
                            phone: phone,
                            ticket_no,
                            category: category,
                            stage:
                                category === "insurance"
                                    ? isNHIF
                                        ? "accounts"
                                        : "meds"
                                    : "meds",
                            category: category,
                            status:
                                category === "insurance"
                                    ? isNHIF
                                        ? "insurance"
                                        : "waiting"
                                    : "waiting",
                        })
                        res.json(ticket);
                    } else {
                        const backup = await TokenBackup.create({
                            phone: phone,
                            ticket_no,
                            category: category,
                            stage:
                                category === "insurance"
                                    ? isNHIF
                                        ? "accounts"
                                        : "meds"
                                    : "meds",
                            category: category,
                            status:
                                category === "insurance"
                                    ? isNHIF
                                        ? "insurance"
                                        : "waiting"
                                    : "waiting",
                        })
                        res.json(ticket);
                    }
                }
            }
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ error: err });
    }
});

router.post("/to_meds", async (req,res)=> {
    const {id} = req.body
    try{
        const ticket = await Ticket.findOne({
            where: {id}
        })
        if(ticket){
            ticket.update({
                stage: "meds"
            })
            res.json(ticket)
        }else{
            return res.status(400).json({error: "Ticket Not Found"})
        }
    }catch (err) {
        res.status(500).json({ error: err });
    }
})
router.post("/priotize", async (req,res)=> {
    const {ticket_no,code} = req.body
    try{
        const ticket = await Ticket.findOne({
            where: {ticket_no: ticket_no}
        })
        if(ticket){
            const coder = await PriorCode.findOne({
                where: {code}
            })
            if(coder){
                ticket.update({
                disability: "Fast Track",
                disabled: true
            })
            res.json(ticket)
            }else{
                return res.status(400).json({error: "Priority code is not correct"})
            }
        }else{
            return res.status(400).json({error: "Ticket Not Found"})
        }
    }catch (err) {
        res.status(500).json({ error: err });
    }
})

module.exports = router
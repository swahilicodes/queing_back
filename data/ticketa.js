const express = require('express')
const router = express.Router()
const axios = require('axios')
const { Ticket, Attendant, Counter, Dokta, TokenBackup, InTime } = require('../models/index')

router.post('/create_ticket', async (req, res) => {
    const { phone, category, hasMedical, isNHIF } = req.body;
    let ticket_no
    let back_no
    try {
        if (hasMedical) {
            axios.get(`http://192.168.235.65/dev/jeeva_api/swagger/patients/${phone}`).then(async (data) => {
                if (data.data.status === 201) {
                    return res.status(400).json({ error: 'Mr Number does not exist' });
                } else {
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
                            mr_no: data.data.data.mrNumber,
                            ticket_no,
                            age: data.data.data.age,
                            gender: data.data.data.gender,
                            name: data.data.data.fullName,
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
                                mr_no: data.data.data.mrNumber,
                                ticket_no,
                                age: data.data.data.age,
                                gender: data.data.data.gender,
                                name: data.data.data.fullName,
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
                                mr_no: data.data.data.mrNumber,
                                ticket_no,
                                age: data.data.data.age,
                                gender: data.data.data.gender,
                                name: data.data.data.fullName,
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
                            mr_no: data.data.data.mrNumber,
                            ticket_no,
                            age: data.data.data.age,
                            gender: data.data.data.gender,
                            name: data.data.data.fullName,
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
                                mr_no: data.data.data.mrNumber,
                                ticket_no,
                                age: data.data.data.age,
                                gender: data.data.data.gender,
                                name: data.data.data.fullName,
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
                                mr_no: data.data.data.mrNumber,
                                ticket_no,
                                age: data.data.data.age,
                                gender: data.data.data.gender,
                                name: data.data.data.fullName,
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
                }
            }).catch((error) => {
                return res.status(400).json({ error: error });
            })
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

module.exports = router
const express = require('express');
const { Ticket, Attendant, Counter, Dokta } = require('../models/index')
const router = express.Router();
const { Op } = require('sequelize')
const axios = require('axios')


router.post('/create_ticket', async (req, res) => {
    const { phone,disability} = req.body;
    let ticket_no
    try {
        if(phone.trim() === ''){
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
                disability,
                disabled: disability !==""? true: false,
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
router.get('/get_display_tokens', async (req, res, next) => {
    const {stage, clinic_code} = req.query
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    if(stage.trim() === ""){
        return res.status(400).json({ error: 'stage is required is required' }); 
    }else if(stage==="nurse_station" && !clinic_code){
        return res.status(400).json({ error: 'clinic code is required is required' });
    }else{
        if(clinic_code){
            try {
                const disabledToks = await Ticket.findAll({
                    where: {stage:stage,status:"waiting",disabled: true,createdAt: {[Op.gte]: twelveHoursAgo},clinic_code: clinic_code},
                    limit: 3,
                    order: [
                        // ['disabled', 'DESC'],
                        ['createdAt', 'ASC'],
                      ],
                })
                const normalToks = await Ticket.findAll({
                    where: {stage:stage,status:"waiting",disabled: false,createdAt: {[Op.gte]: twelveHoursAgo},clinic_code: clinic_code},
                    limit: 5,
                    order: [['createdAt', 'ASC']],
                })
                const disabledIds = disabledToks.map(ticket => ticket.id);
                const normalIds = normalToks.map(ticket => ticket.id);
                const otherToks = await Ticket.findAll({
                    where: {
                        stage: stage,
                        status: "waiting",
                        createdAt: {[Op.gte]: twelveHoursAgo},
                        id: {
                            [Op.notIn]: [...disabledIds, ...normalIds],
                        },
                    },
                    limit: 9 - (normalToks.length+disabledToks.length),
                    order: [['createdAt', 'ASC']],
                });
                const curr = [...disabledToks,...normalToks, ...otherToks]
                    const counters = await Counter.findAll();
                    const result = curr.map(ticket => {
                        const counter = counters.find(item => item.service === ticket.stage)
                        return {
                            ticket: ticket,
                            counter: counter
                        };
                    });
                    res.json(result);
            } catch (err) {
                res.status(500).json({ error: err });
            }
        }else{
            try {
                const disabledToks = await Ticket.findAll({
                    where: {stage:stage,status:"waiting",disabled: true,createdAt: {[Op.gte]: twelveHoursAgo}},
                    limit: 3,
                    order: [
                        // ['disabled', 'DESC'],
                        ['createdAt', 'ASC'],
                      ],
                })
                const normalToks = await Ticket.findAll({
                    where: {stage:stage,status:"waiting",disabled: false,createdAt: {[Op.gte]: twelveHoursAgo}},
                    limit: 5,
                    order: [['createdAt', 'ASC']],
                })
                const disabledIds = disabledToks.map(ticket => ticket.id);
                const normalIds = normalToks.map(ticket => ticket.id);
                const otherToks = await Ticket.findAll({
                    where: {
                        stage: stage,
                        status: "waiting",
                        createdAt: {[Op.gte]: twelveHoursAgo},
                        id: {
                            [Op.notIn]: [...disabledIds, ...normalIds],
                        },
                    },
                    limit: 9 - (normalToks.length+disabledToks.length),
                    order: [['createdAt', 'ASC']],
                });
                const curr = [...disabledToks,...normalToks, ...otherToks]
                    const counters = await Counter.findAll();
                    const result = curr.map(ticket => {
                        const counter = counters.find(item => item.service === ticket.stage)
                        return {
                            ticket: ticket,
                            counter: counter
                        };
                    });
                    res.json(result);
            } catch (err) {
                res.status(500).json({ error: err });
            }
        }
    }
});
// get all queues
router.get('/next_stage', async (req, res, next) => {
    const { mr_number } = req.query
    if(mr_number.trim() === ""){
        return res.status(400).json({ error: 'Mr Number is required' });
    }else{
        axios.get(`http://192.168.235.65/dev/jeeva_api/swagger/patient/${mr_number}`).then((data)=> {
            if (Array.isArray(data.data.data)) {
                res.json(data.data.data)
              } else {
                return res.status(400).json({ error: data.data.data });
              }
        }).catch((error)=> {
            return res.status(400).json({ error: error });
        })
    }
});
// get all queues
router.post('/clinic_go', async (req, res, next) => {
    const { mr_number, stage, cashier_id } = req.body
    if(mr_number.trim() === ""){
        return res.status(400).json({ error: 'Mr Number is required' });
    }else{
        axios.get(`http://192.168.235.65/dev/jeeva_api/swagger/consultation/${mr_number}`).then(async (data)=> {
            if(data.data.status === 201){
                return res.status(400).json({ error: data.data.data.consStatus });
            }else{
                const ticket = await Ticket.findOne({
                    where: {mr_no: mr_number}
                })
                if(ticket){
                  const data002 =  await ticket.update({
                    clinic_code: data.data.data.clinicCode,
                    stage: stage,
                    account_time: new Date(),
                    cashier_id: cashier_id
                    })
                    res.json(data002)
                }else{
                    return res.status(400).json({ error: "patient not found" });
                }
                // res.json(data.data.data)
            }
        }).catch((error)=> {
            return res.status(400).json({ error: error });
        })
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
// get waiting
router.get('/getMedsTickets', async (req, res, next) => {
    const status = req.query.status
    const phone = req.query.phone
    const stage = req.query.stage
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    if(phone.trim() !== ''){ 
        try {
            const disabledToks = await Ticket.findAndCountAll({
                where: {stage:stage,status:status,disabled: true,phone: {[Op.like]:`%${phone}%`},createdAt: {[Op.gte]: twelveHoursAgo}},
                offset: offset,
                limit: 3,
                order: [
                    // ['disabled', 'DESC'],
                    ['createdAt', 'ASC'],
                  ],
            })
            const normalToks = await Ticket.findAndCountAll({
                where: {stage:stage,status:status,disabled: false,phone: {[Op.like]:`%${phone}%`},createdAt: {[Op.gte]: twelveHoursAgo}},
                offset: offset,
                limit: 5,
                order: [['createdAt', 'ASC']],
            })
            const disabledIds = disabledToks.rows.map(ticket => ticket.id);
            const normalIds = normalToks.rows.map(ticket => ticket.id);
            const otherToks = await Ticket.findAndCountAll({
                where: {
                    stage: stage,
                    status: status,
                    phone: {[Op.like]:`%${phone}%`},
                    createdAt: {[Op.gte]: twelveHoursAgo},
                    id: {
                        [Op.notIn]: [...disabledIds, ...normalIds], // Exclude the ids from the first two queries
                    },
                },
                offset: offset,
                limit: 10 - (normalToks.rows.length+disabledToks.rows.length),
                order: [['createdAt', 'ASC']],
            });
            const curr = [...disabledToks.rows,...normalToks.rows, ...otherToks.rows]
            const counters = await Counter.findAll()
            const result = curr.map(cu => {
                const counter = counters.find(item => item.service === cu.stage)
                return {
                    token: cu,
                    counter: counter
                }
            })
            res.json({
                data: result,
                totalItems: curr.count,
                totalPages: Math.ceil(curr.count / pageSize),
            })
        } catch (err) {
            res.status(500).json({ error: err });
        } 
    }else{
        try {
            const disabledToks = await Ticket.findAndCountAll({
                where: {stage:stage,status:status,disabled: true,createdAt: {[Op.gte]: twelveHoursAgo}},
                offset: offset,
                limit: 3,
                order: [
                    // ['disabled', 'DESC'],
                    ['createdAt', 'ASC'],
                  ],
            })
            const normalToks = await Ticket.findAndCountAll({
                where: {stage:stage,status:status,disabled: false,createdAt: {[Op.gte]: twelveHoursAgo}},
                offset: offset,
                limit: 5,
                order: [['createdAt', 'ASC']],
            })
            const disabledIds = disabledToks.rows.map(ticket => ticket.id);
            const normalIds = normalToks.rows.map(ticket => ticket.id);
            const otherToks = await Ticket.findAndCountAll({
                where: {
                    stage: stage,
                    status: status,
                    createdAt: {[Op.gte]: twelveHoursAgo},
                    id: {
                        [Op.notIn]: [...disabledIds, ...normalIds], // Exclude the ids from the first two queries
                    },
                },
                offset: offset,
                limit: 10 - (normalToks.rows.length+disabledToks.rows.length),
                order: [['createdAt', 'ASC']],
            });
            const curr = [...disabledToks.rows,...normalToks.rows, ...otherToks.rows]
            const counters = await Counter.findAll()
            const result = curr.map(cu => {
                const counter = counters.find(item => item.service === cu.stage)
                return {
                    token: cu,
                    counter: counter
                }
            })
            res.json({
                data: result,
                totalItems: curr.count,
                totalPages: Math.ceil(curr.count / pageSize),
            })
        } catch (err) {
            res.status(500).json({ error: err });
        }
    }
});
// get waiting
router.get('/getClinicTickets', async (req, res, next) => {
    const status = req.query.status
    const mr_no = req.query.phone
    const stage = req.query.stage
    const clinic_code = req.query.clinic_code
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    try{
        if(mr_no.trim() !== ''){
            const tickets = await Ticket.findAll({
                where: {stage,clinic_code: clinic_code,status,mr_no: {[Op.like]:`%${mr_no}%`}}
            })
            const counters = await Counter.findAll()
            const result = tickets.map(cu => {
                const counter = counters.find(item => item.service === cu.stage)
                return {
                    token: cu,
                    counter: counter
                }
            })
            res.json({
                data: result,
                totalItems: tickets.count,
                totalPages: Math.ceil(tickets.count / pageSize),
            })
        }else{
            const tickets = await Ticket.findAll({
                where: {stage,clinic_code: clinic_code,status}
            })
            const counters = await Counter.findAll()
            const result = tickets.map(cu => {
                const counter = counters.find(item => item.service === cu.stage)
                return {
                    token: cu,
                    counter: counter
                }
            })
            res.json({
                data: result,
                totalItems: tickets.count,
                totalPages: Math.ceil(tickets.count / pageSize),
            })
        }
    }catch(error){
        res.status(500).json({ error: error });
    }
    // if(phone.trim() !== ''){ 
    //     try {
    //         const disabledToks = await Ticket.findAndCountAll({
    //             where: {stage:stage,status:status,disabled: true,phone: {[Op.like]:`%${phone}%`},createdAt: {[Op.gte]: twelveHoursAgo,clinic_code: clinic_code}},
    //             offset: offset,
    //             limit: 3,
    //             order: [
    //                 // ['disabled', 'DESC'],
    //                 ['createdAt', 'ASC'],
    //               ],
    //         })
    //         const normalToks = await Ticket.findAndCountAll({
    //             where: {stage:stage,status:status,disabled: false,phone: {[Op.like]:`%${phone}%`},createdAt: {[Op.gte]: twelveHoursAgo,clinic_code: clinic_code}},
    //             offset: offset,
    //             limit: 5,
    //             order: [['createdAt', 'ASC']],
    //         })
    //         const disabledIds = disabledToks.rows.map(ticket => ticket.id);
    //         const normalIds = normalToks.rows.map(ticket => ticket.id);
    //         const otherToks = await Ticket.findAndCountAll({
    //             where: {
    //                 stage: stage,
    //                 status: status,
    //                 phone: {[Op.like]:`%${phone}%`},
    //                 createdAt: {[Op.gte]: twelveHoursAgo},
    //                 id: {
    //                     [Op.notIn]: [...disabledIds, ...normalIds], // Exclude the ids from the first two queries
    //                 },
    //             },
    //             offset: offset,
    //             limit: 10 - (normalToks.rows.length+disabledToks.rows.length),
    //             order: [['createdAt', 'ASC']],
    //         });
    //         const curr = [...disabledToks.rows,...normalToks.rows, ...otherToks.rows]
    //         const counters = await Counter.findAll()
    //         const result = curr.map(cu => {
    //             const counter = counters.find(item => item.service === cu.stage)
    //             return {
    //                 token: cu,
    //                 counter: counter
    //             }
    //         })
    //         res.json({
    //             data: result,
    //             totalItems: curr.count,
    //             totalPages: Math.ceil(curr.count / pageSize),
    //         })
    //     } catch (err) {
    //         res.status(500).json({ error: err });
    //     } 
    // }else{
    //     try {
    //         const disabledToks = await Ticket.findAndCountAll({
    //             where: {stage:stage,status:status,disabled: true,createdAt: {[Op.gte]: twelveHoursAgo,clinic_code: clinic_code}},
    //             offset: offset,
    //             limit: 3,
    //             order: [
    //                 // ['disabled', 'DESC'],
    //                 ['createdAt', 'ASC'],
    //               ],
    //         })
    //         const normalToks = await Ticket.findAndCountAll({
    //             where: {stage:stage,status:status,disabled: false,createdAt: {[Op.gte]: twelveHoursAgo,clinic_code: clinic_code}},
    //             offset: offset,
    //             limit: 5,
    //             order: [['createdAt', 'ASC']],
    //         })
    //         const disabledIds = disabledToks.rows.map(ticket => ticket.id);
    //         const normalIds = normalToks.rows.map(ticket => ticket.id);
    //         const otherToks = await Ticket.findAndCountAll({
    //             where: {
    //                 stage: stage,
    //                 status: status,
    //                 createdAt: {[Op.gte]: twelveHoursAgo},
    //                 id: {
    //                     [Op.notIn]: [...disabledIds, ...normalIds], // Exclude the ids from the first two queries
    //                 },
    //             },
    //             offset: offset,
    //             limit: 10 - (normalToks.rows.length+disabledToks.rows.length),
    //             order: [['createdAt', 'ASC']],
    //         });
    //         const curr = [...disabledToks.rows,...normalToks.rows, ...otherToks.rows]
    //         const counters = await Counter.findAll()
    //         const result = curr.map(cu => {
    //             const counter = counters.find(item => item.service === cu.stage)
    //             return {
    //                 token: cu,
    //                 counter: counter
    //             }
    //         })
    //         res.json({
    //             data: result,
    //             totalItems: curr.count,
    //             totalPages: Math.ceil(curr.count / pageSize),
    //         })
    //     } catch (err) {
    //         res.status(500).json({ error: err });
    //     }
    // }
});
// get queues counter
router.get('/getTicketTotal', async (req, res, next) => {
    const status = req.query.status
    const stage = req.query.stage
    try {
        const curr = await Ticket.findAll({
            where: {stage:stage,status:status},
            order: [['id', 'ASC']]
        })
        res.json(curr);
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
const {status} = req.body
    try {
        const ticket = await Ticket.findOne({
            where: { id }
        })
        if(!ticket){
            return res.status(400).json({ error: 'ticket not found' });
        }else {
            ticket.update({
                status: status
            })
            res.json(ticket)
        }
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// edit ticket
router.put('/penalt/:id', async (req, res, next) => {
const id = req.params.id
    try {
        const ticket = await Ticket.findOne({
            where: { id }
        })
        if(!ticket){
            return res.status(400).json({ error: 'ticket not found' });
        }else {
            ticket.update({
                disabled: false,
                disability: "",
                status: "waiting"
            })
            res.json(ticket)
        }
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// edit ticket
router.put('/finish_token/:id', async (req, res, next) => {
const id = req.params.id
const {stage, mr_number, penalized, sex, recorder_id} = req.body
    try {
        const ticket = await Ticket.findOne({
            where: { id }
        })
        if(!ticket){
            return res.status(400).json({ error: 'ticket not found' });
        }else if(mr_number.trim()===""){
            return res.status(400).json({ error: 'mr number is required' }); 
        }else if(stage.trim()===""){
            return res.status(400).json({ error: 'stage is required' }); 
        }else {
            const tiki = await Ticket.findOne({
                where: {mr_no: mr_number}
            })
            if(tiki){
                return res.status(400).json({ error: `${mr_number} exists in ${stage}` }); 
            }else{
                ticket.update({
                    status: "waiting",
                    stage: stage,
                    gender: sex,
                    mr_no: mr_number,
                    disabled: penalized?false: ticket.disabled,
                    disability: penalized?"": ticket.disability,
                    med_time: new Date(),
                    recorder_id: recorder_id
                })
                res.json(ticket)
            }
        }
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// penalize
router.put('/penalize/:id', async (req, res, next) => {
const id = req.params.id
    try {
        const ticket = await Ticket.findOne({
            where: { id }
        })
        if(!ticket){
            return res.status(400).json({ error: 'ticket not found' });
        }else {
            ticket.update({
                dateTime: new Date()
            })
            res.json(ticket)
        }
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// penalize
router.put('/bill/:id', async (req, res, next) => {
const id = req.params.id
const { bill } = req.body
    try {
        if(bill.trim()===""){
            return res.status(400).json({ error: 'billing type is empty' }); 
        }else{
            const ticket = await Ticket.findOne({
                where: { id }
            })
            if(!ticket){
                return res.status(400).json({ error: 'ticket not found' });
            }else {
                ticket.update({
                    stage: bill==="insurance"?"clinic":"payment"
                })
                res.json(ticket)
            }
        }
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// penalize
router.post('/send_to_clinic', async (req, res, next) => {
const { doctor_id, patient_id, nurse_id } = req.body
    try {
        if(doctor_id.trim()===""){
            return res.status(400).json({ error: 'doctor id is empty' }); 
        }else if(patient_id.trim()===""){
            return res.status(400).json({ error: 'patient id is empty' }); 
        }else{
            const ticket = await Ticket.findOne({
                where: { mr_no: patient_id }
            })
            const dokta = await Dokta.findOne({
                where: { phone: doctor_id }
            })
            if(!ticket){
                return res.status(400).json({ error: 'ticket not found' });
            }else if(!dokta) {
                return res.status(400).json({ error: 'doctor not found' });
            }else {
                ticket.update({
                    stage: "clinic",
                    station_time: new Date(),
                    nurse_id: nurse_id
                })
                dokta.update({
                    current_patient: patient_id
                })
                res.json(dokta)
            }
        }
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// get clinic patient
router.get('/clinic_patient', async (req, res, next) => {
const { clinic_code } = req.query
    try {
        if(clinic_code.trim()===""){
            return res.status(400).json({ error: 'clinic code is empty' }); 
        }else{
            const ticket = await Ticket.findOne({
                where: { clinic_code: clinic_code, stage: "clinic" }
            })
            res.json(ticket)
        }
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
module.exports = router;
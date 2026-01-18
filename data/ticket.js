const express = require('express');
const { Ticket, Attendant, Counter, Dokta, TokenBackup,InTime } = require('../models/index')
const router = express.Router();
const { Op } = require('sequelize')
const axios = require('axios')
const cron = require('node-cron');
const authMiddleware = require('../utils/authMiddleWare')
const {getIpByPurpose} = require('../functions/get_ip_by_purpose')

cron.schedule('*/15 * * * * *', async () => {
  try {
    const time = await InTime.findOne({
        order: [['createdAt', 'ASC']]
    })
    // Get current time minus 10 minutes
    const tenMinutesAgo = new Date(Date.now() - time.time * 60 * 1000);
    // Find all tickets with category 'insurance' and createdAt older than 10 minutes
    const tickets = await Ticket.findAll({
      where: {
        category: 'insurance',
        createdAt: {
          [Op.lt]: tenMinutesAgo
        },
        status: {
        [Op.ne]: 'waiting',
        [Op.ne]: 'pending'
        }
      }
    });

    // Loop through tickets and update their status
    for (const ticket of tickets) {
      ticket.status = 'waiting';
      await ticket.save();
    }

  } catch (error) {
    console.error('Error in cron job:', error);
  }
});

router.get("/get_all_the_tickets", async (req,res)=> {
    try{
        const all = await Ticket.findAll()
        res.json(all)
    } catch (err) {
        res.status(500).json({ error: err });
    }
})

router.post('/create_ticket', async (req, res) => {
    const { phone,category} = req.body;
    let ticket_no
    let back_no
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
            const duplicate = await Ticket.findOne({
                where: {ticket_no: ticket_no}
            })
            if(duplicate){
                const numericPart = parseInt(duplicate.ticket_no, 10);
                ticket_no = (numericPart + 1).toString().padStart(3, '0');
                const ticket = await Ticket.create({
                phone,
                ticket_no,
                category: category,
                status: category=="insurance"?"insurance":"waiting"
            })
            const lastBackup = await TokenBackup.findOne({
                order: [['createdAt', 'DESC']]
              });
            if(lastBackup){
                const lastTicketNumber = lastBackup.ticket_no;
                const numericPart = parseInt(lastTicketNumber, 10);
                back_no = (numericPart + 1).toString().padStart(3, '0');
                const backup = await TokenBackup.create({
                    phone,
                    category: category,
                    ticket_no: back_no,
                    stage: "meds",
                    status: category=="insurance"?"insurance":"waiting",
                })
                res.json(ticket);
            }else{
                const backup = await TokenBackup.create({
                    phone,
                    ticket_no,
                    stage: "meds",
                    status: category=="insurance"?"insurance":"waiting",
                    category: category,
                })
                res.json(ticket);
            }
            }else{
                const ticket = await Ticket.create({
                phone,
                ticket_no,
                category: category,
                status: category=="insurance"?"insurance":"waiting"
            })
            const lastBackup = await TokenBackup.findOne({
                order: [['createdAt', 'DESC']]
              });
            if(lastBackup){
                const lastTicketNumber = lastBackup.ticket_no;
                const numericPart = parseInt(lastTicketNumber, 10);
                back_no = (numericPart + 1).toString().padStart(3, '0');
                const backup = await TokenBackup.create({
                    phone,
                    category: category,
                    ticket_no: back_no,
                    stage: "meds",
                    status: category=="insurance"?"insurance":"waiting",
                })
                res.json(ticket);
            }else{
                const backup = await TokenBackup.create({
                    phone,
                    ticket_no,
                    stage: "meds",
                    status: category=="insurance"?"insurance":"waiting",
                    category: category,
                })
                res.json(ticket);
            }
            }
        }
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

// get queues
router.get('/get_display_tokens', async (req, res, next) => {
    const { stage, clinic_code, floor, isDiabetic, isChild } = req.query;
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const isDiabeticValue =
    isDiabetic === 'true' ? 1 :
    isDiabetic === 'false' ? 0 :
    null;
    const isChildValue =
    isChild === 'true' ? 1 :
    isChild === 'false' ? 0 :
    null;

    if (!stage || stage.trim() === "") {
        return res.status(400).json({ error: 'stage is required' });
    }
    if (stage === "nurse_station" && !clinic_code) {
        return res.status(400).json({ error: 'clinic code is required' });
    }
    if (!floor || floor.trim() === "") {
        return res.status(400).json({ error: 'floor is required' });
    }

    if (clinic_code) {
        try {
            const disabledToks = await Ticket.findAll({
                where: {
                    isDiabetic: isDiabeticValue,
                    isChild: isChildValue,
                    floor: floor, // Match provided floor
                    stage: stage,
                    [Op.or]: [
                        { status: "waiting" },
                        { serving: true }
                    ],
                    disabled: true,
                    createdAt: { [Op.gte]: twelveHoursAgo },
                    clinic_code: clinic_code
                },
                limit: 3,
                order: [['createdAt', 'ASC']],
            });
            const normalToks = await Ticket.findAll({
                where: {
                    isDiabetic: isDiabeticValue,
                    isChild: isChildValue,
                    floor: floor, // Match provided floor
                    stage: stage,
                    [Op.or]: [
                        { status: "waiting" },
                        { serving: true }
                    ],
                    disabled: false,
                    createdAt: { [Op.gte]: twelveHoursAgo },
                    clinic_code: clinic_code
                },
                limit: 5,
                order: [['createdAt', 'ASC']],
            });
            const disabledIds = disabledToks.map(ticket => ticket.id);
            const normalIds = normalToks.map(ticket => ticket.id);
            const otherToks = await Ticket.findAll({
                where: {
                    iisDiabetic: isDiabeticValue,
                    isChild: isChildValue,
                    floor: floor, // Match provided floor
                    stage: stage,
                    [Op.or]: [
                        { status: "waiting" },
                        { serving: true }
                    ],
                    createdAt: { [Op.gte]: twelveHoursAgo },
                    id: {
                        [Op.notIn]: [...disabledIds, ...normalIds],
                    },
                },
                limit: 10 - (normalToks.length + disabledToks.length),
                order: [['createdAt', 'ASC']],
            });
            const curr = [...disabledToks, ...normalToks, ...otherToks];
            const counters = await Counter.findAll();
            const result = curr.map(ticket => {
                const counter = counters.find(item => item.service === ticket.stage);
                return {
                    ticket: ticket,
                    counter: counter
                };
            });
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    } else {
        try {
            const disabledToks = await Ticket.findAll({
                where: {
                    isDiabetic: isDiabeticValue,
                    isChild: isChildValue,
                    floor: floor, // Match provided floor
                    stage: stage,
                    [Op.or]: [
                        { status: "waiting" },
                        { serving: true }
                    ],
                    disabled: true,
                    createdAt: { [Op.gte]: twelveHoursAgo }
                },
                limit: 3,
                order: [['createdAt', 'ASC']],
            });
            const normalToks = await Ticket.findAll({
                where: {
                    isDiabetic: isDiabeticValue,
                    isChild: isChildValue,
                    floor: floor, // Match provided floor
                    stage: stage,
                    status: "waiting",
                    disabled: false,
                    createdAt: { [Op.gte]: twelveHoursAgo }
                },
                limit: 5,
                order: [['createdAt', 'ASC']],
            });
            const disabledIds = disabledToks.map(ticket => ticket.id);
            const normalIds = normalToks.map(ticket => ticket.id);
            const otherToks = await Ticket.findAll({
                where: {
                    isDiabetic: isDiabeticValue,
                    isChild: isChildValue,
                    floor: floor, // Match provided floor
                    stage: stage,
                    [Op.or]: [
                        { status: "waiting" },
                        { serving: true }
                    ],
                    createdAt: { [Op.gte]: twelveHoursAgo },
                    id: {
                        [Op.notIn]: [...disabledIds, ...normalIds],
                    },
                },
                limit: 10 - (normalToks.length + disabledToks.length),
                order: [['createdAt', 'ASC']],
            });
            const curr = [...disabledToks, ...normalToks, ...otherToks];
            const counters = await Counter.findAll();
            const result = curr.map(ticket => {
                const counter = counters.find(item => item.service === ticket.stage);
                return {
                    ticket: ticket,
                    counter: counter
                };
            });
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: "internal server error" });
        }
    }
});
// get queues
router.get('/pata_clinic', async (req, res, next) => {
    const {stage, clinics} = req.query
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    if(stage.trim() === ""){
        return res.status(400).json({ error: 'stage is required is required' }); 
    }else{
        try {
                const disabledToks = await Ticket.findAll({
                    where: {stage:stage,status:"waiting",disabled: true,paid: true, clinic_code: {[Op.in]: clinics}},
                    limit: 3,
                    order: [
                        // ['disabled', 'DESC'],
                        ['createdAt', 'ASC'],
                      ],
                })
                const normalToks = await Ticket.findAll({
                    where: {stage:stage,status:"waiting",disabled: false,paid: true, clinic_code: {[Op.in]: clinics}},
                    limit: 5,
                    order: [['createdAt', 'ASC']],
                })
                const disabledIds = disabledToks.map(ticket => ticket.id);
                const normalIds = normalToks.map(ticket => ticket.id);
                const otherToks = await Ticket.findAll({
                    where: {
                        stage: stage,
                        status: "waiting",
                        paid: true, 
                        clinic_code: {[Op.in]: clinics},
                        id: {
                            [Op.notIn]: [...disabledIds, ...normalIds],
                        },
                    },
                    limit: 10 - (normalToks.length+disabledToks.length),
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
});
// get queues
router.get('/get_clinic_tokens', async (req, res, next) => {
    const {clinics, selected_clinic} = req.query
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
        if(selected_clinic || selected_clinic.trim() !== ""){
            try {
                const disabledToks = await Ticket.findAll({
                    where: {stage:"nurse_station",status:"waiting",disabled: true,createdAt: {[Op.gte]: twelveHoursAgo},clinic_code: selected_clinic,paid: true},
                    limit: 3,
                    order: [
                        // ['disabled', 'DESC'],
                        ['createdAt', 'ASC'],
                      ],
                })
                const normalToks = await Ticket.findAll({
                    where: {stage:"nurse_station",status:"waiting",disabled: false,createdAt: {[Op.gte]: twelveHoursAgo},clinic_code: selected_clinic,paid: true},
                    limit: 5,
                    order: [['createdAt', 'ASC']],
                })
                const disabledIds = disabledToks.map(ticket => ticket.id);
                const normalIds = normalToks.map(ticket => ticket.id);
                const otherToks = await Ticket.findAll({
                    where: {
                        stage: "nurse_station",
                        status: "waiting",
                        clinic_code: selected_clinic,
                        paid: true,
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
                    where: {stage:"nurse_station",status:"waiting",disabled: true,createdAt: {[Op.gte]: twelveHoursAgo},clinic_code: {[Op.in]: clinics,paid: true}},
                    limit: 3,
                    order: [
                        // ['disabled', 'DESC'],
                        ['createdAt', 'ASC'],
                      ],
                })
                const normalToks = await Ticket.findAll({
                    where: {stage:"nurse_station",status:"waiting",disabled: false,createdAt: {[Op.gte]: twelveHoursAgo},clinic_code: {[Op.in]: clinics,paid: true}},
                    limit: 5,
                    order: [['createdAt', 'ASC']],
                })
                const disabledIds = disabledToks.map(ticket => ticket.id);
                const normalIds = normalToks.map(ticket => ticket.id);
                const otherToks = await Ticket.findAll({
                    where: {
                        stage: "nurse_station",
                        status: "waiting",
                        clinic_code: {[Op.in]: clinics},
                        paid: true,
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
});
// get all queues
router.get('/next_stage', async (req, res, next) => {
    const ip = await getIpByPurpose('jeeva')
    const { mr_number } = req.query
    if(mr_number.trim() === ""){
        return res.status(400).json({ error: 'Mr Number is required' });
    }else{
        axios.get(`http://${ip}/dev/jeeva_api/swagger/patients/${mr_number}`).then((data)=> {
            if(data.data.status === 201){
                return res.status(400).json({ error: 'Mr Number does not exist' }); 
            }else{
                res.json(data.data.data)
            }
            // if (Array.isArray(data.data.data)) {
            //     res.json(data.data.data)
            //   } else {
            //     return res.status(400).json({ error: data.data.data });
            //   }
        }).catch((error)=> {
            return res.status(400).json({ error: error });
        })
    }
});
// get all queues
router.get('/priority',authMiddleware, async (req, res, next) => {
    const { ticket_no, data, stage, reason,counter } = req.query
    const user = req.user
    if(ticket_no.trim() === ""){
        return res.status(400).json({ error: 'Token Number is required' });
    }else if(data.trim()===""){
        return res.status(400).json({ error: 'data is required' });
    }else if(stage.trim()===""){
        return res.status(400).json({ error: 'stage is required' });
    }else if(!counter){
        return res.status(400).json({ error: 'counter is required' });
    }else{
        try{
            const token = await Ticket.findOne({
                where: {ticket_no,stage}
            })
            if(token){
                if(data==="serve"){
                    if(token.serving===true){
                        token.update({
                            serving: false,
                            serving_id: false,
                            counter: null
                        })
                        res.json(token)
                    }else{
                        const other = await Ticket.findOne({
                            where: {
                                serving: true,
                                serving_id: user.phone
                            }
                        })
                        if(other){
                            // other.update({
                            //     serving: false
                            // })
                            token.update({
                            serving: true,
                            serving_id: user.phone,
                            counter: counter
                        })
                        res.json(token)
                        }else{
                            token.update({
                            serving: true,
                            serving_id: user.phone,
                            counter: counter
                        })
                        res.json(token)
                        }
                    }
                }
                else{
                    if(token.ticket_no===ticket_no && token.disabled===true){
                        token.update({
                            disability: null,
                            disabled: false
                        })
                        res.json(token)
                    }else{
                        token.update({
                            disability: reason,
                            disabled: true
                        })
                        res.json(token)
                    }
                }
            }else{
                return res.status(400).json({ error: 'token not found' });  
            }
        }catch(error){
            res.status(500).json({ error: error });
        }
    }
});
// get all queues
router.post('/clinic_go', async (req, res, next) => {
    const { mr_number, stage, cashier_id } = req.body
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const ip = await getIpByPurpose('jeeva')
    if(mr_number.trim() === ""){
        return res.status(400).json({ error: 'Mr Number is required' });
    }else{
        axios.get(`http://${ip}/dev/jeeva_api/swagger/consultation/${mr_number}`).then(async (data)=> {
            if(data.data.status === 201){
                const ticket = await Ticket.findOne({
                    where: {mr_no: mr_number}
                })
                if(ticket){
                  await ticket.update({
                    clinic_code: data.data.data.clinicCode,
                    serving: false,
                    stage: stage,
                    paid: false,
                    account_time: new Date(),
                    cashier_id: cashier_id,
                    serving: false,
                    counter: null
                    })
                    const backup = await TokenBackup.findOne({
                        where: {mr_no: ticket.mr_no, createdAt: {[Op.gte]: twelveHoursAgo}}
                    })
                    if(backup){
                        await backup.update({
                            clinic_code: data.data.data.clinicCode,
                            stage: stage,
                            paid: false,
                            account_time: new Date(),
                            cashier_id: cashier_id,
                            serving: false,
                            counter: null
                            }) 
                    }
                    res.json(data.data.data.consStatus)
                }else{
                    return res.status(400).json({ error: "patient not found" });
                }
            }else{
                const ticket = await Ticket.findOne({
                    where: {mr_no: mr_number}
                })
                if(ticket){
                  await ticket.update({
                    clinic_code: data.data.data.clinicCode,
                    stage: stage,
                    paid: true,
                    serving: false,
                    account_time: new Date(),
                    cashier_id: cashier_id,
                    serving: false,
                    counter: null
                    })
                    const backup = await TokenBackup.findOne({
                        where: {mr_no: ticket.mr_no,createdAt: {[Op.gte]: twelveHoursAgo}}
                    })
                    if(backup){
                        await backup.update({
                            clinic_code: data.data.data.clinicCode,
                            stage: stage,
                            paid: true,
                            account_time: new Date(),
                            cashier_id: cashier_id,
                            serving: false,
                            counter: null
                            }) 
                    }
                    res.json(data.data.data.consStatus)
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
    const floor = req.query.floor
    const phone = req.query.phone
    const ticket_no = req.query.phone
    const isDiabetic = req.query.isDiabetic
    const isChild = req.query.isChild
    const stage = req.query.stage
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    if(phone.trim() !== '' || ticket_no !== ''){ 
        try {
            const disabledToks = await Ticket.findAndCountAll({
                where: {
                    // stage:stage,
                    // status:status,
                    ...(status !== 'all' && {
                        stage: stage,
                        floor: floor,
                        isDiabetic: isDiabetic==='true'?1:0,
                        isChild: isChild==='true'?1:0,
                        status: status
                    }),
                    disabled: true,
                    [Op.or]: [
                        { phone: { [Op.like]: `%${phone}%` } },
                        { ticket_no: { [Op.like]: `%${ticket_no}%` } }
                    ],
                    createdAt: {[Op.gte]: twelveHoursAgo}
                },
                offset: offset,
                limit: 3,
                order: [
                    // ['disabled', 'DESC'],
                    ['createdAt', 'ASC'],
                  ],
            })
            const normalToks = await Ticket.findAndCountAll({
                where: {
                    // stage:stage,
                    // status:status,
                    ...(status !== 'all' && {
                        floor: floor,
                        stage: stage,
                        isDiabetic: isDiabetic==='true'?1:0,
                        isChild: isChild==='true'?1:0,
                        status: status
                    }),
                    disabled: false,
                    [Op.or]: [
                        { phone: { [Op.like]: `%${phone}%` } },
                        { ticket_no: { [Op.like]: `%${ticket_no}%` } }
                    ],
                    createdAt: {[Op.gte]: twelveHoursAgo}},
                offset: offset,
                limit: 5,
                order: [['createdAt', 'ASC']],
            })
            const disabledIds = disabledToks.rows.map(ticket => ticket.id);
            const normalIds = normalToks.rows.map(ticket => ticket.id);
            const otherToks = await Ticket.findAndCountAll({
                where: {
                    // stage: stage,
                    // status: status,
                    ...(status !== 'all' && {
                        floor: floor,
                        stage: stage,
                        isDiabetic: isDiabetic==='true'?1:0,
                        isChild: isChild==='true'?1:0,
                        status: status
                    }),
                    [Op.or]: [
                        { phone: { [Op.like]: `%${phone}%` } },
                        { ticket_no: { [Op.like]: `%${ticket_no}%` } }
                    ],
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
                where: {
                    // stage:stage,
                    // status:status,
                    ...(status !== 'all' && {
                        floor: floor,
                        stage: stage,
                        isDiabetic: isDiabetic==='true'?1:0,
                        isChild: isChild==='true'?1:0,
                        status: status
                    }),
                    disabled: true,
                    createdAt: {[Op.gte]: twelveHoursAgo}
                },
                offset: offset,
                limit: 3,
                order: [
                    // ['disabled', 'DESC'],
                    ['createdAt', 'ASC'],
                  ],
            })
            const normalToks = await Ticket.findAndCountAll({
                where: {
                    // stage:stage,
                    // status:status,
                    ...(status !== 'all' && {
                        floor: floor,
                        stage: stage,
                        isDiabetic: isDiabetic==='true'?1:0,
                        isChild: isChild==='true'?1:0,
                        status: status
                    }),
                    disabled: false,
                    createdAt: {[Op.gte]: twelveHoursAgo}
                },
                offset: offset,
                limit: 5,
                order: [['createdAt', 'ASC']],
            })
            const disabledIds = disabledToks.rows.map(ticket => ticket.id);
            const normalIds = normalToks.rows.map(ticket => ticket.id);
            const otherToks = await Ticket.findAndCountAll({
                where: {
                    // stage: stage,
                    // status: status,
                    ...(status !== 'all' && {
                        floor: floor,
                        stage: stage,
                        isDiabetic: isDiabetic==='true'?1:0,
                        isChild: isChild==='true'?1:0,
                        status: status
                    }),
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
            res.status(500).json({ error: "internal server error" });
        }
    }
});
// get waiting
router.get('/getClinicTickets', async (req, res, next) => {
    const status = req.query.status;
    const mr_no = req.query.phone;
    const stage = req.query.stage;
    const clinic_code = req.query.clinic_code;
    const current_clinic = req.query.current_clinic;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;

    try {
        let tickets;
        let totalItems;

        if (mr_no && mr_no.trim() !== '') {
            // Query with phone number search
            const result = await Ticket.findAndCountAll({
                where: {
                    stage,
                    clinic_code: current_clinic ? current_clinic : { [Op.in]: clinic_code },
                    status,
                    mr_no: { [Op.like]: `%${mr_no}%` },
                    paid: true
                },
                limit: pageSize,
                offset: offset
            });

            tickets = result.rows;
            totalItems = result.count;
        } else {
            // Query without phone number search
            const result = await Ticket.findAndCountAll({
                where: {
                    stage,
                    clinic_code: current_clinic ? current_clinic : { [Op.in]: clinic_code },
                    status,
                    paid: true
                },
                limit: pageSize,
                offset: offset
            });

            tickets = result.rows;
            totalItems = result.count;
        }

        const counters = await Counter.findAll();
        const result = tickets.map(cu => {
            const counter = counters.find(item => item.service === cu.stage);
            return {
                token: cu,
                counter: counter
            };
        });

        res.json({
            data: result,
            totalItems: totalItems,
            totalPages: Math.ceil(totalItems / pageSize),
            currentPage: page,
            pageSize: pageSize
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// clinic length 
router.get('/get_clinic_length', async (req, res, next) => {
    const status = req.query.status
    const stage = req.query.stage
    const clinic_code = req.query.clinic_code
    const current_clinic = req.query.current_clinic
    try{
        if(current_clinic !== '0'){
            const tickets = await Ticket.findAll({
                where: {stage,status,clinic_code: current_clinic}
            })
            res.json(tickets)
        }else{
            const tickets = await Ticket.findAll({
                where: {stage,status,clinic_code: {[Op.in]: clinic_code}}
            })
            res.json(tickets)
        }
    }catch(error){
        res.status(500).json({ error: error });
    }
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
            const backup = await TokenBackup.findOne({
                where: {
                    ticket_no: ticket.ticket_no,
                    createdAt: {
                        [Op.gt]: new Date(new Date() - 12 * 60 * 60 * 1000) // Less than 12 hours ago
                    }
                }
            });
            if(status==="pending"){
                ticket.update({
                status: status,
                serving: false
            })
            backup.update({
             status: status,
             serving: false   
            })
            res.json(ticket)
            }else{
                backup.update({
                    status: status
                })
                ticket.update({
                status: status
            })
            res.json(ticket)
            }
        }
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// edit ticket
router.put('/finish_token/:id', async (req, res, next) => {
const id = req.params.id
const {stage, mr_number, penalized, sex, recorder_id, name, age, category} = req.body
const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
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
                await ticket.update({
                    status: "waiting",
                    serving: false,
                    stage: stage,
                    name: name,
                    gender: sex,
                    mr_no: mr_number,
                    serving: false,
                    counter: null,
                    // disabled: penalized?false: ticket.disabled,
                    // disability: penalized?"": ticket.disability,
                    med_time: new Date(),
                    recorder_id: recorder_id,
                    category,
                    age: age
                })
                const backup = await TokenBackup.findOne({
                    where: {createdAt: ticket.createdAt}
                }) 
                if(backup){
                    await backup.update({
                        status: "waiting",
                        //serving: false,
                        stage: stage,
                        name: name,
                        gender: sex,
                        mr_no: mr_number,
                        disabled: penalized?false: ticket.disabled,
                        disability: penalized?"": ticket.disability,
                        med_time: new Date(),
                        recorder_id: recorder_id,
                        age: age,
                        category,
                        serving: false,
                        counter: null,
                    })
                }
                res.json(backup)
            }
        }
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// edit ticket
router.put('/finish_account_token/:id', async (req, res, next) => {
const id = req.params.id
const {stage, mr_number, penalized, sex, recorder_id, name, age, category} = req.body
const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
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
                await ticket.update({
                    status: "waiting",
                    serving: false,
                    stage: stage,
                    name: name,
                    gender: sex,
                    mr_no: mr_number,
                    serving: false,
                    counter: null,
                    // disabled: penalized?false: ticket.disabled,
                    // disability: penalized?"": ticket.disability,
                    //med_time: new Date(),
                    //recorder_id: recorder_id,
                    category,
                    age: age
                })
                const backup = await TokenBackup.findOne({
                    where: {createdAt: ticket.createdAt}
                }) 
                if(backup){
                    await backup.update({
                        status: "waiting",
                        //serving: false,
                        stage: stage,
                        name: name,
                        gender: sex,
                        mr_no: mr_number,
                        disabled: penalized?false: ticket.disabled,
                        disability: penalized?"": ticket.disability,
                        //med_time: new Date(),
                        //recorder_id: recorder_id,
                        age: age,
                        category,
                        serving: false,
                        counter: null,
                    })
                }
                res.json(backup)
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
                    nurse_id: nurse_id,
                    serving: false
                })
                dokta.update({
                    current_patient: patient_id
                })
                const backup = await TokenBackup.findOne({
                    where: {mr_no: ticket.mr_no}
                })
                if(backup){
                    backup.update({
                        stage: "clinic",
                        station_time: new Date(),
                        nurse_id: nurse_id  
                    })
                }
                res.json(ticket)
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
// Cron job to find unpaid tickets every 5 minutes
cron.schedule('*/5 * * * * *', async () => {
    const ip = await getIpByPurpose('jeeva')
    try {
      const unpaidTickets = await Ticket.findAll({ where: { paid: false, stage: "nurse_station" } });
      for (const ticket of unpaidTickets) {
        try{
            const response = await axios.get(`http://${ip}/dev/jeeva_api/swagger/consultation/${ticket.mr_no}`);
            if(response.data.status === 201 && response.data.data.consStatus==="Not Paid"){
            }else if(response.data.status===200 && response.data.data.consStatus==="Paid"){
                ticket.update({
                    paid: true,
                    clinic_code: data.data.clinicCode
                })
            }
        }catch (error){
            res.status(500).json({ error: error }); 
        }
      }
    } catch (error) {
        res.status(500).json({ error: error });
    }
  });
module.exports = router;
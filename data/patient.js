const express = require('express');
const { Patient, Counter, sequelize, Doctor } = require('../models/index')
const {Op} = require('sequelize')
const router = express.Router();


router.post('/register_patient', async (req, res) => {
    const { name, clinic, stage, mr_no,age, sex,status, reg_date, reg_time,consult_date, consult_time, doctor, consult_doctor} = req.body;
    const transaction = await sequelize.transaction();
    try {
        console.log('registering patients')
        if(name.trim() === ''){
            return res.status(400).json({ error: 'name is required' });
        }else{
        const pat = await Patient.findOne({
            where: {mr_no},
            transaction
        })
        if(!pat){
            const patient = await Patient.create(req.body,transaction)
            res.json(patient);
        }
        await transaction.commit();
        }
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

// delete duplicate patients
router.put('/duplicate_patients', async (req, res)=> {
    try {
        // Step 1: Find all duplicates based on patientName and mrNumber
        const duplicates = await Patient.findAll({
          attributes: [
            'mr_no',
            [sequelize.fn('COUNT', sequelize.col('id')), 'count']
          ],
          group: ['mr_no'],
          having: sequelize.literal('COUNT(*) > 1') // having more than 1 means it's a duplicate
        });
    
        // Step 2: Iterate through each duplicate group and delete extra entries
        for (const duplicate of duplicates) {
          const { mr_no } = duplicate.get();
    
          // Find all records matching the duplicate criteria
          const duplicateRecords = await Patient.findAll({
            where: {
              mr_no: mr_no
            },
            order: [['id', 'ASC']] // To keep the first record and delete the rest
          });
    
          // Keep the first record and delete the rest
          if (duplicateRecords.length > 1) {
            const recordsToDelete = duplicateRecords.slice(1);
            const idsToDelete = recordsToDelete.map(record => record.id);
            await Patient.destroy({
              where: {
                id: {
                  [Op.in]: idsToDelete
                }
              }
            });
            console.log('records deleted successfully');
          }else{
            console.log('no duplicates');
          }
        }
      } catch (error) {
        console.error('Error deleting duplicates:', error);
      }
})

// get patients
router.get('/get_patients', async (req, res) => {
    const status = req.query.status
    const mr_no = req.query.mr_no
    if(status.trim() !== ''){
        console.log('mr number ',mr_no)
        if(mr_no.trim()===''){
            try {
                const patient = await Patient.findAll({
                    where: {status},
                    limit: 10
                })
                res.json(patient);
            } catch (err) {
                res.status(500).json({ error: err });
            }
        }else{
            try {
                const patient = await Patient.findAll({
                    where: {status,mr_no: {[Op.like]:`%${mr_no}%`}},
                    limit: 10
                })
                res.json(patient);
            } catch (err) {
                res.status(500).json({ error: err });
            }
        }
    }else{
        if(mr_no.trim()===''){
            try {
                const patient = await Patient.findAll({
                    limit: 10
                })
                res.json(patient);
            } catch (err) {
                res.status(500).json({ error: err });
            }
        }else{
            try {
                const patient = await Patient.findAll({
                    where: {mr_no: {[Op.like]: `%${mr_no}%`}},
                    limit: 10
                })
                res.json(patient);
            } catch (err) {
                res.status(500).json({ error: err });
            }
        }
    }
});
// get accounts patients
router.get('/get_account_patients', async (req, res) => {
    const status = req.query.status
    const mr_no = req.query.mr_no
    const stage = req.query.stage
    if(status.trim() !== ''){
        if(mr_no.trim()===''){
            try {
                const patient = await Patient.findAll({
                    where: {status,stage:stage},
                    limit: 10
                })
                res.json(patient);
            } catch (err) {
                res.status(500).json({ error: err });
            }
        }else{
            try {
                const patient = await Patient.findAll({
                    where: {status,stage:stage,mr_no: {[Op.like]:`%${mr_no}%`}},
                    limit: 10
                })
                res.json(patient);
            } catch (err) {
                res.status(500).json({ error: err });
            }
        }
    }else{
        if(mr_no.trim()===''){
            try {
                const patient = await Patient.findAll({
                    where:{stage:stage},
                    limit: 10
                })
                res.json(patient);
            } catch (err) {
                res.status(500).json({ error: err });
            }
        }else{
            try {
                const patient = await Patient.findAll({
                    where: {mr_no: {[Op.like]: `%${mr_no}%`},stage:stage},
                    limit: 10
                })
                res.json(patient);
            } catch (err) {
                res.status(500).json({ error: err });
            }
        }
    }
});

//get total status
router.get('/status_totals', async (req, res) => {
    const status = req.query.status
    const stage = req.query.stage
    try{
        const stats = await Patient.findAll({
            where: {status,stage}
        })
        res.json(stats)
    }catch(err) {
        res.status(500).json({ error: err });  
    }
})

// get queues
router.get('/getCatPatients', async (req, res, next) => {
    const category = req.query.category
    const status = req.query.status
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    console.log("status is ",status,category)
    try {
        if(status.trim()===""){
            const curr = await Patient.findAndCountAll({
                // where: {category},
                where: {clinic:category,status:"waiting"},
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
            const curr = await Patient.findAndCountAll({
                // where: {category},
                where: {clinic:category,status},
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
// get queues
router.get('/getVitalPatients', async (req, res, next) => {
    const category = req.query.category
    const status = req.query.status
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    console.log("status is ",status,category)
    try {
        if(status.trim()===""){
            const curr = await Patient.findAndCountAll({
                // where: {category},
                where: {status:"vitaling"},
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
            const curr = await Patient.findAndCountAll({
                // where: {category},
                where: {status:"vitaling"},
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
// edit patient
router.put('/edit_status/:id', async (req, res, next) => {
    const id = req.params.id
    const status = req.body
        try {
            const ticket = await Patient.findOne({
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
// finish patient
router.put('/finish_patient/:id', async (req, res, next) => {
    const id = req.params.id
        try {
            const ticket = await Patient.findOne({
                where: { id }
            })
            if(!ticket){
                return res.status(400).json({ error: 'ticket not found' });
            }else {
                ticket.update({
                    status: "waiting",
                    stage:"accounts"
                })
                res.json(ticket)
            }
        } catch (err) {
            res.status(500).json({ error: err });
        }
    });
// finish accounts patient
router.put('/finish_accounts_patient/:id', async (req, res, next) => {
    const id = req.params.id
    const {service} = req.body
        try {
            const ticket = await Patient.findOne({
                where: { id }
            })
            if(!ticket){
                return res.status(400).json({ error: 'ticket not found' });
            }else {
                if(service.trim()===""){
                    return res.status(400).json({ error: 'service name cannot be empty' });  
                }else{
                    if(service.trim()==="cash"){
                        ticket.update({
                            status: "waiting",
                            stage:"payment"
                        })
                        res.json(ticket)
                    }else{
                        ticket.update({
                            status: "waiting",
                            stage:"clinic"
                        })
                        res.json(ticket)
                    }
                }
            }
        } catch (err) {
            res.status(500).json({ error: err });
        }
    });
// edit status 
router.put('/edit_status01/:id', async (req, res, next) => {
    const id = req.params.id
    const {stage} = req.body
        try {
            const ticket = await Patient.findOne({
                where: { id }
            })
            const patients = await Patient.findAll({
                where: {stage: stage,status:"waiting"},
                order: [['reg_date', 'ASC']]
            })
            const doctor = await Doctor.findOne({
                where: {current_patient: {[Op.eq]: null}}
            })
            if(!ticket){
                return res.status(400).json({ error: 'ticket not found' });
            }else {
                if(stage.trim()===""){
                    return res.status(400).json({ error: 'stage name cannot be empty' });  
                }else{
                    if(patients.length>1 && doctor){
                        if(patients.length>1){
                            doctor.update({
                                current_patient: patients[1].mr_no,
                                occupied: true
                            })
                            ticket.update({
                                status: "done",
                            })
                            res.json(doctor)
                        }else{
                            doctor.update({
                                current_patient: patients[0].mr_no,
                                occupied: true
                            })
                            ticket.update({
                                status: "done",
                            })
                            res.json(doctor)
                        }
                    }else{
                        return res.status(400).json({ error: 'doctors are busy' });
                    }
                    // res.json(ticket)
                }
            }
        } catch (err) {
            res.status(500).json({ error: err });
        }
    });
// get queues
router.get('/getPatientTickets', async (req, res, next) => {
    const { stage, clinic } = req.query
    try {
        const patients = await Patient.findAll({
            where: {status: "waiting",stage:stage,clinic: clinic},
            limit: 10
        })
        const counters = await Counter.findAll();
        const doctors = await Doctor.findAll({
            where: {service: stage,current_patient: {[Op.ne]: null}}
        })
        const result = patients.map(ticket => {
            const counter = counters.find(item => item.service === ticket.stage)
            if(doctors){
                const doctor = doctors.find(item => item.current_patient === ticket.mr_no)
                return {
                    ticket: ticket,
                    counter: counter,
                    doctor: doctor
                }
            }else{
                return {
                    ticket: ticket,
                    counter: counter
                }
            }
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// get queues
router.get('/get_pats', async (req, res, next) => {
    const { stage, clinic } = req.query
    try {
        const patients = await Patient.findAll({
            where: {status: "waiting",stage:stage},
            limit: 10
        })
        const counters = await Counter.findAll();
        const doctors = await Doctor.findAll({
            where: {service: stage,current_patient: {[Op.ne]: null}}
        })
        const result = patients.map(ticket => {
            const counter = counters.find(item => item.service === ticket.stage)
            if(doctors){
                const doctor = doctors.find(item => item.current_patient === ticket.mr_no)
                return {
                    ticket: ticket,
                    counter: counter,
                    doctor: doctor
                }
            }else{
                return {
                    ticket: ticket,
                    counter: counter
                }
            }
        });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
module.exports = router;
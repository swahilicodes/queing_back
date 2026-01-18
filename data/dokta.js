const express = require('express');
const { Dokta, User, Counter, Patient, Ticket, TokenBackup } = require('../models/index')
const router = express.Router();
const { Op } = require('sequelize')
const bcrypt = require("bcryptjs")
const axios = require('axios');
const authMiddleware = require('../utils/authMiddleWare');
const {getIpByPurpose} = require('../functions/get_ip_by_purpose')


router.post('/create_dokta', async (req, res) => {
    const { name, phone,room, clinic, clinic_code } = req.body;
    let newPass = await bcrypt.hash(phone,6)
    try {
        if(name.trim() === ''){
            return res.status(400).json({ error: 'name is required' });
        }else if(phone.trim() === ''){
            return res.status(400).json({ error: 'phone is required' });
        }else if(clinic.trim() ===""){
            return res.status(400).json({ error: 'clinic is required' });
        }else if(clinic_code.trim() ===""){
            return res.status(400).json({ error: 'clinic code is required' });
        }else if(room.trim() === ''){
            return res.status(400).json({ error: 'room is required' });
        }else{
            const att = await Dokta.findOne({
                where: {phone}
            })
            const user = await User.findOne({
                where: {phone}
            })
            if(att && user){
                return res.status(400).json({ error: 'Doctor exists' });  
            }else if(user && att===null){
                const newAtt = await Dokta.create({
                    name,
                    phone,
                    service: "clinic",
                    room,
                    clinic_code,
                    clinic,
                    role: "doctor",
                    password: newPass
                })
                res.json(newAtt)
            }else{
                const newAtt = await Dokta.create({
                    name,
                    phone,
                    service: "clinic",
                    room,
                    clinic_code,
                    clinic,
                    role: "doctor",
                    password: newPass
                })
                await User.create({
                    name,
                    phone,
                    counter:room,
                    clinic,
                    role: "doctor",
                    password:newPass,
                    service: "clinic",
                    counter:room,
                    display_photo: null
                })
                res.json(newAtt)
            }
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
router.get('/get_doktas', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const clinic_code = req.query.clinic_code;
    const offset = (page - 1) * pageSize;
    console.log(page,clinic_code)
    try {
        const curr = await Dokta.findAndCountAll({
            //where: {clinic_code},
            offset: offset,
            limit: pageSize,
            order: [['id', 'ASC']]
        })
        console.log(curr)
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
// get clinic doctors
router.get('/get_clinic_doktas', async (req, res) => {
    const {clinics} = req.query
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 5;
    const offset = (page - 1) * pageSize;
    try {
        const curr = await Dokta.findAndCountAll({
            where: {clinic_code: {[Op.in]:clinics}},
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
// get clinic doctors
router.get('/get_all_doktas', async (req, res) => {
    try {
        const curr = await Dokta.findAll()
        res.json(curr);
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
// get clinic doctors
router.get('/get_dokta_patients', async (req, res) => {
    const {id} = req.query
    try {
        const curr = await Ticket.findAll({
            where: {doctor_id: id},
            order: [['id', 'ASC']]
        })
        res.json(curr);
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
// assign doctor
router.post('/assign_doctor', async (req, res) => {
    const {doctor_id,patient_id} = req.body
    try {
        const curr = await Ticket.findOne({
            where: {id: patient_id}
        })
        if(!curr){
            res.status(400).json({error: "patient not found"})
        }else{
            await curr.update({
                doctor_id: doctor_id
            })
            res.json(curr)
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
// get doctor patients
router.get('/get_doc_patients', authMiddleware, async (req, res) => {
    // Parse query parameters with defaults
    const { status } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const user = req.user;
    
    try {
        const current = await Dokta.findOne({
            where: { phone: user.phone }
        });
        
        if (!current) {
            return res.status(404).json({ error: "Doctor not found" });
        }

        const offset = (page - 1) * limit;
        
        const { count, rows: pats } = await Ticket.findAndCountAll({
            where: { 
                doctor_id: current.id, 
                status: status, 
                stage: "nurse_station" 
            },
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        const totalPages = Math.ceil(count / limit);
        
        res.json({
            totalPatients: count,
            totalPages: totalPages,
            currentPage: page,
            patientsPerPage: limit,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
            patients: pats
        });
        
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/get_free_doktas', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const selected_clinic = req.query.selected_clinic;
    const clinics = req.query.clinics;
    const offset = (page - 1) * pageSize;
    try {
        if(selected_clinic.trim() !== ""){
            const curr = await Dokta.findAndCountAll({
                where: {clinic_code: selected_clinic,current_patient: {[Op.eq]: null}},
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
            const curr = await Dokta.findAndCountAll({
                where: {clinic_code: {[Op.in]: clinics},current_patient: {[Op.eq]: null}},
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
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
router.put('/delete_dokta/:id', async (req, res) => {
    const id = req.params.id
    try {
        const service = await Dokta.findByPk(id);
        if (!service) {
        return res.status(404).json({ error: 'doctor not found' });
        }else{
            const user = await User.findOne({
                where: {phone: service.phone}
            })
            if(user){
                await user.destroy()
                await service.destroy();
                res.status(204).end();
            }
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});
// // Finish Patient
// router.post('/finish_patient', async (req, res) => {
//     const {doctor_id, patient_id} = req.body
//     const now = new Date();

//     const formattedDate = now.getFullYear().toString() +
//     String(now.getMonth() + 1).padStart(2, '0') +
//     String(now.getDate()).padStart(2, '0');
//     console.log(doctor_id,patient_id)
//     try {
//         const doc = await Dokta.findOne({
//             where: {id: doctor_id}
//         });
//         const tic = await Ticket.findOne({
//             where: {mr_no: patient_id, stage: "nurse_station"}
//         });
//         if (!doc) {
//         return res.status(404).json({ error: 'doctor not found' });
//         }else if (!tic){
//             return res.status(404).json({ error: 'patient not found' });
//         }else{
//             axios.get(`http://192.168.235.65/dev/jeeva_api/swagger/billing/${tic.mr_no}/${formattedDate}/${tic.clinic_code}`).then(async (data)=> {
//                 if(data.data && data.data.status == 'Failure' && data.data.consStatus == "No Patient Data"){
//                     tic.update({
//                         stage: "clinic",
//                         doctor_id: doctor_id,
//                         clinic_time: new Date(),
//                         serving: false
//                     })
//                     doc.update({
//                         current_patient: null,
//                     })
//                     const backup = await TokenBackup.findOne({
//                         where: {ticket_no: tic.ticket_no}
//                     })
//                     if(backup){
//                         backup.update({
//                             stage: "clinic",
//                             doctor_id: doctor_id,
//                              clinic_time: new Date(),
//                              serving: false
//                         })
//                         res.json(backup)
//                     }
//                 }else if(data.data && data.data.status == "Billed"){
//                     tic.update({
//                         stage: "clinic",
//                         doctor_id: doctor_id,
//                         clinic_time: new Date(),
//                         serving: false
//                     })
//                     doc.update({
//                         current_patient: null,
//                         serving: false,
//                         stage: "clinic",
//                     })
//                     const backup = await TokenBackup.findOne({
//                         where: {ticket_no: tic.ticket_no}
//                     })
//                     if(backup){
//                         backup.update({
//                             stage: "clinic",
//                             doctor_id: doctor_id,
//                             serving: false,
//                             clinic_time: new Date()
//                         })
//                         res.json(backup)
//                     }
//                 }else{
//                     tic.update({
//                         stage: "accounts",
//                         doctor_id: doctor_id,
//                         clinic_time: new Date(),
//                         serving: false
//                     })
//                     doc.update({
//                         current_patient: null
//                     })
//                     const backup = await TokenBackup.findOne({
//                         where: {ticket_no: tic.ticket_no}
//                     })
//                     if(backup){
//                         backup.update({
//                             stage: "accounts",
//                             doctor_id: doctor_id,
//                         clinic_time: new Date()
//                         })
//                         res.json(backup)
//                     }
//                 }
//             }).catch((error)=> {
//             return res.status(400).json({ error: error });
//         })
//         }
//     } catch (err) {
//         //next({error: err})
//         res.status(500).json({ error: err });
//     }
// });

router.post('/finish_patient', async (req, res) => {
    const { doctor_id, patient_id } = req.body;
    const now = new Date();
    const ip = await getIpByPurpose('jeeva')

    const formattedDate =
        now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0');

    try {
        const doc = await Dokta.findOne({
            where: { id: doctor_id },
        });
        const tic = await Ticket.findOne({
            where: { mr_no: patient_id, stage: 'nurse_station' },
        });

        if (!doc) {
            return res.status(404).json({ error: 'doctor not found' });
        }
        if (!tic) {
            return res.status(404).json({ error: 'patient not found' });
        }

        const response = await axios.get(
            `http://${ip}/dev/jeeva_api/swagger/billing/${"M85-51-780"}/${formattedDate}/${tic.clinic_code}`
        );

        // Log the API response for debugging
        //console.log('API Response:', JSON.stringify(response.data, null, 2));

        const apiData = response.data.data;

        // Handle the cases explicitly
        if (apiData.status === 'Billed') {
            // Case 1: Billed → stage: "clinic"
            await tic.update({
                stage: 'clinic',
                doctor_id: doctor_id,
                clinic_time: new Date(),
                serving: false,
            });
            await doc.update({
                current_patient: null,
                serving: false,
                stage: 'clinic',
            });

            const backup = await TokenBackup.findOne({
                where: { ticket_no: tic.ticket_no },
            });
            if (backup) {
                await backup.update({
                    stage: 'clinic',
                    doctor_id: doctor_id,
                    clinic_time: new Date(),
                    serving: false,
                });
                return res.json(backup);
            }
            return res.json({ message: 'Updated successfully, no backup found' });
        } else if (
            apiData.status === 'Failure' &&
            apiData.consStatus === 'No Patient Data'
        ) {
            // Case 2: No Patient Data → stage: "clinic"
            await tic.update({
                stage: 'clinic',
                doctor_id: doctor_id,
                clinic_time: new Date(),
                serving: false,
            });
            await doc.update({
                current_patient: null,
                serving: false,
                stage: 'clinic',
            });

            const backup = await TokenBackup.findOne({
                where: { ticket_no: tic.ticket_no },
            });
            if (backup) {
                await backup.update({
                    stage: 'clinic',
                    doctor_id: doctor_id,
                    clinic_time: new Date(),
                    serving: false,
                });
                return res.json(backup);
            }
            return res.json({ message: 'Updated successfully, no backup found' });
        } else {
            // Case 3: Any other status (e.g., "null") → stage: "accounts"
            await tic.update({
                stage: 'accounts',
                doctor_id: doctor_id,
                clinic_time: new Date(),
                serving: false,
            });
            await doc.update({
                current_patient: null,
            });

            const backup = await TokenBackup.findOne({
                where: { ticket_no: tic.ticket_no },
            });
            if (backup) {
                await backup.update({
                    stage: 'accounts',
                    doctor_id: doctor_id,
                    clinic_time: new Date(),
                    serving: false,
                });
                return res.json(backup);
            }
            return res.json({ message: 'Updated successfully, no backup found' });
        }
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: err.message });
    }
});
// Finish Patient
router.get('/verify_vipimo', async (req, res) => {
    const {mr_no, clinic_code} = req.body
    const now = new Date();
    const ip = await getIpByPurpose('jeeva')

    const formattedDate = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
    try {
        if(mr_no.trim() == ""){
            return res.status(400).json({ error: 'mr no not provided' }); 
        }else if(clinic_code.trim() == ""){
            return res.status(400).json({ error: 'clinic code not provided' }); 
        }else{
            axios.get(`http://${ip}/dev/jeeva_api/swagger/billing/${mr_no}/${formattedDate}/${clinic_code}`).then((data)=> {
                console.log('the data is ',data.data)
                return res.json(data.data)
            }).catch((error)=> {
            return res.status(400).json({ error: error });
        })
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});

// Edit doctor
router.put('/edit_dokta/:id', async (req, res) => {
  const id = req.params.id;
  const newData = req.body;

  try {
    const doctor = await Dokta.findOne({ where: { id } });
    if (!doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    const user = await User.findOne({ where: { phone: doctor.phone } });
    if (!user) {
      return res.status(404).json({ error: "User linked to doctor not found" });
    }

    const hashed = await bcrypt.hash(user.phone, 6);

    // Update user
    await user.update({
      name: newData.fields.name || user.name,
      service: newData.fields.service || user.service,
      counter: newData.fields.room || user.counter,
      role: newData.fields.role || user.role,
      password: newData.fields.ispass === "true" ? hashed : user.password
    });

    // Update doctor
    await doctor.update({
      name: newData.fields.name || doctor.name,
      service: newData.fields.service || doctor.service,
      room: newData.fields.room || doctor.counter,
      clinic: newData.fields.clinic || doctor.clinic,
      clinic_code: newData.fields.clinic_code || doctor.clinic_code,
      role: newData.fields.role || doctor.role,
      password: newData.fields.ispass === "true" ? hashed : doctor.password
    });

    // Reload doctor to get latest changes
    await doctor.reload();

    res.json({ message: "Doctor and user updated successfully", doctor });
  } catch (err) {
    res.status(500).json({ error: "Internal server error", details: err.message });
  }
});

router.post("/edit_doctor_one", authMiddleware, async (req, res) => {
    const { name, clinic, clinic_code, room,status } = req.body;
    const user = req.user;
    console.log(req.body)
    try {
        // Validate inputs
        if (!name || typeof name !== 'string' || name.trim() === "") {
            return res.status(400).json({ error: "Name is required" });
        }else if (!clinic || typeof clinic !== 'string' || clinic.trim() === "") {
            return res.status(400).json({ error: "Clinic is required" });
        }else if (!clinic_code || typeof clinic_code !== 'string' || clinic_code.trim() === "") {
            return res.status(400).json({ error: "Clinic code is required" });
        }else if (!room || typeof room !== 'string' || room.trim() === "") {
            return res.status(400).json({ error: "Room is required" });
        }else if (!status || typeof status !== 'string' || status.trim() === "") {
            return res.status(400).json({ error: "Status is required" });
        }else{
            // Find records
        const existingUser = await User.findOne({ where: { phone: user.phone } });
        const existingDoctor = await Dokta.findOne({ where: { phone: user.phone} });
        console.log(existingDoctor,existingUser)
        if (!existingUser || !existingDoctor) {
            return res.status(400).json({ error: "User not found" });
        }else{
            if (existingDoctor) {
            await existingDoctor.update({
                name: name.trim(),
                clinic: clinic.trim(),
                clinic_code: clinic_code.trim(),
                room: room.trim(),
                status: status
            });
            
            //If you need to update the user as well:
            if (existingUser) {
                await existingUser.update({
                    name: name.trim(),
                    counter: room.trim()
                });
            }

            return res.json({
                success: true,
                doctor: {
                    name: existingDoctor.name,
                    clinic: existingDoctor.clinic,
                    clinic_code: existingDoctor.clinic_code,
                    room: existingDoctor.room
                }
            });
        }

        return res.status(400).json({ error: "Doctor record not found" });
        }
        }

    } catch (error) {
        console.error("Error in edit_doctor_one:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
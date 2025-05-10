const express = require('express');
const { Clinic } = require('../models/index')
const router = express.Router();
const { Op } = require('sequelize')
const bcrypt = require("bcryptjs");
const { default: axios } = require('axios');
const cron = require('node-cron');


router.post('/create_clinic', async (req, res) => {
    const { cliniciname,clinicicode, status, deptcode } = req.body;
    try {
        if(cliniciname.trim() === ''){
            return res.status(400).json({ error: 'clinic name is required' });
        }if(clinicicode.trim() === ''){
            return res.status(400).json({ error: 'clinic code is required' });
        }else{
            const clinic = await Clinic.findOne({
                where: {clinicicode}
            })
            if(clinic){
                return res.status(400).json({ error: 'clinic exists' });  
            }else{
                const data = await Clinic.create(req.body)
                res.json(data)
            }
        }
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// get jeeva clinics
router.get('/jeeva_clinics', async (req, res) => {
    try {
        axios.get("http://192.168.235.65/dev/jeeva_api/swagger/clinics").then((data)=> {
            if(data.status === 200){
                res.json(data.data)
            }else{
                res.json(data.status)
            }
        }).catch((error)=> {
            res.status(500).json({ error: error });
        })
    } catch (err) {
        res.status(500).json({ error: err });
    }
});
// get clinics
router.get('/get_clinics', async (req, res) => {
    try {
        const clinics = await Clinic.findAll()
        res.json(clinics)
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

router.get("/get_display_clinics", async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const offset = (page - 1) * pageSize;
    try {
        const curr = await Clinic.findAndCountAll({
            offset: offset,
            limit: pageSize,
            order: [['createdAt', 'ASC']]
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

const job = cron.schedule('0 0 * * *', async () => {
    console.log('Cron job triggered at', new Date().toISOString());
  
    try {
      // Fetch data from the API
      const response = await axios.get('http://192.168.235.65/dev/jeeva_api/swagger/clinics');
  
      if (response.data.status !== 200 || !Array.isArray(response.data.data)) {
        console.error('Unexpected API response format:', response.data);
        return;
      }
  
      const apiClinics = response.data.data;
  
      // Fetch existing clinics from the database
      const dbClinics = await Clinic.findAll({
        attributes: ['clinicicode', 'cliniciname', 'status', 'deptcode'],
        raw: true,
      });
  
      // Find clinics from API not in the DB
      const reserves = apiClinics.filter(apiClinic => {
        return !dbClinics.some(dbClinic => dbClinic.clinicicode === apiClinic.clinicode);
      });
  
      // Insert new records
      if (reserves.length > 0) {
        await Clinic.bulkCreate(reserves.map(item => ({
          cliniciname: item.clinicname,
          clinicicode: item.clinicode,
          status: item.status,
          deptcode: item.deptcode,
        })));
        console.log(`${reserves.length} new clinics added to the database.`);
      } else {
        console.log('No new clinics to add.');
      }
  
    } catch (error) {
      console.error('Error in cron job:', error.message);
    }
  }, {
    scheduled: true, // ensures job is scheduled immediately
    timezone: "Africa/Dar_es_Salaam" // optional: set your local timezone
  });
  
  // Start the cron job explicitly (optional if `scheduled: true`)
  job.start();

module.exports = router;
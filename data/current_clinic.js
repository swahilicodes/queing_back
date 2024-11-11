const express = require('express')
const router = express.Router();
const { CurrentClinic} = require('../models/index')

router.post("/create_current", async (req,res)=> {
const { clinic_name, clinic_code } = req.body
try{
    const clinics = await CurrentClinic.findAll()
    if(clinics.length > 0){
        const clinic = clinics[0].update({
            clinic_code: clinic_code,
            clinic_name: clinic_name
        })
        res.json(clinics[0])
    }else{
        const clinic = await CurrentClinic.create({
            clinic_code,
            clinic_name
        })
        res.json(clinic)
    }
}catch(error){
    res.status(500).json({error: error})
}
})
module.exports = router
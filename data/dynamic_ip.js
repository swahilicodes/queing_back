const express = require('express')
const router = express.Router()
const {DynamicIp} = require('../models/index')
const {getIpByPurpose} = require('../functions/get_ip_by_purpose')

// create dynamic ip
router.post('/create_ip', async(req,res) => {
    const {ip} = req.body
    try{
        if(!ip || ip.trim()===''){
            return res.status(400).json({error: 'ip address is required'})
        }else{
            const newIp = await DynamicIp.create(req.body)
            res.json(newIp)
        }
    }catch(error){
        return res.status(500).json({error: error})
    }
})
// get dynamic ip
router.get('/get_ip', async(req,res) => {
    const {purpose} = req.query
    try{
        if(!purpose || purpose.trim()===''){
            return res.status(400).json({error: 'purpose is required'})
        }else{
            // const newIp = await getIpByPurpose(purpose)
            // res.json(newIp)
            res.json('here is the ip address 192.168.30.246 after setting up ci/cd pipelines')
        }
    }catch(error){
        console.log(error)
        return res.status(500).json({error: 'there is an error'})
    }
})

module.exports = router
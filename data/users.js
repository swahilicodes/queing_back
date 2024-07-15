const express = require('express');
const { User } = require('../models/index')
const router = express.Router();
const { Op } = require('sequelize')
const bcrypt = require("bcryptjs")
const jwt = require('jsonwebtoken')


router.post('/login', async (req, res) => {
    const {phone,password} = req.body
    try {
        if(phone.trim()===""){
            return res.status(400).json({error: 'phone is required'})
        }else if(password.trim()===''){
            return res.status(400).json({error: "password is required"})
        }else{
            const user = await User.findOne({
                where: {phone}
            })
            if(!user){
                return res.status(400).json({ error: 'user not found' });
            }else{
                const correct = await bcrypt.compare(password, user.password)
                if(!correct){
                    return res.status(400).json({ error: 'password not correct' });
                }else{
                const token = jwt.sign({phone,correct},"swahili codes",{expiresIn: 36*36})
                res.json(token);
                }
            }
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Get current administrator
router.get('/get_user', async (req, res) => {
    const {phone} = req.query
    try {
        if(phone.trim()===''){
            return res.status(400).json({ error: 'phone cannot be empty' }); 
        }else{
            const user = await User.findOne({
                where: {phone}
            })
            if(!user){
                return res.status(400).json({ error: 'user not found' });
            }else{
                res.json(user)
            }
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
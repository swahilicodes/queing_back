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
                const token = jwt.sign({phone,correct},"swahili codes",{expiresIn: "1y"})
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
// Get current administrator
router.put('/edit_user/:id', async (req, res) => {
    const id = req.params.id
    const {oldPass,newPass} = req.body
    try {
        if(oldPass.trim()===""){
            return res.status(400).json({ error: 'the old password is empty' }); 
        }else if(newPass.trim()===""){
            return res.status(400).json({ error: 'the new password is empty' });
        }else{
            const user = await User.findOne({
                where: {id}
            })
            if(!user){
                return res.status(400).json({ error: 'user not found' });
            }else{
                const correct = await bcrypt.compare(oldPass,user.password)
                if(!correct){
                    return res.status(400).json({ error: 'the old password is not correct' });
                }else{
                    const newPassnew = await bcrypt.hash(newPass,6)
                    user.update({password: newPassnew})
                    res.json(user)
                }
            }
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Edit user and roles
router.put('/edit_user_roles/:id', async (req, res) => {
    const id = req.params.id
    const {counter} = req.body
    console.log('editing please wait',id,counter)
    try {
        if(counter.trim()==="" || counter === undefined){
            return res.status(400).json({ error: 'counter is empty' }); 
        }else{
            const user = await User.findOne({
                where: {id}
            })
            if(!user){
                return res.status(400).json({ error: 'user not found' });
            }else{
                user.update({counter: counter})
                res.json(user)
            }
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
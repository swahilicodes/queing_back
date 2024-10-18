const express = require('express');
const { Suggestion } = require('../models/index')
const router = express.Router();


router.post('/create_suggestion', async (req, res) => {
    const { type, reason } = req.body;
    try {
        if(type.trim() === "") {
            return res.status(400).json({ error: 'name is required' });
        }else{
            const sugg = await Suggestion.create(req.body)
            res.json(sugg)
        }
    } catch (err) {
        //next({error: err})
        res.status(500).json({ error: err });
    }
});

module.exports = router;
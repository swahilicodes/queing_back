const express = require('express')
const router = express.Router();
const { Audio, Ticket } = require('../models/index');
const { Op } = require('sequelize')

router.post("/create_speaker", async (req, res) => {
    const { ticket_no, counter, stage, station, attendant_id, floor } = req.body
    console.log(req.body);

    const validStation = (station && station !== 'null' && station !== null) ? station : 'first';
    const validCounter = (counter && counter !== 'null' && counter !== null) ? counter : '1';
    try {
        const existingAudio = await Audio.findOne({
            where: {
                ticket_no: ticket_no,
                counter: validCounter,
                stage: stage,
                attendant_id: attendant_id,
                createdAt: {
                    [Op.gte]: new Date(Date.now() - 20 * 1000)
                }
            }
        });
        if (existingAudio) {
            return res.status(400).json({ error: "please wait for 30 seconds" });
        } else {
            const plai = await Audio.create({
                ticket_no,
                stage,
                station: validStation,
                counter: validCounter,
                attendant_id,
                floor
            })
            const ticket = await Ticket.findOne({
                where: { ticket_no }
            })
            if (ticket) {
                ticket.update({
                    calls: ticket.calls + 1,
                    serving: true,
                    counter: validCounter
                })
            }
            res.json(plai)
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error })
    }
})
// get all speakers
router.get("/get_speakers", async (req, res) => {
    const { floor } = req.query
    try {
        const speaks = await Audio.findAll({
            where: { station: floor }
        })
        res.json(speaks)
    } catch (error) {
        res.status(500).json({ error: error })
    }
})
// get all speakers
router.post("/delete_play", async (req, res) => {
    const { id } = req.body
    try {
        if (!id) {
            res.status(400).json({ error: "id is required" })
        } else {
            const play = await Audio.findOne({
                where: { id }
            })
            if (play) {
                await play.destroy()
                res.json(play)
            }
        }
    } catch (error) {
        res.status(500).json({ error: error })
    }
})
module.exports = router
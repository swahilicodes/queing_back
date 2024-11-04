const express = require('express');
const router = express.Router();
const axios = require('axios')

router.get('display_tokens_stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const sendData = async () => {
        try {
            axios.get('http://localhost:5000/tickets/get_display_tokens',{params:{stage: "meds", clinic_code: ""}}).then((data)=> {
                //res.write(data)
                res.write(`data: ${JSON.stringify(data)}\n\n`);
              }).catch((error)=> {
                res.write(`data: ${JSON.stringify({ error: 'Error fetching data' })}\n\n`);
                //res.write(error)
              })
        } catch (error) {
            res.write(error)
        }
    };

    // Send data immediately and then every 5 seconds
    sendData();
    const intervalId = setInterval(sendData, 5000);

    // Clean up on client disconnect
    req.on('close', () => {
        clearInterval(intervalId);
        res.end();
    });
});

module.exports = router;
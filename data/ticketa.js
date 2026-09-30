require("dotenv").config();
const express = require("express");
const router = express.Router();
const axios = require("axios");
const { Op } = require("sequelize");
const {
  Ticket,
  Attendant,
  Counter,
  Dokta,
  TokenBackup,
  InTime,
  PriorCode,
} = require("../models/index");

async function sendSMS({
  senderId = process.env.KILAKONA_SENDER_ID || "MLOGANZILA",
  message,
  contacts,
  apiKey = process.env.KILAKONA_API_KEY || process.env.kilakona_api_key,
  apiSecret = process.env.KILAKONA_API_SECRET || process.env.kilakona_api_secret,
  deliveryReportUrl = process.env.KILAKONA_CALLBACK_URL || "https://your-server.com/delivery-callback",
}) {
  const url = process.env.KILAKONA_URL || "https://messaging.kilakona.co.tz/api/v1/vendor/message/send";

  const data = {
    senderId,
    messageType: "text",
    message,
    contacts,
    deliveryReportUrl,
  };

  const headers = {
    "Content-Type": "application/json",
    api_key: apiKey,
    api_secret: apiSecret,
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data;
  } catch (error) {
    console.error("SMS sending failed:", error.response?.data || error.message);
    throw error;
  }
}

/**
 * Sends an SMS text notification to the next ticket in queue (e.g. ticket 002 when ticket 001 is called).
 * Does NOT invoke audio/speaker calls; only sends text SMS notification.
 */
async function sendSMSNextTicket(currentTicketNo) {
  try {
    if (!currentTicketNo) return;

    // 1. Fetch current ticket to identify floor, stage, and clinic_code
    const currentTicket = await Ticket.findOne({
      where: { ticket_no: currentTicketNo }
    });

    if (!currentTicket) {
      console.log(`[SMS] Current ticket ${currentTicketNo} not found in DB`);
      return;
    }

    // 2. Query next waiting ticket on the SAME floor and stage
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const whereClause = {
      serving: false,
      createdAt: { [Op.gte]: startOfDay },
      id: { [Op.gt]: currentTicket.id }
    };

    if (currentTicket.floor) {
      whereClause.floor = currentTicket.floor;
    }

    if (currentTicket.stage) {
      whereClause.stage = currentTicket.stage;
    }

    if (currentTicket.clinic_code) {
      whereClause.clinic_code = currentTicket.clinic_code;
    }

    let nextTicket = await Ticket.findOne({
      where: whereClause,
      order: [
        ["disabled", "DESC"],
        ["createdAt", "ASC"]
      ]
    });

    // Fallback: search for any unserved ticket on same floor & stage if ID > current.id yields none
    if (!nextTicket) {
      const fallbackClause = {
        serving: false,
        createdAt: { [Op.gte]: startOfDay },
        id: { [Op.ne]: currentTicket.id }
      };

      if (currentTicket.floor) fallbackClause.floor = currentTicket.floor;
      if (currentTicket.stage) fallbackClause.stage = currentTicket.stage;
      if (currentTicket.clinic_code) fallbackClause.clinic_code = currentTicket.clinic_code;

      nextTicket = await Ticket.findOne({
        where: fallbackClause,
        order: [
          ["disabled", "DESC"],
          ["createdAt", "ASC"]
        ]
      });
    }

    if (nextTicket && nextTicket.phone) {
      let phone = nextTicket.phone.toString().replace(/\s+/g, "");
      if (phone.startsWith("0") && phone.length === 10) {
        phone = "255" + phone.substring(1);
      }

      console.log(`[SMS] Sending next-in-line notification to ticket ${nextTicket.ticket_no} (Floor: ${nextTicket.floor}, Stage: ${nextTicket.stage}, Phone: ${phone})`);

      sendSMS({
        senderId: process.env.KILAKONA_SENDER_ID || "MLOGANZILA",
        message: `Namba yako ya foleni ni ${nextTicket.ticket_no} inafuata. Tafadhali kaa karibu utaitwa muda si mrefu karibu HOSPITALI YA TAIFA MUHIMBILI MLOGANZILA`,
        contacts: phone,
        apiKey: process.env.KILAKONA_API_KEY || process.env.kilakona_api_key,
        apiSecret: process.env.KILAKONA_API_SECRET || process.env.kilakona_api_secret,
      }).catch((err) => console.log("SMS next ticket error:", err));
    } else {
      console.log(`[SMS] No upcoming ticket found on floor "${currentTicket.floor}" after ticket ${currentTicketNo}`);
    }
  } catch (err) {
    console.error("Error in sendSMSNextTicket:", err);
  }
}

router.get("/today_ticks", async (req, res) => {
  // Set time boundaries in local time (UTC+3)
  const now = new Date();
  const offsetMs = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

  const startOfDay = new Date(now.getTime() + offsetMs);
  startOfDay.setUTCHours(0, 0, 0, 0); // set time in UTC, shifted

  const endOfDay = new Date(now.getTime() + offsetMs);
  endOfDay.setUTCHours(23, 59, 59, 999);

  console.log("startOfDay:", startOfDay, "endOfDay:", endOfDay);

  try {
    const count = await Ticket.findAll({
      where: {
        createdAt: {
          [Op.between]: [startOfDay, endOfDay],
        },
      },
    });
    res.json(count.length);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// create ticket
router.post("/create_ticket", async (req, res) => {
  const { phone, category, hasMedical, isNHIF, floor, isDiabetic, isChild } =
    req.body;

  if (!phone || phone.trim() === "") {
    return res.status(400).json({ error: "Namba ya simu ni lazima" });
  }

  let normalizedPhone = phone.replace(/\s+/g, "");

  if (!/^[0-9]+$/.test(normalizedPhone)) {
    return res.status(400).json({
      error: "Namba ya simu lazima iwe tarakimu tu",
    });
  }

  if (normalizedPhone.startsWith("0") && normalizedPhone.length === 10) {
    normalizedPhone = "255" + normalizedPhone.substring(1);
  }

  if (!/^255[0-9]{9}$/.test(normalizedPhone)) {
    return res.status(400).json({
      error: "Tafadhali ingiza namba sahihi ya simu",
    });
  }

  const transaction = await Ticket.sequelize.transaction();

  try {
    // get latest ticket number safely
    const [result] = await Ticket.sequelize.query(
      "SELECT ticket_no FROM tickets ORDER BY CAST(ticket_no AS UNSIGNED) DESC LIMIT 1",
      { transaction },
    );

    let ticket_no;
    if (result.length === 0) {
      ticket_no = "001";
    } else {
      const lastNumber = parseInt(result[0].ticket_no, 10);
      ticket_no = (lastNumber + 1).toString().padStart(3, "0");
    }

    // stage & status depend on hasMedical + isNHIF + category
    let stage, status;
    if (hasMedical) {
      stage =
        category === "insurance" ? (isNHIF ? "accounts" : "meds") : "accounts";

      status =
        category === "insurance"
          ? isNHIF
            ? "insurance"
            : "waiting"
          : "waiting";
    } else {
      stage = "meds";
      status =
        category === "insurance"
          ? isNHIF
            ? "insurance"
            : "waiting"
          : "waiting";
    }

    // create new ticket
    const ticket = await Ticket.create(
      {
        phone,
        ticket_no,
        category,
        stage,
        status,
        floor,
        isDiabetic,
        isChild,
      },
      { transaction },
    );

    // also create backup
    await TokenBackup.create(
      {
        phone,
        ticket_no,
        category,
        stage,
        status,
        floor,
        isChild,
        isDiabetic,
      },
      { transaction },
    );

    await transaction.commit();

    // send SMS
    sendSMS({
      senderId: process.env.KILAKONA_SENDER_ID || "MLOGANZILA",
      message: `Namba yako ya foleni ni ${ticket.ticket_no} Tafadhali kaa karibu utaitwa muda si mrefu karibu HOSPITALI YA TAIFA MUHIMBILI MLOGANZILA`,
      contacts: `${ticket.phone}`,
      apiKey: process.env.KILAKONA_API_KEY || process.env.kilakona_api_key,
      apiSecret: process.env.KILAKONA_API_SECRET || process.env.kilakona_api_secret,
    }).catch((err) => console.log("SMS error", err));

    res.json(ticket);
  } catch (err) {
    await transaction.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to create ticket" });
  }
});


router.post("/to_meds", async (req, res) => {
  const { id } = req.body;
  try {
    const ticket = await Ticket.findOne({
      where: { id },
    });
    if (ticket) {
      ticket.update({
        stage: "meds",
      });
      res.json(ticket);
    } else {
      return res.status(400).json({ error: "Ticket Not Found" });
    }
  } catch (err) {
    res.status(500).json({ error: err });
  }
});
router.post("/priotize", async (req, res) => {
  const { ticket_no, code } = req.body;
  try {
    const ticket = await Ticket.findOne({
      where: { ticket_no: ticket_no },
    });
    if (ticket) {
      const coder = await PriorCode.findOne({
        where: { code },
      });
      if (coder) {
        ticket.update({
          disability: "Fast Track",
          disabled: true,
        });
        res.json(ticket);
      } else {
        return res.status(400).json({ error: "Priority code is not correct" });
      }
    } else {
      return res.status(400).json({ error: "Ticket Not Found" });
    }
  } catch (err) {
    res.status(500).json({ error: err });
  }
});

router.sendSMS = sendSMS;
router.sendSMSNextTicket = sendSMSNextTicket;

module.exports = router;

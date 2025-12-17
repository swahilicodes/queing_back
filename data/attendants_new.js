'use strict';

const express = require('express');
const { Doctor, TokenBackup } = require('../models/index');
const { Sequelize, Op } = require('sequelize');
const router = express.Router();

const roleFieldMap = {
  medical_recorder: 'recorder_id',
  accountant: 'cashier_id',
  nurse: 'nurse_id',
  doctor: 'doctor_id',
};

const roleTimeFieldMap = {
  medical_recorder: 'med_time',
  accountant: 'account_time',
  nurse: 'station_time',
  doctor: 'clinic_time',
};

const stageToRoleMap = {
  meds: 'medical_recorder',
  accounts: 'accountant',
  nurse_station: 'nurse',
  clinic: 'doctor',
  all: null,
};

const validRoles = Object.keys(roleFieldMap);
const validStages = Object.keys(stageToRoleMap);
const validDurations = ['day', 'week', 'month', 'year', 'all', 'custom'];

function getDateRange(duration, start_date, end_date) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  // Adjust for UTC database (EAT is UTC+3, so subtract 3 hours for UTC)
  const utcOffset = -3 * 60 * 60 * 1000;

  switch (duration.toLowerCase()) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      start.setTime(start.getTime() + utcOffset);
      end.setTime(end.getTime() + utcOffset);
      break;

    case 'week':
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(diff + 6);
      end.setHours(23, 59, 59, 999);
      start.setTime(start.getTime() + utcOffset);
      end.setTime(end.getTime() + utcOffset);
      break;

    case 'month':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      start.setTime(start.getTime() + utcOffset);
      end.setTime(end.getTime() + utcOffset);
      break;

    case 'year':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      start.setTime(start.getTime() + utcOffset);
      end.setTime(end.getTime() + utcOffset);
      break;

    case 'custom':
      if (start_date && end_date) {
        let start = new Date(start_date);
        let end = new Date(end_date);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        start.setTime(start.getTime() + utcOffset);
        end.setTime(end.getTime() + utcOffset);
        return { start, end };
      }
      throw new Error('Custom range requires both start_date and end_date.');

    case 'all':
    default:
      return { start: new Date(0), end: new Date(now.getTime() + utcOffset) };
  }

  console.log(`Date range for ${duration} (UTC): ${start.toISOString()} to ${end.toISOString()}`);
  return { start, end };
}

function formatProcessingTime(minutes) {
  if (!minutes || minutes <= 0) return '0s';

  const totalSeconds = Math.round(minutes * 60);
  const hours = Math.floor(totalSeconds / 3600);
  const remainingSecondsAfterHours = totalSeconds % 3600;
  const mins = Math.floor(remainingSecondsAfterHours / 60);
  const secs = remainingSecondsAfterHours % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

const calculateScore = async (totalTickets, role, dateRange) => {
  const timeField = roleTimeFieldMap[role.toLowerCase()];
  if (!timeField) {
    console.warn(`No time field for role "${role}"`);
    return 0;
  }

  const departmentTickets = await TokenBackup.count({
    where: {
      [timeField]: { 
        [Op.ne]: null,
        [Op.between]: [dateRange.start, dateRange.end] 
      }
    },
  });

  console.log(`Department tickets for ${role} (${timeField}): ${departmentTickets}`);

  const score = departmentTickets > 0
    ? Math.min(Math.round((totalTickets / departmentTickets) * 100), 100)
    : 0;

  console.log('average score is ', score);
  return score;
};

const getDoctorMetrics = async (doctor, dateRange) => {
  const { phone, role, name } = doctor;
  if (!role) {
    console.warn(`Doctor ${name} (${phone}) has no role defined`);
    return {
      name,
      phone,
      role: null,
      totalTickets: 0,
      avgProcessingTime: '0s',
      score: 0
    };
  }

  const field = roleFieldMap[role.toLowerCase()];
  if (!field) {
    console.warn(`Invalid role "${role}" for doctor ${name} (${phone})`);
    return {
      name,
      phone,
      role,
      totalTickets: 0,
      avgProcessingTime: '0s',
      score: 0
    };
  }

  const timeField = roleTimeFieldMap[role.toLowerCase()];
  if (!timeField) {
    console.warn(`No time field for role "${role}"`);
    return {
      name,
      phone,
      role,
      totalTickets: 0,
      avgProcessingTime: '0s',
      score: 0
    };
  }

  const totalTickets = await TokenBackup.count({
    where: {
      [field]: phone,
      [timeField]: { 
        [Op.ne]: null,
        [Op.between]: [dateRange.start, dateRange.end] 
      }
    },
  });

  console.log(`Total tickets for ${name} (${role}): ${totalTickets}`);

  let avgProcessingTime = '0s';
  let score = 0;

  if (totalTickets > 0) {
    const processingTimes = await TokenBackup.findAll({
      where: {
        [field]: phone,
        [timeField]: { 
          [Op.ne]: null,
          [Op.between]: [dateRange.start, dateRange.end] 
        },
        dateTime: { [Op.ne]: null },
        [Op.and]: Sequelize.literal(`TIMESTAMPDIFF(SECOND, dateTime, ${timeField}) BETWEEN 0 AND ${24 * 3600}`)
      },
      attributes: [
        [Sequelize.fn('AVG', Sequelize.literal(`TIMESTAMPDIFF(SECOND, dateTime, ${timeField}) / 60.0`)), 'avgProcessingTime'],
      ],
      raw: true,
    });

    const avgMinutes = processingTimes[0]?.avgProcessingTime
      ? Number(parseFloat(processingTimes[0].avgProcessingTime).toFixed(2))
      : 0;

    console.log(`Raw avg processing time for ${name} (${role}): ${avgMinutes} minutes`);

    if (avgMinutes > 24 * 60) {
      console.warn(`Unrealistic avg processing time for ${name} (${role}): ${avgMinutes} minutes, capping at 24 hours`);
      avgProcessingTime = formatProcessingTime(24 * 60);
    } else {
      avgProcessingTime = formatProcessingTime(avgMinutes);
    }

    score = await calculateScore(totalTickets, role, dateRange);
  }

  return { 
    name, 
    phone, 
    role, 
    totalTickets, 
    avgProcessingTime, 
    score 
  };
};

router.get('/top-performers', async (req, res) => {
  try {
    const { duration = 'day', start_date, end_date, stage = 'all', name, page = 1 } = req.query;
    const limit = 8;

    // Validate duration
    if (!validDurations.includes(duration.toLowerCase())) {
      return res.status(400).json({ error: `Invalid duration. Must be one of: ${validDurations.join(', ')}` });
    }

    // Validate stage
    if (stage && !validStages.includes(stage.toLowerCase())) {
      return res.status(400).json({ error: `Invalid stage. Must be one of: ${validStages.join(', ')}` });
    }

    // Validate page
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: 'Invalid page number. Must be a positive integer.' });
    }

    // Get date range
    let dateRange;
    try {
      dateRange = getDateRange(duration, start_date, end_date);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    // Build doctor query
    const where = {};
    const mappedStage = stageToRoleMap[stage.toLowerCase()];
    if (mappedStage !== null && mappedStage !== undefined) {
      where.role = mappedStage;
    }
    if (name) {
      where.name = { [Op.like]: `%${name}%` };
    }

    const doctors = await Doctor.findAll({
      attributes: ['phone', 'name', 'role'],
      where,
    });

    if (!doctors.length) {
      return res.status(404).json({ 
        error: 'No doctors found', 
        details: `No doctors match the stage '${stage}'${name ? ` and name '${name}'` : ''}` 
      });
    }

    // Calculate department counts
    const departmentCounts = {
      medical_recorders: 0,
      accountants: 0,
      nurses: 0,
      doctors: 0,
      all: 0
    };

    const roleCounts = await Doctor.findAll({
      attributes: [
        'role',
        [Sequelize.fn('COUNT', Sequelize.col('role')), 'count']
      ],
      group: ['role'],
      raw: true
    });

    roleCounts.forEach(({ role, count }) => {
      const normalizedRole = role ? role.toLowerCase() : null;
      if (normalizedRole === 'medical_recorder') {
        departmentCounts.medical_recorders = count;
      } else if (normalizedRole === 'accountant') {
        departmentCounts.accountants = count;
      } else if (normalizedRole === 'nurse') {
        departmentCounts.nurses = count;
      } else if (normalizedRole === 'doctor') {
        departmentCounts.doctors = count;
      }
    });

    departmentCounts.all = departmentCounts.medical_recorders + 
                          departmentCounts.accountants + 
                          departmentCounts.nurses + 
                          departmentCounts.doctors;

    const performers = [];
    const invalidRoles = new Set();

    for (const doctor of doctors) {
      const metrics = await getDoctorMetrics(doctor, dateRange);
      performers.push(metrics);
      
      if (!doctor.role || !validRoles.includes(doctor.role.toLowerCase())) {
        if (doctor.role) invalidRoles.add(doctor.role);
      }
    }

    if (invalidRoles.size > 0) {
      console.warn(`Doctors with invalid roles: ${[...invalidRoles].join(', ')}`);
    }

    // Sort by score in descending order
    performers.sort((a, b) => b.score - a.score);

    // Pagination
    const totalItems = performers.length;
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (pageNum - 1) * limit;
    const paginatedPerformers = performers.slice(offset, offset + limit);

    if (paginatedPerformers.length === 0 && totalItems > 0) {
      return res.status(400).json({ 
        error: 'Page out of range', 
        details: `Requested page ${pageNum} exceeds total pages ${totalPages}` 
      });
    }

    return res.json({
      data: paginatedPerformers,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems,
        itemsPerPage: limit
      },
      departmentCounts
    });
  } catch (error) {
    console.error('Error fetching top performers:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { Device, AttendClinic } = require('../models/index')
const os = require("os");
const si = require("systeminformation");

router.get("/get_device_id", async (req, res) => {
    const networkInterfaces = os.networkInterfaces();
    let macAddress;
    for (const interfaceName in networkInterfaces) {
      const iface = networkInterfaces[interfaceName];
      for (const config of iface) {
        if (!config.internal && config.mac) {
          macAddress = config.mac;
          break;
        }
      }
      if (macAddress) break;
    }

    // Get device name
    const deviceName = os.hostname();

    // Get model and manufacturer information
    const systemInfo = await si.system();
    const deviceModel = systemInfo.model;
    const manufacturer = systemInfo.manufacturer;

    const data = {
      macAddress,
      deviceName,
      deviceModel,
      manufacturer,
    };
    const isEmpty = (obj) => {
        return Object.keys(obj).length === 0;
      };
      try{
        if(!isEmpty(data) && macAddress){
            const device = await Device.findOne({
                where: {macAddress}
            })
            if(!device){
                const div = await Device.create({
                    macAddress: macAddress,
                    deviceName: deviceName,
                    deviceModel: deviceModel,
                    manufucturer: manufacturer 
                 })
                 const clinics = await AttendClinic.findAll({
                  where: {attendant_id: div.macAddress}
              })
                 res.json({
                  id: div.id,
                  macAddress: div.macAddress,
                  manufucturer:div.manufucturer,
                  deviceName: div.deviceName,
                  deviceModel: div.deviceModel,
                  default_page: div.default_page,
                  role: div.role,
                  createdAt: div.createdAt,
                  updatedAt: div.updatedAt,
                  clinics: clinics
                 })
            }else{
              device.update({
                macAddress: macAddress,
                deviceName: deviceName,
                deviceModel: deviceModel,
                manufucturer: manufacturer 
              })
              const clinics = await AttendClinic.findAll({
                where: {attendant_id: device.macAddress}
            })
            console.log('device clinics are ',clinics)
              res.json({
                id: device.id,
                macAddress: device.macAddress,
                manufucturer:device.manufucturer,
                deviceName: device.deviceName,
                deviceModel: device.deviceModel,
                default_page: device.default_page,
                role: device.role,
                createdAt: device.createdAt,
                updatedAt: device.updatedAt,
                clinics: clinics
               })
            }
        }
      }catch(error) {
        res.status(500).json({ error: error });
      }
});
router.get("/get_devices", async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const offset = (page - 1) * pageSize;
  try {
      const curr = await Device.findAndCountAll({
          offset: offset,
          limit: pageSize,
          order: [['createdAt', 'ASC']]
      })
      const clinics = await AttendClinic.findAll()
      const result = curr.rows.map((item)=> {
        const clinica = clinics.filter((id)=> id.attendant_id===item.macAddress)
        return {
          id: item.id,
          macAddress: item.macAddress,
          deviceName: item.deviceName,
          deviceModel: item.deviceModel,
          manufucturer: item.manufucturer,
          default_page: item.default_page,
          role: item.role,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          clinics: clinica
        }
      })
      res.json({
          data: result,
          totalItems: curr.count,
          totalPages: Math.ceil(curr.count / pageSize),
        });
  } catch (err) {
      //next({error: err})
      res.status(500).json({ error: err });
  }
});
// edit device
router.get("/edit_device", async (req, res) => {
  const { page, id } = req.query
  try {
    if(id.trim()===""){
      res.status(400).json({error: "id is empty"})
    }else{
      const div = await Device.findOne({
        where: {id: Number(id)}
      })
      if(div){
        div.update({
          default_page: page
        })
        res.json(div)
      }else{
        res.status(400).json({error: "device not found"})
      }
    }
  } catch (err) {
      //next({error: err})
      res.status(500).json({ error: err });
  }
});
// delete device
router.get("/delete_device", async (req, res) => {
  const {id} = req.query
  try {
    if(id.trim()===""){
      res.status(400).json({error: "id is empty"})
    }else{
      const div = await Device.findOne({
        where: {id: Number(id)}
      })
      if(div){
        div.destroy()
        res.json(div)
      }else{
        res.status(400).json({error: "device not found"})
      }
    }
  } catch (err) {
      //next({error: err})
      res.status(500).json({ error: err });
  }
});

module.exports = router;

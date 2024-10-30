const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { Device } = require('../models/index')
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
                 res.json(div)
            }else{
              device.update({
                macAddress: macAddress,
                deviceName: deviceName,
                deviceModel: deviceModel,
                manufucturer: manufacturer 
              })
              res.json(device)
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
      res.json({
          data: curr.rows,
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

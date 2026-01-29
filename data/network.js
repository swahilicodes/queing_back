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
// create new device
router.post("/create_update", async (req, res) => {
  const { macAddress, deviceModel, deviceName, manufacturer } = req.body
  try{
    const device = await Device.findOne({
      where: {macAddress}
  })
  if(!device){
      const div = await Device.create({
          macAddress: macAddress,
          deviceName: `${deviceName}`,
          deviceModel: `${deviceModel}`,
          manufucturer: `${manufacturer}` 
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
    // device.update({
    //   macAddress: macAddress,
    //   deviceName: deviceName,
    //   deviceModel: deviceModel,
    //   manufucturer: manufacturer 
    // })
    const clinics = await AttendClinic.findAll({
      where: {attendant_id: device.macAddress}
  })
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
      window: device.window,
      clinics: clinics
     })
  }
  }catch(error){

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
          window: item.window,
          floor: item.floor,
          isChild: item.isChild,
          isDiabetic: item.isDiabetic,
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
// get a single device
router.get("/get_device", async (req, res) => {
  const {id} = req.query
  try {
      const curr = await Device.findOne({
          where: {
            macAddress: id
          }
      })
      res.json(curr)
  } catch (err) {
      //next({error: err})
      res.status(500).json({ error: err });
  }
});
// edit device
// router.get("/edit_device", async (req, res) => {
//   const { page, id, deviceName, deviceModel, manufucturer,window } = req.query
//   try {
//     if(id.trim()===""){
//       res.status(400).json({error: "id is empty"})
//     }else{
//       const div = await Device.findOne({
//         where: {id: Number(id)}
//       })
//       if(div){
//         div.update({
//           default_page: page,
//           deviceModel: deviceModel,
//           deviceName: deviceName,
//           manufucturer: manufucturer,
//           window: window
//         })
//         res.json(div)
//       }else{
//         res.status(400).json({error: "device not found"})
//       }
//     }
//   } catch (err) {
//       //next({error: err})
//       res.status(500).json({ error: err });
//   }
// });
router.post("/edit_device", async (req, res) => {
  const {
    id,
    page,
    deviceName,
    deviceModel,
    manufucturer,
    window: deviceWindow,
    floor,
    isChild,
    isDiabetic
  } = req.body;
  try {
    if (!id) {
      return res.status(400).json({ error: "id is required" });
    }

    const device = await Device.findOne({
      where: { id: Number(id) }
    });

    if (!device) {
      return res.status(404).json({ error: "device not found" });
    }

    await device.update({
      default_page: page,
      deviceName: deviceName,
      deviceModel: deviceModel,
      manufucturer: manufucturer,
      window: deviceWindow,
      floor: floor,
      isChild: isChild===true?1:0,
      isDiabetic: isDiabetic===true?1:0
    });
    return res.json(device);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
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
// get all device
router.get("/get_all_devices", async (req, res) => {
  try {
    const devices = await Device.findAll()
    res.json(devices)
  } catch (err) {
      //next({error: err})
      res.status(500).json({ error: err });
  }
});

module.exports = router;

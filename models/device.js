'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Device extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Device.init({
    macAddress: {
      type: DataTypes.STRING,
      allowNull: false
    },
    deviceName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    deviceModel: {
      type: DataTypes.STRING,
      allowNull: false
    },
    manufucturer: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clinics: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true
    },
    window: {
      type: DataTypes.STRING,
      allowNull: true
    },
    floor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isDiabetic: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    isChild: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    default_page: {
      type: DataTypes.STRING,
      allowNull: true
    },
  }, {
    sequelize,
    modelName: 'Device',
    tableName: 'devices'
  });
  return Device;
};
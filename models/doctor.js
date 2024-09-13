'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Doctor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Doctor.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    service: {
      type: DataTypes.STRING,
      allowNull: false
    },
    room: {
      type: DataTypes.STRING,
      allowNull: false
    },
    occupied: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    current_patient: {
      type: DataTypes.STRING,
      allowNull: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      default: "doctor"
    },
    display_photo: {
      type: DataTypes.STRING,
      allowNull: true,
      default: "doctor"
    },
  }, {
    sequelize,
    modelName: 'Doctor',
    tableName: 'doctors'
  });
  return Doctor;
};
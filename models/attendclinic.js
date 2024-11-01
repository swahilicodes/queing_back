'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AttendClinic extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  AttendClinic.init({
    clinic: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clinic_code: {
      type: DataTypes.STRING,
      allowNull: false
    },
    attendant_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
  }, {
    sequelize,
    modelName: 'AttendClinic',
    tableName: 'attendant_clinics'
  });
  return AttendClinic;
};
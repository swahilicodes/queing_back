'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Ticket extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Ticket.init({
    ticket_no: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: true
    },
    floor: {
      type: DataTypes.STRING,
      defaultValue: "first",
      allowNull: true,
    },
    isDiabetic: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
    isChild: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    },
    stage: {
      type: DataTypes.STRING,
      defaultValue: "meds"
      // allowNull: false,
    },
    mr_no: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    clinic: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    clinic_code: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    age: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    consult_doctor: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    disabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    dateTime: {
      type: DataTypes.DATE,
      defaultValue: new Date(),
      allowNull: false,
    },
    disability: {
      type: DataTypes.STRING,
      defaultValue: null
    },
    calls: {
      type: DataTypes.INTEGER,
      allowNull: true,
      default: 0
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      default: "waiting"
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    med_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    account_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    station_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    clinic_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    recorder_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    cashier_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    nurse_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    counter: {
      allowNull: true,
      type: DataTypes.INTEGER,
    },
    doctor_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    serving_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paid: {
      allowNull: false,
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    serving: {
      allowNull: false,
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    name: {
      allowNull: true,
      type: DataTypes.STRING,
    },
  }, {
    sequelize,
    modelName: 'Ticket',
    tableName: 'tickets'
  });
  return Ticket;
};
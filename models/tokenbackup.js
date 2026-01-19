'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TokenBackup extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  TokenBackup.init({
    ticket_no: {
      type: DataTypes.STRING(10),
      allowNull: false,
      unique: false
    },
    stage: {
      type: DataTypes.STRING,
      allowNull: false,
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
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    age: {
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
    status: {
      type: DataTypes.STRING,
      allowNull: true,
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
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: new Date().toISOString().slice(0, 10)
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
    doctor_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    paid: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    floor: {
        type: DataTypes.STRING,
        defaultValue: 'first',
        allowNull: false
      },
      isChild: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true
      },
      isDiabetic: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true
      },
  }, {
    sequelize,
    modelName: 'TokenBackup',
    tableName: 'tokenbackups'
  });
  return TokenBackup;
};
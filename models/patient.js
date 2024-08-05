'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Patient extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Patient.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clinic: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mr_no: {
      type: DataTypes.STRING,
      allowNull: false
    },
    age: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sex: {
      type: DataTypes.STRING,
      allowNull: false
    },
    reg_date: {
      type: DataTypes.STRING,
      allowNull: false
    },
    reg_time: {
      type: DataTypes.STRING,
      allowNull: false
    },
    consult_date: {
      type: DataTypes.STRING,
      allowNull: true
    },
    consult_time: {
      type: DataTypes.STRING,
      allowNull: true
    },
    doctor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    consult_doctor: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Patient',
    tableName: 'patients'
  });
  return Patient;
};
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
      type: DataTypes.DATE,
      allowNull: false
    },
    reg_time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    consult_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    consult_time: {
      type: DataTypes.TIME,
      allowNull: true
    },
    doctor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    consult_doctor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    patient_type: {
      type: DataTypes.STRING,
      allowNull: false
    },
    patient_category: {
      type: DataTypes.STRING,
      allowNull: false
    },
    examption_category: {
      type: DataTypes.STRING,
      allowNull: true
    },
    initial_diagnosis: {
      type: DataTypes.STRING,
      allowNull: true
    },
    credit_company_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    membership_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    emp_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    comp_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    paid_status: {
      type: DataTypes.STRING,
      allowNull: false
    },
    paid_amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    amount_to_be_paid: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    visit: {
      type: DataTypes.STRING,
      allowNull: false
    },
    created_by: {
      type: DataTypes.STRING,
      allowNull: false
    },
    comp_amount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
  }, {
    sequelize,
    modelName: 'Patient',
    tableName: 'patients'
  });
  return Patient;
};
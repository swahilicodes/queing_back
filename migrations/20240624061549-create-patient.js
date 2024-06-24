'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('patients', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      clinic: {
        type: Sequelize.STRING,
        allowNull: false
      },
      mr_no: {
        type: Sequelize.STRING,
        allowNull: false
      },
      age: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sex: {
        type: Sequelize.STRING,
        allowNull: false
      },
      reg_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      reg_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      consult_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      consult_time: {
        type: Sequelize.TIME,
        allowNull: true
      },
      doctor: {
        type: Sequelize.STRING,
        allowNull: true
      },
      consult_doctor: {
        type: Sequelize.STRING,
        allowNull: true
      },
      patient_type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      patient_category: {
        type: Sequelize.STRING,
        allowNull: false
      },
      examption_category: {
        type: Sequelize.STRING,
        allowNull: true
      },
      initial_diagnosis: {
        type: Sequelize.STRING,
        allowNull: true
      },
      credit_company_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      membership_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      emp_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      comp_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      paid_status: {
        type: Sequelize.STRING,
        allowNull: false
      },
      paid_amount: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      amount_to_be_paid: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      visit: {
        type: Sequelize.STRING,
        allowNull: false
      },
      created_by: {
        type: Sequelize.STRING,
        allowNull: false
      },
      comp_amount: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('patients');
  }
};
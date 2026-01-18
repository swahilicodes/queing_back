'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tickets', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        default: "waiting"
      },
      dateTime: {
        type: Sequelize.DATE,
        defaultValue: new Date(),
        allowNull: false,
      },
      ticket_no: {
        type: Sequelize.STRING(10),
        allowNull: false,
        unique: true
      },
      stage: {
        type: Sequelize.STRING,
        defaultValue: "meds"
        // allowNull: false,
      },
      floor: {
        type: Sequelize.STRING,
        default: "first",
        allowNull: true,
      },
      isDiabetic: {
        type: Sequelize.BOOLEAN,
        default: false,
        allowNull: true,
      },
      isChild: {
        type: Sequelize.BOOLEAN,
        default: false,
        allowNull: true,
      },
      mr_no: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      category: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      age: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      clinic: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      clinic_code: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      gender: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      consult_doctor: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      disability: {
        type: Sequelize.STRING,
        defaultValue: null
      },
      disabled: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      med_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      account_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      station_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      clinic_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      recorder_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      cashier_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      calls: {
        type: Sequelize.INTEGER,
        allowNull: true,
        default: 0
      },
      nurse_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      doctor_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      serving_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      paid: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      serving: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      name: {
        allowNull: true,
        type: Sequelize.STRING,
      },
      counter: {
        allowNull: true,
        type: Sequelize.INTEGER,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('tickets');
  }
};
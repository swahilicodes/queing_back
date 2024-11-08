'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('tokenbackups', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      dateTime: {
        type: Sequelize.DATE,
        defaultValue: new Date(),
        allowNull: false,
      },
      ticket_no: {
        type: Sequelize.STRING(10),
        allowNull: false,
        unique: false
      },
      stage: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      mr_no: {
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
        allowNull: false
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
      nurse_id: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      doctor_id: {
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
      paid: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
    await queryInterface.dropTable('tokenbackups');
  }
};
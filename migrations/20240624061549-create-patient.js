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
      status: {
        type: Sequelize.STRING,
        allowNull: false
      },
      reg_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      consult_date: {
        type: Sequelize.DATE,
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
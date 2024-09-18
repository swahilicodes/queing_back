'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('doctors', {
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
      phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      service: {
        type: Sequelize.STRING,
        allowNull: false
      },
      clinic: {
        type: Sequelize.STRING,
        allowNull: true
      },
      room: {
        type: Sequelize.STRING,
        allowNull: false
      },
      occupied: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      current_patient: {
        type: Sequelize.STRING,
        allowNull: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
        default: "doctor"
      },
      display_photo: {
        type: Sequelize.STRING,
        allowNull: true,
        default: "doctor"
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
    await queryInterface.dropTable('doctors');
  }
};
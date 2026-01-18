'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('devices', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      macAddress: {
        type: Sequelize.STRING,
        allowNull: false
      },
      deviceName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      deviceModel: {
        type: Sequelize.STRING,
        allowNull: false
      },
      manufucturer: {
        type: Sequelize.STRING,
        allowNull: false
      },
      clinics: {
        type: Sequelize.STRING,
        allowNull: true
      },
      default_page: {
        type: Sequelize.STRING,
        allowNull: true
      },
      role: {
        type: Sequelize.STRING,
        allowNull: true
      },
      window: {
        type: Sequelize.STRING,
        allowNull: true
      },
      floor: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isDiabetic: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      isChild: {
        type: Sequelize.BOOLEAN,
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
    await queryInterface.dropTable('devices');
  }
};
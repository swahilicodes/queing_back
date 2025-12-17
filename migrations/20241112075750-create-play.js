'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('plays', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      ticket_no: {
        type: Sequelize.STRING,
        allowNull: false
      },
      counter: {
        type: Sequelize.STRING,
        allowNull: false
      },
      stage: {
        type: Sequelize.STRING,
        allowNull: false
      },
      station: {
        type: Sequelize.STRING,
        allowNull: false
      },
      floor: {
        type: Sequelize.STRING,
        allowNull: false
      },
      talking: {
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
    await queryInterface.dropTable('plays');
  }
};
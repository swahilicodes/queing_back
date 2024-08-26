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
        default:"waiting"
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
      disability: {
        type: Sequelize.STRING,
        defaultValue: null
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false,
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
    await queryInterface.dropTable('tickets');
  }
};
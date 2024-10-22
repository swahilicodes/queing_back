'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Room extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Room.init({
    namba: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clinic: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clinic_code: {
      type: DataTypes.STRING,
      allowNull: false
    },
  }, {
    sequelize,
    modelName: 'Room',
    tableName: 'rooms'
  });
  return Room;
};
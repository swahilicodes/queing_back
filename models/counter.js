'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Counter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Counter.init({
    namba: {
      type: DataTypes.STRING,
      allowNull: false
    },
    service: {
      type: DataTypes.STRING,
      allowNull: false
    },
    subservice: {
      type: DataTypes.STRING,
      allowNull: true
    },
  }, {
    sequelize,
    modelName: 'Counter',
    tableName:"counters"
  });
  return Counter;
};
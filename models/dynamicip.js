'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DynamicIp extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  DynamicIp.init({
    ip: {
      type: DataTypes.STRING,
      allowNull: false
    },
    purpose: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'dynamics',
    modelName: 'DynamicIp',
  });
  return DynamicIp;
};
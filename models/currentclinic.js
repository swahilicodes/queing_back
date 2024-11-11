'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CurrentClinic extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  CurrentClinic.init({
    clinic_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    clinic_code: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'CurrentClinic',
    tableName: 'currentclinic'
  });
  return CurrentClinic;
};
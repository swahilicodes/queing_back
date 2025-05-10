'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Active extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Active.init({
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false
    },
    page: {
      type: DataTypes.STRING,
      allowNull: false
    },
    video: {
      type: DataTypes.STRING,
      allowNull: false
    },
    device: {
      type: DataTypes.STRING,
      allowNull: true
    },
  }, {
    sequelize,
    modelName: 'Active',
    tableName: 'active'
  });
  return Active;
};
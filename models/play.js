'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Play extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Play.init({
    ticket_no: {
      type: DataTypes.STRING,
      allowNull: false
    },
    counter: {
      type: DataTypes.STRING,
      allowNull: false
    },
    stage: {
      type: DataTypes.STRING,
      allowNull: false
    },
    station: {
      type: DataTypes.STRING,
      allowNull: false
    },
    floor: {
        type: DataTypes.STRING,
        allowNull: false
      },
    talking: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
  }, {
    sequelize,
    modelName: 'Play',
    tableName: "plays"
  });
  return Play;
};
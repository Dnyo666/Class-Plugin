import { DataTypes } from 'sequelize'
import BaseModel from './BaseModel.js'

export default class TimeConfig extends BaseModel {
  static schema = {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // 节数范围 如:1-2
    section: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // 开始时间 如:08:00
    startTime: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // 结束时间 如:09:40
    endTime: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }

  static initConfig = {
    tableName: 'time_config'
  }
} 
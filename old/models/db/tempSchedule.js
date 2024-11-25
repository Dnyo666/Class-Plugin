import { DataTypes } from 'sequelize'
import BaseModel from './BaseModel.js'

export default class TempSchedule extends BaseModel {
  static schema = {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    // 原课程ID
    scheduleId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    // 调课日期
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    // 调整到第几节
    section: DataTypes.INTEGER,
    // 临时教室  
    location: DataTypes.STRING
  }

  static initConfig = {
    tableName: 'temp_schedule',
    timestamps: true
  }
} 
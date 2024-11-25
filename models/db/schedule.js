import { DataTypes } from 'sequelize'
import BaseModel from './BaseModel.js'

export default class Schedule extends BaseModel {
  static schema = {
    id: {
      type: DataTypes.STRING,
      primaryKey: true
    },
    // 用户QQ
    userId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: DataTypes.STRING,
    teacher: DataTypes.STRING,
    location: DataTypes.STRING,
    weekDay: DataTypes.INTEGER,
    // 节数范围 如:1-2
    section: DataTypes.STRING,
    // 周数配置 如:[1,3,5,7,9,11,13,15] 表示单周
    weeks: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    // 周数类型:all-所有周,odd-单周,even-双周
    weekType: {
      type: DataTypes.STRING,
      defaultValue: 'all'
    },
    remind: {
      type: DataTypes.JSON,
      defaultValue: {
        enable: true,
        time: 10,
        type: 'group'
      }
    }
  }

  static initConfig = {
    tableName: 'schedule',
    timestamps: true
  }
} 
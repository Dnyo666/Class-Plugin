import { sequelize, DataTypes } from './base.js'

const ScheduleTable = sequelize.define('schedule', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  teacher: DataTypes.STRING,
  location: DataTypes.STRING,
  weekDay: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  section: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  weeks: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  remind: {
    type: DataTypes.JSON,
    defaultValue: {
      enable: true,
      time: 10,
      type: 'group'
    }
  }
}, {
  freezeTableName: true
})

await ScheduleTable.sync()

export async function addSchedule(data) {
  return await ScheduleTable.create(data)
}

export async function getSchedule(where) {
  return await ScheduleTable.findAll({ where })
} 
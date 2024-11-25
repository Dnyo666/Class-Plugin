import { App, Render, Config } from '#components'
import { db } from '#models'
import moment from 'moment'
import _ from 'lodash'

const app = {
  id: 'schedule',
  name: '课表'
}

export const rule = {
  // 添加课程
  addSchedule: {
    reg: /^#?(添加|新增)课程\s*(.*)$/,
    fnc: async function(e) {
      if (!e.isMaster) {
        await e.reply('只有主人才可以添加课程哦~')
        return true
      }
      // TODO: 解析课程信息并存储
    }
  },

  // 查看课表
  viewSchedule: {
    reg: /^#?课表\s*(.*)$/,
    fnc: async function(e) {
      // TODO: 获取并渲染课表
    }
  },

  // 临时调课
  changeSchedule: {
    reg: /^#?调课\s*(\d+)\s*(\d+)$/,
    fnc: async function(e) {
      if (!e.isMaster) {
        await e.reply('只有主人才可以调课哦~')
        return true
      }
      // TODO: 处理调课
    }
  }
}

export const scheduleApp = new App(app, rule).create() 
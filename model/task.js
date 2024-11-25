import schedule from 'node-schedule'
import fs from 'fs'
import moment from 'moment'
import { Config } from './config.js'

export class Task {
  constructor() {
    this.init()
  }

  init() {
    if(!schedule?.scheduleJob) {
      logger.error('[Class-Plugin] node-schedule 模块加载失败')
      return
    }
    
    // 每分钟检查一次
    schedule.scheduleJob('* * * * *', () => this.checkCourses())
  }

  async checkCourses() {
    const now = moment()
    const data = JSON.parse(fs.readFileSync(`${process.cwd()}/data/class-plugin/data/courses.json`, 'utf8'))
    
    for(const userId in data.users) {
      const userData = data.users[userId]
      if(!userData.remind?.enable) continue

      const todayCourses = this.getTodayCourses(userData.courses, now)
      for(const course of todayCourses) {
        if(this.shouldRemind(course, now, userData.remind.advance)) {
          await this.sendRemind(userId, course, userData.remind.mode)
        }
      }
    }
  }

  getTodayCourses(courses, now) {
    const weekDay = now.day()
    const week = this.getCurrentWeek()
    return courses.filter(course => {
      return course.weekDay === weekDay && 
             course.weeks.includes(week) &&
             !this.isAdjusted(course)
    })
  }

  getCurrentWeek() {
    // 计算当前教学周
    const startDate = moment('2024-02-26') // 开学日期,后续可配置
    const now = moment()
    return Math.ceil(now.diff(startDate, 'weeks', true))
  }

  shouldRemind(course, now, advance) {
    const [startSection] = course.section.split('-').map(Number)
    const courseTime = this.getSectionTime(startSection)
    const remindTime = moment(courseTime).subtract(advance, 'minutes')
    
    return now.isSame(remindTime, 'minute')
  }

  getSectionTime(section) {
    // 课程时间对应表,后续可配置
    const sectionTimes = {
      1: '08:00',
      3: '10:00',
      5: '14:00',
      7: '16:00',
      9: '19:00'
    }
    return moment().format('YYYY-MM-DD ') + sectionTimes[section]
  }

  async sendRemind(userId, course, mode) {
    const msg = [
      `课程提醒:`,
      `课程: ${course.name}`,
      `教师: ${course.teacher}`,
      `教室: ${course.location}`,
      `时间: ${course.section}节`
    ].join('\n')

    if(Bot) {
      if(mode === 'private') {
        await Bot.pickUser(userId).sendMsg(msg)
      } else {
        // 获取用户所在群
        const groups = await this.getUserGroups(userId)
        if(groups.length) {
          // 选择最后活跃的群发送提醒
          const group = groups[0]
          await Bot.pickGroup(group).sendMsg([
            segment.at(userId),
            msg
          ])
        } else {
          // 找不到群时降级为私聊
          await Bot.pickUser(userId).sendMsg(msg)
        }
      }
    }
  }

  async getUserGroups(userId) {
    try {
      // 获取用户所在的群列表
      const groups = await Bot.gl.values()
      return Array.from(groups)
        .filter(group => group.members.has(userId))
        .map(group => group.group_id)
        .sort((a, b) => {
          // 按最后发言时间排序
          const timeA = group.members.get(userId)?.last_sent_time || 0
          const timeB = group.members.get(userId)?.last_sent_time || 0
          return timeB - timeA
        })
    } catch(e) {
      logger.error(`获取用户群聊失败: ${e}`)
      return []
    }
  }
} 
import schedule from 'node-schedule'
import moment from 'moment'
import { Config } from './config.js'
import { Utils } from './utils.js'

export class Task {
  constructor() {
    this.lastCheck = new Map()
    this.init()
  }

  init() {
    if (!schedule?.scheduleJob) {
      logger.error('[Class-Plugin] node-schedule 模块加载失败')
      return
    }
    
    // 每分钟检查一次
    schedule.scheduleJob('* * * * *', () => this.checkCourses())
  }

  async checkCourses() {
    try {
      const now = moment()
      const users = Config.getAllUsers()

      for (const userId of users) {
        const userData = Config.getUserConfig(userId)
        if (!userData?.remind?.enable) continue

        const todayCourses = this.getTodayCourses(userData)
        for (const course of todayCourses) {
          if (this.shouldRemind(course, now, userData.remind.advance)) {
            // 检查是否已经提醒过
            const key = `${userId}_${course.id}_${now.format('YYYY-MM-DD')}`
            if (this.lastCheck.has(key)) continue

            await this.sendRemind(userId, course, userData.remind.mode)
            this.lastCheck.set(key, true)

            // 24小时后清除记录
            setTimeout(() => {
              this.lastCheck.delete(key)
            }, 24 * 60 * 60 * 1000)
          }
        }
      }
    } catch (err) {
      logger.error(`[Class-Plugin] 检查课程提醒失败: ${err}`)
    }
  }

  getTodayCourses(userData) {
    if (!userData?.courses || !Array.isArray(userData.courses)) return []

    const now = moment()
    const weekDay = now.day() || 7 // 将周日的0转换为7
    const week = Utils.getCurrentWeek(userData.base?.startDate)

    return userData.courses.filter(course => {
      try {
        return course &&
               typeof course === 'object' &&
               Number(course.weekDay) === weekDay &&
               Array.isArray(course.weeks) &&
               course.weeks.includes(week)
      } catch (err) {
        logger.error(`[Class-Plugin] 过滤今日课程失败: ${err}`)
        return false
      }
    })
  }

  shouldRemind(course, now, advance) {
    try {
      if (!course?.section || typeof course.section !== 'string') return false

      const courseTime = Utils.parseTime(course.section)
      if (!courseTime?.start) return false

      const remindTime = moment(now.format('YYYY-MM-DD ') + courseTime.start, 'YYYY-MM-DD HH:mm')
        .subtract(advance || 10, 'minutes')
      
      const diffMinutes = Math.abs(now.diff(remindTime, 'minutes'))
      return diffMinutes === 0
    } catch (err) {
      logger.error(`[Class-Plugin] 检查提醒时间失败: ${err}`)
      return false
    }
  }

  async sendRemind(userId, course, mode = 'private') {
    try {
      if (!course || typeof course !== 'object') return

      const msg = [
        '课程提醒:',
        `课程: ${course.name || '未知课程'}`,
        `教师: ${course.teacher || '未知教师'}`,
        `教室: ${course.location || '未知教室'}`,
        `时间: ${course.section || '未知时间'}节`
      ].join('\n')

      if (!Bot) {
        logger.error('[Class-Plugin] Bot 未初始化')
        return
      }

      if (mode === 'private') {
        await Bot.pickUser(userId).sendMsg(msg)
      } else {
        try {
          // 获取用户所在群
          const groups = await Bot.getGroupList()
          const userGroups = groups.filter(group => 
            group.member_list?.some(member => member.user_id === userId)
          )

          if (userGroups.length) {
            // 选择第一个群发送提醒
            await Bot.pickGroup(userGroups[0].group_id).sendMsg([
              segment.at(userId),
              msg
            ])
          } else {
            // 找不到群时降级为私聊
            await Bot.pickUser(userId).sendMsg(msg)
          }
        } catch (err) {
          logger.error(`[Class-Plugin] 群发提醒失败，降级为私聊: ${err}`)
          await Bot.pickUser(userId).sendMsg(msg)
        }
      }
    } catch (err) {
      logger.error(`[Class-Plugin] 发送提醒失败: ${err}`)
    }
  }
} 
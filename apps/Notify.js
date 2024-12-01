import plugin from '../../../lib/plugins/plugin.js'
import { createRequire } from 'module'
import moment from 'moment'
import { Config } from '../model/config.js'
import { Utils } from '../model/utils.js'

const require = createRequire(import.meta.url)
const schedule = require('node-schedule')

export class Notify extends plugin {
  constructor() {
    super({
      name: 'Class-通知',
      dsc: '课表提醒通知',
      event: 'message',
      priority: 5000,
      rule: [
        {
          reg: '^#?(开启|关闭)提醒$',
          fnc: 'toggleNotify'
        },
        {
          reg: '^#?设置提醒时间\\s*(\\d+)$',
          fnc: 'setNotifyTime'
        },
        {
          reg: '^#?切换提醒方式$',
          fnc: 'toggleNotifyMode'
        }
      ]
    })

    this.task = null
    this.init()
  }

  init() {
    try {
      // 取消已存在的任务
      if(this.task) {
        this.task.cancel()
      }

      // 创建新的定时任务
      this.task = schedule.scheduleJob('* * * * *', () => {
        this.checkCourses().catch(err => {
          logger.error(`[Class-Plugin] 课程检查失败: ${err}`)
        })
      })

      logger.info('[Class-Plugin] 课程提醒任务已启动')
    } catch(err) {
      logger.error(`[Class-Plugin] 初始化定时任务失败: ${err}`)
    }
  }

  async toggleNotify(e) {
    try {
      const enable = e.msg.includes('开启')
      let userData = Config.getUserConfig(e.user_id)
      
      userData.remind = {
        ...userData.remind,
        enable
      }
      
      Config.setUserConfig(e.user_id, userData)
      await e.reply(`已${enable ? '开启' : '关闭'}课程提醒`)
      return true
    } catch(err) {
      logger.error(`[Class-Plugin] 切换提醒状态失败: ${err}`)
      await e.reply('操作失败，请稍后重试')
      return true
    }
  }

  async setNotifyTime(e) {
    try {
      const minutes = parseInt(e.msg.match(/(\d+)/)[1])
      if(minutes < 1 || minutes > 60) {
        await e.reply('提醒时间需在1-60分钟之间')
        return true
      }

      let userData = Config.getUserConfig(e.user_id)
      userData.remind = {
        ...userData.remind,
        advance: minutes
      }
      
      Config.setUserConfig(e.user_id, userData)
      await e.reply(`已设置为上课前${minutes}分钟提醒`)
      return true
    } catch(err) {
      logger.error(`[Class-Plugin] 设置提醒时间失败: ${err}`)
      await e.reply('设置失败，请稍后重试')
      return true
    }
  }

  async toggleNotifyMode(e) {
    try {
      let userData = Config.getUserConfig(e.user_id)
      const currentMode = userData.remind?.mode || 'private'
      const newMode = currentMode === 'private' ? 'group' : 'private'
      
      userData.remind = {
        ...userData.remind,
        mode: newMode
      }
      
      Config.setUserConfig(e.user_id, userData)
      await e.reply(`已切换为${newMode === 'private' ? '私聊' : '群聊'}提醒`)
      return true
    } catch(err) {
      logger.error(`[Class-Plugin] 切换提醒方式失败: ${err}`)
      await e.reply('切换失败，请稍后重试')
      return true
    }
  }

  async checkCourses() {
    const now = moment()
    const users = Config.getAllUsers()
    
    for(const userId of users) {
      try {
        const userData = Config.getUserConfig(userId)
        if(!userData.remind?.enable) continue

        const currentWeek = Utils.getCurrentWeek(userData.base?.startDate)
        const weekDay = now.day()
        
        // 获取今日课程
        const todayCourses = userData.courses.filter(course => {
          return course.weekDay === weekDay && 
                 course.weeks.includes(currentWeek)
        })

        for(const course of todayCourses) {
          const timeInfo = Utils.parseTime(course.section)
          if(!timeInfo) continue

          const courseTime = moment(timeInfo.start, 'HH:mm')
          const diffMinutes = courseTime.diff(now, 'minutes')
          
          // 检查是否需要提醒
          if(diffMinutes === userData.remind.advance) {
            await this.sendNotify(userId, course, userData.remind.mode)
          }
        }
      } catch(err) {
        logger.error(`[Class-Plugin] 检查用户 ${userId} 课程失败: ${err}`)
      }
    }
  }

  async sendNotify(userId, course, mode = 'private') {
    try {
      const msg = [
        `课程提醒：`,
        `课程：${course.name}`,
        `教师：${course.teacher}`,
        `教室：${course.location}`,
        `时间：${Utils.parseTime(course.section).start}`
      ].join('\n')

      const Bot = await import('../../../lib/bot.js')
      
      if(mode === 'private') {
        // 私聊提醒
        await Bot.pickUser(userId).sendMsg(msg)
      } else {
        // 获取用户所在群
        const groups = await Bot.getGroupList()
        for(const group of groups) {
          const members = await Bot.getGroupMemberList(group.group_id)
          if(members.find(m => m.user_id === userId)) {
            await Bot.pickGroup(group.group_id).sendMsg(msg)
          }
        }
      }
    } catch(err) {
      logger.error(`[Class-Plugin] 发送提醒消息失败: ${err}`)
    }
  }
} 
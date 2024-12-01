import plugin from '../../../lib/plugins/plugin.js'
import schedule from 'node-schedule'
import moment from 'moment'
import { Config } from '../model/config.js'
import { Utils } from '../model/utils.js'

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

    this.init()
  }

  init() {
    // 每分钟检查一次课程提醒
    schedule.scheduleJob('* * * * *', () => this.checkCourses())
  }

  async toggleNotify(e) {
    const enable = e.msg.includes('开启')
    let userData = Config.getUserConfig(e.user_id)
    
    userData.remind = {
      ...userData.remind,
      enable
    }
    
    Config.setUserConfig(e.user_id, userData)
    await e.reply(`已${enable ? '开启' : '关闭'}课程提醒`)
    return true
  }

  async setNotifyTime(e) {
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
  }

  async toggleNotifyMode(e) {
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
  }

  async checkCourses() {
    const now = moment()
    const users = Config.getAllUsers()
    
    for(const userId of users) {
      const userData = Config.getUserConfig(userId)
      if(!userData.remind?.enable) continue

      const currentWeek = Utils.getCurrentWeek()
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
    }
  }

  async sendNotify(userId, course, mode = 'private') {
    const msg = [
      `课程提醒：`,
      `课程：${course.name}`,
      `教师：${course.teacher}`,
      `教室：${course.location}`,
      `时间：${Utils.parseTime(course.section).start}`
    ].join('\n')

    // 获取Bot实例
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
  }
} 
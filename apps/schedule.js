import plugin from '../../../lib/plugins/plugin.js'
import { createRequire } from 'module'
import lodash from 'lodash'
import moment from 'moment'
import { db } from '../model/index.js'
import { Op } from 'sequelize'

export class Schedule extends plugin {
  constructor () {
    super({
      name: 'Class-Schedule',
      dsc: '课表管理插件',
      event: 'message',
      priority: 5000,
      rule: [
        {
          reg: /^#?(添加|新增)课程\s*(.*)$/,
          fnc: 'addSchedule'
        },
        {
          reg: /^#?课表\s*(.*)$/,
          fnc: 'viewSchedule'  
        },
        {
          reg: /^#?本周课表$/,
          fnc: 'thisWeekSchedule'
        },
        {
          reg: /^#?删除课程\s*(\d+)$/,
          fnc: 'deleteSchedule'
        },
        {
          reg: /^#?修改课程\s*(\d+)\s*(.+)$/,
          fnc: 'editSchedule'
        },
        {
          reg: /^#?调课\s*(\d+)\s*(.+)$/,
          fnc: 'changeSchedule'
        },
        {
          reg: /^#?取消调课\s*(\d+)$/,
          fnc: 'cancelChange'
        },
        {
          reg: /^#?调课记录$/,
          fnc: 'changeRecord'
        },
        {
          reg: /^#?(开启|关闭)提醒$/,
          fnc: 'toggleRemind'
        },
        {
          reg: /^#?设置提醒时间\s*(\d+)$/,
          fnc: 'setRemindTime'
        },
        {
          reg: /^#?提醒方式$/,
          fnc: 'toggleRemindType'
        }
      ]
    })
  }

  // 添加课程
  async addSchedule (e) {
    const params = e.msg.match(/课程\s+(.+?)\s+(.+?)\s+(.+?)\s+(.+?)\s+(.+?)\s+(.+)/i)
    if (!params) {
      await e.reply('格式错误,请按照: #添加课程 课程名 教师 教室 星期 节数 周数\n例如: #添加课程 高数 张三 A101 周一 1-2 1-16周')
      return true
    }

    const [, name, teacher, location, weekDay, section, weeks] = params
    
    const weekDayMap = {
      '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5
    }
    if (!weekDayMap[weekDay]) {
      await e.reply('星期格式错误,请使用:周一/周二/周三/周四/周五')
      return true
    }

    const sectionMatch = section.match(/(\d+)-(\d+)/)
    if (!sectionMatch) {
      await e.reply('节数格式错误,请使用范围格式,如:1-2')
      return true  
    }

    const weekConfig = this.parseWeeks(weeks)
    if (!weekConfig.weeks.length) {
      await e.reply('周数格式错误,支持:\n1. 单周/双周\n2. 1-16周\n3. 1,3,5,7周')
      return true
    }

    await db.addSchedule({
      userId: e.user_id,
      name,
      teacher,
      location,
      weekDay: weekDayMap[weekDay],
      section,
      weeks: weekConfig.weeks,
      weekType: weekConfig.type
    })

    await e.reply('添加课程成功!')
    return true
  }

  // 查看课表
  async viewSchedule (e) {
    const schedules = await db.getSchedule({
      userId: e.user_id
    })
    const img = await this.render('schedule/table', {
      schedules,
      weeks: this.getCurrentWeek()
    })
    await this.reply(img)
    return true
  }

  // 本周课表
  async thisWeekSchedule (e) {
    const currentWeek = this.getCurrentWeek()
    const schedules = await db.getSchedule({
      userId: e.user_id,
      weeks: {
        [Op.contains]: [currentWeek]
      }
    })
    const img = await this.render('schedule/table', {
      schedules,
      currentWeek
    })
    await this.reply(img)
    return true
  }

  // 删除课程
  async deleteSchedule (e) {
    const id = e.msg.match(/删除课程\s*(\d+)/)[1]
    const schedule = await db.getScheduleById(id)
    
    if (!schedule || schedule.userId !== e.user_id) {
      await e.reply('未找到该课程')
      return true
    }

    await db.deleteSchedule(id)
    await e.reply('删除课程成功')
    return true
  }

  // 修改课程
  async editSchedule (e) {
    const [, id, content] = e.msg.match(/修改课程\s*(\d+)\s*(.+)/)
    const schedule = await db.getScheduleById(id)
    
    if (!schedule || schedule.userId !== e.user_id) {
      await e.reply('未找到该课程')
      return true
    }

    const [key, value] = content.split('=')
    if (!schedule[key]) {
      await e.reply('无效的修改项')
      return true
    }

    await db.updateSchedule(id, { [key]: value })
    await e.reply('修改课程成功')
    return true
  }

  // 调课
  async changeSchedule (e) {
    const [, id, newSection] = e.msg.match(/调课\s*(\d+)\s*(.+)/)
    const schedule = await db.getScheduleById(id)
    
    if (!schedule || schedule.userId !== e.user_id) {
      await e.reply('未找到该课程')
      return true
    }

    await db.addChange({
      scheduleId: id,
      oldSection: schedule.section,
      newSection
    })
    await e.reply('调课成功')
    return true
  }

  // 取消调课
  async cancelChange (e) {
    const id = e.msg.match(/取消调课\s*(\d+)/)[1]
    await db.deleteChange(id)
    await e.reply('取消调课成功')
    return true
  }

  // 调课记录
  async changeRecord (e) {
    const changes = await db.getChanges({
      userId: e.user_id
    })
    const msg = changes.map(c => 
      `${c.schedule.name} ${c.oldSection} → ${c.newSection}`
    ).join('\n')
    await e.reply(msg || '暂无调课记录')
    return true
  }

  // 开启/关闭提醒
  async toggleRemind (e) {
    const enable = e.msg.includes('开启')
    await db.updateRemind(e.user_id, { enable })
    await e.reply(`${enable ? '开启' : '关闭'}提醒成功`)
    return true
  }

  // 设置提醒时间
  async setRemindTime (e) {
    const time = e.msg.match(/设置提醒时间\s*(\d+)/)[1]
    await db.updateRemind(e.user_id, { time: parseInt(time) })
    await e.reply(`设置提醒时间为${time}分钟`)
    return true
  }

  // 切换提醒方式
  async toggleRemindType (e) {
    const remind = await db.getRemind(e.user_id)
    const type = remind.type === 'group' ? 'private' : 'group'
    await db.updateRemind(e.user_id, { type })
    await e.reply(`切换为${type === 'group' ? '群聊' : '私聊'}提醒`)
    return true
  }

  // 工具方法
  parseWeeks (str) {
    // ... 周数解析逻辑
  }

  getCurrentWeek () {
    // ... 获取当前周数逻辑
  }
} 
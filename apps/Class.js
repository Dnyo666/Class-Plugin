import plugin from '../../../lib/plugins/plugin.js'
import { Config } from '../model/config.js'
import { Utils } from '../model/utils.js'
import { Render } from '../model/render.js'
import moment from 'moment'

export class Class extends plugin {
  constructor() {
    super({
      name: 'Class-课表',
      dsc: '课表管理',
      event: 'message',
      priority: 5000,
      rule: [
        {
          reg: '^#?课表$',
          fnc: 'viewSchedule'
        },
        {
          reg: '^#?本周课表$',
          fnc: 'thisWeekSchedule'
        },
        {
          reg: /^#?(添加|新增)课程\s*(.*)$/,
          fnc: 'addSchedule'
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
        }
      ]
    })
  }

  // 查看课表
  async viewSchedule(e) {
    try {
      const userData = Config.getUserConfig(e.user_id)
      if(!userData.courses.length) {
        await e.reply('暂无课程信息，请先添加课程')
        return true
      }

      const currentWeek = Utils.getCurrentWeek()
      const render = new Render()
      const imagePath = await render.courseTable(userData.courses, currentWeek)
      
      if(!imagePath) {
        throw new Error('生成课表图片失败')
      }

      await e.reply(segment.image(`file:///${imagePath}`))
      return true
    } catch(err) {
      logger.error(`[Class-Plugin] 查看课表失败: ${err}`)
      await e.reply('生成课表失败，请稍后重试')
      return true
    }
  }

  // 本周课表
  async thisWeekSchedule(e) {
    try {
      const currentWeek = Utils.getCurrentWeek()
      const userData = Config.getUserConfig(e.user_id)
      
      const weekCourses = userData.courses.filter(course => 
        course.weeks.includes(currentWeek)
      )

      if(!weekCourses.length) {
        await e.reply('本周没有课程')
        return true
      }

      const render = new Render()
      const imagePath = await render.courseTable(weekCourses, currentWeek)
      
      if(!imagePath) {
        throw new Error('生成课表图片失败')
      }

      await e.reply(segment.image(`file:///${imagePath}`))
      return true
    } catch(err) {
      logger.error(`[Class-Plugin] 查看本周课表失败: ${err}`)
      await e.reply('生成课表失败，请稍后重试')
      return true
    }
  }

  // 添加课程
  async addSchedule(e) {
    try {
      const params = e.msg.match(/课程\s+(.+?)\s+(.+?)\s+(.+?)\s+(.+?)\s+(.+?)\s+(.+)/i)
      if (!params) {
        await e.reply('格式错误，请按照: #添加课程 课程名 教师 教室 星期 节数 周数\n例如: #添加课程 高数 张三 A101 周一 1-2 1-16周')
        return true
      }

      const [, name, teacher, location, weekDay, section, weeks] = params
      const weekDayMap = {
        '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5
      }
      
      if (!weekDayMap[weekDay]) {
        await e.reply('星期格式错误，请使用: 周一/周二/周三/周四/周五')
        return true
      }

      const sectionMatch = section.match(/(\d+)-(\d+)/)
      if (!sectionMatch) {
        await e.reply('节数格式错误，请使用范围格式，如: 1-2')
        return true
      }

      const weekConfig = Utils.parseWeeks(weeks)
      if (!weekConfig.length) {
        await e.reply('周数格式错误，支持:\n1. 单周/双周\n2. 1-16周\n3. 1,3,5,7周')
        return true
      }

      let userData = Config.getUserConfig(e.user_id)
      userData.courses.push({
        id: Utils.generateId(),
        name,
        teacher,
        location,
        weekDay: weekDayMap[weekDay],
        section: sectionMatch[0],
        weeks: weekConfig
      })

      Config.setUserConfig(e.user_id, userData)
      await e.reply('添加课程成功')
      return true
    } catch(err) {
      logger.error(`[Class-Plugin] 添加课程失败: ${err}`)
      await e.reply('添加课程失败，请稍后重试')
      return true
    }
  }

  // 删除课程
  async deleteSchedule(e) {
    try {
      const courseId = e.msg.match(/删除课程\s*(\d+)/)[1]
      let userData = Config.getUserConfig(e.user_id)
      
      const index = userData.courses.findIndex(c => c.id === courseId)
      if(index === -1) {
        await e.reply('未找到该课程')
        return true
      }

      userData.courses.splice(index, 1)
      userData.adjustments = userData.adjustments.filter(a => 
        a.courseId !== courseId
      )

      Config.setUserConfig(e.user_id, userData)
      await e.reply('删除课程成功')
      return true
    } catch(err) {
      logger.error(`[Class-Plugin] 删除课程失败: ${err}`)
      await e.reply('删除课程失败，请稍后重试')
      return true
    }
  }

  // 修改课程
  async editSchedule(e) {
    try {
      const [, id, content] = e.msg.match(/修改课程\s*(\d+)\s*(.+)/)
      let userData = Config.getUserConfig(e.user_id)
      
      const course = userData.courses.find(c => c.id === id)
      if(!course) {
        await e.reply('未找到该课程')
        return true
      }

      const [key, value] = content.split('=')
      if(!course.hasOwnProperty(key)) {
        await e.reply('无效的修改项，可修改: name/teacher/location')
        return true
      }

      course[key] = value
      Config.setUserConfig(e.user_id, userData)
      await e.reply('修改课程成功')
      return true
    } catch(err) {
      logger.error(`[Class-Plugin] 修改课程失败: ${err}`)
      await e.reply('修改课程失败，请稍后重试')
      return true
    }
  }

  // 调课
  async changeSchedule(e) {
    try {
      const [, id, newSection] = e.msg.match(/调课\s*(\d+)\s*(.+)/)
      let userData = Config.getUserConfig(e.user_id)
      
      const course = userData.courses.find(c => c.id === id)
      if(!course) {
        await e.reply('未找到该课程')
        return true
      }

      if(!/^\d+-\d+$/.test(newSection)) {
        await e.reply('节数格式错误，请使用范围格式，如: 1-2')
        return true
      }

      userData.adjustments.push({
        courseId: id,
        date: moment().format('YYYY-MM-DD'),
        originalSection: course.section,
        newSection
      })

      Config.setUserConfig(e.user_id, userData)
      await e.reply('调课成功')
      return true
    } catch(err) {
      logger.error(`[Class-Plugin] 调课失败: ${err}`)
      await e.reply('调课失败，请稍后重试')
      return true
    }
  }

  // 取消调课
  async cancelChange(e) {
    try {
      const courseId = e.msg.match(/取消调课\s*(\d+)/)[1]
      let userData = Config.getUserConfig(e.user_id)
      
      const index = userData.adjustments.findIndex(a => 
        a.courseId === courseId
      )
      if(index === -1) {
        await e.reply('未找到该调课记录')
        return true
      }

      userData.adjustments.splice(index, 1)
      Config.setUserConfig(e.user_id, userData)
      await e.reply('取消调课成功')
      return true
    } catch(err) {
      logger.error(`[Class-Plugin] 取消调课失败: ${err}`)
      await e.reply('取消调课失败，请稍后重试')
      return true
    }
  }

  // 调课记录
  async changeRecord(e) {
    try {
      const userData = Config.getUserConfig(e.user_id)
      if(!userData.adjustments.length) {
        await e.reply('暂无调课记录')
        return true
      }

      const records = userData.adjustments.map(adj => {
        const course = userData.courses.find(c => c.id === adj.courseId)
        return `${course.name}: ${adj.originalSection} → ${adj.newSection} (${adj.date})`
      })

      await e.reply(records.join('\n'))
      return true
    } catch(err) {
      logger.error(`[Class-Plugin] 查看调课记录失败: ${err}`)
      await e.reply('查看调课记录失败，请稍后重试')
      return true
    }
  }
}

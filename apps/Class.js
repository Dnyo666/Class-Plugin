import plugin from '../../../lib/plugins/plugin.js'
import { Config } from '../model/config.js'
import Utils from '../utils.js'
import { Render } from '../model/render.js'
import moment from 'moment'

let tempCourseData = new Map() // 临时存储用户的课程数据

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

  // 初始化检查
  async checkInit(e) {
    const config = Config.getUserConfig(e.user_id)
    if (!config?.base?.startDate || !config?.base?.maxWeek) {
      // 存储当前操作的课程数据
      if (e.msg.includes('添加课程')) {
        const courseData = e.msg.replace(/^#?(添加|新增)课程\s*/, '')
        tempCourseData.set(e.user_id, courseData)
      }

      await e.reply([
        '⚠️ 检测到您还未完成课表初始化配置',
        '请按以下步骤进行设置：',
        '',
        '1. 设置开学日期',
        '发送: #设置开学日期 2024-02-26',
        '',
        '2. 设置学期周数',
        '发送: #设置学期周数 16',
        '',
        '完成设置后，您之前添加的课程将自动导入'
      ].join('\n'))
      return false
    }

    // 检查是否有临时存储的课程数据需要导入
    const tempData = tempCourseData.get(e.user_id)
    if (tempData) {
      try {
        // 构造添加课程的消息
        e.msg = `#添加课程 ${tempData}`
        await this.addSchedule(e)
        tempCourseData.delete(e.user_id)
      } catch (err) {
        logger.error(`[Class-Plugin] 导入临时课程数据失败: ${err}`)
      }
    }

    return true
  }

  // 查看课表
  async viewSchedule(e) {
    if (!await this.checkInit(e)) return true

    try {
      const userData = Config.getUserConfig(e.user_id)
      if (!userData?.courses?.length) {
        await e.reply('暂无课程信息，请先添加课程')
        return true
      }

      const currentWeek = Utils.getCurrentWeek(userData.base.startDate)
      if (!currentWeek) {
        throw new Error('无效的开学日期')
      }

      const render = new Render()
      const imagePath = await render.courseTable(userData.courses, currentWeek)
      
      if (!imagePath) {
        throw new Error('生成课表图片失败')
      }

      await e.reply(segment.image(`file:///${imagePath}`))
      return true
    } catch (err) {
      logger.error(`[Class-Plugin] 查看课表失败: ${err}`)
      await e.reply(`查看课表失败: ${err.message}`)
      return true
    }
  }

  // 本周课表
  async thisWeekSchedule(e) {
    if (!await this.checkInit(e)) return true

    try {
      const userData = Config.getUserConfig(e.user_id)
      const currentWeek = Utils.getCurrentWeek(userData.base.startDate)
      
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
    if (!await this.checkInit(e)) return true

    try {
      const params = e.msg.match(/课程\s+(.+?)\s+(.+?)\s+(.+?)\s+(.+?)\s+(.+?)\s+(.+)/i)
      if (!params) {
        await e.reply([
          '格式错误，请按照以下格式添加课程：',
          '#添加课程 课程名 教师 教室 星期 节数 周数',
          '',
          '例如：',
          '#添加课程 高数 张三 A101 周一 1-2 1-16周',
          '',
          '说明：',
          '- 星期：周一/周二/周三/周四/周五',
          '- 节数：1-2/3-4/5-6/7-8/9-10',
          '- 周数：1-16周/单周/双周/1,3,5,7周'
        ].join('\n'))
        return true
      }

      const [, name, teacher, location, weekDay, section, weeks] = params
      const weekDayMap = {
        '周一': 1, '周二': 2, '周三': 3, '周四': 4, '周五': 5,
        '星期一': 1, '星期二': 2, '星期三': 3, '星期四': 4, '星期五': 5,
        '1': 1, '2': 2, '3': 3, '4': 4, '5': 5
      }
      
      const weekDayNum = weekDayMap[weekDay]
      if (!weekDayNum) {
        await e.reply('星期格式错误，请使用: 周一/周二/周三/周四/周五')
        return true
      }

      const weekList = Utils.parseWeeks(weeks)
      if (!weekList.length) {
        await e.reply([
          '周数格式错误，支持以下格式：',
          '1. 单周/双周',
          '2. 1-16周',
          '3. 1,3,5,7周',
          '',
          '例如：1-16周、单周、1,3,5周'
        ].join('\n'))
        return true
      }

      let userData = Config.getUserConfig(e.user_id)
      if (!userData.courses) userData.courses = []

      // 检查时间冲突
      const hasConflict = userData.courses.some(c => 
        c.weekDay === weekDayNum && 
        c.section === section &&
        c.weeks.some(w => weekList.includes(w))
      )

      if (hasConflict) {
        await e.reply('该时间段已有课程，请检查是否冲突')
        return true
      }

      const newCourse = {
        id: Utils.generateId(),
        name,
        teacher,
        location,
        weekDay: weekDayNum,
        section,
        weeks: weekList
      }

      try {
        Utils.validateCourse(newCourse)
      } catch (err) {
        await e.reply(`课程数据验证失败: ${err.message}`)
        return true
      }

      userData.courses.push(newCourse)

      if (Config.setUserConfig(e.user_id, userData)) {
        await e.reply([
          '✅ 添加课程成功！',
          '',
          '课程信息：',
          `📚 课程：${name}`,
          `👨‍🏫 教师：${teacher}`,
          `📍 教室：${location}`,
          `📅 时间：周${['一','二','三','四','五'][weekDayNum-1]} ${section}节`,
          `🗓️ 周数：${weeks}`
        ].join('\n'))
      } else {
        throw new Error('保存课程数据失败')
      }

      return true
    } catch (err) {
      logger.error(`[Class-Plugin] 添加课程失败: ${err}`)
      await e.reply('添加课程失败，请稍后重试')
      return true
    }
  }

  // 删除课程
  async deleteSchedule(e) {
    if (!await this.checkInit(e)) return true

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
    if (!await this.checkInit(e)) return true

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
    if (!await this.checkInit(e)) return true

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

      userData.adjustments = userData.adjustments || []
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
    if (!await this.checkInit(e)) return true

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
    if (!await this.checkInit(e)) return true

    try {
      const userData = Config.getUserConfig(e.user_id)
      if(!userData.adjustments?.length) {
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

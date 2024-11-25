import plugin from '../../../lib/plugins/plugin.js'
import { createRequire } from 'module'
import lodash from 'lodash'
import fs from 'fs'
import { Render } from '../model/render.js'
import moment from 'moment'

const _path = process.cwd()

export class Class extends plugin {
  constructor () {
    super({
      name: 'Class-课表',
      dsc: '课表插件',
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
    this.dataFile = `${_path}/data/class-plugin/courses.json`
  }

  // 获取用户课程数据
  getUserData(userId) {
    if(!fs.existsSync(this.dataFile)) {
      fs.writeFileSync(this.dataFile, JSON.stringify({users:{}}, null, 2))
    }
    const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'))
    return data.users[userId] || { 
      config: {
        startDate: moment().format('YYYY-MM-DD'),
        maxWeek: 16,
        sections: [
          { name: '第一节', start: '08:00', end: '08:45' },
          { name: '第二节', start: '08:55', end: '09:40' },
          { name: '第三节', start: '10:10', end: '10:55' },
          { name: '第四节', start: '11:05', end: '11:50' },
          { name: '第五节', start: '14:00', end: '14:45' },
          { name: '第六节', start: '14:55', end: '15:40' },
          { name: '第七节', start: '16:00', end: '16:45' },
          { name: '第八节', start: '16:55', end: '17:40' }
        ]
      },
      courses: [], 
      adjustments: [],
      remind: {
        enable: false,
        advance: 10,
        mode: 'private'
      }
    }
  }

  // 保存用户课程数据
  saveUserData(userId, userData) {
    const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'))
    data.users[userId] = userData
    fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2))
  }

  // 添加课程
  async addSchedule(e) {
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
    if (!weekConfig.length) {
      await e.reply('周数格式错误,支持:\n1. 单周/双周\n2. 1-16周\n3. 1,3,5,7周')
      return true
    }

    let userData = this.getUserData(e.user_id)
    userData.courses.push({
      id: Date.now().toString(),
      name,
      teacher,
      location,
      weekDay: weekDayMap[weekDay],
      section: sectionMatch[0],
      weeks: weekConfig
    })

    this.saveUserData(e.user_id, userData)
    await e.reply('添加课程成功!')
    return true
  }

  // 查看课表
  async viewSchedule(e) {
    try {
      const userData = this.getUserData(e.user_id)
      if(!userData.courses.length) {
        await e.reply('暂无课程信息')
        return true
      }
  
      const currentWeek = this.getCurrentWeek()
      const render = new Render()
      const imagePath = await render.courseTable(userData.courses, currentWeek)
      
      if(fs.existsSync(imagePath)) {
        await e.reply(segment.image(`file:///${imagePath}`))
        fs.unlinkSync(imagePath)
      } else {
        throw new Error('生成课表图片失败')
      }
    } catch(err) {
      logger.error(err)
      await e.reply('生成课表失败,请稍后重试')
    }
    return true
  }
  // 解析周数
  parseWeeks(weekStr) {
    let weeks = []
    
    // 处理单双周
    if(weekStr.includes('单周')) {
      for(let i = 1; i <= 16; i += 2) weeks.push(i)
      return weeks
    }
    if(weekStr.includes('双周')) {
      for(let i = 2; i <= 16; i += 2) weeks.push(i)
      return weeks
    }

    // 处理范围 如"1-16周"
    const rangeMatch = weekStr.match(/(\d+)-(\d+)周/)
    if(rangeMatch) {
      const [, start, end] = rangeMatch
      for(let i = parseInt(start); i <= parseInt(end); i++) {
        weeks.push(i)
      }
      return weeks
    }

    // 处理列表 如"1,3,5,7周"
    const listMatch = weekStr.match(/(\d+(?:,\d+)*?)周/)
    if(listMatch) {
      weeks = listMatch[1].split(',').map(Number)
      return weeks
    }

    return []
  }

  // 获取当前周数
  getCurrentWeek() {
    const startDate = new Date('2024-02-26') // 开学日期,后续可配置
    const now = new Date()
    const diff = now - startDate
    return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000))
  }

  // 本周课表
  async thisWeekSchedule(e) {
    try {
      const currentWeek = this.getCurrentWeek()
      const userData = this.getUserData(e.user_id)
      
      const weekCourses = userData.courses.filter(course => 
        course.weeks.includes(currentWeek)
      )

      if(!weekCourses.length) {
        await e.reply('本周没有课程')
        return true
      }

      const render = new Render()
      const imagePath = await render.courseTable(weekCourses, currentWeek)
      
      if(fs.existsSync(imagePath)) {
        await e.reply(segment.image(`file:///${imagePath}`))
        // 发送后删除临时文件
        fs.unlinkSync(imagePath)
      } else {
        throw new Error('生成课表图片失败')
      }
    } catch(err) {
      logger.error(err)
      await e.reply('生成课表失败,请稍后重试')
    }
    return true
  }

  // 删除课程
  async deleteSchedule(e) {
    const courseId = e.msg.match(/删除课程\s*(\d+)/)[1]
    let userData = this.getUserData(e.user_id)
    
    const index = userData.courses.findIndex(c => c.id === courseId)
    if(index === -1) {
      await e.reply('未找到该课程')
      return true
    }

    userData.courses.splice(index, 1)
    // 同时删除相关的调课记录
    userData.adjustments = userData.adjustments.filter(a => 
      a.courseId !== courseId
    )

    this.saveUserData(e.user_id, userData)
    await e.reply('删除课程成功')
    return true
  }

  // 修改课程
  async editSchedule(e) {
    const [, id, content] = e.msg.match(/修改课程\s*(\d+)\s*(.+)/)
    let userData = this.getUserData(e.user_id)
    
    const course = userData.courses.find(c => c.id === id)
    if(!course) {
      await e.reply('未找到该课程')
      return true
    }

    const [key, value] = content.split('=')
    if(!course.hasOwnProperty(key)) {
      await e.reply('无效的修改项,可修改: name/teacher/location')
      return true
    }

    course[key] = value
    this.saveUserData(e.user_id, userData)
    await e.reply('修改课程成功')
    return true
  }

  // 调课
  async changeSchedule(e) {
    const [, id, newSection] = e.msg.match(/调课\s*(\d+)\s*(.+)/)
    let userData = this.getUserData(e.user_id)
    
    const course = userData.courses.find(c => c.id === id)
    if(!course) {
      await e.reply('未找到该课程')
      return true
    }

    // 添加调课记录
    userData.adjustments.push({
      courseId: id,
      date: new Date().toISOString().split('T')[0],
      originalSection: course.section,
      newSection
    })

    this.saveUserData(e.user_id, userData)
    await e.reply('调课成功')
    return true
  }

  // 取消调课
  async cancelChange(e) {
    const courseId = e.msg.match(/取消调课\s*(\d+)/)[1]
    let userData = this.getUserData(e.user_id)
    
    const index = userData.adjustments.findIndex(a => 
      a.courseId === courseId
    )
    if(index === -1) {
      await e.reply('未找到该调课记录')
      return true
    }

    userData.adjustments.splice(index, 1)
    this.saveUserData(e.user_id, userData)
    await e.reply('取消调课成功')
    return true
  }

  // 调课记录
  async changeRecord(e) {
    const userData = this.getUserData(e.user_id)
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
  }
}

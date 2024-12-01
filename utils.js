import moment from 'moment'
import Config from './components/Config.js'
import Logger from './components/Logger.js'

export class Utils {
  // 解析课程时间
  static parseSections(sectionStr) {
    try {
      const config = Config.get('schedule.combinations') || []
      
      // 查找匹配的时间组合
      const combination = config.find(c => c.name === sectionStr)
      if (combination) {
        return combination.sections
      }

      // 如果没有预定义组合，尝试解析格式 "n-m"
      const match = sectionStr.match(/^(\d+)-(\d+)$/)
      if (match) {
        const start = parseInt(match[1])
        const end = parseInt(match[2])
        if (start > 0 && end >= start && end <= 12) {
          return Array.from({length: end - start + 1}, (_, i) => (start + i).toString())
        }
      }

      Logger.warn(`无效的课程时间格式: ${sectionStr}`)
      return null
    } catch (err) {
      Logger.error(`解析课程时间失败: ${sectionStr}`, err)
      return null
    }
  }

  // 获取课程时间信息
  static getSectionTimes(sections) {
    try {
      const config = Config.get('schedule.sections')
      if (!config) return null

      const times = []
      for (const section of sections) {
        for (const period of Object.values(config)) {
          const sectionInfo = period.find(s => s.id === section)
          if (sectionInfo) {
            times.push(sectionInfo)
            break
          }
        }
      }

      if (times.length === 0) return null

      return {
        start: times[0].start,
        end: times[times.length - 1].end
      }
    } catch (err) {
      Logger.error(`获取课程时间失败`, err)
      return null
    }
  }

  // 解析周数
  static parseWeeks(weekStr) {
    if (!weekStr || typeof weekStr !== 'string') return []
    
    try {
      let weeks = []
      
      // 处理单双周
      if (weekStr.includes('单周')) {
        for (let i = 1; i <= 16; i += 2) weeks.push(i)
        return weeks
      }
      if (weekStr.includes('双周')) {
        for (let i = 2; i <= 16; i += 2) weeks.push(i)
        return weeks
      }

      // 处理范围 如"1-16周"
      const rangeMatch = weekStr.match(/(\d+)-(\d+)周/)
      if (rangeMatch) {
        const start = parseInt(rangeMatch[1])
        const end = parseInt(rangeMatch[2])
        if (Number.isInteger(start) && Number.isInteger(end) && start > 0 && end >= start) {
          for (let i = start; i <= Math.min(end, 30); i++) {
            weeks.push(i)
          }
          return weeks
        }
      }

      // 处理列表 如"1,3,5,7周"
      const listMatch = weekStr.match(/(\d+(?:,\d+)*?)周/)
      if (listMatch) {
        weeks = listMatch[1].split(',')
          .map(w => parseInt(w))
          .filter(w => Number.isInteger(w) && w > 0 && w <= 30)
          .sort((a, b) => a - b)
        return weeks
      }

      Logger.warn(`无效的周数格式: ${weekStr}`)
      return []
    } catch (err) {
      Logger.error(`解析周数失败: ${weekStr}`, err)
      return []
    }
  }

  // 获取当前教学周
  static getCurrentWeek(startDate) {
    if (!startDate || !moment(startDate).isValid()) {
      Logger.error('无效的开学日期')
      return 1
    }

    const start = moment(startDate).startOf('day')
    const now = moment().startOf('day')
    const weeks = Math.ceil(now.diff(start, 'weeks', true))
    
    return weeks > 0 ? weeks : 1
  }

  // 生成唯一ID
  static generateId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 格式化时间
  static formatTime(date) {
    return moment(date).format('YYYY-MM-DD HH:mm:ss')
  }

  // 验证课程数据
  static validateCourse(course) {
    if (!course || typeof course !== 'object') {
      throw new Error('无效的课程数据')
    }

    const required = ['name', 'teacher', 'location', 'day', 'sections', 'weeks']
    for (const field of required) {
      if (!course[field]) {
        throw new Error(`缺少必要字段: ${field}`)
      }
    }
    
    if (!Number.isInteger(course.day) || course.day < 1 || course.day > 7) {
      throw new Error('无效的星期')
    }
    
    if (!Array.isArray(course.sections) || !course.sections.length) {
      throw new Error('无效的课程节数')
    }
    
    if (!Array.isArray(course.weeks) || !course.weeks.length || 
        !course.weeks.every(w => Number.isInteger(w) && w > 0 && w <= 30)) {
      throw new Error('无效的周数')
    }

    return true
  }
} 
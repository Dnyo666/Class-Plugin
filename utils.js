import moment from 'moment'

export default class Utils {
  // 解析时间字符串
  static parseTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null

    const times = {
      '1-2': { start: '08:00', end: '09:40' },
      '3-4': { start: '10:00', end: '11:40' },
      '5-6': { start: '14:00', end: '15:40' },
      '7-8': { start: '16:00', end: '17:40' },
      '9-10': { start: '19:00', end: '20:40' },
      '11-12': { start: '20:50', end: '22:30' }
    }

    const time = times[timeStr]
    if (!time) return null

    return {
      start: moment(time.start, 'HH:mm').isValid() ? time.start : null,
      end: moment(time.end, 'HH:mm').isValid() ? time.end : null
    }
  }

  // 获取当前教学周
  static getCurrentWeek(startDate) {
    if (!startDate || !moment(startDate).isValid()) {
      logger.mark('[Class-Plugin] 无效的开学日期')
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

  // 解析周数
  static parseWeeks(weekStr) {
    if (!weekStr || typeof weekStr !== 'string') return []
    
    let weeks = []
    
    try {
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
    } catch (err) {
      logger.mark(`[Class-Plugin] 解析周数失败: ${err}`)
      return []
    }

    return []
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

    const required = ['name', 'teacher', 'location', 'weekDay', 'section', 'weeks']
    for (const field of required) {
      if (!course[field]) {
        throw new Error(`缺少必要字段: ${field}`)
      }
    }
    
    if (!Number.isInteger(course.weekDay) || course.weekDay < 1 || course.weekDay > 7) {
      throw new Error('无效的星期')
    }
    
    if (typeof course.section !== 'string' || !/^\d+-\d+$/.test(course.section)) {
      throw new Error('无效的节数格式')
    }
    
    if (!Array.isArray(course.weeks) || !course.weeks.length || 
        !course.weeks.every(w => Number.isInteger(w) && w > 0 && w <= 30)) {
      throw new Error('无效的周数')
    }

    return true
  }
} 
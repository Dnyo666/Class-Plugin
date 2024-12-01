import moment from 'moment'

export default class Utils {
  // 解析时间字符串
  static parseTime(timeStr) {
    const times = {
      '1-2': { start: '08:00', end: '09:40' },
      '3-4': { start: '10:00', end: '11:40' },
      '5-6': { start: '14:00', end: '15:40' },
      '7-8': { start: '16:00', end: '17:40' },
      '9-10': { start: '19:00', end: '20:40' }
    }
    return times[timeStr]
  }

  // 获取当前教学周
  static getCurrentWeek(startDate = '2024-02-26') {
    const start = moment(startDate)
    const now = moment()
    return Math.ceil(now.diff(start, 'weeks', true))
  }

  // 生成唯一ID
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 解析周数
  static parseWeeks(weekStr) {
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

  // 格式化时间
  static formatTime(date) {
    return moment(date).format('YYYY-MM-DD HH:mm:ss')
  }

  // 验证课程数据
  static validateCourse(course) {
    const required = ['name', 'teacher', 'location', 'weekDay', 'section', 'weeks']
    for(const field of required) {
      if(!course[field]) {
        throw new Error(`缺少必要字段: ${field}`)
      }
    }
    
    if(!/^[1-5]$/.test(course.weekDay)) {
      throw new Error('无效的星期')
    }
    
    if(!/^\d+-\d+$/.test(course.section)) {
      throw new Error('无效的节数格式')
    }
    
    if(!Array.isArray(course.weeks) || !course.weeks.length) {
      throw new Error('无效的周数')
    }
  }
} 
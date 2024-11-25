import moment from 'moment'

export class Utils {
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

  // 生成课程ID
  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // 验证课程数据
  static validateCourse(course) {
    const required = ['name', 'teacher', 'location', 'weekDay', 'section', 'weeks']
    for(const field of required) {
      if(!course[field]) {
        throw new ClassError(`缺少必要字段: ${field}`, ErrorCode.INVALID_PARAM)
      }
    }
    
    if(!/^[1-5]$/.test(course.weekDay)) {
      throw new ClassError('无效的星期', ErrorCode.INVALID_WEEKDAY)
    }
    
    if(!/^\d+-\d+$/.test(course.section)) {
      throw new ClassError('无效的节数格式', ErrorCode.INVALID_SECTION)
    }
    
    if(!Array.isArray(course.weeks) || !course.weeks.length) {
      throw new ClassError('无效的周数', ErrorCode.INVALID_WEEK)
    }
  }

  // 检查时间冲突
  static checkTimeConflict(courses, newCourse) {
    return courses.some(course => {
      return course.weekDay === newCourse.weekDay &&
             course.section === newCourse.section &&
             course.weeks.some(w => newCourse.weeks.includes(w))
    })
  }
} 
export interface CourseData {
  // 学期配置
  term: {
    startDate: string,  // 开学日期 
    endDate: string,   // 结束日期
    currentWeek: number // 当前周数
  },
  
  // 作息时间
  schedule: {
    sections: Array<{
      section: number,   // 第几节
      startTime: string, // 开始时间
      endTime: string,   // 结束时间
      type: 'course' | 'break' // 课程或休息
    }>
  },

  // 课程数据
  courses: Array<{
    id: string,
    name: string,      // 课程名
    teacher: string,   // 教师
    location: string,  // 教室
    weekDay: number,   // 周几
    section: string,   // 节数
    weeks: number[],   // 周数
    color: string     // 课程颜色
  }>,

  // 调课记录
  adjustments: Array<{
    courseId: string,
    date: string,
    originalSection: string,
    newSection: string
  }>
} 
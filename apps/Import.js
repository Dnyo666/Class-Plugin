import plugin from '../../../lib/plugins/plugin.js'
import fs from 'fs'
import XLSX from 'xlsx'

export class Import extends plugin {
  constructor() {
    super({
      name: 'Class-导入导出',
      dsc: '课表导入导出',
      event: 'message',
      priority: 5000,
      rule: [
        {
          reg: '^#?导出课表$',
          fnc: 'exportSchedule'
        },
        {
          reg: '^#?导入课表$',
          fnc: 'importSchedule'
        }
      ]
    })
  }

  async exportSchedule(e) {
    const userData = this.getUserData(e.user_id)
    if(!userData.courses.length) {
      await e.reply('暂无课程数据可导出')
      return true
    }

    // 创建工作簿
    const wb = XLSX.utils.book_new()
    
    // 转换课程数据
    const data = userData.courses.map(course => ({
      课程名: course.name,
      教师: course.teacher,
      教室: course.location,
      星期: this.weekDayToStr(course.weekDay),
      节数: course.section,
      周数: this.weeksToStr(course.weeks)
    }))

    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, '课表')

    // 保存文件
    const filePath = `${process.cwd()}/data/class-plugin/temp/${e.user_id}_课表.xlsx`
    XLSX.writeFile(wb, filePath)

    // 发送文件
    await e.reply(segment.file(filePath))
    
    // 删除临时文件
    setTimeout(() => fs.unlinkSync(filePath), 5000)
    
    return true
  }

  async importSchedule(e) {
    if(!e.file) {
      await e.reply('请发送Excel文件(.xlsx)')
      return true
    }

    try {
      // 下载文件
      const filePath = `${process.cwd()}/data/class-plugin/temp/${e.file.name}`
      await this.downloadFile(e.file.url, filePath)

      // 读取Excel
      const wb = XLSX.readFile(filePath)
      const ws = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(ws)

      // 转换数据
      const courses = data.map(row => ({
        id: Date.now().toString(),
        name: row['课程名'],
        teacher: row['教师'],
        location: row['教室'],
        weekDay: this.strToWeekDay(row['星期']),
        section: row['节数'],
        weeks: this.strToWeeks(row['周数'])
      }))

      // 保存数据
      let userData = this.getUserData(e.user_id)
      userData.courses = courses
      this.saveUserData(e.user_id, userData)

      // 删除临时文件
      fs.unlinkSync(filePath)
      
      await e.reply('导入成功')
    } catch(err) {
      logger.error(`导入课表失败: ${err}`)
      await e.reply('导入失败,请确保文件格式正确')
    }

    return true
  }

  weekDayToStr(day) {
    return ['周一','周二','周三','周四','周五'][day-1]
  }

  strToWeekDay(str) {
    return {'周一':1,'周二':2,'周三':3,'周四':4,'周五':5}[str]
  }

  weeksToStr(weeks) {
    // 连续周数合并
    let ranges = []
    let start = weeks[0]
    let prev = weeks[0]
    
    for(let i = 1; i <= weeks.length; i++) {
      if(weeks[i] !== prev + 1) {
        if(start === prev) {
          ranges.push(start.toString())
        } else {
          ranges.push(`${start}-${prev}`)
        }
        start = weeks[i]
      }
      prev = weeks[i]
    }

    return ranges.join(',') + '周'
  }

  strToWeeks(str) {
    return str.split(/[,，]/).flatMap(range => {
      const match = range.match(/(\d+)(?:-(\d+))?周/)
      if(!match) return []
      if(match[2]) {
        const weeks = []
        for(let i = parseInt(match[1]); i <= parseInt(match[2]); i++) {
          weeks.push(i)
        }
        return weeks
      }
      return [parseInt(match[1])]
    })
  }

  async downloadFile(url, path) {
    const response = await fetch(url)
    const buffer = await response.buffer()
    fs.writeFileSync(path, buffer)
  }
} 
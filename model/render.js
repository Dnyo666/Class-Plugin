import { createCanvas, loadImage, registerFont } from 'canvas'
import fs from 'fs'
import path from 'path'

export class Render {
  constructor() {
    this.width = 1000
    this.height = 1200
    this.padding = 60
    this.headerHeight = 120
    this.timeWidth = 80
    this.dayWidth = (this.width - this.timeWidth - this.padding * 2) / 7
    this.sectionHeight = 100
  }

  initFont() {
    try {
      // 使用系统默认字体
      const fontPath = path.join(process.cwd(), 'plugins/class-plugin/resources/font/HYWenHei.ttf')
      if(fs.existsSync(fontPath)) {
        registerFont(fontPath, { family: 'HYWenHei' })
      }
    } catch (e) {
      logger.warn('[Class-Plugin] 使用系统默认字体')
    }
  }

  getRandomColor(str) {
    // 根据字符串生成固定颜色
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const colors = [
      '#FF9966', '#FF6666', '#99CC66', '#66CCCC', 
      '#6699CC', '#9966CC', '#CC6699', '#FF99CC',
      '#99CCFF', '#FF99FF', '#FFCC99', '#FFFF99'
    ]
    return colors[Math.abs(hash) % colors.length]
  }

  async courseTable(data, currentWeek) {
    const canvas = createCanvas(this.width, this.height)
    const ctx = canvas.getContext('2d')
    
    // 绘制背景
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, this.width, this.height)
    
    // 绘制日期和周数
    this.drawHeader(ctx, data.term, currentWeek)
    
    // 绘制时间轴
    this.drawTimeline(ctx, data.schedule)
    
    // 绘制课程
    this.drawCourses(ctx, data.courses, currentWeek)
    
    return this.saveImage(canvas)
  }

  drawHeader(ctx, term, currentWeek) {
    // 绘制日期和周数
    ctx.font = '24px "Microsoft YaHei"'
    ctx.fillStyle = '#333333'
    ctx.textAlign = 'center'
    ctx.fillText(`第${currentWeek}周课表`, this.width / 2, this.headerHeight / 2)
  }

  drawTimeline(ctx, schedule) {
    // 绘制时间轴
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
    
    // 垂直线
    for(let i = 0; i <= 7; i++) {
      ctx.beginPath()
      ctx.moveTo(this.padding + i * this.dayWidth, this.headerHeight)
      ctx.lineTo(this.padding + i * this.dayWidth, this.height - this.padding)
      ctx.stroke()
    }
    
    // 水平线
    for(let i = 0; i <= schedule.length; i++) {
      ctx.beginPath() 
      ctx.moveTo(this.padding, this.headerHeight + i * this.sectionHeight)
      ctx.lineTo(this.width - this.padding, this.headerHeight + i * this.sectionHeight)
      ctx.stroke()
    }
  }

  drawCourses(ctx, courses, currentWeek) {
    // 绘制课程
    courses.forEach(course => {
      const x = this.padding + (course.weekDay - 1) * this.dayWidth
      const sectionStart = parseInt(course.section.split('-')[0])
      const y = this.headerHeight + Math.floor((sectionStart - 1) / 2) * this.sectionHeight
      
      // 课程背景
      ctx.fillStyle = this.getRandomColor(course.name)
      ctx.fillRect(x + 1, y + 1, this.dayWidth - 2, this.sectionHeight - 2)
      
      // 课程信息
      ctx.fillStyle = '#ffffff'
      ctx.font = '16px "Microsoft YaHei"'
      ctx.textAlign = 'left'
      ctx.fillText(course.name, x + 5, y + 25)
      ctx.fillText(course.teacher, x + 5, y + 45)
      ctx.fillText(course.location, x + 5, y + 65)
    })
  }

  saveImage(canvas) {
    // 返回图片路径
    const tempPath = path.join(process.cwd(), 'data/class-plugin/temp', `schedule_${Date.now()}.png`)
    const buffer = canvas.toBuffer('image/png')
    fs.writeFileSync(tempPath, buffer)
    
    return tempPath
  }
}
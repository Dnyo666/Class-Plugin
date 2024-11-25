import { createCanvas, loadImage, registerFont } from 'canvas'
import fs from 'fs'
import path from 'path'

export class Render {
  constructor() {
    this.width = 1000
    this.height = 800
    this.initFont()
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

  async courseTable(courses, currentWeek) {
    const canvas = createCanvas(this.width, this.height)
    const ctx = canvas.getContext('2d')
    
    // 绘制背景
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, this.width, this.height)
    
    // 绘制标题
    ctx.font = '24px "Microsoft YaHei"'
    ctx.fillStyle = '#333333'
    ctx.textAlign = 'center'
    ctx.fillText(`第${currentWeek}周课表`, this.width / 2, 40)
    
    // 绘制表头
    const days = ['周一', '周二', '周三', '周四', '周五']
    const cellWidth = (this.width - 100) / days.length
    const cellHeight = 100
    
    // 绘制列标题
    ctx.font = '18px "Microsoft YaHei"'
    days.forEach((day, i) => {
      ctx.fillText(day, 100 + cellWidth * i + cellWidth/2, 80)
    })
    
    // 绘制行标题
    const sections = ['1-2', '3-4', '5-6', '7-8', '9-10']
    sections.forEach((section, i) => {
      ctx.fillText(section, 50, 120 + cellHeight * i + cellHeight/2)
    })
    
    // 绘制网格线
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 1
    
    // 垂直线
    for(let i = 0; i <= days.length; i++) {
      ctx.beginPath()
      ctx.moveTo(100 + cellWidth * i, 60)
      ctx.lineTo(100 + cellWidth * i, 600)
      ctx.stroke()
    }
    
    // 水平线
    for(let i = 0; i <= sections.length; i++) {
      ctx.beginPath() 
      ctx.moveTo(100, 100 + cellHeight * i)
      ctx.lineTo(this.width - 50, 100 + cellHeight * i)
      ctx.stroke()
    }
    
    // 绘制课程
    courses.forEach(course => {
      const x = 100 + (course.weekDay - 1) * cellWidth
      const sectionStart = parseInt(course.section.split('-')[0])
      const y = 100 + Math.floor((sectionStart - 1) / 2) * cellHeight
      
      // 课程背景
      ctx.fillStyle = this.getRandomColor(course.name)
      ctx.fillRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2)
      
      // 课程信息
      ctx.fillStyle = '#ffffff'
      ctx.font = '16px "Microsoft YaHei"'
      ctx.textAlign = 'left'
      ctx.fillText(course.name, x + 5, y + 25)
      ctx.fillText(course.teacher, x + 5, y + 45)
      ctx.fillText(course.location, x + 5, y + 65)
    })

    // 返回图片路径
    const tempPath = path.join(process.cwd(), 'data/class-plugin/temp', `schedule_${Date.now()}.png`)
    const buffer = canvas.toBuffer('image/png')
    fs.writeFileSync(tempPath, buffer)
    
    return tempPath
  }
}
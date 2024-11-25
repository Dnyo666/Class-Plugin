import { createCanvas, loadImage, registerFont } from 'canvas'
import fs from 'fs'
import path from 'path'

const _path = process.cwd()

export class Render {
  constructor() {
    this.width = 1000
    this.height = 800
    this.initFont()
  }

  initFont() {
    try {
      // 使用系统默认字体
      const fontPath = `${process.cwd()}/plugins/class-plugin/resources/font/HYWenHei.ttf`
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
    
    // 绘制表格边框
    ctx.strokeStyle = '#d0d0d0'
    ctx.lineWidth = 1
    ctx.strokeRect(this.padding, this.padding, 
      this.width - this.padding * 2, 
      this.height - this.padding * 2)

    // 绘制表头
    this.drawHeader(ctx)
    
    // 绘制网格
    this.drawGrid(ctx)
    
    // 绘制课程
    this.drawCourses(ctx, courses, currentWeek)
    
    // 绘制周数信息
    this.drawWeekInfo(ctx, currentWeek)

    return canvas.toBuffer('image/png')
  }

  drawHeader(ctx) {
    const days = ['周一', '周二', '周三', '周四', '周五']
    ctx.fillStyle = '#333333'
    ctx.font = '20px "HYWenHei", "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    
    days.forEach((day, index) => {
      const x = this.padding + this.cellWidth * index + this.cellWidth / 2
      const y = this.padding - 10
      ctx.fillText(day, x, y)
    })

    // 绘制节数
    const sections = ['1-2', '3-4', '5-6', '7-8', '9-10']
    sections.forEach((section, index) => {
      const x = this.padding - 10
      const y = this.padding + this.cellHeight * index + this.cellHeight / 2
      ctx.fillText(section, x, y)
    })
  }

  drawGrid(ctx) {
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 0.5

    // 绘制竖线
    for(let i = 1; i < 5; i++) {
      const x = this.padding + this.cellWidth * i
      ctx.beginPath()
      ctx.moveTo(x, this.padding)
      ctx.lineTo(x, this.height - this.padding)
      ctx.stroke()
    }

    // 绘制横线
    for(let i = 1; i < 6; i++) {
      const y = this.padding + this.cellHeight * i
      ctx.beginPath()
      ctx.moveTo(this.padding, y)
      ctx.lineTo(this.width - this.padding, y)
      ctx.stroke()
    }
  }

  drawCourses(ctx, courses, currentWeek) {
    courses.forEach(course => {
      if(course.weeks.includes(currentWeek)) {
        const x = this.padding + (course.weekDay - 1) * this.cellWidth
        const [start, end] = course.section.split('-').map(Number)
        const y = this.padding + (Math.floor((start - 1) / 2)) * this.cellHeight
        
        // 绘制课程背景
        ctx.fillStyle = this.getRandomColor(course.name)
        ctx.fillRect(x + 1, y + 1, this.cellWidth - 2, this.cellHeight - 2)
        
        // 绘制课程信息
        ctx.fillStyle = '#ffffff'
        ctx.font = '16px HYWenHei'
        ctx.textAlign = 'center'
        
        const lines = [
          course.name,
          course.teacher,
          course.location
        ]
        
        lines.forEach((line, index) => {
          ctx.fillText(line, 
            x + this.cellWidth / 2,
            y + 25 + index * 20,
            this.cellWidth - 10)
        })
      }
    })
  }

  drawWeekInfo(ctx, currentWeek) {
    ctx.fillStyle = '#333333'
    ctx.font = 'bold 24px HYWenHei'
    ctx.textAlign = 'center'
    ctx.fillText(`第${currentWeek}周`, this.width / 2, 30)
  }

  getRandomColor(str) {
    // 根据字符串生成固定颜色
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const colors = [
      '#FF9966', '#FF6666', '#99CC66', '#66CCCC', 
      '#6699CC', '#9966CC', '#CC6699'
    ]
    return colors[Math.abs(hash) % colors.length]
  }

  async help(helpCfg, helpGroup) {
    const canvas = createCanvas(800, 1000)
    const ctx = canvas.getContext('2d')
    
    // 使用系统默认字体
    const fontFamily = '"Microsoft YaHei", "SimHei", sans-serif'
    
    // 绘制背景
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, 800, 1000)
    
    // 绘制标题
    ctx.font = `36px ${fontFamily}`
    ctx.fillStyle = '#333'
    ctx.fillText(helpCfg.title, 50, 80)
    
    // 绘制副标题
    ctx.font = `24px ${fontFamily}`
    ctx.fillText(helpCfg.subTitle, 50, 120)
    
    // 绘制分组
    let y = 180
    helpGroup.forEach(group => {
      ctx.font = `28px ${fontFamily}`
      ctx.fillStyle = '#666'
      ctx.fillText(group.group, 50, y)
      y += 50
      
      group.list.forEach(help => {
        ctx.font = `24px ${fontFamily}`
        ctx.fillStyle = '#409EFF'
        ctx.fillText(help.title, 80, y)
        ctx.fillStyle = '#666'
        ctx.fillText(help.desc, 300, y)
        y += 40
      })
      y += 30
    })

    // 保存为临时文件
    const tempPath = `${process.cwd()}/data/class-plugin/temp/help.png`
    const out = fs.createWriteStream(tempPath)
    const stream = canvas.createPNGStream()
    stream.pipe(out)
    
    return new Promise((resolve) => {
      out.on('finish', () => resolve(tempPath))
    })
  }
}
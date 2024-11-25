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
    
    // 使用系统默认字体
    const fontFamily = '"Microsoft YaHei", "SimHei", sans-serif'
    
    // 绘制背景
    ctx.fillStyle = '#f5f5f5'
    ctx.fillRect(0, 0, this.width, this.height)
    
    // 绘制标题
    ctx.font = `bold 24px ${fontFamily}`
    ctx.fillStyle = '#333333'
    ctx.textAlign = 'center'
    ctx.fillText(`第${currentWeek}周课表`, this.width / 2, 30)
    
    // ... 其他绘制代码 ...

    // 保存为临时文件
    const tempPath = path.join(process.cwd(), 'data/class-plugin/temp', `schedule_${Date.now()}.png`)
    const buffer = canvas.toBuffer('image/png')
    fs.writeFileSync(tempPath, buffer)
    
    return tempPath
  }
}
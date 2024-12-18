import fs from 'node:fs'
import path from 'path'
import moment from 'moment'

const _path = process.cwd()

export class DataManager {
  constructor() {
    this.dataDir = path.join(process.cwd(), 'data/class-plugin/users')
    if(!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true })
    }
  }

  getUserDataPath(userId) {
    return path.join(this.dataDir, `${userId}.json`)
  }

  getDefaultData() {
    return {
      term: {
        startDate: moment().format('YYYY-MM-DD'),
        endDate: moment().add(4, 'months').format('YYYY-MM-DD'),
        currentWeek: 1
      },
      schedule: {
        sections: [
          { section: 1, startTime: '08:15', endTime: '09:00', type: 'course' },
          { section: 0, startTime: '09:00', endTime: '09:05', type: 'break' },
          { section: 2, startTime: '09:05', endTime: '09:50', type: 'course' },
          // ... 其他时间段
        ]
      },
      courses: [],
      adjustments: []
    }
  }
}

class Init {
  constructor() {
    this.initDirs()
    this.initFiles()
  }

  initDirs() {
    const dirs = [
      `${_path}/plugins/class-plugin/resources`,
      `${_path}/plugins/class-plugin/resources/font`,
      `${_path}/plugins/class-plugin/resources/img`,
      `${_path}/plugins/class-plugin/config`,
      `${_path}/data/class-plugin`,
      `${_path}/data/class-plugin/data`,
      `${_path}/data/class-plugin/temp`
    ]
    
    for(const dir of dirs) {
      if(!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    }
    
    // 下载字体文件
    const fontUrl = 'https://example.com/HYWenHei.ttf' // 需要替换为实际的字体文件URL
    const fontPath = `${_path}/plugins/class-plugin/resources/font/HYWenHei.ttf`
    if(!fs.existsSync(fontPath)) {
      try {
        // 下载字体文件的代码
        // ...
      } catch(e) {
        logger.warn('[Class-Plugin] 字体文件下载失败,将使用系统默认字体')
      }
    }
  }

  initFiles() {
    // 初始化配置文件
    const configPath = `${_path}/plugins/class-plugin/config/config.yaml`
    if(!fs.existsSync(configPath)) {
      const defaultConfig = `
# 课表插件配置
base:
  startDate: '2024-02-26'  # 开学日期
  maxWeek: 16             # 学期周数
  
remind:
  defaultAdvance: 10      # 默认提前提醒时间(分钟)
  defaultMode: 'private'  # 默认提醒方式
`
      fs.writeFileSync(configPath, defaultConfig)
    }

    // 初始化数据文件
    const dataPath = `${_path}/data/class-plugin/data/courses.json`
    if(!fs.existsSync(dataPath)) {
      fs.writeFileSync(dataPath, JSON.stringify({
        users: {}
      }, null, 2))
    }
  }
}

export default new Init()

import fs from 'node:fs'

const _path = process.cwd()

class Init {
  constructor() {
    this.initDirs()
    this.initFiles()
  }

  initDirs() {
    const dirs = [
      `${_path}/data/class-plugin`,
      `${_path}/data/class-plugin/data`,
      `${_path}/data/class-plugin/temp`,
      `${_path}/plugins/class-plugin/config`,
      `${_path}/plugins/class-plugin/resources`,
      `${_path}/plugins/class-plugin/resources/font`,
      `${_path}/plugins/class-plugin/resources/img`
    ]
    
    for(const dir of dirs) {
      if(!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
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

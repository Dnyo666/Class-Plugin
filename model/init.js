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
      `${_path}/data/class-plugin/data`
    ]
    
    for(const dir of dirs) {
      if(!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    }
  }

  initFiles() {
    // 初始化配置文件
    const configPath = `${_path}/data/class-plugin/config.json`
    if(!fs.existsSync(configPath)) {
      const defaultConfig = {
        version: '1.0.0',
        base: {
          remind: {
            enable: false,
            advance: 10,
            mode: 'private'
          }
        }
      }
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
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

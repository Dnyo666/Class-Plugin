import fs from 'node:fs'

const _path = process.cwd()

export class Config {
  static getConfig() {
    const configPath = `${_path}/data/class-plugin/config.json`
    return JSON.parse(fs.readFileSync(configPath, 'utf8'))
  }

  static setConfig(config) {
    const configPath = `${_path}/data/class-plugin/config.json`
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  }

  static getUserConfig(userId) {
    const coursePath = `${_path}/data/class-plugin/data/courses.json`
    const data = JSON.parse(fs.readFileSync(coursePath, 'utf8'))
    return data.users[userId] || {
      courses: [],
      adjustments: [],
      remind: this.getConfig().base.remind
    }
  }

  static setUserConfig(userId, config) {
    const coursePath = `${_path}/data/class-plugin/data/courses.json`
    const data = JSON.parse(fs.readFileSync(coursePath, 'utf8'))
    data.users[userId] = config
    fs.writeFileSync(coursePath, JSON.stringify(data, null, 2))
  }
} 
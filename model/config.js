import fs from 'node:fs'
import path from 'path'
import moment from 'moment'

const _path = process.cwd()
const defaultConfig = {
  base: {
    startDate: moment().format('YYYY-MM-DD'),
    maxWeek: 16,
    sections: [
      { name: '第一节', start: '08:00', end: '08:45' },
      { name: '第二节', start: '08:55', end: '09:40' },
      { name: '第三节', start: '10:10', end: '10:55' },
      { name: '第四节', start: '11:05', end: '11:50' },
      { name: '第五节', start: '14:00', end: '14:45' },
      { name: '第六节', start: '14:55', end: '15:40' },
      { name: '第七节', start: '16:00', end: '16:45' },
      { name: '第八节', start: '16:55', end: '17:40' }
    ]
  },
  courses: [],
  adjustments: [],
  remind: {
    enable: false,
    advance: 10,
    mode: 'private'
  }
}

export class Config {
  static getUserConfig(userId) {
    const userPath = path.join(_path, 'data/class-plugin/data', `${userId}.json`)
    if (!fs.existsSync(userPath)) {
      this.setUserConfig(userId, defaultConfig)
      return defaultConfig
    }
    return JSON.parse(fs.readFileSync(userPath, 'utf8'))
  }

  static setUserConfig(userId, config) {
    const dataDir = path.join(_path, 'data/class-plugin/data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    const userPath = path.join(dataDir, `${userId}.json`)
    fs.writeFileSync(userPath, JSON.stringify(config, null, 2))
  }

  static getAllUsers() {
    const dataDir = path.join(_path, 'data/class-plugin/data')
    if (!fs.existsSync(dataDir)) return []
    return fs.readdirSync(dataDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''))
  }
} 
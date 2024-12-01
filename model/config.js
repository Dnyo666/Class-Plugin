import fs from 'node:fs'
import path from 'path'
import moment from 'moment'

const _path = process.cwd()

export class Config {
  static dataDir = path.join(_path, 'data/class-plugin/data')
  static defaultConfig = {
    base: {
      startDate: moment().format('YYYY-MM-DD'),
      maxWeek: 16
    },
    courses: [],
    remind: {
      enable: false,
      advance: 10,
      mode: 'private'
    }
  }

  static init() {
    try {
      // 确保数据目录存在
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true })
      }
      logger.info('[Class-Plugin] 数据目录初始化成功')
    } catch (err) {
      logger.error(`[Class-Plugin] 数据目录初始化失败: ${err}`)
    }
  }

  static getUserConfig(userId) {
    try {
      const filePath = path.join(this.dataDir, `${userId}.json`)
      if (!fs.existsSync(filePath)) {
        return this.defaultConfig
      }
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
      return this.validateConfig(data)
    } catch (err) {
      logger.error(`[Class-Plugin] 读取用户配置失败: ${err}`)
      return this.defaultConfig
    }
  }

  static setUserConfig(userId, config) {
    try {
      const filePath = path.join(this.dataDir, `${userId}.json`)
      const validConfig = this.validateConfig(config)
      fs.writeFileSync(filePath, JSON.stringify(validConfig, null, 2))
      return true
    } catch (err) {
      logger.error(`[Class-Plugin] 保存用户配置失败: ${err}`)
      return false
    }
  }

  static validateConfig(config) {
    // 基础配置验证
    const validConfig = {
      base: {
        startDate: moment(config.base?.startDate || this.defaultConfig.base.startDate).format('YYYY-MM-DD'),
        maxWeek: Number(config.base?.maxWeek || this.defaultConfig.base.maxWeek)
      },
      courses: [],
      remind: {
        enable: Boolean(config.remind?.enable),
        advance: Number(config.remind?.advance || this.defaultConfig.remind.advance),
        mode: ['private', 'group'].includes(config.remind?.mode) ? config.remind.mode : this.defaultConfig.remind.mode
      }
    }

    // 课程数据验证
    if (Array.isArray(config.courses)) {
      validConfig.courses = config.courses.map(course => ({
        id: String(course.id || Date.now()),
        name: String(course.name || ''),
        teacher: String(course.teacher || ''),
        location: String(course.location || ''),
        weekDay: Number(course.weekDay),
        section: String(course.section || ''),
        weeks: Array.isArray(course.weeks) 
          ? course.weeks.map(w => Number(w)).filter(w => w > 0 && w <= 30).sort((a, b) => a - b)
          : []
      })).filter(course => 
        course.name && 
        course.teacher && 
        course.location && 
        course.weekDay >= 1 && 
        course.weekDay <= 7 &&
        /^\d+-\d+$/.test(course.section) &&
        course.weeks.length > 0
      )
    }

    return validConfig
  }

  static getAllUsers() {
    try {
      if (!fs.existsSync(this.dataDir)) return []
      return fs.readdirSync(this.dataDir)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', ''))
    } catch (err) {
      logger.error(`[Class-Plugin] 获取用户列表失败: ${err}`)
      return []
    }
  }

  static deleteUserConfig(userId) {
    try {
      const filePath = path.join(this.dataDir, `${userId}.json`)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        return true
      }
      return false
    } catch (err) {
      logger.error(`[Class-Plugin] 删除用户配置失败: ${err}`)
      return false
    }
  }
} 
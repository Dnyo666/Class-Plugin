import fs from 'node:fs'
import path from 'path'
import moment from 'moment'
import { pluginRoot } from './path.js'

export class Config {
  static dataDir = path.join(pluginRoot, 'data')
  static tempDir = path.join(this.dataDir, 'temp')
  
  // 标准数据结构
  static defaultConfig = {
    version: '1.0.0', // 配置版本号
    base: {
      startDate: moment().format('YYYY-MM-DD'),
      maxWeek: 16,
      currentTerm: '2023-2024-2' // 当前学期
    },
    timeTable: {
      sections: [
        { 
          index: 1,          // 节次索引
          name: '第一节',    // 节次名称
          start: "08:00",    // 开始时间
          end: "09:35",      // 结束时间
          duration: 95,      // 时长(分钟)
          rest: 15           // 休息时间(分钟)
        },
        { 
          index: 2,
          name: '第二节',
          start: "09:50",
          end: "11:25", 
          duration: 95,
          rest: 120
        },
        {
          index: 3,
          name: '第三节',
          start: "13:25",
          end: "15:00",
          duration: 95,
          rest: 15
        },
        {
          index: 4,
          name: '第四节',
          start: "15:15",
          end: "16:50",
          duration: 95,
          rest: 15
        },
        {
          index: 5,
          name: '第五节',
          start: "17:05",
          end: "18:40",
          duration: 95,
          rest: 0
        }
      ],
      autoCalculate: true,
      defaultDuration: 95,  // 默认课程时长(分钟)
      defaultRest: 15       // 默认休息时长(分钟)
    },
    courses: [], // 课程列表
    styles: {
      courseColors: [
        '#FF9B9B', '#9BCDFF', '#B5E8B0', '#FFE1B1', 
        '#D5B8FF', '#FFB1E6', '#B1FFE3', '#FFD7B1'
      ]
    }
  }

  static init() {
    // 确保目录存在
    const dirs = [this.dataDir, this.tempDir]
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    })
  }

  static async getInstance() {
    if (!this.instance) {
      this.init()
      this.instance = new Config()
    }
    return this.instance
  }

  // 标准化课程数据结构
  static validateCourse(course) {
    return {
      id: course.id || `${course.name}_${course.day}_${course.startNode}`,
      name: course.name || '',
      teacher: course.teacher || '',
      room: course.room || '',
      day: Number(course.day) || 1,
      startNode: Number(course.startNode) || 1,
      endNode: Number(course.endNode) || (Number(course.startNode) + 1),
      weeks: Array.isArray(course.weeks) ? course.weeks.map(Number) : [],
      color: course.color || '',
      timeInfo: {
        start: course.timeInfo?.start || '',
        end: course.timeInfo?.end || '',
        duration: Number(course.timeInfo?.duration) || 0
      }
    }
  }

  // 验证并标准化配置
  static validateConfig(config) {
    const validConfig = {
      version: config.version || this.defaultConfig.version,
      base: {
        startDate: moment(config.base?.startDate).isValid() 
          ? moment(config.base.startDate).format('YYYY-MM-DD')
          : this.defaultConfig.base.startDate,
        maxWeek: Number(config.base?.maxWeek) || this.defaultConfig.base.maxWeek,
        currentTerm: config.base?.currentTerm || this.defaultConfig.base.currentTerm
      },
      timeTable: {
        sections: [],
        autoCalculate: Boolean(config.timeTable?.autoCalculate),
        defaultDuration: Number(config.timeTable?.defaultDuration) || this.defaultConfig.timeTable.defaultDuration,
        defaultRest: Number(config.timeTable?.defaultRest) || this.defaultConfig.timeTable.defaultRest
      },
      courses: [],
      styles: {
        courseColors: Array.isArray(config.styles?.courseColors) 
          ? config.styles.courseColors 
          : this.defaultConfig.styles.courseColors
      }
    }

    // 验证时间表
    if (Array.isArray(config.timeTable?.sections)) {
      validConfig.timeTable.sections = config.timeTable.sections
        .map((section, index) => ({
          index: Number(section.index) || index + 1,
          name: section.name || `第${index + 1}节`,
          start: this.validateTime(section.start) ? section.start : this.defaultConfig.timeTable.sections[index]?.start,
          end: this.validateTime(section.end) ? section.end : this.defaultConfig.timeTable.sections[index]?.end,
          duration: Number(section.duration) || this.defaultConfig.timeTable.sections[index]?.duration,
          rest: Number(section.rest) >= 0 ? Number(section.rest) : this.defaultConfig.timeTable.sections[index]?.rest
        }))
        .filter(section => section.start && section.end)
    }

    if (!validConfig.timeTable.sections.length) {
      validConfig.timeTable.sections = this.defaultConfig.timeTable.sections
    }

    // 验证课程数据
    if (Array.isArray(config.courses)) {
      validConfig.courses = config.courses
        .map(course => this.validateCourse(course))
        .filter(course => course.name && course.weeks.length)
    }

    return validConfig
  }

  // 验证时间格式 HH:mm
  static validateTime(time) {
    if (typeof time !== 'string') return false
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/
    return regex.test(time)
  }

  // 读取用户配置
  static getUserConfig(userId) {
    try {
      const filePath = path.join(this.dataDir, `${userId}.json`)
      if (!fs.existsSync(filePath)) {
        return this.defaultConfig
      }
      const data = fs.readFileSync(filePath, 'utf8')
      return this.validateConfig(JSON.parse(data))
    } catch (err) {
      logger.mark(`[Class-Plugin] 读取用户配置失败: ${err}`)
      return this.defaultConfig
    }
  }

  // 保存用户配置
  static setUserConfig(userId, config) {
    try {
      const filePath = path.join(this.dataDir, `${userId}.json`)
      const validConfig = this.validateConfig(config)
      
      // 确保目录存在
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true })
      }

      // 如果是初始化配置，检查是否有临时数据需要迁移
      if (!config.base?.startDate || !config.base?.maxWeek) {
        const tempPath = path.join(this.tempDir, `${userId}.json`)
        if (fs.existsSync(tempPath)) {
          try {
            const tempData = JSON.parse(fs.readFileSync(tempPath, 'utf8'))
            if (tempData.courses?.length) {
              validConfig.courses = tempData.courses.map(course => this.validateCourse(course))
            }
            fs.unlinkSync(tempPath)
          } catch (err) {
            logger.mark(`[Class-Plugin] 迁移临时数据失败: ${err}`)
          }
        }
      }

      // 备份旧配置
      const backupDir = path.join(this.dataDir, 'backup')
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true })
      }
      if (fs.existsSync(filePath)) {
        const backupPath = path.join(backupDir, `${userId}_${moment().format('YYYYMMDD_HHmmss')}.json`)
        fs.copyFileSync(filePath, backupPath)
      }

      // 保存新配置
      fs.writeFileSync(filePath, JSON.stringify(validConfig, null, 2))
      return true
    } catch (err) {
      logger.mark(`[Class-Plugin] 保存用户配置失败: ${err}`)
      return false
    }
  }
} 
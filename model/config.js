import fs from 'node:fs'
import path from 'path'
import moment from 'moment'
import { pluginRoot } from './path.js'
import logger from './logger.js'

export class Config {
  static dataDir = path.join(pluginRoot, 'data')
  static tempDir = path.join(this.dataDir, 'temp')
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
    },
    server: {
      port: 3000,
      allowLogin: true
    },
    timeTable: {
      // 课程时间配置
      sections: [
        { start: "08:00", end: "09:35", rest: 15 },  // 1-2节
        { start: "09:50", end: "11:25", rest: 120 }, // 3-4节，午休
        { start: "13:25", end: "15:00", rest: 15 },  // 5-6节
        { start: "15:15", end: "16:50", rest: 15 },  // 7-8节
        { start: "17:05", end: "18:40", rest: 0 }    // 9-10节
      ],
      // 是否自动计算后续时间
      autoCalculate: true,
      // 每节课时长（分钟）
      duration: 45,
      // 课间休息时长（分钟）
      breakTime: 10
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

  static getUserConfig(userId) {
    try {
      const filePath = path.join(this.dataDir, `${userId}.json`)
      if (!fs.existsSync(filePath)) {
        return this.defaultConfig
      }
      const data = fs.readFileSync(filePath, 'utf8')
      return this.validateConfig(JSON.parse(data))
    } catch (err) {
      logger.error(`[Class-Plugin] 读取用户配置失败: ${err}`)
      return this.defaultConfig
    }
  }

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
              validConfig.courses = tempData.courses
            }
            fs.unlinkSync(tempPath)
          } catch (err) {
            logger.error(`[Class-Plugin] 迁移临时数据失败: ${err}`)
          }
        }
      }

      fs.writeFileSync(filePath, JSON.stringify(validConfig, null, 2))
      return true
    } catch (err) {
      logger.error(`[Class-Plugin] 保存用户配置失败: ${err}`)
      return false
    }
  }

  static saveTempData(userId, data) {
    try {
      const tempPath = path.join(this.tempDir, `${userId}.json`)
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2))
      return true
    } catch (err) {
      logger.error(`[Class-Plugin] 保存临时数据失败: ${err}`)
      return false
    }
  }

  static validateConfig(config) {
    // 基础配置验证
    const validConfig = {
      base: {
        startDate: moment(config.base?.startDate || this.defaultConfig.base.startDate).isValid() 
          ? moment(config.base?.startDate).format('YYYY-MM-DD')
          : this.defaultConfig.base.startDate,
        maxWeek: Number.isInteger(Number(config.base?.maxWeek)) && Number(config.base?.maxWeek) > 0
          ? Number(config.base?.maxWeek)
          : this.defaultConfig.base.maxWeek
      },
      courses: [],
      remind: {
        enable: Boolean(config.remind?.enable),
        advance: Number.isInteger(Number(config.remind?.advance)) && Number(config.remind?.advance) > 0
          ? Number(config.remind?.advance)
          : this.defaultConfig.remind.advance,
        mode: ['private', 'group'].includes(config.remind?.mode)
          ? config.remind.mode
          : this.defaultConfig.remind.mode
      }
    }

    // 课程数据验证
    if (Array.isArray(config.courses)) {
      validConfig.courses = config.courses
        .filter(course => course && typeof course === 'object')
        .map(course => ({
          id: String(course.id || Date.now()),
          name: String(course.name || '').trim(),
          teacher: String(course.teacher || '').trim(),
          location: String(course.location || '').trim(),
          weekDay: Number.isInteger(Number(course.weekDay)) ? Number(course.weekDay) : 0,
          section: String(course.section || ''),
          weeks: Array.isArray(course.weeks)
            ? course.weeks
                .map(w => Number(w))
                .filter(w => Number.isInteger(w) && w > 0 && w <= 30)
                .sort((a, b) => a - b)
            : []
        }))
        .filter(course =>
          course.name &&
          course.teacher &&
          course.location &&
          course.weekDay >= 1 &&
          course.weekDay <= 7 &&
          /^\d+-\d+$/.test(course.section) &&
          course.weeks.length > 0
        )
    }

    // 验证时间配置
    if (config.timeTable) {
      const validTimeTable = {
        sections: [],
        autoCalculate: Boolean(config.timeTable.autoCalculate),
        duration: Number(config.timeTable.duration) || this.defaultConfig.timeTable.duration,
        breakTime: Number(config.timeTable.breakTime) || this.defaultConfig.timeTable.breakTime
      };

      if (Array.isArray(config.timeTable.sections)) {
        validTimeTable.sections = config.timeTable.sections
          .filter(section => section && typeof section === 'object')
          .map(section => ({
            start: this.validateTime(section.start) ? section.start : "08:00",
            end: this.validateTime(section.end) ? section.end : this.calculateEndTime(section.start || "08:00", validTimeTable.duration),
            rest: Number(section.rest) >= 0 ? Number(section.rest) : 15
          }));
      }

      if (!validTimeTable.sections.length) {
        validTimeTable.sections = this.defaultConfig.timeTable.sections;
      }

      validConfig.timeTable = validTimeTable;
    } else {
      validConfig.timeTable = this.defaultConfig.timeTable;
    }

    return validConfig;
  }

  // 验证时间格式 HH:mm
  static validateTime(time) {
    if (typeof time !== 'string') return false;
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    return regex.test(time);
  }

  // 计算结束时间
  static calculateEndTime(startTime, duration) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  }

  // 计算所有课程时间
  static calculateAllTimes(timeTable) {
    if (!timeTable.autoCalculate) return timeTable.sections;

    const sections = [];
    let currentTime = timeTable.sections[0]?.start || "08:00";

    for (let i = 0; i < 5; i++) {
      const existingSection = timeTable.sections[i];
      if (existingSection && this.validateTime(existingSection.start)) {
        // 使用配置的时间
        currentTime = existingSection.start;
      }

      const endTime = this.calculateEndTime(currentTime, timeTable.duration * 2);
      sections.push({
        start: currentTime,
        end: endTime,
        rest: existingSection?.rest ?? (i < 4 ? 15 : 0)
      });

      // 计算下一节课开始时间
      if (i < 4) {
        const totalMinutes = this.timeToMinutes(endTime) + sections[i].rest;
        currentTime = this.minutesToTime(totalMinutes);
      }
    }

    return sections;
  }

  // 辅助函数：时间转分钟
  static timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // 辅助函数：分钟转时间
  static minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
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
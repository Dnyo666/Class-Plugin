import express from 'express'
import path from 'path'
import { pluginRoot } from '../model/path.js'
import { Config } from '../model/config.js'
import bodyParser from 'body-parser'
import moment from 'moment'

export class Server {
  constructor(port = 3000) {
    this.app = express()
    this.port = port
    this.data = new Map() // 存储临时数据
    this.setupMiddleware()
    this.setupRoutes()
  }

  setupMiddleware() {
    this.app.use(bodyParser.json())
    this.app.use(express.static(path.join(pluginRoot, 'resources')))
  }

  setupRoutes() {
    // 登录接口
    this.app.post('/api/login', (req, res) => {
      try {
        const { userId, verifyCode } = req.body
        if (!userId || !verifyCode) {
          return res.json({ code: 400, msg: '参数错误' })
        }
        // 验证码校验逻辑...
        res.json({ code: 0, msg: 'success' })
      } catch (err) {
        logger.mark(`[Class-Plugin] 登录失败: ${err}`)
        res.json({ code: 500, msg: '服务器错误' })
      }
    })

    // 获取用户配置
    this.app.get('/api/config/:userId', (req, res) => {
      try {
        const { userId } = req.params
        const config = Config.getUserConfig(userId)
        if (!config) {
          return res.json({ code: 404, msg: '未找到配置' })
        }
        res.json({ code: 0, data: config })
      } catch (err) {
        logger.mark(`[Class-Plugin] 获取配置失败: ${err}`)
        res.json({ code: 500, msg: '服务器错误' })
      }
    })

    // 保存用户配置
    this.app.post('/api/config/:userId', (req, res) => {
      try {
        const { userId } = req.params
        const config = req.body
        
        // 验证并处理基础配置
        if (config.base) {
          if (config.base.startDate && !moment(config.base.startDate).isValid()) {
            return res.json({ code: 400, msg: '无效的开学日期' })
          }
          if (config.base.maxWeek && (!Number.isInteger(config.base.maxWeek) || config.base.maxWeek <= 0)) {
            return res.json({ code: 400, msg: '无效的周数' })
          }
        }

        // 保存配置
        if (Config.setUserConfig(userId, config)) {
          res.json({ code: 0, msg: '保存成功' })
        } else {
          res.json({ code: 500, msg: '保存失败' })
        }
      } catch (err) {
        logger.mark(`[Class-Plugin] 保存配置失败: ${err}`)
        res.json({ code: 500, msg: '服务器错误' })
      }
    })

    // 导入课程数据
    this.app.post('/api/courses/import/:userId', (req, res) => {
      try {
        const { userId } = req.params
        const { courses } = req.body
        
        if (!Array.isArray(courses)) {
          return res.json({ code: 400, msg: '无效的课程数据' })
        }

        const config = Config.getUserConfig(userId)
        config.courses = courses.map(course => ({
          ...course,
          id: course.id || `${course.name}_${course.day}_${course.startNode}`,
          weeks: Array.isArray(course.weeks) ? course.weeks.map(Number) : [],
          day: Number(course.day),
          startNode: Number(course.startNode),
          endNode: Number(course.endNode)
        }))

        if (Config.setUserConfig(userId, config)) {
          res.json({ code: 0, msg: '导入成功' })
        } else {
          res.json({ code: 500, msg: '导入失败' })
        }
      } catch (err) {
        logger.mark(`[Class-Plugin] 导入课程失败: ${err}`)
        res.json({ code: 500, msg: '服务器错误' })
      }
    })

    // 获取当前周信息
    this.app.get('/api/currentWeek/:userId', (req, res) => {
      try {
        const { userId } = req.params
        const config = Config.getUserConfig(userId)
        const startDate = config.base?.startDate
        
        if (!startDate || !moment(startDate).isValid()) {
          return res.json({ code: 400, msg: '未设置开学日期' })
        }

        const now = moment()
        const start = moment(startDate)
        const currentWeek = Math.max(1, Math.min(
          Math.ceil(now.diff(start, 'days') / 7),
          config.base.maxWeek || 16
        ))

        res.json({
          code: 0,
          data: {
            currentWeek,
            startDate,
            maxWeek: config.base.maxWeek || 16
          }
        })
      } catch (err) {
        logger.mark(`[Class-Plugin] 获取当前周失败: ${err}`)
        res.json({ code: 500, msg: '服务器错误' })
      }
    })
  }

  start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          logger.mark(`[Class-Plugin] 服务器启动成功，端口: ${this.port}`)
          resolve()
        })
      } catch (err) {
        logger.mark(`[Class-Plugin] 服务器启动失败: ${err}`)
        reject(err)
      }
    })
  }

  stop() {
    if (this.server) {
      this.server.close()
      logger.mark('[Class-Plugin] 服务器已停止')
    }
  }

  // 生成验证码
  static generateVerifyCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  // 验证用户
  verifyUser(userId, code) {
    const userData = this.data.get(userId)
    if (!userData) return false
    if (userData.code !== code) return false
    if (Date.now() - userData.timestamp > 10 * 60 * 1000) {
      this.data.delete(userId)
      return false
    }
    return true
  }
}

const server = new Server()

// 初始化服务器
server.start().catch(err => {
    logger.error(`[Class-Plugin] 服务器启动失败: ${err}`)
})

export { server } 
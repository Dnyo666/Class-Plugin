import express from 'express'
import path from 'path'
import { pluginRoot } from '../model/path.js'
import { Config } from '../model/config.js'
import bodyParser from 'body-parser'
import moment from 'moment'

class Server {
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
    // 添加登录页面路由
    this.app.get('/login', (req, res) => {
      const { userId, code } = req.query
      if (!userId || !code) {
        return res.status(400).send('参数错误')
      }

      // 返回登录页面HTML
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>课表系统登录</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .login-container {
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              width: 300px;
            }
            h2 {
              text-align: center;
              color: #333;
            }
            .form-group {
              margin-bottom: 15px;
            }
            label {
              display: block;
              margin-bottom: 5px;
              color: #666;
            }
            input {
              width: 100%;
              padding: 8px;
              border: 1px solid #ddd;
              border-radius: 4px;
              box-sizing: border-box;
            }
            button {
              width: 100%;
              padding: 10px;
              background: #4CAF50;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
            button:hover {
              background: #45a049;
            }
            .error {
              color: red;
              text-align: center;
              margin-top: 10px;
              display: none;
            }
          </style>
        </head>
        <body>
          <div class="login-container">
            <h2>课表系统登录</h2>
            <div class="form-group">
              <label>用户ID</label>
              <input type="text" id="userId" value="${userId}" readonly>
            </div>
            <div class="form-group">
              <label>验证码</label>
              <input type="text" id="verifyCode" value="${code}" readonly>
            </div>
            <button onclick="login()">登录</button>
            <div id="error" class="error"></div>
          </div>

          <script>
            async function login() {
              try {
                const userId = document.getElementById('userId').value
                const verifyCode = document.getElementById('verifyCode').value
                
                const response = await fetch('/api/login', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ userId, verifyCode })
                })
                
                const data = await response.json()
                if (data.code === 0) {
                  alert('登录成功！')
                  window.location.href = '/dashboard'
                } else {
                  document.getElementById('error').style.display = 'block'
                  document.getElementById('error').textContent = data.msg
                }
              } catch (err) {
                document.getElementById('error').style.display = 'block'
                document.getElementById('error').textContent = '登录失败，请稍后重试'
              }
            }
          </script>
        </body>
        </html>
      `)
    })

    // 登录接口
    this.app.post('/api/login', (req, res) => {
      try {
        const { userId, verifyCode } = req.body
        if (!userId || !verifyCode) {
          return res.json({ code: 400, msg: '参数错误' })
        }

        // 验证码校验
        const userData = this.data.get(userId)
        if (!userData || userData.code !== verifyCode) {
          return res.json({ code: 401, msg: '验证码错误' })
        }

        // 验证码过期检查
        if (Date.now() - userData.timestamp > 10 * 60 * 1000) {
          this.data.delete(userId)
          return res.json({ code: 401, msg: '验证码已过期' })
        }

        // 登录成功
        res.json({ code: 0, msg: 'success' })
      } catch (err) {
        logger.mark(`[Class-Plugin] 登录失败: ${err}`)
        res.json({ code: 500, msg: '服务器错误' })
      }
    })

    // 仪表盘页面
    this.app.get('/dashboard', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>课表管理系统</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background: #f5f5f5;
            }
            h1 {
              color: #333;
            }
          </style>
        </head>
        <body>
          <h1>欢迎使用课表管理系统</h1>
          <p>登录成功！</p>
        </body>
        </html>
      `)
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

// 创建单例实例
const server = new Server()

// 初始化服务器
server.start().catch(err => {
    logger.error(`[Class-Plugin] 服务器启动失败: ${err}`)
})

export { server } 
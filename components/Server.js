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
    // 登录页面路由
    this.app.get('/login', (req, res) => {
      const { userId } = req.query
      if (!userId) {
        return res.status(400).send('参数错误：缺少用户ID')
      }

      // 返回登录页面
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
              <label>登录令牌</label>
              <input type="text" id="token" placeholder="请输入机器人发送的登录令牌">
            </div>
            <button onclick="login()">登录</button>
            <div id="error" class="error"></div>
          </div>

          <script>
            async function login() {
              try {
                const userId = document.getElementById('userId').value
                const token = document.getElementById('token').value

                if (!token) {
                  document.getElementById('error').style.display = 'block'
                  document.getElementById('error').textContent = '请输入登录令牌'
                  return
                }

                const response = await fetch('/api/auth', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ userId, token })
                })
                
                const data = await response.json()
                if (data.code === 0) {
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

    // 认证接口
    this.app.post('/api/auth', (req, res) => {
      try {
        const { userId, token } = req.body
        if (!userId || !token) {
          return res.json({ code: 400, msg: '参数错误' })
        }

        // 验证令牌
        const userData = this.data.get(userId)
        if (!userData || userData.token !== token) {
          return res.json({ code: 401, msg: '登录失败' })
        }

        // 检查令牌是否过期（10分钟）
        if (Date.now() - userData.timestamp > 10 * 60 * 1000) {
          this.data.delete(userId)
          return res.json({ code: 401, msg: '登录已过期' })
        }

        // 登录成功
        res.json({ code: 0, msg: 'success' })
      } catch (err) {
        logger.mark(`[Class-Plugin] 认证失败: ${err}`)
        res.json({ code: 500, msg: '服务器错误' })
      }
    })

    // 仪表盘页面
    this.app.get('/dashboard', (req, res) => {
      const html = `
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
            .container {
              max-width: 1200px;
              margin: 0 auto;
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .schedule-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 4px;
            }
            .schedule-table th,
            .schedule-table td {
              padding: 8px 4px;
              font-size: 14px;
            }
            .course-item {
              padding: 6px;
              background: #f8f9fa;
              border-radius: 4px;
              margin-bottom: 5px;
            }
            .course-name {
              font-weight: bold;
            }
            .course-info {
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>课表管理系统</h1>
            <div id="scheduleView"></div>
          </div>

          <script>
            // 页面加载时获取课表数据
            window.onload = async function() {
              const userId = new URLSearchParams(window.location.search).get('userId');
              if (!userId) return;
              
              try {
                const response = await fetch('/api/schedule/' + userId);
                const data = await response.json();
                if (data.code === 0) {
                  renderSchedule(data.data);
                }
              } catch (err) {
                console.error('加载课表失败:', err);
              }
            };

            function renderSchedule(data) {
              const sections = ['1-2', '3-4', '5-6', '7-8', '9-10'];
              let html = [];
              
              html.push('<div style="margin-bottom: 10px">');
              html.push('  <span>当前第 ' + data.currentWeek + ' 周</span>');
              html.push('</div>');
              html.push('<table class="schedule-table">');
              html.push('  <tr>');
              html.push('    <th>节次</th>');
              html.push('    <th>周一</th>');
              html.push('    <th>周二</th>');
              html.push('    <th>周三</th>');
              html.push('    <th>周四</th>');
              html.push('    <th>周五</th>');
              html.push('    <th>周六</th>');
              html.push('    <th>周日</th>');
              html.push('  </tr>');

              sections.forEach(function(section) {
                html.push('  <tr>');
                html.push('    <td>' + section + '</td>');
                
                for (let day = 1; day <= 7; day++) {
                  html.push('    <td>');
                  const courses = data.courses.filter(function(c) {
                    return c.weekDay === day && 
                           c.section === section &&
                           c.weeks.includes(data.currentWeek);
                  });
                  
                  courses.forEach(function(course) {
                    html.push('      <div class="course-item">');
                    html.push('        <div class="course-name">' + course.name + '</div>');
                    html.push('        <div class="course-info">' + course.teacher + '</div>');
                    html.push('        <div class="course-info">' + course.location + '</div>');
                    html.push('      </div>');
                  });
                  
                  html.push('    </td>');
                }
                
                html.push('  </tr>');
              });

              html.push('</table>');
              document.getElementById('scheduleView').innerHTML = html.join('\\n');
            }
          </script>
        </body>
        </html>
      `;
      
      res.send(html);
    });

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

    // 获取课表数据
    this.app.get('/api/schedule/:userId', (req, res) => {
      try {
        const { userId } = req.params
        const config = Config.getUserConfig(userId)
        if (!config) {
          return res.json({ code: 404, msg: '未找到课表数据' })
        }
        res.json({ 
          code: 0, 
          data: {
            courses: config.courses || [],
            base: config.base || {},
            currentWeek: Utils.getCurrentWeek(config.base?.startDate)
          }
        })
      } catch (err) {
        logger.mark(`[Class-Plugin] 获取课表失败: ${err}`)
        res.json({ code: 500, msg: '服务器错误' })
      }
    })

    // 添加课程
    this.app.post('/api/course/:userId', (req, res) => {
      try {
        const { userId } = req.params
        const courseData = req.body
        
        // 验证课程数据
        if (!courseData.name || !courseData.teacher || !courseData.location || 
            !courseData.weekDay || !courseData.section || !courseData.weeks) {
          return res.json({ code: 400, msg: '课程信息不完整' })
        }

        // 验证星期
        const weekDay = Number(courseData.weekDay)
        if (!Number.isInteger(weekDay) || weekDay < 1 || weekDay > 7) {
          return res.json({ code: 400, msg: '无效的星期' })
        }

        // 处理周数数据
        let weeks = []
        if (typeof courseData.weeks === 'string') {
          // 处理类似 "1-16" 的格式
          if (courseData.weeks.includes('-')) {
            const [start, end] = courseData.weeks.split('-').map(Number)
            for (let i = start; i <= end; i++) weeks.push(i)
          } 
          // 处理类似 "1,3,5,7" 的格式
          else {
            weeks = courseData.weeks.split(',').map(Number)
          }
        }

        const config = Config.getUserConfig(userId)
        if (!config.courses) config.courses = []

        // 检查时间冲突
        const hasConflict = config.courses.some(course => 
          course.weekDay === Number(courseData.weekDay) &&
          course.section === courseData.section &&
          course.weeks.some(w => weeks.includes(w))
        )

        if (hasConflict) {
          return res.json({ code: 400, msg: '该时间段已有课程' })
        }

        // 添加新课程
        const newCourse = {
          id: Date.now().toString(),
          name: courseData.name,
          teacher: courseData.teacher,
          location: courseData.location,
          weekDay: Number(courseData.weekDay),
          section: courseData.section,
          weeks
        }

        config.courses.push(newCourse)

        if (Config.setUserConfig(userId, config)) {
          res.json({ code: 0, msg: '添加成功', data: newCourse })
        } else {
          res.json({ code: 500, msg: '保存失败' })
        }
      } catch (err) {
        logger.mark(`[Class-Plugin] 添加课程失败: ${err}`)
        res.json({ code: 500, msg: '服务器错误' })
      }
    })

    // 删除课程
    this.app.delete('/api/course/:userId/:courseId', (req, res) => {
      try {
        const { userId, courseId } = req.params
        const config = Config.getUserConfig(userId)
        
        const index = config.courses.findIndex(c => c.id === courseId)
        if (index === -1) {
          return res.json({ code: 404, msg: '未找到课程' })
        }

        config.courses.splice(index, 1)

        if (Config.setUserConfig(userId, config)) {
          res.json({ code: 0, msg: '删除成功' })
        } else {
          res.json({ code: 500, msg: '删除失败' })
        }
      } catch (err) {
        logger.mark(`[Class-Plugin] 删除课程失败: ${err}`)
        res.json({ code: 500, msg: '服务器错误' })
      }
    })

    // 修改课程
    this.app.put('/api/course/:userId/:courseId', (req, res) => {
      try {
        const { userId, courseId } = req.params
        const courseData = req.body
        
        const config = Config.getUserConfig(userId)
        const courseIndex = config.courses.findIndex(c => c.id === courseId)
        
        if (courseIndex === -1) {
          return res.json({ code: 404, msg: '未找到课程' })
        }

        // 更新课程数据
        config.courses[courseIndex] = {
          ...config.courses[courseIndex],
          ...courseData
        }

        if (Config.setUserConfig(userId, config)) {
          res.json({ code: 0, msg: '修改成功' })
        } else {
          res.json({ code: 500, msg: '修改失败' })
        }
      } catch (err) {
        logger.mark(`[Class-Plugin] 修改课程失败: ${err}`)
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
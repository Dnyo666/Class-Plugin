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
      res.send([
        '<!DOCTYPE html>',
        '<html>',
        '<head>',
        '  <meta charset="UTF-8">',
        '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '  <title>课表系统登录</title>',
        '  <style>',
        '    body {',
        '      font-family: Arial, sans-serif;',
        '      display: flex;',
        '      justify-content: center;',
        '      align-items: center;',
        '      height: 100vh;',
        '      margin: 0;',
        '      background: #f5f5f5;',
        '    }',
        '    .login-container {',
        '      background: white;',
        '      padding: 20px;',
        '      border-radius: 8px;',
        '      box-shadow: 0 2px 4px rgba(0,0,0,0.1);',
        '      width: 300px;',
        '    }',
        '    h2 {',
        '      text-align: center;',
        '      color: #333;',
        '    }',
        '    .form-group {',
        '      margin-bottom: 15px;',
        '    }',
        '    label {',
        '      display: block;',
        '      margin-bottom: 5px;',
        '      color: #666;',
        '    }',
        '    input {',
        '      width: 100%;',
        '      padding: 8px;',
        '      border: 1px solid #ddd;',
        '      border-radius: 4px;',
        '      box-sizing: border-box;',
        '    }',
        '    button {',
        '      width: 100%;',
        '      padding: 10px;',
        '      background: #4CAF50;',
        '      color: white;',
        '      border: none;',
        '      border-radius: 4px;',
        '      cursor: pointer;',
        '    }',
        '    button:hover {',
        '      background: #45a049;',
        '    }',
        '    .error {',
        '      color: red;',
        '      text-align: center;',
        '      margin-top: 10px;',
        '      display: none;',
        '    }',
        '  </style>',
        '</head>',
        '<body>',
        '  <div class="login-container">',
        '    <h2>课表系统登录</h2>',
        '    <div class="form-group">',
        '      <label>用户ID</label>',
        '      <input type="text" id="userId" value="' + userId + '" readonly>',
        '    </div>',
        '    <div class="form-group">',
        '      <label>登录令牌</label>',
        '      <input type="text" id="token" placeholder="请输入机器人发送的登录令牌">',
        '    </div>',
        '    <button onclick="login()">登录</button>',
        '    <div id="error" class="error"></div>',
        '  </div>',
        '',
        '  <script>',
        '    async function login() {',
        '      try {',
        '        const userId = document.getElementById("userId").value;',
        '        const token = document.getElementById("token").value;',
        '',
        '        if (!token) {',
        '          document.getElementById("error").style.display = "block";',
        '          document.getElementById("error").textContent = "请输入登录令牌";',
        '          return;',
        '        }',
        '',
        '        const response = await fetch("/api/auth", {',
        '          method: "POST",',
        '          headers: {',
        '            "Content-Type": "application/json"',
        '          },',
        '          body: JSON.stringify({ userId, token })',
        '        });',
        '',
        '        const data = await response.json();',
        '        if (data.code === 0 && data.data && data.data.redirectUrl) {',
        '          window.location.href = data.data.redirectUrl;',
        '        } else {',
        '          document.getElementById("error").style.display = "block";',
        '          document.getElementById("error").textContent = data.msg || "登录失败";',
        '        }',
        '      } catch (err) {',
        '        document.getElementById("error").style.display = "block";',
        '        document.getElementById("error").textContent = "登录失败，请稍后重试";',
        '      }',
        '    }',
        '  </script>',
        '</body>',
        '</html>'
      ].join('\n'))
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
        if (!userData) {
          return res.json({ code: 401, msg: '请先获取登录令牌' })
        }

        if (userData.token !== token) {
          return res.json({ code: 401, msg: '令牌错误' })
        }

        // 查令牌是否过期（10分钟）
        if (Date.now() - userData.timestamp > 10 * 60 * 1000) {
          this.data.delete(userId)
          return res.json({ code: 401, msg: '令牌已过期，请重新获取' })
        }

        // 登录成功后，将用户ID添加到URL
        res.json({ 
          code: 0, 
          msg: 'success',
          data: {
            redirectUrl: '/dashboard?userId=' + userId
          }
        })
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
            .nav {
              margin-bottom: 20px;
              border-bottom: 1px solid #ddd;
            }
            .nav-item {
              display: inline-block;
              padding: 10px 20px;
              cursor: pointer;
            }
            .nav-item.active {
              border-bottom: 2px solid #4CAF50;
              color: #4CAF50;
            }
            .tab-content {
              display: none;
            }
            .tab-content.active {
              display: block;
            }
            .form-group {
              margin-bottom: 15px;
            }
            label {
              display: block;
              margin-bottom: 5px;
            }
            input, select {
              width: 100%;
              padding: 8px;
              border: 1px solid #ddd;
              border-radius: 4px;
              box-sizing: border-box;
            }
            button {
              padding: 8px 16px;
              background: #4CAF50;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
            button:hover {
              background: #45a049;
            }
            .course-list-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .course-list-table th,
            .course-list-table td {
              padding: 10px;
              border: 1px solid #ddd;
              text-align: center;
            }
            .course-list-table th {
              background: #f5f5f5;
            }
            .course-list-table button {
              margin: 0 5px;
              padding: 5px 10px;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
            .course-list-table button:first-child {
              background: #4CAF50;
              color: white;
            }
            .course-list-table button:last-child {
              background: #f44336;
              color: white;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>课表管理系统</h1>
            
            <div class="nav">
              <div class="nav-item active" onclick="switchTab('schedule')">课表查看</div>
              <div class="nav-item" onclick="switchTab('add')">添加课程</div>
              <div class="nav-item" onclick="switchTab('settings')">基础设置</div>
            </div>

            <div id="schedule" class="tab-content active">
              <div id="scheduleView"></div>
            </div>

            <div id="add" class="tab-content">
              <h2>添加课程</h2>
              <div class="form-group">
                <label>课程名称</label>
                <input type="text" id="courseName">
              </div>
              <div class="form-group">
                <label>教师</label>
                <input type="text" id="courseTeacher">
              </div>
              <div class="form-group">
                <label>教室</label>
                <input type="text" id="courseLocation">
              </div>
              <div class="form-group">
                <label>星期</label>
                <select id="courseWeekDay">
                  <option value="1">周一</option>
                  <option value="2">周二</option>
                  <option value="3">周三</option>
                  <option value="4">周四</option>
                  <option value="5">周五</option>
                  <option value="6">周六</option>
                  <option value="7">周日</option>
                </select>
              </div>
              <div class="form-group">
                <label>节数</label>
                <select id="courseSection">
                  <option value="1-2">1-2节</option>
                  <option value="3-4">3-4节</option>
                  <option value="5-6">5-6节</option>
                  <option value="7-8">7-8节</option>
                  <option value="9-10">9-10节</option>
                </select>
              </div>
              <div class="form-group">
                <label>周数</label>
                <input type="text" id="courseWeeks" placeholder="例如：1-16 或 1,3,5,7">
              </div>
              <button onclick="addCourse()">添加课程</button>
            </div>

            <div id="settings" class="tab-content">
              <h2>基础设置</h2>
              <div class="form-group">
                <label>开学日期</label>
                <input type="date" id="startDate">
              </div>
              <div class="form-group">
                <label>学期周数</label>
                <input type="number" id="maxWeek" min="1" max="30">
              </div>
              <button onclick="saveSettings()">保存设置</button>
            </div>

            <div id="courseManage" class="tab-content">
              <h2>课程管理</h2>
              <div id="courseList"></div>
            </div>
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
              const sections = ['1-2', '3-4', '5-6', '7-8', '9-10']
              let scheduleHtml = [
                '<div style="margin-bottom: 20px">',
                `  <h3>当前第 ${data.currentWeek} 周</h3>`,
                '</div>',
                '<table class="schedule-table">',
                '  <tr>',
                '    <th>节次</th>',
                '    <th>周一</th>',
                '    <th>周二</th>',
                '    <th>周三</th>',
                '    <th>周四</th>',
                '    <th>周五</th>',
                '    <th>周六</th>',
                '    <th>周日</th>',
                '  </tr>'
              ].join('\n')

              sections.forEach(section => {
                scheduleHtml += '<tr>'
                scheduleHtml += `<td>${section}</td>`
                
                for (let day = 1; day <= 7; day++) {
                  scheduleHtml += '<td>'
                  const courses = data.courses.filter(c => 
                    c.weekDay === day && 
                    c.section === section &&
                    c.weeks.includes(data.currentWeek)
                  )
                  
                  courses.forEach(course => {
                    scheduleHtml += `
                      <div class="course-item">
                        <div class="course-name">${course.name}</div>
                        <div class="course-info">${course.teacher}</div>
                        <div class="course-info">${course.location}</div>
                      </div>
                    `
                  })
                  scheduleHtml += '</td>'
                }
                scheduleHtml += '</tr>'
              })

              scheduleHtml += '</table>'
              document.getElementById('scheduleView').innerHTML = scheduleHtml
            }

            // 切换标签页
            function switchTab(tabId) {
              document.querySelectorAll('.tab-content').forEach(tab => {
                tab.style.display = 'none'
              })
              document.getElementById(tabId).style.display = 'block'
              
              document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active')
              })
              event.target.classList.add('active')
              
              // 切��到相应标签��刷新数据
              if (tabId === 'schedule') {
                loadSchedule()
              } else if (tabId === 'courseManage') {
                loadCourseList()
              }
            }

            // 添加课程
            async function addCourse() {
              const userId = new URLSearchParams(window.location.search).get('userId')
              if (!userId) return

              const courseData = {
                name: document.getElementById('courseName').value,
                teacher: document.getElementById('courseTeacher').value,
                location: document.getElementById('courseLocation').value,
                weekDay: document.getElementById('courseWeekDay').value,
                section: document.getElementById('courseSection').value,
                weeks: document.getElementById('courseWeeks').value
              }

              try {
                const response = await fetch(\`/api/course/\${userId}\`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(courseData)
                })

                const data = await response.json()
                if (data.code === 0) {
                  alert('添加成功')
                  // 清空表单
                  document.getElementById('courseName').value = ''
                  document.getElementById('courseTeacher').value = ''
                  document.getElementById('courseLocation').value = ''
                  document.getElementById('courseWeeks').value = ''
                  // 刷新课表
                  loadSchedule()
                } else {
                  alert(data.msg || '添加失败')
                }
              } catch (err) {
                console.error('添加课程失败:', err)
                alert('添加失败，请稍后重试')
              }
            }

            // 保存设置
            async function saveSettings() {
              const userId = new URLSearchParams(window.location.search).get('userId')
              if (!userId) return

              const config = {
                base: {
                  startDate: document.getElementById('startDate').value,
                  maxWeek: parseInt(document.getElementById('maxWeek').value)
                }
              }

              try {
                const response = await fetch(\`/api/config/\${userId}\`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(config)
                })

                const data = await response.json()
                if (data.code === 0) {
                  alert('保存成功')
                  // 刷新课表
                  loadSchedule()
                } else {
                  alert(data.msg || '保存失败')
                }
              } catch (err) {
                console.error('保存设置失败:', err)
                alert('保存失败，请稍后重试')
              }
            }

            // 加载设置
            async function loadSettings() {
              const userId = new URLSearchParams(window.location.search).get('userId')
              if (!userId) return

              try {
                const response = await fetch(\`/api/config/\${userId}\`)
                const data = await response.json()
                if (data.code === 0) {
                  document.getElementById('startDate').value = data.data.base?.startDate || ''
                  document.getElementById('maxWeek').value = data.data.base?.maxWeek || ''
                }
              } catch (err) {
                console.error('加载设置失败:', err)
              }
            }

            // 页面加载时初始化
            window.onload = async function() {
              await loadSchedule()
              await loadSettings()
              await loadCourseList()
            }

            // 添加加载课程列表的函数
            async function loadCourseList() {
              const userId = new URLSearchParams(window.location.search).get('userId')
              if (!userId) return

              try {
                const response = await fetch('/api/schedule/' + userId)
                const data = await response.json()
                if (data.code === 0) {
                  let html = '<table class="course-list-table">'
                  html += [
                    '<tr>',
                    '  <th>课程名称</th>',
                    '  <th>教师</th>',
                    '  <th>教室</th>',
                    '  <th>时间</th>',
                    '  <th>周数</th>',
                    '  <th>操作</th>',
                    '</tr>'
                  ].join('')
                  
                  data.data.courses.forEach(course => {
                    html += [
                      '<tr>',
                      '  <td>' + course.name + '</td>',
                      '  <td>' + course.teacher + '</td>',
                      '  <td>' + course.location + '</td>',
                      '  <td>周' + ['一','二','三','四','五','六','日'][course.weekDay-1] + ' ' + course.section + '节</td>',
                      '  <td>' + course.weeks.join(',') + '</td>',
                      '  <td>',
                      '    <button onclick="editCourse(\'' + course.id + '\')">编辑</button>',
                      '    <button onclick="deleteCourse(\'' + course.id + '\')">删除</button>',
                      '  </td>',
                      '</tr>'
                    ].join('')
                  })
                  
                  html += '</table>'
                  document.getElementById('courseList').innerHTML = html
                }
              } catch (err) {
                console.error('加载课程列表失败:', err)
              }
            }

            // 添加删除课程函数
            async function deleteCourse(courseId) {
              if (!confirm('确定要删除这门课程吗？')) return
              
              const userId = new URLSearchParams(window.location.search).get('userId')
              if (!userId) return

              try {
                const response = await fetch(`/api/course/${userId}/${courseId}`, {
                  method: 'DELETE'
                })
                
                const data = await response.json()
                if (data.code === 0) {
                  alert('删除成功')
                  await loadCourseList()
                  await loadSchedule()
                } else {
                  alert(data.msg || '删除失败')
                }
              } catch (err) {
                console.error('删除课程失败:', err)
                alert('删除失败，请稍后重试')
              }
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
        logger.mark('[Class-Plugin] 获取课表失败: ' + err)
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
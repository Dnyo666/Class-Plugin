import { Config } from './model/config.js'
import path from 'path'
import fs from 'fs'
import moment from 'moment'
import lodash from 'lodash'

export function supportGuoba() {
  return {
    pluginInfo: {
      name: 'class-plugin',
      title: '课表插件',
      author: '@Dnyo666 @YXC0915',
      authorLink: 'https://github.com/Dnyo666',
      link: 'https://github.com/Dnyo666/class-plugin',
      isV3: true,
      isV2: false,
      showInMenu: true,
      description: '课表管理插件',
      icon: 'mdi:calendar-clock',
      iconColor: '#7c99ea',
      iconPath: path.join(process.cwd(), 'plugins/class-plugin/resources/help/imgs/icon.png')
    },
    configInfo: {
      schemas: [
        {
          field: 'userId',
          label: '选择用户',
          component: 'Select',
          required: true,
          bottomHelpMessage: '选择要配置的用户',
          componentProps: {
            options: (() => {
              const dataDir = path.join(process.cwd(), 'data/class-plugin/data')
              if (!fs.existsSync(dataDir)) return []
              return fs.readdirSync(dataDir)
                .filter(f => f.endsWith('.json'))
                .map(f => ({
                  label: f.replace('.json', ''),
                  value: f.replace('.json', '')
                }))
            })()
          }
        },
        {
          component: 'Divider',
          label: '基础设置',
          componentProps: {
            orientation: 'left',
            plain: true
          }
        },
        {
          field: 'base.startDate',
          label: '开学日期',
          bottomHelpMessage: '设置学期开始日期',
          component: 'DatePicker',
          required: true,
          componentProps: {
            format: 'YYYY-MM-DD',
            valueFormat: 'YYYY-MM-DD',
            placeholder: '请选择开学日期'
          }
        },
        {
          field: 'base.maxWeek',
          label: '学期周数',
          bottomHelpMessage: '设置学期总周数（通常为16-18周）',
          component: 'InputNumber',
          required: true,
          componentProps: {
            min: 1,
            max: 30,
            placeholder: '请输入学期周数'
          }
        },
        {
          component: 'Divider',
          label: '课程管理',
          componentProps: {
            orientation: 'left',
            plain: true
          }
        },
        {
          field: 'courses',
          label: '课程列表',
          bottomHelpMessage: '管理所有课程信息',
          component: 'GSubForm',
          componentProps: {
            multiple: true,
            schemas: [
              {
                field: 'name',
                label: '课程名称',
                component: 'Input',
                required: true,
                componentProps: {
                  placeholder: '请输入课程名称'
                }
              },
              {
                field: 'teacher',
                label: '教师',
                component: 'Input',
                required: true,
                componentProps: {
                  placeholder: '请输入教师姓名'
                }
              },
              {
                field: 'location',
                label: '教室',
                component: 'Input',
                required: true,
                componentProps: {
                  placeholder: '请输入上课地点'
                }
              },
              {
                field: 'weekDay',
                label: '星期',
                component: 'Select',
                required: true,
                componentProps: {
                  options: [
                    { label: '周一', value: 1 },
                    { label: '周二', value: 2 },
                    { label: '周三', value: 3 },
                    { label: '周四', value: 4 },
                    { label: '周五', value: 5 },
                    { label: '周六', value: 6 },
                    { label: '周日', value: 7 }
                  ]
                }
              },
              {
                field: 'section',
                label: '节数',
                component: 'Select',
                required: true,
                componentProps: {
                  options: [
                    { label: '1-2节', value: '1-2' },
                    { label: '3-4节', value: '3-4' },
                    { label: '5-6节', value: '5-6' },
                    { label: '7-8节', value: '7-8' },
                    { label: '9-10节', value: '9-10' }
                  ]
                }
              },
              {
                field: 'weeks',
                label: '周数',
                component: 'Select',
                required: true,
                bottomHelpMessage: '选择上课周数（可多选）',
                componentProps: {
                  mode: 'multiple',
                  options: [
                    { label: '单周', value: 'odd', group: '快速选择' },
                    { label: '双周', value: 'even', group: '快速选择' },
                    ...Array.from({ length: 30 }, (_, i) => ({
                      label: `第${i + 1}周`,
                      value: i + 1,
                      group: '具体周数'
                    }))
                  ],
                  onChange: (value, form, field) => {
                    const weeks = new Set()
                    value.forEach(v => {
                      if (typeof v === 'string') {
                        switch(v) {
                          case 'odd':
                            for (let i = 1; i <= 30; i += 2) weeks.add(i)
                            break
                          case 'even':
                            for (let i = 2; i <= 30; i += 2) weeks.add(i)
                            break
                        }
                      } else {
                        weeks.add(v)
                      }
                    })
                    form.setFieldValue(field.name, Array.from(weeks).sort((a, b) => a - b))
                  }
                }
              }
            ]
          }
        }
      ],
      getConfigData() {
        const dataDir = path.join(process.cwd(), 'data/class-plugin/data')
        if (!fs.existsSync(dataDir)) return {}

        const files = fs.readdirSync(dataDir)
        const config = {}

        files.forEach(file => {
          if (file.endsWith('.json')) {
            const userId = file.replace('.json', '')
            try {
              const userData = Config.getUserConfig(userId)
              if (userData) {
                config[userId] = {
                  base: {
                    startDate: userData.base?.startDate ? moment(userData.base.startDate).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
                    maxWeek: Number(userData.base?.maxWeek || 16)
                  },
                  courses: (userData.courses || []).map(course => ({
                    ...course,
                    weekDay: Number(course.weekDay),
                    weeks: course.weeks?.map(w => Number(w)) || []
                  }))
                }
              }
            } catch (err) {
              console.error(`[Class-Plugin] 读取用户 ${userId} 配置失败:`, err)
            }
          }
        })
        return config
      },

      setConfigData(data, { Result }) {
        try {
          const userId = data.userId
          if (!userId) {
            return Result.error('请选择用户')
          }

          // 验证并格式化数据
          const config = {
            base: {
              startDate: moment(data.base?.startDate).format('YYYY-MM-DD'),
              maxWeek: Number(data.base?.maxWeek || 16)
            },
            courses: (data.courses || []).map(course => ({
              id: course.id || Date.now().toString(),
              name: String(course.name || ''),
              teacher: String(course.teacher || ''),
              location: String(course.location || ''),
              weekDay: Number(course.weekDay),
              section: String(course.section || ''),
              weeks: (course.weeks || []).map(w => Number(w)).sort((a, b) => a - b)
            }))
          }

          // 保存配置
          Config.setUserConfig(userId, config)
          return Result.ok({}, '保存成功~')
        } catch (err) {
          console.error('[Class-Plugin] 保存配置失败:', err)
          return Result.error('保存失败：' + err.message)
        }
      }
    }
  }
}
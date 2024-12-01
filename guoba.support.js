import fs from 'fs'
import path from 'path'
import moment from 'moment'
import lodash from 'lodash'
import { Config } from './model/config.js'

const _path = process.cwd()
const pluginPath = _path + '/plugins/class-plugin'

export function supportGuoba() {
  let allGroup = []
  Bot.gl.forEach((v, k) => {
    allGroup.push({ label: `${v.group_name}(${k})`, value: k })
  })

  return {
    pluginInfo: {
      name: 'class-plugin',
      title: '课表插件',
      author: '@Dnyo666',
      authorLink: 'https://github.com/Dnyo666',
      link: 'https://github.com/Dnyo666/class-plugin',
      isV3: true,
      isV2: false,
      description: '课表管理插件',
      icon: 'mdi:calendar-clock',
      iconColor: '#7c68ee',
      iconPath: path.join(pluginPath, "resources/icon.png")
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
              const dataDir = path.join(_path, 'data/class-plugin/data')
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
          label: '基础设置'
        },
        {
          field: 'base.startDate',
          label: '开学日期',
          component: 'DatePicker',
          required: true,
          bottomHelpMessage: '设置学期开始日期',
          componentProps: {
            format: 'YYYY-MM-DD',
            valueFormat: 'YYYY-MM-DD'
          }
        },
        {
          field: 'base.maxWeek',
          label: '学期周数',
          component: 'InputNumber',
          required: true,
          bottomHelpMessage: '设置学期总周数',
          componentProps: {
            min: 1,
            max: 30
          }
        },
        {
          component: 'Divider',
          label: '提醒设置'
        },
        {
          field: 'remind.enable',
          label: '开启提醒',
          component: 'Switch',
          bottomHelpMessage: '是否开启课程提醒功能'
        },
        {
          field: 'remind.advance',
          label: '提前提醒时间',
          component: 'InputNumber',
          bottomHelpMessage: '上课前多少分钟提醒',
          componentProps: {
            min: 1,
            max: 60,
            addonAfter: '分钟'
          },
          vIf: ({ values }) => values.remind?.enable
        },
        {
          field: 'remind.mode',
          label: '提醒方式',
          component: 'Select',
          bottomHelpMessage: '选择提醒消息的发送方式',
          componentProps: {
            options: [
              { label: '私聊提醒', value: 'private' },
              { label: '群聊提醒', value: 'group' }
            ]
          },
          vIf: ({ values }) => values.remind?.enable
        },
        {
          component: 'Divider',
          label: '课程管理'
        },
        {
          field: 'courses',
          label: '课程列表',
          component: 'GSubForm',
          bottomHelpMessage: '管理所有课程信息',
          componentProps: {
            multiple: true,
            schemas: [
              {
                field: 'name',
                label: '课程名称',
                component: 'Input',
                required: true,
                bottomHelpMessage: '输入课程名称'
              },
              {
                field: 'teacher',
                label: '教师',
                component: 'Input',
                required: true,
                bottomHelpMessage: '输入教师姓名'
              },
              {
                field: 'location',
                label: '教室',
                component: 'Input',
                required: true,
                bottomHelpMessage: '输入上课地点'
              },
              {
                field: 'weekDay',
                label: '星期',
                component: 'Select',
                required: true,
                bottomHelpMessage: '选择上课星期',
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
                bottomHelpMessage: '选择上课节数',
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
                    { label: '工作日', value: '1-5', group: '快速选择' },
                    { label: '周末', value: '6-7', group: '快速选择' },
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
                          case '1-5':
                            for (let i = 1; i <= 5; i++) weeks.add(i)
                            break
                          case '6-7':
                            weeks.add(6)
                            weeks.add(7)
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
        const dataDir = path.join(_path, 'data/class-plugin/data')
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
                    startDate: userData.base?.startDate || moment().format('YYYY-MM-DD'),
                    maxWeek: Number(userData.base?.maxWeek || 16)
                  },
                  courses: (userData.courses || []).map(course => ({
                    ...course,
                    weekDay: Number(course.weekDay),
                    weeks: course.weeks?.map(w => Number(w)) || []
                  })),
                  remind: {
                    enable: Boolean(userData.remind?.enable),
                    advance: Number(userData.remind?.advance || 10),
                    mode: userData.remind?.mode || 'private'
                  }
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
          for (let [userId, userData] of Object.entries(data)) {
            if (userId === 'userId') continue
            
            // 验证并格式化数据
            const config = {
              base: {
                startDate: moment(userData.base?.startDate).format('YYYY-MM-DD'),
                maxWeek: Number(userData.base?.maxWeek || 16)
              },
              courses: (userData.courses || []).map(course => ({
                id: course.id || Date.now().toString(),
                name: String(course.name || ''),
                teacher: String(course.teacher || ''),
                location: String(course.location || ''),
                weekDay: Number(course.weekDay),
                section: String(course.section || ''),
                weeks: (course.weeks || []).map(w => Number(w)).sort((a, b) => a - b)
              })),
              remind: {
                enable: Boolean(userData.remind?.enable),
                advance: Number(userData.remind?.advance || 10),
                mode: String(userData.remind?.mode || 'private')
              }
            }

            Config.setUserConfig(userId, config)
          }
          return Result.ok({}, '保存成功')
        } catch (err) {
          console.error('[Class-Plugin] 保存配置失败:', err)
          return Result.error('保存失败：' + err.message)
        }
      }
    }
  }
}
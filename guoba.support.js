import fs from 'fs'
import path from 'path'
import moment from 'moment'
import { Config } from './model/config.js'
import Utils from './utils.js'

export function supportGuoba() {
  const dataDir = path.join(process.cwd(), 'data/class-plugin/data')
  let users = []
  
  if (fs.existsSync(dataDir)) {
    users = fs.readdirSync(dataDir)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        label: f.replace('.json', ''),
        value: f.replace('.json', '')
      }))
  }

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
      icon: 'mdi:calendar-clock'
    },
    
    configInfo: {
      schemas: [
        {
          field: 'userId',
          label: '选择用户',
          component: 'Select',
          required: true,
          componentProps: {
            options: users,
            onChange: (value, form) => {
              if(!value) return {}
              const userData = Config.getUserConfig(value)
              form.setFieldsValue({
                base: userData.base || {
                  startDate: moment().format('YYYY-MM-DD'),
                  maxWeek: 16
                },
                courses: userData.courses || [],
                remind: userData.remind || {
                  enable: false,
                  advance: 10,
                  mode: 'private'
                }
              })
            }
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
          component: 'Switch'
        },
        {
          field: 'remind.advance',
          label: '提前提醒时间(分钟)',
          component: 'InputNumber',
          componentProps: {
            min: 1,
            max: 60
          },
          vIf: ({ values }) => values.remind?.enable
        },
        {
          field: 'remind.mode',
          label: '提醒方式',
          component: 'Select',
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
          component: 'GTabs',
          componentProps: {
            tabList: ({ values }) => values.courses?.map((course, index) => ({
              label: course.name || `课程${index + 1}`,
              value: index
            })) || []
          }
        },
        {
          field: 'courses',
          label: '课程信息',
          component: 'GSubForm',
          componentProps: {
            multiple: true,
            schemas: [
              {
                field: 'name',
                label: '课程名称',
                component: 'Input',
                required: true
              },
              {
                field: 'teacher',
                label: '教师',
                component: 'Input',
                required: true
              },
              {
                field: 'location',
                label: '教室',
                component: 'Input',
                required: true
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
                    { label: '周五', value: 5 }
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
                component: 'GTags',
                required: true,
                componentProps: {
                  allowAdd: true,
                  allowDel: true,
                  max: 20,
                  validator: (value) => {
                    if(!/^\d+$/.test(value)) return '请输入数字'
                    if(parseInt(value) < 1 || parseInt(value) > 30) return '周数需在1-30之间'
                    return true
                  }
                }
              }
            ]
          }
        }
      ],

      getConfigData(form) {
        const userId = form?.getFieldValue('userId')
        if(!userId) return {}
        return Config.getUserConfig(userId)
      },

      setConfigData(data, form) {
        const userId = form?.getFieldValue('userId')
        if(!userId) return false
        
        try {
          // 验证并格式化数据
          const config = {
            base: {
              startDate: data.base?.startDate || moment().format('YYYY-MM-DD'),
              maxWeek: data.base?.maxWeek || 16
            },
            courses: (data.courses || []).map(course => ({
              id: course.id || Utils.generateId(),
              name: course.name,
              teacher: course.teacher,
              location: course.location,
              weekDay: parseInt(course.weekDay),
              section: course.section,
              weeks: course.weeks.map(w => parseInt(w)).sort((a, b) => a - b)
            })),
            remind: {
              enable: data.remind?.enable || false,
              advance: data.remind?.advance || 10,
              mode: data.remind?.mode || 'private'
            }
          }

          Config.setUserConfig(userId, config)
          return true
        } catch(err) {
          console.error('[Class-Plugin] 保存配置失败:', err)
          return false
        }
      }
    }
  }
}
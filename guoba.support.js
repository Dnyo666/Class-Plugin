import fs from 'fs'
import path from 'path'
import { Config } from './model/config.js'

export function supportGuoba() {
  // 获取所有用户列表
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
          componentProps: {
            options: users
          }
        },
        {
          component: 'Divider',
          label: '用户课表设置'
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
          label: '课程设置'
        },
        {
          field: 'schedule.sections',
          label: '作息时间',
          component: 'GSubForm',
          componentProps: {
            multiple: true,
            schemas: [
              {
                field: 'name',
                label: '节次名称',
                component: 'Input'
              },
              {
                field: 'start',
                label: '开始时间',
                component: 'TimePicker'
              },
              {
                field: 'end', 
                label: '结束时间',
                component: 'TimePicker'
              }
            ]
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
          label: '提前提醒(分钟)',
          component: 'InputNumber',
          componentProps: {
            min: 1,
            max: 60
          }
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
          }
        }
      ],
      
      getConfigData() {
        const userId = this.ctx.form.userId
        if (!userId) return {}
        return Config.getUserConfig(userId)
      },

      setConfigData(data, { Result }) {
        try {
          const userId = data.userId
          if (!userId) {
            return Result.error('请选择用户')
          }
          delete data.userId // 移除用户ID字段
          Config.setUserConfig(userId, data)
          return Result.ok({}, '保存成功')
        } catch(e) {
          return Result.error(e.message)
        }
      }
    }
  }
}
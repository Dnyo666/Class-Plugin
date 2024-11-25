import fs from 'fs'
import path from 'path'
import { pluginRoot } from './model/path.js'

export function supportGuoba() {
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
    // 配置项
    configInfo: {
      schemas: [
        {
          field: 'config.startDate',
          label: '开学日期',
          component: 'DatePicker',
          componentProps: {
            format: 'YYYY-MM-DD',
            valueFormat: 'YYYY-MM-DD'
          }
        },
        {
          field: 'config.maxWeek',
          label: '学期周数',
          component: 'InputNumber',
          componentProps: {
            min: 1,
            max: 30
          }
        },
        {
          field: 'remind.advance',
          label: '提醒时间(分钟)',
          component: 'InputNumber',
          componentProps: {
            min: 1,
            max: 60
          }
        }
      ]
    }
  }
}
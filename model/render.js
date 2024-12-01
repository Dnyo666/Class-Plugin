import Version from './Version.js'
import path from 'path'

export class Render {
  constructor(e) {
    this.e = e
  }

  async courseTable(courses, currentWeek) {
    try {
      return await this.render('schedule/schedule', {
        weekDays: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        sections: ['1-2', '3-4', '5-6', '7-8', '9-10'],
        courses: courses,
        currentWeek: currentWeek,
        styles: {
          defaultStyle: {
            borderRadius: '6px',
            padding: '8px',
            fontSize: '12px',
            lineHeight: '1.4',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          },
          courseColors: [
            '#FF9999', '#99FF99', '#9999FF', '#FFFF99', '#FF99FF',
            '#99FFFF', '#FFB366', '#99CC66', '#9966CC', '#66CCFF'
          ]
        }
      })
    } catch (err) {
      logger.error(`[Class-Plugin] 渲染课表失败: ${err}`)
      throw err
    }
  }

  async render(path, params) {
    if (!this.e.runtime) {
      logger.warn('[Class-Plugin] 未找到e.runtime，请升级至最新版Yunzai')
      return false
    }

    return await this.e.runtime.render('class-plugin', path, params)
  }
}
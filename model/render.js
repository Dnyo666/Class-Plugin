import { pluginRoot } from './path.js'
import Handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'
import { Config } from './config.js'
import moment from 'moment'

export class Render {
  static async render(path, params, options = {}) {
    // 注册辅助函数
    Handlebars.registerHelper('add', function(a, b) {
      return a + b;
    });

    Handlebars.registerHelper('randomColor', function(index, colors) {
      return colors[index % colors.length];
    });

    Handlebars.registerHelper('isCurrentWeek', function(dayIndex, sectionIndex, currentWeek) {
      return currentWeek && params.courses[dayIndex][sectionIndex].some(course => 
        course.weeks.includes(currentWeek)
      );
    });

    Handlebars.registerHelper('lookup', function(obj, index, prop) {
      if (!obj || !obj[index]) return '';
      return obj[index][prop] || '';
    });

    // 处理课程数据
    if (params.courses) {
      // 获取配置信息
      const config = await Config.getInstance();
      const timeTable = config.getConfig().timeTable;
      
      // 计算当前周数
      const startDate = moment(config.getConfig().base.startDate);
      const now = moment();
      params.currentWeek = Math.ceil(now.diff(startDate, 'days') / 7);
      
      // 将课程数据转换为二维数组格式
      const courseGrid = Array(7).fill(null).map(() => 
        Array(5).fill(null).map(() => [])
      );

      params.courses.forEach(course => {
        const dayIndex = course.day - 1;
        const sectionIndex = Math.floor((course.startNode - 1) / 2);
        
        if (courseGrid[dayIndex] && courseGrid[dayIndex][sectionIndex]) {
          // 添加时间信息
          const sectionTime = timeTable.sections[sectionIndex];
          course.startTime = sectionTime.start;
          course.endTime = sectionTime.end;
          
          // 添加到课程网格
          courseGrid[dayIndex][sectionIndex].push(course);
        }
      });

      params.courses = courseGrid;
      params.times = timeTable.sections;
    }

    try {
      let html = await fs.readFileSync(path.join(pluginRoot, 'resources', path + '.html'), 'utf8')
      let template = Handlebars.compile(html)
      return template(params)
    } catch (error) {
      console.error('渲染错误：', error)
      return ''
    }
  }
}
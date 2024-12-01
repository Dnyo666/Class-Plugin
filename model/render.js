import template from 'art-template'
import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs'

const _path = process.cwd()

export class Render {
  constructor() {
    this.browser = null
    this.isInitializing = false
    this.maxRetries = 3
    this.retryDelay = 1000
  }

  async initBrowser() {
    if (this.browser) return this.browser
    if (this.isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100))
      return this.initBrowser()
    }

    try {
      this.isInitializing = true
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
          '--no-first-run',
          '--no-sandbox',
          '--no-zygote',
          '--single-process'
        ]
      })

      // 监听浏览器断开事件
      this.browser.on('disconnected', () => {
        this.browser = null
        this.isInitializing = false
      })

      return this.browser
    } catch (error) {
      logger.error(`[Class-Plugin] 初始化浏览器失败: ${error}`)
      this.browser = null
      throw error
    } finally {
      this.isInitializing = false
    }
  }

  async closeBrowser() {
    if (this.browser) {
      try {
        await this.browser.close()
      } catch (error) {
        logger.error(`[Class-Plugin] 关闭浏览器失败: ${error}`)
      }
      this.browser = null
    }
  }

  async renderWithRetry(renderFn, maxRetries = this.maxRetries) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await renderFn()
      } catch (error) {
        logger.error(`[Class-Plugin] 渲染重试 ${i + 1}/${maxRetries}: ${error}`)
        await this.closeBrowser()
        if (i === maxRetries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, this.retryDelay))
      }
    }
  }

  async help(helpCfg, helpList) {
    return this.renderWithRetry(async () => {
      const browser = await this.initBrowser()
      const page = await browser.newPage()
      
      try {
        await page.setViewport({ width: 1280, height: 720 })
        const html = await this.getHtml('help/index', {
          helpCfg,
          helpGroup: helpList,
          colCount: helpCfg.colCount || 3,
          style: this.getStyle()
        })

        await page.setContent(html)
        const body = await page.$('#container')
        const buff = await body.screenshot({
          type: 'png',
          quality: 100,
          omitBackground: true
        })

        const tmpPath = path.join(_path, 'temp', `help_${Date.now()}.png`)
        fs.writeFileSync(tmpPath, buff)
        return tmpPath
      } finally {
        await page.close()
      }
    })
  }

  async courseTable(courses, currentWeek) {
    return this.renderWithRetry(async () => {
      const browser = await this.initBrowser()
      const page = await browser.newPage()
      
      try {
        await page.setViewport({ width: 1000, height: 800 })
        const html = await this.getHtml('schedule/index', {
          courses,
          currentWeek,
          weekDays: ['周一', '周二', '周三', '周四', '周五'],
          sections: Array(8).fill(0).map((_, i) => `第${i + 1}节`),
          styles: this.getCourseStyles()
        })

        await page.setContent(html)
        const body = await page.$('#container')
        const buff = await body.screenshot({
          type: 'png',
          quality: 100,
          omitBackground: true
        })

        const tmpPath = path.join(_path, 'temp', `schedule_${Date.now()}.png`)
        fs.writeFileSync(tmpPath, buff)
        return tmpPath
      } finally {
        await page.close()
      }
    })
  }

  getStyle() {
    try {
      const styleConfig = require('../resources/help/imgs/config.js').style
      return Object.entries(styleConfig)
        .map(([key, value]) => `.${key} { ${value} }`)
        .join('\n')
    } catch (error) {
      logger.error(`[Class-Plugin] 获取样式配置失败: ${error}`)
      return ''
    }
  }

  getCourseStyles() {
    return {
      courseColors: [
        '#FF9999', '#99FF99', '#9999FF', 
        '#FFFF99', '#FF99FF', '#99FFFF'
      ],
      defaultStyle: {
        borderRadius: '8px',
        padding: '8px',
        fontSize: '14px',
        lineHeight: '1.4',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }
    }
  }

  async getHtml(type, data) {
    try {
      const tplPath = path.join(_path, 'plugins', 'class-plugin', 'resources', type + '.html')
      const layoutPath = path.join(_path, 'plugins', 'class-plugin', 'resources', 'common', 'layout.html')
      
      return template(tplPath, {
        ...data,
        _layout: layoutPath,
        _res_path: path.join(_path, 'plugins', 'class-plugin', 'resources'),
        defaultLayout: layoutPath
      })
    } catch (error) {
      logger.error(`[Class-Plugin] 生成HTML失败: ${error}`)
      throw error
    }
  }
}
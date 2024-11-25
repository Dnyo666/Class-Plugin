import template from 'art-template'
import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs'

const _path = process.cwd()

export class Render {
  constructor() {
    this.browser = false
    this.lock = false
    this.renderNum = 0
    this.maxRender = 100
  }

  async initBrowser() {
    if (this.browser) return this.browser
    if (this.lock) return false
    this.lock = true

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
    this.lock = false
    return this.browser
  }

  async help(helpCfg, helpList) {
    const browser = await this.initBrowser()
    if (!browser) return false

    const page = await browser.newPage()
    await page.setViewport({ width: 1280, height: 720 })

    const html = await this.getHtml('help/index', {
      helpCfg,
      helpGroup: helpList,
      colCount: helpCfg.colCount || 3,
      bgType: Math.ceil(Math.random() * 3)
    })

    await page.setContent(html)
    const body = await page.$('#container')
    const buff = await body.screenshot()
    await page.close()

    const tmpPath = path.join(_path, 'temp', 'help.png')
    fs.writeFileSync(tmpPath, buff)
    return tmpPath
  }

  async getHtml(type, data) {
    const tplPath = path.join(_path, 'plugins', 'class-plugin', 'resources', type + '.html')
    const layoutPath = path.join(_path, 'plugins', 'class-plugin', 'resources', 'common', 'layout.html')
    
    return template(tplPath, {
      ...data,
      _layout: layoutPath,
      _res_path: path.join(_path, 'plugins', 'class-plugin', 'resources'),
      defaultLayout: layoutPath,
      style: (await import('../resources/help/imgs/config.js')).style
    })
  }

  async courseTable(courses, currentWeek) {
    const browser = await this.initBrowser()
    if (!browser) return false

    const page = await browser.newPage()
    await page.setViewport({ width: 1000, height: 800 })

    const html = await this.getHtml('schedule/index', {
      courses,
      currentWeek,
      weekDays: ['周一', '周二', '周三', '周四', '周五'],
      sections: Array(8).fill(0).map((_, i) => `第${i + 1}节`)
    })

    await page.setContent(html)
    const body = await page.$('#container')
    const buff = await body.screenshot()
    await page.close()

    const tmpPath = path.join(_path, 'temp', 'schedule.png')
    fs.writeFileSync(tmpPath, buff)
    return tmpPath
  }
}
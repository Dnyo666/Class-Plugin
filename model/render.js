import template from 'art-template'
import puppeteer from 'puppeteer'
import path from 'path'
import fs from 'fs'
import { style } from '../resources/help/imgs/config.js'

const _path = process.cwd()

export class Render {
  constructor() {
    this.browser = null
    this.isInitializing = false
    this.maxRetries = 3
    this.retryDelay = 1000
    this.initDirs()
  }

  initDirs() {
    const dirs = [
      path.join(_path, 'plugins', 'class-plugin', 'temp'),
      path.join(_path, 'plugins', 'class-plugin', 'data')
    ]
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    }
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
          style: await this.getStyle()
        })

        logger.mark(`[Class-Plugin] 生成的HTML内容: ${html}`)

        await page.setContent(html)
        
        // 等待页面加载完成
        await page.waitForSelector('#container', { timeout: 5000 })
        
        // 获取实际内容高度
        const bodyHandle = await page.$('body')
        const { height } = await bodyHandle.boundingBox()
        await bodyHandle.dispose()
        
        // 调整视口高度
        await page.setViewport({ width: 1280, height: Math.ceil(height) })
        
        // 重新获取容器并截图
        const container = await page.$('#container')
        if (!container) {
          throw new Error('找不到容器元素')
        }

        // 等待样式加载
        await page.waitForTimeout(1000)

        const buff = await container.screenshot({
          type: 'png',
          omitBackground: true,
          encoding: 'binary'
        })

        const tmpPath = path.join(_path, 'plugins', 'class-plugin', 'temp', `help_${Date.now()}.png`)
        fs.writeFileSync(tmpPath, buff)

        // 验证文件是否成功生成
        if (!fs.existsSync(tmpPath)) {
          throw new Error('图片文件未生成')
        }

        const fileSize = fs.statSync(tmpPath).size
        if (fileSize === 0) {
          throw new Error('生成的图片文件为空')
        }

        logger.mark(`[Class-Plugin] 成功生成帮助图片: ${tmpPath}`)
        return tmpPath
      } catch (error) {
        logger.error(`[Class-Plugin] 帮助渲染失败: ${error}`)
        throw error
      } finally {
        await page.close()
      }
    })
  }

  async getStyle() {
    try {
      const styleText = Object.entries(style)
        .map(([key, value]) => `.${key} { ${value} }`)
        .join('\n')
      logger.mark(`[Class-Plugin] 生成的样式内容: ${styleText}`)
      return `
        ${styleText}
        body {
          background: transparent;
        }
        #container {
          margin: 20px;
          padding: 20px;
          background: white;
          border-radius: 15px;
          box-shadow: 0 5px 10px rgba(0,0,0,0.1);
        }
        .help-table {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 15px 0;
        }
        .tr {
          display: flex;
          gap: 10px;
        }
        .td {
          flex: 1;
          background: #f8f9fa;
          padding: 15px;
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        .td:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
      `
    } catch (error) {
      logger.error(`[Class-Plugin] 获取样式配置失败: ${error}`)
      return this.getDefaultStyle()
    }
  }

  getDefaultStyle() {
    return `
      body {
        margin: 0;
        padding: 20px;
        font-family: "Microsoft YaHei", sans-serif;
        background: #f5f6fa;
      }
      #container {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        padding: 20px;
        max-width: 1000px;
        margin: 0 auto;
      }
      .help-title {
        font-size: 24px;
        color: #2c3e50;
        margin-bottom: 15px;
        text-align: center;
      }
      .help-group {
        font-size: 18px;
        color: #34495e;
        margin: 20px 0 10px;
        padding-bottom: 5px;
        border-bottom: 2px solid #3498db;
      }
      .help-item {
        background: white;
        padding: 12px;
        margin: 8px 0;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .help-command {
        font-weight: bold;
        color: #2980b9;
      }
      .help-desc {
        color: #7f8c8d;
        font-size: 14px;
        margin-top: 5px;
      }
    `
  }

  async getHtml(type, data) {
    try {
      const tplPath = path.join(_path, 'plugins', 'class-plugin', 'resources', type + '.html')
      const layoutPath = path.join(_path, 'plugins', 'class-plugin', 'resources', 'common', 'layout.html')
      
      if (!fs.existsSync(tplPath)) {
        throw new Error(`模板文件不存在: ${tplPath}`)
      }
      if (!fs.existsSync(layoutPath)) {
        throw new Error(`布局文件不存在: ${layoutPath}`)
      }

      const templateContent = fs.readFileSync(tplPath, 'utf8')
      const layoutContent = fs.readFileSync(layoutPath, 'utf8')
      logger.mark(`[Class-Plugin] 模板内容: ${templateContent}`)
      logger.mark(`[Class-Plugin] 布局内容: ${layoutContent}`)

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
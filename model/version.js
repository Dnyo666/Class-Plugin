import fs from 'fs'
import { createRequire } from 'module'
import fetch from 'node-fetch'

const require = createRequire(import.meta.url)
const _path = process.cwd()

export class Version {
  constructor() {
    this.package = require('../package.json')
    this.version = this.package.version
  }

  async check() {
    try {
      const res = await fetch('https://api.github.com/repos/owner/class-plugin/releases/latest')
      const json = await res.json()
      
      if(json.tag_name > this.version) {
        logger.mark(`[Class-Plugin] 发现新版本: ${json.tag_name}`)
        logger.mark(`[Class-Plugin] 更新内容: ${json.body}`)
      }
    } catch(e) {
      logger.error(`[Class-Plugin] 版本检查失败: ${e}`)
    }
  }
} 
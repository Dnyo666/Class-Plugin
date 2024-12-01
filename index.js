import fs from 'node:fs'
import path from 'node:path'
import { Config } from './model/config.js'

// 确保必要的目录存在
const _path = process.cwd()
const pluginPath = path.join(_path, 'plugins/class-plugin')
const tempPath = path.join(_path, 'temp')

// 创建临时目录
if (!fs.existsSync(tempPath)) {
  fs.mkdirSync(tempPath, { recursive: true })
}

// 初始化配置
Config.init()

// 导出插件
export * from './apps/Class.js'
export * from './apps/Help.js'
export * from './apps/Notify.js'

// 检查更新
try {
  const packagePath = path.join(pluginPath, 'package.json')
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
  logger.info(`[Class-Plugin] 课表插件 v${packageJson.version} 初始化完成`)
} catch (err) {
  logger.warn('[Class-Plugin] 无法读取版本信息')
  logger.info('[Class-Plugin] 课表插件初始化完成')
}
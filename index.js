import fs from 'node:fs'
import { Config } from './model/config.js'

// 确保必要的目录存在
const _path = process.cwd()
const pluginPath = _path + '/plugins/class-plugin'
const tempPath = path.join(_path, 'temp')

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
let packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
logger.info(`[Class-Plugin] 课表插件 v${packageJson.version} 初始化完成`)
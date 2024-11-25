import fs from 'node:fs'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { logger } from '../../../lib/plugins/plugin.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 插件路径
const pluginPath = join(__dirname, '..')
const pluginName = 'class-plugin'

try {
  // 读取插件package.json
  const pluginPackage = JSON.parse(fs.readFileSync(join(pluginPath, 'package.json'), 'utf8'))
  const pluginVersion = pluginPackage.version

  // 读取Bot package.json
  const BotPath = join(pluginPath, '../..')
  const BotPackage = JSON.parse(fs.readFileSync(join(BotPath, 'package.json'), 'utf8'))
  const BotVersion = BotPackage.version

  // 判断Bot类型
  const BotName = (() => {
    if (BotPackage.name === 'miao-yunzai') {
      return 'Miao-Yunzai'
    } else if (BotPackage.name === 'trss-yunzai') {
      return 'Trss-Yunzai'
    } else if (BotPackage.name === 'yunzai-bot') {
      return 'Yunzai-Bot'
    } else {
      return 'Unknown'
    }
  })()

  export default {
    pluginName,
    pluginPath,
    pluginVersion,
    BotName,
    BotPath,
    BotVersion
  }

} catch (err) {
  logger.error('[Class-Plugin] 读取package.json失败', err)
  process.exit()
}

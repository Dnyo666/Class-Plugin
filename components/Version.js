import fs from 'node:fs'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import plugin from '../../../lib/plugins/plugin.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 插件路径
const pluginPath = join(__dirname, '..')
const pluginName = 'class-plugin'

let BotName = 'Unknown'
let BotPath = ''
let BotVersion = ''
let pluginVersion = ''

try {
  // 读取插件package.json
  const pluginPackage = JSON.parse(fs.readFileSync(join(pluginPath, 'package.json'), 'utf8'))
  pluginVersion = pluginPackage.version

  // 读取Bot package.json
  BotPath = join(pluginPath, '../..')
  const BotPackage = JSON.parse(fs.readFileSync(join(BotPath, 'package.json'), 'utf8'))
  BotVersion = BotPackage.version

  // 判断Bot类型
  if (BotPackage.name === 'miao-yunzai') {
    BotName = 'Miao-Yunzai'
  } else if (BotPackage.name === 'trss-yunzai') {
    BotName = 'Trss-Yunzai'
  } else if (BotPackage.name === 'yunzai-bot') {
    BotName = 'Yunzai-Bot'
  }
} catch (err) {
  plugin.error('[Class-Plugin] 读取package.json失败', err)
}

export {
  pluginName,
  pluginPath,
  pluginVersion,
  BotName,
  BotPath,
  BotVersion
}

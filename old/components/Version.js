import fs from 'node:fs'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const pluginPath = join(__dirname, '..')
const pluginName = 'class-plugin'

// 读取版本信息
const packageJson = JSON.parse(fs.readFileSync(join(pluginPath, '../../package.json'), 'utf8'))
const pluginPackageJson = JSON.parse(fs.readFileSync(join(pluginPath, 'package.json'), 'utf8'))

const BotVersion = packageJson.version
const pluginVersion = pluginPackageJson.version
const BotName = packageJson.name === 'miao-yunzai' ? 'Miao-Yunzai' : 
               packageJson.name === 'trss-yunzai' ? 'Trss-Yunzai' : 
               packageJson.name === 'yunzai-bot' ? 'Yunzai-Bot' : 'Unknown'

const Version = {
  pluginName,
  pluginPath,
  pluginVersion,
  BotName,
  BotVersion
}

export { Version }

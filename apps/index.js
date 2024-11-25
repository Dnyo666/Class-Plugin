import fs from 'node:fs'
import plugin from '#lib'
import { join } from 'node:path'
import { App, Version } from '#components'

const startTime = Date.now()

const path = join(Version.pluginPath, 'apps')

const files = fs.readdirSync(path).filter(file => file.endsWith('.js'))

const apps = {}
for (const i of files) {
  if (i === 'index.js') continue
  try {
    const exp = await import(`file://${join(path, i)}`)
    const app = new App(exp.app || {
      id: i.replace('.js', ''),
      name: i.replace('.js', '')
    })
    for (const key in exp.rule) {
      const rule = exp.rule[key]
      app.rule(key, rule.reg, rule.fnc, rule.cfg)
    }
    apps[app.id] = app.create()
  } catch (error) {
    plugin.error(`[${Version.pluginName}]加载js: apps/${i}错误\n`, error)
  }
}

export { apps }

plugin.info('-----------------')
plugin.info(`${Version.pluginName} v${Version.pluginVersion} 加载成功~ 耗时: ${Date.now() - startTime}ms`)
plugin.info('-------^_^-------')

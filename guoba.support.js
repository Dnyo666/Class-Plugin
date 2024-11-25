import lodash from 'lodash'
import { Config } from '#components'
import { setting } from '#models'

export function supportGuoba () {
  return {
    pluginInfo: {
      name: 'class-schedule',
      title: '课表插件',
      author: '浅巷墨黎、鹿茸茅草屋',
      authorLink: 'https://github.com/XasYer',
      link: 'https://github.com/XasYer/class-schedule',
      isV3: true,
      isV2: false,
      description: '提供课表相关功能',
      icon: 'mdi:calendar-clock'
    },
    configInfo: {
      schemas: setting.getGuobasChemas(),
      getConfigData () {
        const data = {}
        for (const file of Config.files) {
          const name = file.replace('.yaml', '')
          data[name] = Config.getDefOrConfig(name)
        }
        return data
      },
      setConfigData (data, { Result }) {
        const config = Config.getCfg()

        for (const key in data) {
          const split = key.split('.')
          if (lodash.isEqual(config[split[1]], data[key])) continue
          Config.modify(split[0], split[1], data[key])
        }
        return Result.ok({}, '设置成功~')
      }
    },
    panelInfo: {
      title: '课表管理',
      icon: 'mdi:calendar-edit',
      path: '/schedule',
      component: 'Schedule',
      auth: 'master'
    }
  }
}

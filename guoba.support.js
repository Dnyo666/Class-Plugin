import lodash from 'lodash'
import { Config } from '../config/config.js'

export function supportGuoba () {
  return {
    pluginInfo: {
      name: 'Class-Plugin',
      title: '课表插件',
      author: '@Dnyo666',
      authorLink: 'https://github.com/Dnyo666',
      link: 'https://github.com/Dnyo666/Class-Plugin',
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
      component: 'Schedule'
    }
  }
}

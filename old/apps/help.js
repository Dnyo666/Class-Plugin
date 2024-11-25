import { App, Render, Version } from '#components'
import lodash from 'lodash'
import { help as helpUtil } from '#models'

const app = {
  id: 'help',
  name: '帮助'
}

export const rule = {
  help: {
    reg: /^#?(课表|class)(插件|plugin)?(帮助|菜单|help)$/i,
    fnc: help
  }
}

export const helpApp = new App(app, rule).create()

async function help (e) {
  const helpGroup = []

  lodash.forEach(helpUtil.helpList, (group) => {
    if (group.auth && group.auth === 'master' && !e.isMaster) {
      return true
    }

    lodash.forEach(group.list, (help) => {
      const icon = help.icon * 1
      if (!icon) {
        help.css = 'display:none'
      } else {
        const x = (icon - 1) % 10
        const y = (icon - x - 1) / 10
        help.css = `background-position:-${x * 50}px -${y * 50}px`
      }
    })

    helpGroup.push(group)
  })
  const themeData = await helpUtil.helpTheme.getThemeData(helpUtil.helpCfg)
  const img = await Render.render('help/index', {
    helpCfg: helpUtil.helpCfg,
    helpGroup,
    ...themeData,
    scale: 1.2
  })
  if (img) {
    await e.reply(img)
  } else {
    await e.reply('截图失败辣! 再试一次叭')
  }
  return true
}

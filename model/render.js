import Version from './Version.js'
import path from 'path'

function scale(pct = 1) {
    let scale = 100
    scale = Math.min(2, Math.max(0.5, scale / 100))
    pct = pct * scale
    return `style=transform:scale(${pct})`
}

export class Render {
    static async render(path, params, cfg) {
        let { e } = cfg
        if (!e.runtime) {
            logger.warn('[Class-Plugin] 未找到e.runtime，请升级至最新版Yunzai')
            return false
        }

        let BotName = Version.isMiao ? 'Miao-Yunzai' : 'Yunzai-Bot'
        let currentVersion = '1.0.0'

        return e.runtime.render('class-plugin', path, params, {
            retType: cfg.retMsgId ? 'msgId' : 'default',
            beforeRender({ data }) {
                let pluginName = ''
                if (data.pluginName !== false) {
                    pluginName = ` & ${data.pluginName || 'class-plugin'}`
                    if (data.pluginVersion !== false) {
                        pluginName += `<span class="version">${currentVersion}`
                    }
                }
                let resPath = process.cwd() + '/plugins/class-plugin/resources/'
                const layoutPath = process.cwd() + '/plugins/class-plugin/resources/common/layout/'
                return {
                    ...data,
                    _res_path: resPath,
                    _layout_path: layoutPath,
                    defaultLayout: layoutPath + 'default.html',
                    elemLayout: layoutPath + 'elem.html',
                    sys: {
                        scale: scale(cfg.scale || 1)
                    },
                    copyright: `Created By ${BotName}<span class="version">${Version.yunzai}</span>${pluginName}</span>`,
                    pageGotoParams: {
                        waitUntil: 'networkidle2'
                    }
                }
            }
        })
    }
}
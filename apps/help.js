import plugin from '../../../lib/plugins/plugin.js';
import { Render } from '../model/render.js';
import { style } from '../resources/help/imgs/config.js';
import _ from 'lodash';

export class Help extends plugin {
    constructor() {
        super({
            name: 'Class-帮助',
            dsc: '课表插件帮助',
            event: 'message',
            priority: 1009,
            rule: [
                {
                    reg: '^#?(课表|class|课程表|上课)(帮助|help|说明|指南)$',
                    fnc: 'help'
                }
            ]
        });
    }

    async help(e) {
        const helpCfg = {
            themeSet: false,
            title: '课表插件帮助',
            subTitle: '让课表管理更简单',
            colWidth: 265,
            theme: 'all',
            themeExclude: ['default'],
            colCount: 2,
            bgBlur: true
        };

        const helpList = [
            {
                group: '🔰 开始使用',
                list: [
                    {
                        icon: 1,
                        title: '#开始配置课表',
                        desc: '初始化课表配置（设置开学日期和学期周数）'
                    },
                    {
                        icon: 2,
                        title: '#设置开学日期 2024-02-26',
                        desc: '设置学期开始日期'
                    },
                    {
                        icon: 3,
                        title: '#设置学期周数 16',
                        desc: '设置学期总周数（通常为16-18周）'
                    }
                ]
            },
            {
                group: '📝 课表管理',
                list: [
                    {
                        icon: 4,
                        title: '#添加课程',
                        desc: '按提示添加新课程，例如：#添加课程 高数 张三 A101 周一 1-2 1-16周'
                    },
                    {
                        icon: 5,
                        title: '#导入课表',
                        desc: '从Excel文件导入课表数据'
                    },
                    {
                        icon: 6,
                        title: '#课表设置',
                        desc: '打开课表管理面板'
                    },
                    {
                        icon: 7,
                        title: '#清空课表',
                        desc: '清空当前所有课程数据'
                    }
                ]
            },
            {
                group: '👀 查看课表',
                list: [
                    {
                        icon: 8,
                        title: '#课表',
                        desc: '查看本周的课程安排'
                    },
                    {
                        icon: 9,
                        title: '#课表 1',
                        desc: '查看指定周的课表'
                    },
                    {
                        icon: 10,
                        title: '#今天课表',
                        desc: '查看今天的课程'
                    },
                    {
                        icon: 11,
                        title: '#明天课表',
                        desc: '查看明天的课程'
                    },
                    {
                        icon: 12,
                        title: '#下节课',
                        desc: '查看接下来的课程'
                    }
                ]
            },
            {
                group: '⏰ 提醒设置',
                list: [
                    {
                        icon: 13,
                        title: '#开启提醒',
                        desc: '开启上课提醒功能'
                    },
                    {
                        icon: 14,
                        title: '#关闭提醒',
                        desc: '关闭上课提醒功能'
                    },
                    {
                        icon: 15,
                        title: '#设置提醒时间 10',
                        desc: '设置提前多少分钟提醒（1-60分钟）'
                    }
                ]
            },
            {
                group: '🛠️ 其他功能',
                list: [
                    {
                        icon: 16,
                        title: '#周数',
                        desc: '查看当前是第几周'
                    },
                    {
                        icon: 17,
                        title: '#上课时间',
                        desc: '查看每节课的时间安排'
                    }
                ]
            }
        ];

        let helpGroup = [];
        _.forEach(helpList, (group) => {
            _.forEach(group.list, (help) => {
                let icon = help.icon * 1;
                if (!icon) {
                    help.css = 'display:none';
                } else {
                    let x = (icon - 1) % 10;
                    let y = (icon - x - 1) / 10;
                    help.css = `background-position:-${x * 50}px -${y * 50}px`;
                }
            });
            helpGroup.push(group);
        });

        let themeData = await this.getThemeData(helpCfg, helpCfg);
        return await Render.render('help/index', {
            helpCfg,
            helpGroup,
            ...themeData,
            element: 'default'
        }, { e, scale: 1.6 });
    }

    async getThemeCfg() {
        let resPath = process.cwd() + '/plugins/class-plugin/resources/help/imgs/';
        return {
            main: `${resPath}main.png`,
            bg: `${resPath}bg.jpg`,
            style: style
        };
    }

    async getThemeData(diyStyle, sysStyle) {
        let helpConfig = _.extend({}, sysStyle, diyStyle);
        let colCount = Math.min(5, Math.max(parseInt(helpConfig?.colCount) || 3, 2));
        let colWidth = Math.min(500, Math.max(100, parseInt(helpConfig?.colWidth) || 265));
        let width = Math.min(2500, Math.max(800, colCount * colWidth + 30));
        let theme = await this.getThemeCfg();
        let themeStyle = theme.style || {};
        let ret = [`
          body{background-image:url(${theme.bg});width:${width}px;}
          .container{background-image:url(${theme.main});width:${width}px;}
          .help-table .td,.help-table .th{width:${100 / colCount}%}
          `]
        let css = function (sel, css, key, def, fn) {
            let val = (function () {
                for (let idx in arguments) {
                    if (!_.isUndefined(arguments[idx])) {
                        return arguments[idx]
                    }
                }
            })(themeStyle[key], diyStyle[key], sysStyle[key], def)
            if (fn) {
                val = fn(val)
            }
            ret.push(`${sel}{${css}:${val}}`)
        }
        css('.help-title,.help-group', 'color', 'fontColor', '#ceb78b')
        css('.help-title,.help-group', 'text-shadow', 'fontShadow', 'none')
        css('.help-desc', 'color', 'descColor', '#eee')
        css('.cont-box', 'background', 'contBgColor', 'rgba(43, 52, 61, 0.8)')
        css('.cont-box', 'backdrop-filter', 'contBgBlur', 3, (n) => diyStyle.bgBlur === false ? 'none' : `blur(${n}px)`)
        css('.help-group', 'background', 'headerBgColor', 'rgba(34, 41, 51, .4)')
        css('.help-table .tr:nth-child(odd)', 'background', 'rowBgColor1', 'rgba(34, 41, 51, .2)')
        css('.help-table .tr:nth-child(even)', 'background', 'rowBgColor2', 'rgba(34, 41, 51, .4)')
        return {
            style: `<style>${ret.join('\n')}</style>`,
            colCount
        }
    }
}

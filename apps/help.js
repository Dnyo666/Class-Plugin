import plugin from '../../../lib/plugins/plugin.js';
import { Render } from '../model/render.js';
import { style } from '../resources/help/imgs/config.js';
import _ from 'lodash';

const render = new Render();

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
            title: '课表插件帮助',
            subTitle: '让课表管理更简单',
            colCount: 3,
            bgBlur: true
        };

        const helpList = [
            {
                group: '基础功能',
                list: [
                    {
                        title: '#课表',
                        desc: '查看本周的课程安排'
                    },
                    {
                        title: '#课表 1',
                        desc: '查看指定周数的课表，例如第1周'
                    },
                    {
                        title: '#下节课',
                        desc: '快速查看接下来要上的课程'
                    },
                    {
                        title: '#今天课表',
                        desc: '只看今天的课程安排'
                    },
                    {
                        title: '#明天课表',
                        desc: '提前查看明天的课程'
                    }
                ]
            },
            {
                group: '课表管理',
                list: [
                    {
                        title: '#课表设置',
                        desc: '打开课表管理面板，可以修改课表信息'
                    },
                    {
                        title: '#导入课表',
                        desc: '从教务系统导入新的课表数据'
                    },
                    {
                        title: '#清空课表',
                        desc: '删除当前的所有课表数据'
                    },
                    {
                        title: '#更新课表',
                        desc: '更新现有课表数据'
                    }
                ]
            },
            {
                group: '提醒功能',
                list: [
                    {
                        title: '#开启提醒',
                        desc: '开启上课前的自动提醒'
                    },
                    {
                        title: '#关闭提醒',
                        desc: '关闭上课提醒功能'
                    },
                    {
                        title: '#提醒设置',
                        desc: '调整提醒时间等设置'
                    }
                ]
            },
            {
                group: '其他功能',
                list: [
                    {
                        title: '#周数',
                        desc: '查看当前是第几周'
                    },
                    {
                        title: '#设置周数 n',
                        desc: '手动设置当前周数'
                    },
                    {
                        title: '#上课时间',
                        desc: '查看每节课的时间安排'
                    }
                ]
            }
        ];

        let themeData = await this.getThemeData(helpCfg);
        return await render.help(helpCfg, helpList);
    }

    async getThemeData(helpCfg) {
        const colCount = Math.min(5, Math.max(parseInt(helpCfg?.colCount) || 3, 2));
        const width = Math.min(2500, Math.max(800, colCount * 265 + 30));

        return {
            style: `<style>
                body { width: ${width}px; }
                .container { width: ${width}px; }
                .help-table .td, .help-table .th { width: ${100 / colCount}% }
            </style>`,
            colCount
        };
    }
}

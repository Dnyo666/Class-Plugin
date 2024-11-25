export const helpCfg = {
  title: '课表帮助',
  subTitle: 'Yunzai-Bot & Class-Plugin',
  columnCount: 3
}
export const helpList = [
  {
    group: '基础功能',
    list: [
      {
        icon: 1,
        title: '#课表',
        desc: '查看当前课表'
      },
      {
        icon: 2,
        title: '#添加课程',
        desc: '添加新的课程,格式:#添加课程 课程名 教师 教室 星期 节数 周数'
      },
      {
        icon: 3,
        title: '#删除课程',
        desc: '删除指定课程,格式:#删除课程 课程ID'
      },
      {
        icon: 4,
        title: '#修改课程',
        desc: '修改课程信息,格式:#修改课程 课程ID 修改项=修改值'
      }
    ]
  },
  {
    group: '调课功能',
    list: [
      {
        icon: 11,
        title: '#调课',
        desc: '临时调课,格式:#调课 原课程ID 新节数'
      },
      {
        icon: 12,
        title: '#取消调课',
        desc: '取消临时调课,格式:#取消调课 课程ID'
      },
      {
        icon: 13,
        title: '#调课记录',
        desc: '查看临时调课记录'
      }
    ]
  },
  {
    group: '提醒功能',
    list: [
      {
        icon: 21,
        title: '#开启提醒',
        desc: '开启上课提醒'
      },
      {
        icon: 22,
        title: '#关闭提醒',
        desc: '关闭上课提醒'
      },
      {
        icon: 23,
        title: '#设置提醒时间',
        desc: '设置提前提醒时间,格式:#设置提醒时间 分钟数'
      },
      {
        icon: 24,
        title: '#提醒方式',
        desc: '切换提醒方式(群聊/私聊)'
      }
    ]
  },
  {
    group: '管理功能',
    list: [
      {
        icon: 31,
        title: '#课表设置',
        desc: '修改课表插件配置'
      },
      {
        icon: 32,
        title: '#导入课表',
        desc: '批量导入课表数据'
      },
      {
        icon: 33,
        title: '#导出课表',
        desc: '导出课表数据备份'
      }
    ]
  }
]

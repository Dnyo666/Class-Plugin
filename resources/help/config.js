export const helpCfg = {
  title: '课表插件帮助',
  subTitle: 'Class-Plugin Help',
  colWidth: 265,
  colCount: 2,
  bgBlur: true
}

export const helpList = [
  {
    group: '基础功能',
    list: [
      {
        icon: 17,
        title: '#课表',
        desc: '查看完整课表'
      },
      {
        icon: 54,
        title: '#本周课表',
        desc: '查看本周课表'
      },
      {
        icon: 86,
        title: '#添加课程',
        desc: '格式：#添加课程 课程名 教师 教室 星期 节数 周数\n例：#添加课程 高数 张三 A101 周一 1-2 1-16周'
      },
      {
        icon: 14,
        title: '#删除课程',
        desc: '格式：#删除课程 课程ID\n例：#删除课程 1'
      }
    ]
  },
  {
    group: '高级功能',
    list: [
      {
        icon: 1,
        title: '#修改课程',
        desc: '格式：#修改课程 课程ID 属性=新值\n例：#修改课程 1 name=高等数学'
      },
      {
        icon: 5,
        title: '#调课',
        desc: '格式：#调课 课程ID 新节数\n例：#调课 1 3-4'
      },
      {
        icon: 7,
        title: '#取消调课',
        desc: '格式：#取消调课 课程ID\n例：#取消调课 1'
      },
      {
        icon: 11,
        title: '#提醒设置',
        desc: '#开启提醒\n#关闭提醒\n#设置提醒时间 分钟\n#切换提醒方式'
      }
    ]
  }
] 
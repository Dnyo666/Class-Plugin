export const cfgSchema = {
  schedule: {
    title: '课表设置',
    cfg: {
      remind: {
        title: '提醒开关',
        key: '开启提醒',
        type: 'boolean',
        def: true,
        desc: '是否开启上课提醒'
      },
      remindTime: {
        title: '提前提醒时间',
        key: '提醒时间',
        type: 'number',
        def: 10,
        desc: '提前多少分钟提醒(分钟)'
      },
      remindType: {
        title: '提醒方式',
        key: '提醒方式',
        type: 'string',
        def: 'group',
        desc: 'group: 群聊提醒, private: 私聊提醒'
      }
    }
  }
} 
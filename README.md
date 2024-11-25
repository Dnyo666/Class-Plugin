![Class-Schedule-Plugin](https://socialify.git.ci/XasYer/class-schedule/image?description=1&font=Raleway&forks=1&issues=1&language=1&name=1&owner=1&pattern=Circuit%20Board&pulls=1&stargazers=1&theme=Auto)

<img decoding="async" align=right src="resources/readme/schedule.png" width="35%">

# Class-Schedule-Plugin 📅

- 一个适用于 [Yunzai-Bot](https://github.com/Le-niao/Yunzai-Bot) 的课表管理插件
- 提供课表管理、图片渲染、临时调课、上课提醒等功能
- 支持自定义提醒时间、群聊/私聊提醒等个性化设置

## 安装教程

1. 克隆项目
```bash
git clone https://github.com/XasYer/class-schedule.git ./plugins/class-schedule/
```

2. 安装依赖
```bash
pnpm install --filter=class-schedule
```

3. 重启云崽
```bash
pnpm restart
```

## 功能介绍

<details><summary>基础功能</summary>

- [x] 课表管理
  - 添加/删除/修改课程
  - 支持批量导入导出
  - 数据本地持久化存储
- [x] 图片渲染
  - 美观的课表展示
  - 支持自定义样式
  - 高清图片输出
- [x] 临时调课
  - 灵活的调课管理
  - 支持跨周调课
  - 调课记录查询
- [x] 上课提醒
  - 自定义提醒时间
  - 群聊/私聊可选
  - 智能提醒服务

</details>

## 使用指南

<details><summary>常用命令</summary>

| 命令 | 说明 | 示例 |
|------|------|------|
| #课表 | 查看课表 | #课表 |
| #添加课程 | 添加新课程 | #添加课程 高数 张三 A101 周一 1-2 1-16周 |
| #删除课程 | 删除课程 | #删除课程 1 |
| #调课 | 临时调课 | #调课 1 3-4 |
| #开启提醒 | 开启提醒 | #开启提醒 |
| #设置提醒时间 | 设置提醒 | #设置提醒时间 10 |

</details>

## 配置说明

<details><summary>配置项说明</summary>

本插件支持通过 [Guoba-Plugin](https://github.com/guoba-yunzai/guoba-plugin) 进行可视化配置

主要配置项:
- 提醒时间: 上课前多少分钟提醒
- 提醒方式: 群聊/私聊
- 渲染设置: 课表样式相关配置
- 数据存储: 课表数据备份与恢复

</details>

## 效果展示

<details><summary>功能截图</summary>

| 功能 | 效果图 |
|------|--------|
| 课表展示 | ![课表展示](resources/readme/view.png) |
| 临时调课 | ![临时调课](resources/readme/change.png) |
| 上课提醒 | ![上课提醒](resources/readme/remind.png) |

</details>

## 联系方式

- QQ群: [741577559](http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=IvPaOVo_p-6n--FaLm1v39ML9EZaBRCm)

## 贡献者

> 🌟 感谢所有为 **Class-Schedule-Plugin** 做出贡献的人！

<a href="https://github.com/XasYer/class-schedule/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=XasYer%2Fclass-schedule" />
</a>

## 其他

如果觉得此插件对你有帮助的话,可以点一个 star,你的支持就是我们不断更新的动力~

## 许可证

项目采用 [MIT](./LICENSE) 许可证
import Config from "./components/Config.js";
import lodash from "lodash";
import path from "path";
import { pluginRoot } from "./model/path.js";

export function supportGuoba() {
  return {
    pluginInfo: {
      name: 'class-plugin',
      title: '课表插件',
      author: ['@Dnyo666', '@YXC0915'],
      authorLink: ['https://github.com/Dnyo666', 'https://github.com/YXC0915'],
      link: 'https://github.com/Dnyo666/class-plugin',
      isV3: true,
      isV2: false,
      showInMenu: true,
      description: '基于 Yunzai 的课表管理插件,提供课表管理、图片渲染、临时调课、上课提醒等功能',
      icon: 'mdi:calendar-clock',
      iconColor: '#91caff',
      iconPath: path.join(pluginRoot, 'resources/img/logo.png')
    },
    configInfo: {
      schemas: [
        {
          component: "Divider",
          label: "课表基础配置",
          componentProps: {
            orientation: "left",
            plain: true
          }
        },
        {
          field: "base.startDate",
          label: "开学日期",
          component: "DatePicker",
          required: true,
          componentProps: {
            placeholder: "请选择开学日期",
            format: "YYYY-MM-DD"
          }
        },
        {
          field: "base.maxWeek",
          label: "学期周数",
          component: "InputNumber",
          required: true,
          componentProps: {
            min: 1,
            max: 30,
            placeholder: "请输入学期总周数"
          }
        },
        {
          component: "Divider",
          label: "课程时间配置",
          componentProps: {
            orientation: "left",
            plain: true
          }
        },
        {
          field: "time",
          label: "节次时间",
          component: "GSubForm",
          componentProps: {
            multiple: true,
            schemas: [
              {
                field: "section",
                label: "节次",
                component: "Input",
                required: true,
                componentProps: {
                  placeholder: "如:1-2"
                }
              },
              {
                field: "startTime",
                label: "开始时间",
                component: "TimePicker",
                required: true,
                componentProps: {
                  format: "HH:mm"
                }
              }
            ]
          }
        },
        {
          component: "Divider",
          label: "提醒配置",
          componentProps: {
            orientation: "left",
            plain: true
          }
        },
        {
          field: "remind.defaultAdvance",
          label: "默认提前提醒时间(分钟)",
          component: "InputNumber",
          required: true,
          componentProps: {
            min: 1,
            max: 60,
            placeholder: "请输入默认提前提醒时间"
          }
        },
        {
          field: "remind.defaultMode",
          label: "默认提醒方式",
          component: "Select",
          required: true,
          componentProps: {
            options: [
              { label: "私聊提醒", value: "private" },
              { label: "群聊提醒", value: "group" }
            ],
            placeholder: "请选择默认提醒方式"
          }
        }
      ]
    }
  }
}
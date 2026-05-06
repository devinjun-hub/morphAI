# 内容后台说明

这个文件夹是给你自己维护网站内容用的。

你后面主要看两个东西：

1. `site-data.template.json`
这是内容模板。

2. `index.html`
页面本体还是会读取这些字段结构来显示。

## 你以后主要改什么

### 1. 基础信息

- `pw`: 后台密码
- `email`: 联系邮箱
- `ht`: 首屏大字
- `ab`: About 简介
- `svcs`: 服务内容，每行一条，格式是 `中文 | English`
- `ig` / `be` / `li`: 社媒链接

### 2. 工作经历

`jobs` 是数组，一项就是一段工作经历：

```json
{
  "id": 1,
  "company": "上海瑞马展览有限公司",
  "role": "展览展示空间设计师",
  "year": "2023.09-至今",
  "desc": "这里写这段经历的简介"
}
```

### 3. 项目

`projects` 是作品项目数组，一项就是一个项目：

```json
{
  "id": 1,
  "name": "上海进口博览会",
  "sub": "China International Import Expo",
  "cat": "Expo · International",
  "type": "国际展会展台",
  "loc": "上海",
  "year": "2019-2024",
  "scale": "设计师",
  "desc": "这里写项目介绍",
  "images": [
    "images/example/project-01.jpg"
  ],
  "labels": [
    "主视角"
  ]
}
```

## 图片怎么填

图片字段是：

- `images`: 图片路径数组
- `labels`: 图片标注数组

例如：

```json
"images": [
  "images/2025华海医药cphi/View01_01.jpg",
  "images/2025华海医药cphi/View03_01.jpg"
],
"labels": [
  "主视图",
  "品牌展示面"
]
```

注意：

- `images` 和 `labels` 最好一一对应
- 图片先放进网站仓库里的 `images/` 目录
- PDF 不能直接当项目图用，先转成 JPG / PNG 再填路径

## 你本地怎么用

现在站里我已经补了：

- 工作经历增删改
- 项目增删改
- JSON 导出
- JSON 导入
- 重置默认内容

后面你可以这样操作：

1. 本地打开网站
2. 进入 `Admin`
3. 修改内容
4. 点 `Export JSON`
5. 把导出的 JSON 留作备份

如果你后面要恢复内容：

1. 进入 `Admin`
2. 点 `Import JSON`
3. 选择之前导出的 JSON 文件

## 下一步我建议

你先按这个结构把内容填顺。

等你本地内容填好了，我再继续做两件事：

1. 图片防盗展示层
2. 推送并更新线上网站

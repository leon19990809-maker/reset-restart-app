# RE:SET 重启计划

一个为 iPhone 设计的双页面移动网站：

- **戒断**：多个戒断项目、实时计时、阶段目标、每日打卡、本周阶段图表、坚持统计表
- **饮食边界**：绿灯放心吃、红灯坚决不碰、分类筛选、严格模式、添加与编辑规则
- 底部只保留“戒断 / 饮食”两个入口
- 数据保存在设备本地 `localStorage`，不上传服务器
- PWA：HTTPS 部署后可在 Safari 中“添加到主屏幕”，全屏打开并离线使用

## 本地预览

在本目录运行：

```bash
python3 -m http.server 8080
```

浏览器访问 `http://localhost:8080`。

## 部署

把整个目录上传到任意静态网站托管服务，例如 EdgeOne Pages、CloudBase 静态托管、Vercel、Netlify、GitHub Pages 或自有 HTTPS 服务器。

`index.html`、`styles.css`、`app.js`、`manifest.webmanifest`、`sw.js` 和 `assets/` 必须保持在同一目录结构中。

## iPhone 安装

1. 用 Safari 打开部署后的 HTTPS 地址
2. 点击底部分享按钮
3. 选择“添加到主屏幕”
4. 从主屏幕打开后即为全屏独立窗口

数据属于当前浏览器。清除 Safari 网站数据或更换域名会导致已有记录无法自动迁移。

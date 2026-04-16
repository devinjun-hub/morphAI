# MORPHAI · Portfolio

Single-page portfolio for Liu Jun (Exhibition / Spatial Designer, Shanghai).
Live: <https://devinjun-hub.github.io/morphAI/>

Everything is one self-contained file (`index.html`) — HTML + CSS + JS, no build step, no backend.
The hero is a real-time Canvas 2D crystal-lens (prismatic dispersion, ground caustic, lens magnification, Fresnel + specular shading) over the word **MORPH**.

---

## 文件说明

| 文件 / 目录 | 作用 |
|---|---|
| `index.html` | 唯一的页面文件，所有样式和脚本都内嵌在里面。GitHub Pages 直接以它作为入口。 |
| `images/` | 作品集图片放这里。上传后在管理面板里粘贴路径 `images/xxx.jpg` 即可。 |
| `.nojekyll` | 告诉 GitHub Pages 跳过 Jekyll 处理（不要碰，留空即可）。 |

---

## 三种修改内容的方式

### A · 临时改（只在你自己浏览器里看到）
打开网站 → 双击左上角 `MORPHAI` 字样（或点右上角灰色 `Admin`）→ 输入密码 `liu2025` → 在面板里改。
改完点 **Save All**。这只会写进你浏览器的 `localStorage`，别人看不到。
适合临时演示、试不同文案、调顺序看哪个效果好。

### B · 永久改文字 / 邮箱 / 服务列表（推荐）
直接编辑 `index.html` 里的 `DEF` 常量（在 `<script>` 顶部，搜 `const DEF=` 就能定位）：

```js
const DEF={
  pw:'liu2025',                                    // 后台密码
  email:'ljyyshxq@163.com',                        // 联系邮箱（footer + Contact 区都用它）
  ht:'MORPH',                                      // 首屏大字（也是晶体里浮的字）
  ab:'专注展览展示空间设计…',                       // About 段落
  svcs:'展览展示设计 | Exhibition Design\n创意…', // 服务列表，每行 "中文 | English"
  ig:'', be:'', li:'',                             // 三个外链（留空就不显示）
  projects:[ { id:1, name:'Valeo 车展方案', … } ]  // 项目数组
};
```

改完保存，按下面"上线流程"推一次就行。

### C · 永久改作品图片
1. 把图片放进 `morphai/images/` 文件夹（建议宽 ≥ 1600px、JPG 压到 ~200KB 以内）。
2. 编辑 `DEF.projects` 里对应项目的 `images: []`，填相对路径：
   ```js
   images:['images/valeo-01.jpg','images/valeo-02.jpg'],
   labels:['主视觉','入口空间']
   ```
3. push 上线（见下）。

> 也可以走临时方案：管理面板里直接拖图上传 → 会以 base64 存进 localStorage（自己看用，别人看不到）。

---

## 上线流程

每次本地改完，一键推送：

```bash
cd "C:/Users/ASUS/Documents/New project/claude/jianli/morphai"
git add -A
git commit -m "update: 描述你改了什么"
git push
```

GitHub Pages 会在大约 30 秒～1 分钟内自动更新 <https://devinjun-hub.github.io/morphAI/>。

---

## 设计要点 / 技术备注

- **Crystal lens（首屏）**：Canvas 2D 实时绘制，每帧重新合成。包含分层：1) 透视地面网格 2) 背景 halo 3) MORPH 文字 4) 四面体几何 5) 投影 + 地面 caustic 光池 6) 边缘 7 色光谱色散 7) 顶点星芒 + 高光。
- **Material 面板**：左下"Roughness / NoiseScale / Color"是真在驱动晶体着色的（粗糙度影响高光、颜色直接进 metal core）。
- **Theme**：右上 "Color Engine" 切换 4 套配色（Ultraviolet Glass / Acid Emerald / Noir Chrome / Copper Bloom）。
- **响应式**：桌面 ≥1024、平板 768、手机 ≤720 三档断点。手机会自动隐藏 4 个浮动 panel 中的 3 个，只保留底部 Material；项目卡的标题 / 分类在触屏设备上常驻显示（不再依赖 hover）。
- **性能**：移动端 / 低核心数 CPU 自动进入 `PERF.lite` 模式，降帧率 + 限制 DPR ≤ 1。

---

## 常见维护

| 想做的事 | 怎么做 |
|---|---|
| 改首屏大字 | `DEF.ht` |
| 改邮箱 | `DEF.email` |
| 改 About 段落 | `DEF.ab` |
| 加 / 改服务条目 | `DEF.svcs`，每行 `中文 \| English` |
| 加新项目 | 在 `DEF.projects` 数组里推一个对象 |
| 删项目 | 删 `DEF.projects` 里对应那一项 |
| 调项目顺序 | 直接在 `DEF.projects` 里改顺序 |
| 加外链（IG / Behance / LinkedIn） | `DEF.ig` / `DEF.be` / `DEF.li` 填完整 URL |
| 改后台密码 | `DEF.pw`（只用于 Admin 面板，纯前端，不要存敏感数据） |

---

© 2026 MORPHAI · Liu Jun · Shanghai

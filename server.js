const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'site-data.json');

// 支持大 JSON（base64 图片）
app.use(express.json({ limit: '100mb' }));

// 托管静态文件
app.use(express.static(__dirname));
app.use('/content-admin', express.static(path.join(__dirname, 'content-admin')));
app.use('/images', express.static(path.join(__dirname, 'images'), { maxAge: '365d', immutable: true }));

// 默认数据（首次启动时用）
const DEFAULT_DATA = {
  pw: 'liujun2025',
  email: 'ljyyshxq@163.com',
  ht: 'MORPH',
  startYear: 2016,
  ab: '10年展览展示设计经验，3年海外展会项目积累。服务过 Medtronic、Henkel、Merck、BASF、Valeo 等国际品牌，独立主导从概念创意、空间叙事到施工落地的全流程。同时深度融合 AIGC 工具构建设计工作流，用 ComfyUI、Stable Diffusion、Midjourney 驱动方案推演与效果生成——这是我认为展览设计在当下最有力的进化方向。',
  svcs: '创意主导 | Creative Direction\nAIGC 驱动设计流程 | AI-Augmented Workflow\n跨部门协同推进 | Cross-Functional Delivery\n项目全流程跟进 | End-to-End Execution\n国际展会设计 | International Exhibition Design\n品牌空间表达 | Brand Spatial Experience',
  ig: '',
  be: '',
  li: '',
  jobs: [
    {id:1,company:'上海瑞马展览有限公司',role:'展览展示空间设计师',year:'2023.09 — 至今',desc:'主导创意型展会、舞台活动及展厅项目的整体设计工作，从品牌需求、空间结构与商业逻辑出发输出高价值方案，引入 AIGC 工具优化设计流程，推动设计与制作团队高效协同落地。'},
    {id:2,company:'上海崩穗迪公关策划有限公司',role:'3D 设计师',year:'2022.08 — 2023.09',desc:'负责医疗及国际品牌展示项目的核心创意设计与视觉策略，深度参与客户沟通与需求拆解，服务客户包括 Medtronic、Henkel、Merck、BASF 等国际品牌。'},
    {id:3,company:'上海狄普展览设计有限公司',role:'3D 设计师',year:'2018.01 — 2022.01',desc:'主导公司外展展示项目的创意设计与全流程推进，累计完成 10+ 大型展览项目，客户满意度达 95% 以上，多个项目获行业奖项提名。'},
    {id:4,company:'拓展会展（上海）有限公司',role:'三维 / CAD / 制图',year:'2016.01 — 2018.01',desc:'负责展台与展厅三维设计制图，参与设计前期讨论、方向引导与后期施工搭建配合，确保方案从设计到实施的一致性。'}
  ],
  projects: [
    {id:1,name:'加农进博会',sub:'CIIE · Canon',cat:'Expo · International',type:'国际展会展台',loc:'上海',year:'2025',scale:'设计师',desc:'大型国际展会参展方案，在高标准场馆环境下完成品牌展示空间设计，确保动线逻辑与品牌叙事的统一表达。',images:['images/2025加农进博会/10_PhysCamera001.jpg','images/2025加农进博会/10_PhysCamera003.jpg','images/2025加农进博会/10_PhysCamera004.jpg','images/2025加农进博会/10_PhysCamera007.jpg','images/2025加农进博会/10_PhysCamera008.jpg','images/2025加农进博会/10_PhysCamera010.jpg','images/2025加农进博会/10_Camera001.jpg','images/2025加农进博会/10_Camera003.jpg'],labels:['主视角','展台透视','品牌展示面','核心展示区','洽谈区','入口空间','概念视角 A','概念视角 B']},
    {id:2,name:'HRC 进博会',sub:'CIIE · HRC',cat:'Expo · International',type:'国际展会展台',loc:'上海',year:'2025',scale:'设计师',desc:'HRC 品牌进博会参展方案，在标准化场馆条件下强化品牌识别度与空间层次感。',images:['images/2025HRC进博会/01_PhysCamera001.jpg','images/2025HRC进博会/01_PhysCamera004.jpg','images/2025HRC进博会/01_PhysCamera005.jpg','images/2025HRC进博会/01_PhysCamera006.jpg','images/2025HRC进博会/01_PhysCamera007.jpg','images/2025HRC进博会/01_PhysCamera008.jpg','images/2025HRC进博会/01_PhysCamera009.jpg'],labels:['主视角','入口空间','品牌展示面','洽谈区','开放动线','功能区','结构细节']},
    {id:3,name:'芬琳大师漆广州设计周',sub:'Finlux · Guangzhou Design Week',cat:'Design · Creative',type:'创意竞标提案',loc:'广州',year:'2025',scale:'主案设计师',desc:'以鲜明的空间母题和视觉焦点建立提案记忆点，在高创意要求场景中实现方案中标，体现创意表达与商业价值转化能力。',images:['images/2025芬琳大师漆广州设计周/01_PhysCamera001.jpg','images/2025芬琳大师漆广州设计周/01_PhysCamera004.jpg','images/2025芬琳大师漆广州设计周/01_PhysCamera007.jpg','images/2025芬琳大师漆广州设计周/01_PhysCamera012.jpg','images/2025芬琳大师漆广州设计周/01_PhysCamera018.jpg','images/2025芬琳大师漆广州设计周/01_PhysCamera028.jpg','images/2025芬琳大师漆广州设计周/01_PhysCamera036.jpg','images/2025芬琳大师漆广州设计周/01_PhysCamera040.jpg'],labels:['入口主视角','主展面','品牌装置区','中庭空间','动线转折','功能展示区','灯光氛围','整体收尾视角']},
    {id:4,name:'华海医药 CPhI',sub:'Huahai Pharma · CPhI',cat:'Pharma · Exhibition',type:'国际医药展台',loc:'上海',year:'2025',scale:'设计师',desc:'负责医药品牌展台的设计深化与施工图输出，现场逐一解决执行问题，保障还原度与交付质量。',images:['images/2025华海医药cphi/View01_01.jpg','images/2025华海医药cphi/View03_01.jpg','images/2025华海医药cphi/View05_01.jpg','images/2025华海医药cphi/View07_01.jpg','images/2025华海医药cphi/View010_01.jpg','images/2025华海医药cphi/08_PhysCamera008.jpg','images/2025华海医药cphi/08_PhysCamera012.jpg','images/2025华海医药cphi/pingmian.jpg'],labels:['主视图','品牌展示面','洽谈区视角','开放动线','结构细节','空间透视 A','空间透视 B','平面规划']},
    {id:5,name:'华域车展',sub:'Huayu · Auto Show',cat:'Auto · Exhibition',type:'国际车展展台',loc:'上海',year:'2025',scale:'主案设计师',desc:'汽车零部件品牌车展方案，通过空间结构与品牌动线的精准把控，实现高辨识度的展台视觉表达。',images:['images/2025华域车展/15-01_PhysCamera001.jpg','images/2025华域车展/15-01_PhysCamera002.jpg','images/2025华域车展/15-01_PhysCamera003.jpg','images/2025华域车展/15-01_PhysCamera005.jpg','images/2025华域车展/15-01_PhysCamera007.jpg','images/2025华域车展/15-01_PhysCamera009.jpg','images/2025华域车展/15-01_PhysCamera011.jpg','images/2025华域车展/15-01_PhysCamera013.jpg'],labels:['主视角','入口空间','品牌展示面','产品展示区','洽谈区','动线视角','结构细节','全局视角']},
    {id:6,name:'HRC 车展',sub:'HRC · Auto Show',cat:'Auto · Exhibition',type:'车展展台',loc:'上海',year:'2025',scale:'主案设计师',desc:'HRC 品牌车展展台，强调产品展示逻辑与空间动线，在竞争激烈的场馆环境中打造品牌差异化。',images:['images/2025HRC车展/01_PhysCamera001.jpg','images/2025HRC车展/01_PhysCamera002.jpg','images/2025HRC车展/01_PhysCamera003.jpg','images/2025HRC车展/01_PhysCamera005.jpg','images/2025HRC车展/01_PhysCamera007.jpg','images/2025HRC车展/01_PhysCamera008.jpg','images/2025HRC车展/01_PhysCamera013.jpg'],labels:['主视角','入口空间','品牌立面','产品展示区','洽谈区','动线视角','结构细节']},
    {id:7,name:'倍适登汽配展',sub:'Bestune · Auto Parts Show',cat:'Auto Parts · Exhibition',type:'汽配展台',loc:'上海',year:'2025',scale:'主案设计师',desc:'汽配行业展台方案，注重工业品牌专业质感与产品展示效率，在标准展位中创造超出预期的视觉层次。',images:['images/2025倍适登汽配展/01_PhysCamera001.jpg','images/2025倍适登汽配展/01_PhysCamera002.jpg','images/2025倍适登汽配展/01_PhysCamera003.jpg','images/2025倍适登汽配展/01_PhysCamera005.jpg','images/2025倍适登汽配展/01_PhysCamera007.jpg','images/2025倍适登汽配展/01_PhysCamera008.jpg','images/2025倍适登汽配展/01_PhysCamera010.jpg'],labels:['主视角','入口空间','品牌展示面','产品展示区','洽谈区','动线视角','全局视角']},
    {id:8,name:'海蒂诗家具展',sub:'Hettich · Furniture Exhibition',cat:'Furniture · Exhibition',type:'家具展台',loc:'上海',year:'2025',scale:'主案设计师',desc:'欧洲五金品牌家具展台，结合品牌调性与产品特性，在展示空间中传递专业工艺与生活美学的双重价值。',images:['images/2025海蒂诗家具展/01_PhysCamera001.jpg','images/2025海蒂诗家具展/01_PhysCamera003.jpg','images/2025海蒂诗家具展/01_PhysCamera005.jpg','images/2025海蒂诗家具展/01_PhysCamera007.jpg','images/2025海蒂诗家具展/01_PhysCamera009.jpg','images/2025海蒂诗家具展/01_PhysCamera012.jpg','images/2025海蒂诗家具展/01_PhysCamera016.jpg','images/2025海蒂诗家具展/01_PhysCamera020.jpg'],labels:['主视角','入口空间','品牌展示面','产品展示区','洽谈区','动线视角','细节展示','全局视角']},
    {id:9,name:'莱克 AWE',sub:'Lexy · AWE Appliance Expo',cat:'Home Appliance · Exhibition',type:'家电展台',loc:'上海',year:'2026',scale:'主案设计师',desc:'AWE 家电博览会展台，以科技感与未来感为基调，构建符合消费品牌调性的沉浸式体验空间。',images:['images/2026莱克AWE/01_00-00.jpg','images/2026莱克AWE/01_PhysCamera001.jpg','images/2026莱克AWE/01_PhysCamera002.jpg','images/2026莱克AWE/01_PhysCamera004.jpg','images/2026莱克AWE/01_PhysCamera006.jpg','images/2026莱克AWE/01_PhysCamera008.jpg','images/2026莱克AWE/01_PhysCamera012.jpg','images/2026莱克AWE/鸟瞰图.jpg'],labels:['概念方案','主视角','入口空间','品牌展示面','产品区','体验区','动线视角','鸟瞰全景']},
    {id:10,name:'和咖酒店用品展',sub:'Coffee Jack · Hospitality Show',cat:'Hospitality · Exhibition',type:'酒店用品展台',loc:'上海',year:'2026',scale:'主案设计师',desc:'酒店用品行业品牌展台，在专业展会环境中平衡商业展示效率与品牌文化体验，构建有温度的空间叙事。',images:['images/2026和咖酒店用品展/01_PhysCamera001.jpg','images/2026和咖酒店用品展/01_PhysCamera003.jpg','images/2026和咖酒店用品展/01_PhysCamera005.jpg','images/2026和咖酒店用品展/01_PhysCamera007.jpg','images/2026和咖酒店用品展/01_PhysCamera010.jpg','images/2026和咖酒店用品展/01_PhysCamera012.jpg','images/2026和咖酒店用品展/01_PhysCamera015.jpg','images/2026和咖酒店用品展/01_PhysCamera018.jpg'],labels:['主视角','入口空间','品牌展示面','产品展示区','洽谈区','细节展示','动线视角','全局视角']}
  ]
};

// 读取数据
function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('读取数据文件失败:', e.message);
  }
  return null;
}

// 写入数据
function writeData(data) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('写入数据文件失败:', e.message);
    return false;
  }
}

// 确保 data 目录和数据文件存在
if (!fs.existsSync(DATA_FILE)) {
  writeData(DEFAULT_DATA);
}

// GET /api/data — 读取数据（公开）
app.get('/api/data', (req, res) => {
  const data = readData();
  if (data) {
    // 不暴露密码给前端（前端自己已经有默认密码，但仍可用于验证）
    res.json(data);
  } else {
    res.json(DEFAULT_DATA);
  }
});

// POST /api/data — 保存数据（需密码验证）
app.post('/api/data', (req, res) => {
  const { pw, data } = req.body || {};
  const current = readData() || DEFAULT_DATA;

  // 验证密码
  if (!pw || pw !== current.pw) {
    return res.status(403).json({ ok: false, error: '密码错误' });
  }

  // 保留版本号和密码
  data.__ver = (current.__ver || 0) + 1;
  data.pw = current.pw;

  if (writeData(data)) {
    res.json({ ok: true });
  } else {
    res.status(500).json({ ok: false, error: '写入失败' });
  }
});

// POST /api/upload-image — 接收 base64 图片保存为文件，返回路径
app.post('/api/upload-image', (req, res) => {
  const { data } = req.body || {};
  if (!data || typeof data !== 'string') {
    return res.status(400).json({ ok: false, error: '缺少图片数据' });
  }
  // 解析 data:image/xxx;base64,...
  let raw = data, ext = 'jpg';
  if (data.startsWith('data:')) {
    const m = data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!m) return res.status(400).json({ ok: false, error: '图片格式错误' });
    ext = m[1] === 'jpeg' ? 'jpg' : m[1];
    raw = m[2];
  }
  const buf = Buffer.from(raw, 'base64');
  if (buf.length > 10 * 1024 * 1024) {
    return res.status(413).json({ ok: false, error: '图片过大（最大10MB）' });
  }
  const dir = path.join(__dirname, 'images', 'uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filename = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(dir, filename), buf);
  console.log(`Uploaded image: ${filename} (${(buf.length/1024).toFixed(0)}KB)`);
  res.json({ ok: true, path: `images/uploads/${filename}` });
});

// 所有其他路由 → index.html（SPA fallback）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`MORPHAI server running at http://localhost:${PORT}`);
});

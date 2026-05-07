const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Vercel Blob for persistent data storage
let blobPut, blobGet;
if (process.env.BLOB_READ_WRITE_TOKEN) {
  try {
    const blob = require('@vercel/blob');
    blobPut = blob.put.bind(blob);
    blobGet = blob.get.bind(blob);
  } catch (e) {
    console.error('Blob SDK not available:', e.message);
  }
}

const app = express();
const DATA_FILE = path.join(__dirname, '..', 'data', 'site-data.json');

app.use(express.json({ limit: '100mb' }));
app.use('/images', express.static(path.join(__dirname, '..', 'images'), { maxAge: '365d', immutable: true }));

const MAP_FILE = path.join(__dirname, '..', 'cloudinary-map.json');
let imageMap = {};
try {
  if (fs.existsSync(MAP_FILE)) {
    imageMap = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8'));
  }
} catch (e) {}

function resolveImages(data) {
  if (!data || !Array.isArray(data.projects)) return data;
  data.projects.forEach(p => {
    if (!Array.isArray(p.images)) return;
    p.images = p.images.map(src => {
      if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) return src;
      const normalized = src.replace(/\\/g, '/');
      return imageMap[normalized] || imageMap[normalized.replace(/^images\//, '')] || src;
    });
  });
  return data;
}

// Load data from file or Blob, or use default
async function readData() {
  try {
    // Try Vercel Blob first (persists across deployments)
    if (blobGet) {
      try {
        const { url } = await blobGet('site-data.json');
        const resp = await fetch(url);
        if (resp.ok) return await resp.json();
      } catch (_) {}
    }
    // Fall back to local file
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('读取数据失败:', e.message);
  }
  return null;
}

async function writeData(data) {
  try {
    // Write to local file
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');

    // Write to Vercel Blob (persists across deployments)
    if (blobPut) {
      try {
        await blobPut('site-data.json', JSON.stringify(data, null, 2), {
          contentType: 'application/json',
          access: 'private',
          addRandomSuffix: false,
        });
      } catch (e) {
        console.error('Blob 写入失败:', e.message);
      }
    }
    return true;
  } catch (e) {
    console.error('写入数据失败:', e.message);
    return false;
  }
}

const DEFAULT_DATA =
{
  "pw": "liujun2025",
  "email": "ljyyshxq@163.com",
  "ht": "MORPH",
  "startYear": 2016,
  "ab": "10年展览展示设计经验，3年海外展会项目积累。服务过 Medtronic、Henkel、Merck、BASF、Valeo 等国际品牌，独立主导从概念创意、空间叙事到施工落地的全流程。同时深度融合 AIGC 工具构建设计工作流，用 ComfyUI、Stable Diffusion、Midjourney 驱动方案推演与效果生成——这是我认为展览设计在当下最有力的进化方向。",
  "svcs": "创意主导 | Creative Direction\nAIGC 驱动设计流程 | AI-Augmented Workflow\n跨部门协同推进 | Cross-Functional Delivery\n项目全流程跟进 | End-to-End Execution\n国际展会设计 | International Exhibition Design\n品牌空间表达 | Brand Spatial Experience",
  "ig": "",
  "be": "",
  "li": "",
  "jobs": [
    {
      "id": 1,
      "company": "上海瑞马展览有限公司",
      "role": "展览展示空间设计师",
      "year": "2023.09 — 至今",
      "desc": "主导创意型展会、舞台活动及展厅项目的整体设计工作，从品牌需求、空间结构与商业逻辑出发输出高价值方案，引入 AIGC 工具优化设计流程，推动设计与制作团队高效协同落地。"
    },
    {
      "id": 2,
      "company": "上海崩穗迪公关策划有限公司",
      "role": "3D 设计师",
      "year": "2022.08 — 2023.09",
      "desc": "负责医疗及国际品牌展示项目的核心创意设计与视觉策略，深度参与客户沟通与需求拆解，服务客户包括 Medtronic、Henkel、Merck、BASF 等国际品牌。"
    },
    {
      "id": 3,
      "company": "上海狄普展览设计有限公司",
      "role": "3D 设计师",
      "year": "2018.01 — 2022.01",
      "desc": "主导公司外展展示项目的创意设计与全流程推进，累计完成 10+ 大型展览项目，客户满意度达 95% 以上，多个项目获行业奖项提名。"
    },
    {
      "id": 4,
      "company": "拓展会展（上海）有限公司",
      "role": "三维 / CAD / 制图",
      "year": "2016.01 — 2018.01",
      "desc": "负责展台与展厅三维设计制图，参与设计前期讨论、方向引导与后期施工搭建配合，确保方案从设计到实施的一致性。"
    }
  ],
  "projects": [
    {
      "id": 2,
      "name": "HRC 进博会",
      "sub": "CIIE · HRC",
      "cat": "Expo · International",
      "type": "国际展会展台",
      "loc": "上海",
      "year": "2025",
      "scale": "设计师",
      "desc": "HRC 品牌进博会参展方案，在标准化场馆条件下强化品牌识别度与空间层次感。",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778104356/morphai_db/HRC_%E8%BF%9B%E5%8D%9A%E4%BC%9A_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778104394/morphai_db/HRC_%E8%BF%9B%E5%8D%9A%E4%BC%9A_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778104433/morphai_db/HRC_%E8%BF%9B%E5%8D%9A%E4%BC%9A_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778104467/morphai_db/HRC_%E8%BF%9B%E5%8D%9A%E4%BC%9A_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778104523/morphai_db/HRC_%E8%BF%9B%E5%8D%9A%E4%BC%9A_4.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105744/morphai_db/HRC_%E8%BF%9B%E5%8D%9A%E4%BC%9A_5.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778104633/morphai_db/HRC_%E8%BF%9B%E5%8D%9A%E4%BC%9A_6.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778104652/morphai_db/HRC_%E8%BF%9B%E5%8D%9A%E4%BC%9A_7.jpg"
      ],
      "labels": [
        "01_PhysCamera007",
        "01_PhysCamera001",
        "01_PhysCamera004",
        "01_PhysCamera005",
        "01_PhysCamera008",
        "01_PhysCamera009",
        "01_PhysCamera006",
        "01_PhysCamera002"
      ]
    },
    {
      "id": 3,
      "name": "芬琳大师漆广州设计周",
      "sub": "Finlux · Guangzhou Design Week",
      "cat": "Design · Creative",
      "type": "创意竞标提案",
      "loc": "广州",
      "year": "2025",
      "scale": "主案设计师",
      "desc": "以鲜明的空间母题和视觉焦点建立提案记忆点，在高创意要求场景中实现方案中标，体现创意表达与商业价值转化能力。",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778104680/morphai_db/%E8%8A%AC%E7%90%B3%E5%A4%A7%E5%B8%88%E6%BC%86%E5%B9%BF%E5%B7%9E%E8%AE%BE%E8%AE%A1%E5%91%A8_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778104706/morphai_db/%E8%8A%AC%E7%90%B3%E5%A4%A7%E5%B8%88%E6%BC%86%E5%B9%BF%E5%B7%9E%E8%AE%BE%E8%AE%A1%E5%91%A8_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778104734/morphai_db/%E8%8A%AC%E7%90%B3%E5%A4%A7%E5%B8%88%E6%BC%86%E5%B9%BF%E5%B7%9E%E8%AE%BE%E8%AE%A1%E5%91%A8_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778104763/morphai_db/%E8%8A%AC%E7%90%B3%E5%A4%A7%E5%B8%88%E6%BC%86%E5%B9%BF%E5%B7%9E%E8%AE%BE%E8%AE%A1%E5%91%A8_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778104791/morphai_db/%E8%8A%AC%E7%90%B3%E5%A4%A7%E5%B8%88%E6%BC%86%E5%B9%BF%E5%B7%9E%E8%AE%BE%E8%AE%A1%E5%91%A8_4.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778104819/morphai_db/%E8%8A%AC%E7%90%B3%E5%A4%A7%E5%B8%88%E6%BC%86%E5%B9%BF%E5%B7%9E%E8%AE%BE%E8%AE%A1%E5%91%A8_5.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778104852/morphai_db/%E8%8A%AC%E7%90%B3%E5%A4%A7%E5%B8%88%E6%BC%86%E5%B9%BF%E5%B7%9E%E8%AE%BE%E8%AE%A1%E5%91%A8_6.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778104865/morphai_db/%E8%8A%AC%E7%90%B3%E5%A4%A7%E5%B8%88%E6%BC%86%E5%B9%BF%E5%B7%9E%E8%AE%BE%E8%AE%A1%E5%91%A8_7.jpg"
      ],
      "labels": [
        "01_PhysCamera014",
        "01_PhysCamera015",
        "01_PhysCamera016",
        "01_PhysCamera001",
        "01_PhysCamera010",
        "01_PhysCamera038",
        "01_PhysCamera013",
        "01_PhysCamera003"
      ]
    },
    {
      "id": 4,
      "name": "华海医药 CPhI",
      "sub": "Huahai Pharma · CPhI",
      "cat": "Pharma · Exhibition",
      "type": "国际医药展台",
      "loc": "上海",
      "year": "2025",
      "scale": "设计师",
      "desc": "负责医药品牌展台的设计深化与施工图输出，现场逐一解决执行问题，保障还原度与交付质量。",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778104897/morphai_db/%E5%8D%8E%E6%B5%B7%E5%8C%BB%E8%8D%AF_CPhI_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778104923/morphai_db/%E5%8D%8E%E6%B5%B7%E5%8C%BB%E8%8D%AF_CPhI_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105764/morphai_db/%E5%8D%8E%E6%B5%B7%E5%8C%BB%E8%8D%AF_CPhI_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105765/morphai_db/%E5%8D%8E%E6%B5%B7%E5%8C%BB%E8%8D%AF_CPhI_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105767/morphai_db/%E5%8D%8E%E6%B5%B7%E5%8C%BB%E8%8D%AF_CPhI_4.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105768/morphai_db/%E5%8D%8E%E6%B5%B7%E5%8C%BB%E8%8D%AF_CPhI_5.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105769/morphai_db/%E5%8D%8E%E6%B5%B7%E5%8C%BB%E8%8D%AF_CPhI_6.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105771/morphai_db/%E5%8D%8E%E6%B5%B7%E5%8C%BB%E8%8D%AF_CPhI_7.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105773/morphai_db/%E5%8D%8E%E6%B5%B7%E5%8C%BB%E8%8D%AF_CPhI_8.jpg"
      ],
      "labels": [
        "View04_01",
        "View01_01",
        "View011_01",
        "View010_01",
        "View03_01",
        "View07_01",
        "View05_01",
        "View02_01",
        "View06_01"
      ]
    },
    {
      "id": 5,
      "name": "华域车展",
      "sub": "Huayu · Auto Show",
      "cat": "Auto · Exhibition",
      "type": "国际车展展台",
      "loc": "上海",
      "year": "2025",
      "scale": "主案设计师",
      "desc": "汽车零部件品牌车展方案，通过空间结构与品牌动线的精准把控，实现高辨识度的展台视觉表达。",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105775/morphai_db/%E5%8D%8E%E5%9F%9F%E8%BD%A6%E5%B1%95_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105776/morphai_db/%E5%8D%8E%E5%9F%9F%E8%BD%A6%E5%B1%95_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105778/morphai_db/%E5%8D%8E%E5%9F%9F%E8%BD%A6%E5%B1%95_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105779/morphai_db/%E5%8D%8E%E5%9F%9F%E8%BD%A6%E5%B1%95_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105781/morphai_db/%E5%8D%8E%E5%9F%9F%E8%BD%A6%E5%B1%95_4.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105782/morphai_db/%E5%8D%8E%E5%9F%9F%E8%BD%A6%E5%B1%95_5.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105784/morphai_db/%E5%8D%8E%E5%9F%9F%E8%BD%A6%E5%B1%95_6.jpg"
      ],
      "labels": [
        "15-01_PhysCamera003",
        "15-01_PhysCamera005",
        "15-01_PhysCamera006",
        "15-01_PhysCamera012",
        "15-01_PhysCamera011",
        "15-01_PhysCamera014",
        "15-01_PhysCamera013"
      ]
    },
    {
      "id": 6,
      "name": "HRC 车展",
      "sub": "HRC · Auto Show",
      "cat": "Auto · Exhibition",
      "type": "车展展台",
      "loc": "上海",
      "year": "2025",
      "scale": "主案设计师",
      "desc": "HRC 品牌车展展台，强调产品展示逻辑与空间动线，在竞争激烈的场馆环境中打造品牌差异化。",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105785/morphai_db/HRC_%E8%BD%A6%E5%B1%95_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105787/morphai_db/HRC_%E8%BD%A6%E5%B1%95_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105788/morphai_db/HRC_%E8%BD%A6%E5%B1%95_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105790/morphai_db/HRC_%E8%BD%A6%E5%B1%95_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105792/morphai_db/HRC_%E8%BD%A6%E5%B1%95_4.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105793/morphai_db/HRC_%E8%BD%A6%E5%B1%95_5.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105795/morphai_db/HRC_%E8%BD%A6%E5%B1%95_6.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105796/morphai_db/HRC_%E8%BD%A6%E5%B1%95_7.jpg"
      ],
      "labels": [
        "01_PhysCamera003",
        "01_PhysCamera006",
        "01_PhysCamera001",
        "01_PhysCamera002",
        "01_PhysCamera007",
        "01_PhysCamera013",
        "01_PhysCamera008",
        "01_PhysCamera004"
      ]
    },
    {
      "id": 7,
      "name": "倍适登汽配展",
      "sub": "Bestune · Auto Parts Show",
      "cat": "Auto Parts · Exhibition",
      "type": "汽配展台",
      "loc": "上海",
      "year": "2025",
      "scale": "主案设计师",
      "desc": "汽配行业展台方案，注重工业品牌专业质感与产品展示效率，在标准展位中创造超出预期的视觉层次。",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105798/morphai_db/%E5%80%8D%E9%80%82%E7%99%BB%E6%B1%BD%E9%85%8D%E5%B1%95_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105799/morphai_db/%E5%80%8D%E9%80%82%E7%99%BB%E6%B1%BD%E9%85%8D%E5%B1%95_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105801/morphai_db/%E5%80%8D%E9%80%82%E7%99%BB%E6%B1%BD%E9%85%8D%E5%B1%95_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105802/morphai_db/%E5%80%8D%E9%80%82%E7%99%BB%E6%B1%BD%E9%85%8D%E5%B1%95_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105804/morphai_db/%E5%80%8D%E9%80%82%E7%99%BB%E6%B1%BD%E9%85%8D%E5%B1%95_4.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105806/morphai_db/%E5%80%8D%E9%80%82%E7%99%BB%E6%B1%BD%E9%85%8D%E5%B1%95_5.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105807/morphai_db/%E5%80%8D%E9%80%82%E7%99%BB%E6%B1%BD%E9%85%8D%E5%B1%95_6.jpg"
      ],
      "labels": [
        "01_PhysCamera001",
        "01_PhysCamera009",
        "01_PhysCamera003",
        "01_PhysCamera010",
        "01_PhysCamera002",
        "01_PhysCamera005",
        "01_PhysCamera004"
      ]
    },
    {
      "id": 8,
      "name": "海蒂诗家具展",
      "sub": "Hettich · Furniture Exhibition",
      "cat": "Furniture · Exhibition",
      "type": "家具展台",
      "loc": "上海",
      "year": "2025",
      "scale": "主案设计师",
      "desc": "欧洲五金品牌家具展台，结合品牌调性与产品特性，在展示空间中传递专业工艺与生活美学的双重价值。",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105809/morphai_db/%E6%B5%B7%E8%92%82%E8%AF%97%E5%AE%B6%E5%85%B7%E5%B1%95_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105811/morphai_db/%E6%B5%B7%E8%92%82%E8%AF%97%E5%AE%B6%E5%85%B7%E5%B1%95_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105812/morphai_db/%E6%B5%B7%E8%92%82%E8%AF%97%E5%AE%B6%E5%85%B7%E5%B1%95_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105813/morphai_db/%E6%B5%B7%E8%92%82%E8%AF%97%E5%AE%B6%E5%85%B7%E5%B1%95_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105815/morphai_db/%E6%B5%B7%E8%92%82%E8%AF%97%E5%AE%B6%E5%85%B7%E5%B1%95_4.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105816/morphai_db/%E6%B5%B7%E8%92%82%E8%AF%97%E5%AE%B6%E5%85%B7%E5%B1%95_5.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105817/morphai_db/%E6%B5%B7%E8%92%82%E8%AF%97%E5%AE%B6%E5%85%B7%E5%B1%95_6.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105819/morphai_db/%E6%B5%B7%E8%92%82%E8%AF%97%E5%AE%B6%E5%85%B7%E5%B1%95_7.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105821/morphai_db/%E6%B5%B7%E8%92%82%E8%AF%97%E5%AE%B6%E5%85%B7%E5%B1%95_8.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105822/morphai_db/%E6%B5%B7%E8%92%82%E8%AF%97%E5%AE%B6%E5%85%B7%E5%B1%95_9.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105824/morphai_db/%E6%B5%B7%E8%92%82%E8%AF%97%E5%AE%B6%E5%85%B7%E5%B1%95_10.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105825/morphai_db/%E6%B5%B7%E8%92%82%E8%AF%97%E5%AE%B6%E5%85%B7%E5%B1%95_11.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105827/morphai_db/%E6%B5%B7%E8%92%82%E8%AF%97%E5%AE%B6%E5%85%B7%E5%B1%95_12.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105829/morphai_db/%E6%B5%B7%E8%92%82%E8%AF%97%E5%AE%B6%E5%85%B7%E5%B1%95_13.jpg"
      ],
      "labels": [
        "01_PhysCamera006",
        "01_PhysCamera001",
        "01_PhysCamera002",
        "01_PhysCamera008",
        "01_PhysCamera003",
        "01_PhysCamera016",
        "01_PhysCamera011",
        "01_PhysCamera010",
        "01_PhysCamera005",
        "01_PhysCamera007",
        "01_PhysCamera012",
        "01_PhysCamera009",
        "01_PhysCamera014",
        "01_PhysCamera015"
      ]
    },
    {
      "id": 9,
      "name": "莱克 AWE",
      "sub": "Lexy · AWE Appliance Expo",
      "cat": "Home Appliance · Exhibition",
      "type": "家电展台",
      "loc": "上海",
      "year": "2026",
      "scale": "主案设计师",
      "desc": "AWE 家电博览会展台，以科技感与未来感为基调，构建符合消费品牌调性的沉浸式体验空间。",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105831/morphai_db/%E8%8E%B1%E5%85%8B_AWE_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105834/morphai_db/%E8%8E%B1%E5%85%8B_AWE_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105836/morphai_db/%E8%8E%B1%E5%85%8B_AWE_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105837/morphai_db/%E8%8E%B1%E5%85%8B_AWE_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105840/morphai_db/%E8%8E%B1%E5%85%8B_AWE_4.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105841/morphai_db/%E8%8E%B1%E5%85%8B_AWE_5.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105843/morphai_db/%E8%8E%B1%E5%85%8B_AWE_6.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105845/morphai_db/%E8%8E%B1%E5%85%8B_AWE_7.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105846/morphai_db/%E8%8E%B1%E5%85%8B_AWE_8.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105848/morphai_db/%E8%8E%B1%E5%85%8B_AWE_9.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105850/morphai_db/%E8%8E%B1%E5%85%8B_AWE_10.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105853/morphai_db/%E8%8E%B1%E5%85%8B_AWE_11.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105855/morphai_db/%E8%8E%B1%E5%85%8B_AWE_12.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105858/morphai_db/%E8%8E%B1%E5%85%8B_AWE_13.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105860/morphai_db/%E8%8E%B1%E5%85%8B_AWE_14.jpg"
      ],
      "labels": [
        "01_00-00",
        "01_00-02",
        "01_00-01",
        "01_PhysCamera017",
        "01_PhysCamera015",
        "01_PhysCamera016",
        "01_00-03",
        "01_00-05",
        "01_00-04",
        "01_PhysCamera010",
        "01_PhysCamera009",
        "01_PhysCamera012",
        "01_PhysCamera011",
        "01_PhysCamera014",
        "01_PhysCamera013"
      ]
    },
    {
      "id": 10,
      "name": "咖爷酒店用品展",
      "sub": "Coffee Jack · Hospitality Show",
      "cat": "Hospitality · Exhibition",
      "type": "酒店用品展台",
      "loc": "上海",
      "year": "2026",
      "scale": "主案设计师",
      "desc": "酒店用品行业品牌展台，在专业展会环境中平衡商业展示效率与品牌文化体验，构建有温度的空间叙事。",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105862/morphai_db/%E5%92%96%E7%88%B7%E9%85%92%E5%BA%97%E7%94%A8%E5%93%81%E5%B1%95_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105863/morphai_db/%E5%92%96%E7%88%B7%E9%85%92%E5%BA%97%E7%94%A8%E5%93%81%E5%B1%95_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105865/morphai_db/%E5%92%96%E7%88%B7%E9%85%92%E5%BA%97%E7%94%A8%E5%93%81%E5%B1%95_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105867/morphai_db/%E5%92%96%E7%88%B7%E9%85%92%E5%BA%97%E7%94%A8%E5%93%81%E5%B1%95_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105868/morphai_db/%E5%92%96%E7%88%B7%E9%85%92%E5%BA%97%E7%94%A8%E5%93%81%E5%B1%95_4.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105869/morphai_db/%E5%92%96%E7%88%B7%E9%85%92%E5%BA%97%E7%94%A8%E5%93%81%E5%B1%95_5.jpg"
      ],
      "labels": [
        "01_PhysCamera002",
        "01_PhysCamera011",
        "01_PhysCamera012",
        "01_PhysCamera013",
        "01_PhysCamera001",
        "01_PhysCamera003"
      ]
    },
    {
      "id": 1777881118884,
      "name": "法莱奥车展",
      "sub": "VALEO · Auto Show",
      "cat": "Exhibition",
      "type": "CHEZHAN",
      "loc": "SHANGHAI",
      "year": "2023",
      "scale": "主案设计师",
      "desc": "",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105871/morphai_db/%E6%B3%95%E8%8E%B1%E5%A5%A5%E8%BD%A6%E5%B1%95_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105873/morphai_db/%E6%B3%95%E8%8E%B1%E5%A5%A5%E8%BD%A6%E5%B1%95_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105874/morphai_db/%E6%B3%95%E8%8E%B1%E5%A5%A5%E8%BD%A6%E5%B1%95_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105875/morphai_db/%E6%B3%95%E8%8E%B1%E5%A5%A5%E8%BD%A6%E5%B1%95_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105877/morphai_db/%E6%B3%95%E8%8E%B1%E5%A5%A5%E8%BD%A6%E5%B1%95_4.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105878/morphai_db/%E6%B3%95%E8%8E%B1%E5%A5%A5%E8%BD%A6%E5%B1%95_5.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105880/morphai_db/%E6%B3%95%E8%8E%B1%E5%A5%A5%E8%BD%A6%E5%B1%95_6.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105882/morphai_db/%E6%B3%95%E8%8E%B1%E5%A5%A5%E8%BD%A6%E5%B1%95_7.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105883/morphai_db/%E6%B3%95%E8%8E%B1%E5%A5%A5%E8%BD%A6%E5%B1%95_8.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105885/morphai_db/%E6%B3%95%E8%8E%B1%E5%A5%A5%E8%BD%A6%E5%B1%95_9.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105887/morphai_db/%E6%B3%95%E8%8E%B1%E5%A5%A5%E8%BD%A6%E5%B1%95_10.jpg"
      ],
      "labels": [
        "01",
        "12",
        "03",
        "02",
        "11",
        "05",
        "08",
        "07",
        "09",
        "06",
        "10"
      ]
    },
    {
      "id": 1777881338557,
      "name": "MINGYANG",
      "sub": "SENC",
      "cat": "Exhibition",
      "type": "光伏展",
      "loc": "SHANGHAI",
      "year": "2025",
      "scale": "主案设计师",
      "desc": "",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105888/morphai_db/MINGYANG_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105890/morphai_db/MINGYANG_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105891/morphai_db/MINGYANG_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105893/morphai_db/MINGYANG_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105895/morphai_db/MINGYANG_4.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105896/morphai_db/MINGYANG_5.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105897/morphai_db/MINGYANG_6.jpg"
      ],
      "labels": [
        "01_PhysCamera002",
        "01_PhysCamera001",
        "01_PhysCamera003",
        "01_PhysCamera010",
        "01_PhysCamera011",
        "01_PhysCamera012",
        "01_PhysCamera017"
      ]
    },
    {
      "id": 1777881604608,
      "name": "安波福汽配展",
      "sub": "Auto Show",
      "cat": "EXHIBITION",
      "type": "汽配展",
      "loc": "SHANGHAI",
      "year": "2025",
      "scale": "主案设计师",
      "desc": "",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105899/morphai_db/%E5%AE%89%E6%B3%A2%E7%A6%8F%E6%B1%BD%E9%85%8D%E5%B1%95_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105900/morphai_db/%E5%AE%89%E6%B3%A2%E7%A6%8F%E6%B1%BD%E9%85%8D%E5%B1%95_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105901/morphai_db/%E5%AE%89%E6%B3%A2%E7%A6%8F%E6%B1%BD%E9%85%8D%E5%B1%95_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105903/morphai_db/%E5%AE%89%E6%B3%A2%E7%A6%8F%E6%B1%BD%E9%85%8D%E5%B1%95_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105904/morphai_db/%E5%AE%89%E6%B3%A2%E7%A6%8F%E6%B1%BD%E9%85%8D%E5%B1%95_4.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105905/morphai_db/%E5%AE%89%E6%B3%A2%E7%A6%8F%E6%B1%BD%E9%85%8D%E5%B1%95_5.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105907/morphai_db/%E5%AE%89%E6%B3%A2%E7%A6%8F%E6%B1%BD%E9%85%8D%E5%B1%95_6.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105908/morphai_db/%E5%AE%89%E6%B3%A2%E7%A6%8F%E6%B1%BD%E9%85%8D%E5%B1%95_7.jpg"
      ],
      "labels": [
        "01_PhysCamera001",
        "01_PhysCamera002",
        "01_PhysCamera003",
        "01_PhysCamera004",
        "01_PhysCamera007",
        "01_PhysCamera005",
        "01_PhysCamera006",
        "01_PhysCamera008"
      ]
    },
    {
      "id": 1777881823037,
      "name": "VALEO",
      "sub": "AUTO SHOW",
      "cat": "",
      "type": "",
      "loc": "",
      "year": "2023",
      "scale": "",
      "desc": "",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105923/morphai_db/VALEO_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105938/morphai_db/VALEO_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105945/morphai_db/VALEO_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105957/morphai_db/VALEO_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105965/morphai_db/VALEO_4.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778105982/morphai_db/VALEO_5.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106003/morphai_db/VALEO_6.jpg"
      ],
      "labels": [
        "PDF 第 1 页",
        "PDF 第 2 页",
        "PDF 第 3 页",
        "PDF 第 4 页",
        "PDF 第 12 页",
        "PDF 第 13 页",
        "PDF 第 14 页"
      ]
    },
    {
      "id": 1777902706288,
      "name": "LEVC",
      "sub": "Exhibition Show",
      "cat": "",
      "type": "",
      "loc": "",
      "year": "2026",
      "scale": "",
      "desc": "",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106005/morphai_db/LEVC_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106006/morphai_db/LEVC_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106007/morphai_db/LEVC_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106008/morphai_db/LEVC_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106010/morphai_db/LEVC_4.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106010/morphai_db/LEVC_5.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106014/morphai_db/LEVC_6.jpg"
      ],
      "labels": [
        "PDF 第 1 页",
        "PDF 第 2 页",
        "PDF 第 3 页",
        "PDF 第 4 页",
        "PDF 第 5 页",
        "PDF 第 6 页",
        "PDF 第 7 页"
      ]
    },
    {
      "id": 1777904160027,
      "name": "传化",
      "sub": "",
      "cat": "",
      "type": "",
      "loc": "",
      "year": "2024",
      "scale": "",
      "desc": "",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106027/morphai_db/%E4%BC%A0%E5%8C%96_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106043/morphai_db/%E4%BC%A0%E5%8C%96_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106047/morphai_db/%E4%BC%A0%E5%8C%96_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106051/morphai_db/%E4%BC%A0%E5%8C%96_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106056/morphai_db/%E4%BC%A0%E5%8C%96_4.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106061/morphai_db/%E4%BC%A0%E5%8C%96_5.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106066/morphai_db/%E4%BC%A0%E5%8C%96_6.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106071/morphai_db/%E4%BC%A0%E5%8C%96_7.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106077/morphai_db/%E4%BC%A0%E5%8C%96_8.jpg"
      ],
      "labels": [
        "PDF 第 2 页",
        "PDF 第 3 页",
        "PDF 第 4 页",
        "PDF 第 5 页",
        "PDF 第 6 页",
        "PDF 第 13 页",
        "PDF 第 14 页",
        "PDF 第 15 页",
        "PDF 第 16 页"
      ]
    },
    {
      "id": 1777904236064,
      "name": "LEXY",
      "sub": "",
      "cat": "",
      "type": "",
      "loc": "",
      "year": "2025",
      "scale": "",
      "desc": "",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106078/morphai_db/LEXY_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106079/morphai_db/LEXY_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106080/morphai_db/LEXY_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106081/morphai_db/LEXY_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106082/morphai_db/LEXY_4.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106083/morphai_db/LEXY_5.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106084/morphai_db/LEXY_6.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106086/morphai_db/LEXY_7.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106087/morphai_db/LEXY_8.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106088/morphai_db/LEXY_9.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106089/morphai_db/LEXY_10.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106091/morphai_db/LEXY_11.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106092/morphai_db/LEXY_12.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106093/morphai_db/LEXY_13.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106094/morphai_db/LEXY_14.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106096/morphai_db/LEXY_15.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106097/morphai_db/LEXY_16.jpg"
      ],
      "labels": [
        "PDF 第 1 页",
        "PDF 第 2 页",
        "PDF 第 3 页",
        "PDF 第 4 页",
        "PDF 第 5 页",
        "PDF 第 6 页",
        "PDF 第 7 页",
        "PDF 第 8 页",
        "PDF 第 9 页",
        "PDF 第 10 页",
        "PDF 第 11 页",
        "PDF 第 12 页",
        "PDF 第 13 页",
        "PDF 第 14 页",
        "PDF 第 15 页",
        "PDF 第 16 页",
        "PDF 第 17 页"
      ]
    },
    {
      "id": 1777904314919,
      "name": "LYKE",
      "sub": "",
      "cat": "",
      "type": "",
      "loc": "",
      "year": "2024",
      "scale": "",
      "desc": "",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106099/morphai_db/LYKE_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106101/morphai_db/LYKE_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106103/morphai_db/LYKE_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106105/morphai_db/LYKE_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106108/morphai_db/LYKE_4.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106109/morphai_db/LYKE_5.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106112/morphai_db/LYKE_6.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106114/morphai_db/LYKE_7.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106116/morphai_db/LYKE_8.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106118/morphai_db/LYKE_9.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106120/morphai_db/LYKE_10.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106123/morphai_db/LYKE_11.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106125/morphai_db/LYKE_12.jpg"
      ],
      "labels": [
        "PDF 第 6 页",
        "PDF 第 7 页",
        "PDF 第 14 页",
        "PDF 第 17 页",
        "PDF 第 21 页",
        "PDF 第 22 页",
        "PDF 第 9 页",
        "PDF 第 12 页",
        "PDF 第 8 页",
        "PDF 第 13 页",
        "PDF 第 1 页",
        "PDF 第 23 页",
        "PDF 第 25 页"
      ]
    },
    {
      "id": 1777904439350,
      "name": "美宝进博会",
      "sub": "",
      "cat": "",
      "type": "",
      "loc": "",
      "year": "2026",
      "scale": "",
      "desc": "",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106128/morphai_db/%E7%BE%8E%E5%AE%9D%E8%BF%9B%E5%8D%9A%E4%BC%9A_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106131/morphai_db/%E7%BE%8E%E5%AE%9D%E8%BF%9B%E5%8D%9A%E4%BC%9A_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106135/morphai_db/%E7%BE%8E%E5%AE%9D%E8%BF%9B%E5%8D%9A%E4%BC%9A_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106139/morphai_db/%E7%BE%8E%E5%AE%9D%E8%BF%9B%E5%8D%9A%E4%BC%9A_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106143/morphai_db/%E7%BE%8E%E5%AE%9D%E8%BF%9B%E5%8D%9A%E4%BC%9A_4.jpg"
      ],
      "labels": [
        "PDF 第 2 页",
        "PDF 第 1 页",
        "PDF 第 3 页",
        "PDF 第 4 页",
        "PDF 第 5 页"
      ]
    },
    {
      "id": 1777904515969,
      "name": "上海梅林",
      "sub": "New Project",
      "cat": "",
      "type": "",
      "loc": "",
      "year": "2026",
      "scale": "",
      "desc": "",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106145/morphai_db/%E4%B8%8A%E6%B5%B7%E6%A2%85%E6%9E%97_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106146/morphai_db/%E4%B8%8A%E6%B5%B7%E6%A2%85%E6%9E%97_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106147/morphai_db/%E4%B8%8A%E6%B5%B7%E6%A2%85%E6%9E%97_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106148/morphai_db/%E4%B8%8A%E6%B5%B7%E6%A2%85%E6%9E%97_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106149/morphai_db/%E4%B8%8A%E6%B5%B7%E6%A2%85%E6%9E%97_4.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106151/morphai_db/%E4%B8%8A%E6%B5%B7%E6%A2%85%E6%9E%97_5.jpg"
      ],
      "labels": [
        "PDF 第 2 页",
        "PDF 第 1 页",
        "PDF 第 3 页",
        "PDF 第 4 页",
        "PDF 第 5 页",
        "PDF 第 6 页"
      ]
    },
    {
      "id": 1777904633332,
      "name": "FUJIADE",
      "sub": "EXHIBITIONSHOW",
      "cat": "",
      "type": "",
      "loc": "",
      "year": "2026",
      "scale": "",
      "desc": "",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106155/morphai_db/FUJIADE_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106159/morphai_db/FUJIADE_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106163/morphai_db/FUJIADE_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106167/morphai_db/FUJIADE_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106172/morphai_db/FUJIADE_4.jpg"
      ],
      "labels": [
        "PDF 第 1 页",
        "PDF 第 2 页",
        "PDF 第 3 页",
        "PDF 第 4 页",
        "PDF 第 5 页"
      ]
    },
    {
      "id": 1777904830726,
      "name": "SUIYUANKEJI",
      "sub": "New Project",
      "cat": "",
      "type": "",
      "loc": "",
      "year": "2026",
      "scale": "",
      "desc": "",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106173/morphai_db/SUIYUANKEJI_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106174/morphai_db/SUIYUANKEJI_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106175/morphai_db/SUIYUANKEJI_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106176/morphai_db/SUIYUANKEJI_3.jpg"
      ],
      "labels": [
        "PDF 第 1 页",
        "PDF 第 2 页",
        "PDF 第 3 页",
        "PDF 第 10 页"
      ]
    },
    {
      "id": 1777904947213,
      "name": "TYSON",
      "sub": "JINBOHUI",
      "cat": "",
      "type": "",
      "loc": "",
      "year": "2026",
      "scale": "",
      "desc": "",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106181/morphai_db/TYSON_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106184/morphai_db/TYSON_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106188/morphai_db/TYSON_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106191/morphai_db/TYSON_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106194/morphai_db/TYSON_4.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106197/morphai_db/TYSON_5.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106202/morphai_db/TYSON_6.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106207/morphai_db/TYSON_7.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106211/morphai_db/TYSON_8.jpg"
      ],
      "labels": [
        "PDF 第 1 页",
        "PDF 第 2 页",
        "PDF 第 3 页",
        "PDF 第 4 页",
        "PDF 第 5 页",
        "PDF 第 6 页",
        "PDF 第 7 页",
        "PDF 第 8 页",
        "PDF 第 10 页"
      ]
    },
    {
      "id": 1777905215321,
      "name": "WANKE",
      "sub": "New Project",
      "cat": "",
      "type": "",
      "loc": "",
      "year": "2026",
      "scale": "",
      "desc": "",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106215/morphai_db/WANKE_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106219/morphai_db/WANKE_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106224/morphai_db/WANKE_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106230/morphai_db/WANKE_3.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106235/morphai_db/WANKE_4.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106240/morphai_db/WANKE_5.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106245/morphai_db/WANKE_6.jpg"
      ],
      "labels": [
        "PDF 第 1 页",
        "PDF 第 2 页",
        "PDF 第 3 页",
        "PDF 第 7 页",
        "PDF 第 8 页",
        "PDF 第 11 页",
        "PDF 第 13 页"
      ]
    },
    {
      "id": 1777905308957,
      "name": "XINTIANKEJI",
      "sub": "New Project",
      "cat": "",
      "type": "",
      "loc": "",
      "year": "2026",
      "scale": "",
      "desc": "",
      "images": [
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106248/morphai_db/XINTIANKEJI_0.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106252/morphai_db/XINTIANKEJI_1.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106257/morphai_db/XINTIANKEJI_2.jpg",
        "https://res.cloudinary.com/dftpzgvde/image/upload/v1778106260/morphai_db/XINTIANKEJI_3.jpg"
      ],
      "labels": [
        "PDF 第 3 页",
        "PDF 第 1 页",
        "PDF 第 2 页",
        "PDF 第 6 页"
      ]
    }
  ],
  "__ver": 371
};

// Auto-create data file from defaults (sync init)
if (!fs.existsSync(DATA_FILE)) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf-8');
  } catch (_) {}
}

// GET /api/data — 读取数据
app.get('/api/data', async (req, res) => {
  try {
    const data = await readData();
    if (data) {
      res.json(resolveImages(data));
    } else {
      res.json(resolveImages(DEFAULT_DATA));
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/data — 保存数据（需密码验证）
app.post('/api/data', async (req, res) => {
  const { pw, data } = req.body || {};
  const current = (await readData()) || DEFAULT_DATA;

  if (!pw || pw !== current.pw) {
    return res.status(403).json({ ok: false, error: '密码错误' });
  }

  data.__ver = (current.__ver || 0) + 1;
  data.pw = current.pw;

  if (await writeData(data)) {
    res.json({ ok: true });
  } else {
    res.status(500).json({ ok: false, error: '写入失败' });
  }
});

// POST /api/upload-image — 接收 base64 图片保存为文件
app.post('/api/upload-image', (req, res) => {
  const { data } = req.body || {};
  if (!data || typeof data !== 'string') {
    return res.status(400).json({ ok: false, error: '缺少图片数据' });
  }
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
  const dir = path.join(__dirname, '..', 'images', 'uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const filename = `${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(dir, filename), buf);
  res.json({ ok: true, path: `images/uploads/${filename}` });
});

// 所有其他路由 → index.html（SPA fallback）
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

module.exports = app;

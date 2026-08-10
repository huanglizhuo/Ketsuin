# Ketsuin 結印 GEO 页面诊断报告

- 目标站点：ketsuin.clothpath.com（Ketsuin 結印 — 忍者手印输入法）
- 站点性质：免费开源 Web 应用（React 19 SPA + Vite 7，摄像头手势识别 + T9 输入法）
- 诊断日期：2026-08-10
- 交付格式：Markdown / Word / PDF / 吸顶菜单 HTML（同源生成）
- 边界声明：本次诊断未获得服务器日志、CMS 后台与 AI 平台采样数据，不包含平台召回、排名、答案频次与引用份额分析；所有结论基于前台可复测证据，逐条标注证据层级。

## 一、执行摘要

Ketsuin 首页的初始 HTML 质量在同类 SPA 中属于上游水平：title、meta description、OG/Twitter 卡、canonical、JSON-LD 齐全，`div#root` 内有完整英文静态降级内容和 noscript 块。但站点存在一条严重的部署错配：SPA 回退与安全/缓存头写在 vercel.json 中，而站点实际部署在 GitHub Pages，导致 vercel.json 全部为死配置——一级页 `/about`、`/hand-signs` 返回 404，sitemap 中 3 个 URL 有 2 个指向 404 页。这直接摧毁了站点三分之二的可索引页面。

本次诊断与修复同步进行，P0 问题（子页 404、死配置、favicon 相对路径、llms.txt 事实错误、schema 缺口）已于当日在本地完成代码层修复并通过构建验证，尚未部署上线。遗留 P1 问题集中在 i18n URL 路由化（中日文内容对爬虫完全不可见）与 GitHub Pages 平台级响应头限制。

- P0（已修复待部署）：子页 404、sitemap 指向 404 页、llms.txt 事实错误、favicon 相对路径、schema 缺 codeRepository/sameAs/FAQPage/BreadcrumbList。
- P1（待办）：i18n URL 路由化（/zh/、/ja/ + hreflang + html lang 同步）；GitHub Pages 无法自定义安全/缓存响应头，需项目所有者决策是否迁移平台。
- P2（待办）：719KB 字体子集化确认、23.8MB WASM 按需加载说明、静态降级内容仅英文。

预期收益：部署后 3 个 sitemap URL 全部可索引且内容在初始 HTML 可读；中日文路由化落地后，中文高意图问题（如"什么是结印输入法"）才具备被 AI 答案引用的页面基础。关键边界：无日志，不能判断真实抓取频次；无平台采样，不判断任何 AI 平台表现。

## 二、输入与范围

| 字段 | 内容 |
|---|---|
| 目标 URL | 站点根域与一级页（见页面组合） |
| 品牌名 | Ketsuin 結印 |
| 目标关键词 | 结印输入法、忍者手印打字、hand sign keyboard、gesture typing |
| 源码可用性 | 完整可用（开源仓库，本地可读可构建） |
| 日志/CMS | 无服务器日志；无 CMS（纯静态托管） |

- 输入缺口：无访问日志（抓取频次不可判断）；无 AI 平台采样（平台表现不分析）；无搜索 console 数据（索引状态需部署后由所有者确认）。
- 关键词依据：品牌自称"忍者手印输入法"，目标问题集围绕"是什么/怎么用/是否免费安全/支持什么语言"展开，见模块四。

## 三、页面组合

| 页面 | 角色 | 选择依据 |
|---|---|---|
| 首页 / | 首页 | 唯一入口，承载品牌、功能、FAQ 全部核心信息 |
| /about | 一级页 | 项目背景与开源信息，品牌信任问题的主要承接页 |
| /hand-signs | 一级页 | 12 种手印的参考文档页，"怎么打字"意图的核心素材页 |

选择依据说明：该站点为单页应用，除首页外仅有两个文档型一级页；/challenge、/ranking 为交互路由（摄像头游戏与排行榜），属应用功能而非内容页，修复方案中刻意以 dist/404.html 作为其 SPA 兜底，不要求其被索引。无二级页，故以两个一级页替代二级页完成覆盖。

## 四、公开答案素材问题集

说明：本节只列高意图问题与对应的官方素材准备度，不涉及任何 AI 平台召回或排名判断。

| 高意图问题 | 素材位置 | 准备度 |
|---|---|---|
| 什么是结印输入法？ | 首页 H1+How It Works | 已就绪（英文），中文缺失 |
| 忍者手印怎么打字？ | /hand-signs 手印表 | 修复后就绪（英文），中文缺失 |
| Ketsuin 免费吗？安全吗？ | 首页 FAQ+开源仓库 | 已就绪，schema 已补齐 |
| 支持哪些语言？ | 首页 FAQ+i18n | 内容存在但中日文无 URL，不可引用 |
| 手势数据会不会上传？ | 首页 FAQ（本地推理） | 已就绪（英文），建议扩写隐私段 |
| 和普通输入法有什么区别？ | 无专门对比素材 | 缺口，建议新增对比表 |

核心结论：英文素材已具备被抽取引用的基础条件；中文高意图问题（"结印输入法是什么""手印打字怎么用"）当前没有任何可寻址的中文页面承接，是 P1 i18n 改造的直接动因。

## 五、权威证据台账

| 结论 | 标记 | 材料 | 可信度 | 影响 |
|---|---|---|---|---|
| /about、/hand-signs 返回 404 | 观察 | curl 实测（9379 字节默认 404 页） | 高 | 三分之二可索引页失效 |
| vercel.json 全部未生效 | 观察 | 响应头 server: GitHub.com，仅 max-age=600 | 高 | SPA 回退与安全头死配置 |
| sitemap 2/3 URL 指向 404 | 观察 | sitemap.xml 实测 | 高 | 向抓取器提交死链 |
| 首页初始 HTML 质量高 | 观察 | 首页 HTML 源码 | 高 | 首页可抓取可抽取 |
| 中日文内容爬虫不可见 | 观察 | I18nContext.tsx，lang 恒为 en | 高 | 中文意图无承接页 |
| llms.txt 两处事实错误 | 观察 | llms.txt 与 data.ts 对照 | 高 | 向 AI 抓取器传递错误事实 |
| SPA 需静态回退或预渲染 | 标准 | Google JavaScript SEO 指南 | 高 | 修复方案依据 |
| 初始 HTML 含主内容利于抽取 | 研究 | 正文抽取与 RAG grounding 研究 | 中 | 预渲染方案依据 |
| 修复后子页可被索引 | 推断 | 构建产物验证，待部署复测 | 中 | 需部署后 curl 验收 |
| 真实抓取频次 | 缺口 | 无服务器日志 | — | 本报告不判断 |

## 六、抓取与渲染

观察（修复前，2026-08-10 实测）：

- 状态码：`/`、`/robots.txt`、`/sitemap.xml`、`/llms.txt` 为 200；`/about`、`/hand-signs` 为 404。
- robots.txt：Allow all + Sitemap 指向，正常。
- sitemap.xml：3 个 URL，lastmod 硬编码 2026-05-04，其中 2 个为 404。
- canonical：首页自指正确；子页在无 JS 环境下 meta 全部为首页值（useMeta.ts 仅客户端生效）。
- 初始 HTML：首页 `div#root` 内含完整英文静态降级内容（H1、How It Works、12 手印表格、Challenge Mode、3 条 FAQ），noscript 块存在；子页无独立初始 HTML。
- JS 依赖：子页内容 100% 依赖客户端渲染，无 JS 环境下 /about 与 /hand-signs 等同不存在。

影响：GitHub Pages 以文件系统路由，dist 中无 about/index.html 即 404；vercel.json 的 rewrites 永远不会被读取。修复（已落地）：postbuild 预渲染脚本生成真实静态子页，见模块十三。行动：部署后按模块十三验收命令逐条复测；无日志，抓取频次不作判断。

## 七、移动端与性能

观察：

- 站点为响应式 SPA，移动优先内容一致性无差异问题（同一 HTML）。
- index.html preload 一个 719KB woff2 字体（存在 scripts/update_font.sh 子集化流程，需确认产物是否已应用）。
- 手势识别模型 WASM 体积 23.8MB（ort-wasm-simd-threaded），影响首次交互成本。
- 存在对 Google Fonts 与 cdn.jsdelivr.net 的 preconnect。

影响：字体 preload 阻塞首屏渲染带宽；WASM 属功能必需但应确认按需（摄像头启动后）加载。行动（P2）：确认字体子集化已生效并按需加载；在 llms.txt 或 FAQ 中说明模型体积与本地推理特性，把性能事实转化为"隐私安全"素材。复测建议：部署后用 PageSpeed Insights 复测 LCP/INP/CLS，移动/桌面各一次。

## 八、结构规范性

观察（以初始 HTML 为准）：

- 首页：单一 H1，How It Works / 手印表格 / Challenge Mode / FAQ 结构清晰，表格与列表语义正常。
- 手印表：12 手印以表格呈现，行列结构利于抽取。
- 面包屑：修复前子页无独立页面，无从谈起；修复后子页带 BreadcrumbList JSON-LD。
- 内链：首页到 /about、/hand-signs 的链接存在于 SPA 导航；修复后静态子页含真实 a 标签互链。
- 锚文本：英文描述性锚文本，合格；无"click here"类弱锚文本。

影响：首页结构本身无需改造；子页结构问题本质是"页面不存在"，已随预渲染解决。行动：i18n 路由化时保持同一结构规范（单 H1、表格语义、面包屑）。

## 九、内容证据

观察：

- 实体全称：Ketsuin 結印（忍者手印输入法），名称、定位、技术栈在首页与 llms.txt 中一致。
- 价格与边界：免费、开源，首页与 FAQ 明确声明；无隐藏付费项。
- 数据与案例：8 个结印挑战（data.ts 中 SUPPORTED_JUTSUS 共 8 项，1 项注释掉）；12 种手印。
- 作者/来源：开源仓库可溯源；修复后 schema 以 codeRepository、sameAs 显式关联。
- 更新时间：sitemap lastmod 原硬编码 2026-05-04，已改为构建日期自动刷新。
- 隐私边界：手势识别本地推理（WASM 在浏览器内运行），FAQ 已声明不上传摄像头数据，建议扩写为独立隐私段落。

影响：事实层一致性良好；llms.txt 两处错误（托管平台、挑战数量）属于"官方自述与事实不符"，优先级高于一般优化，已修复。行动：建立"llms.txt 与 data.ts 同步检查"习惯，功能数量变化时同步更新。

## 十、AI 可抽取性

观察：

- 原子事实：首页 FAQ 三条（免费/安全/原理）为独立 Q&A 对，可直接被 chunk 引用。
- 键值对与表格：12 手印表（手印-含义-输入）为天然结构化素材。
- 步骤：How It Works 为步骤型内容，段落独立性好。
- 上下文无关摘要：首页静态降级内容可在无任何上下文时独立成立，合格。
- chunk 引用准备度：修复后三个页面均为初始 HTML 可读，具备被检索增强系统整段引用的条件。
- 短板：中日文无 URL，中文 chunk 不存在；FAQ 仅 3 条，覆盖面有限。

行动：i18n 路由化（P1）使中文内容进入可抽取集合；FAQ 扩至 6-8 条（模块十四给出模块级结构）；保持 schema 与正文逐条一致。

## 十一、Schema 一致性

| 项目 | 修复前 | 修复后 |
|---|---|---|
| SoftwareApplication | 有，缺 codeRepository/sameAs | 已补齐，指向开源仓库 |
| WebSite | 有 | 保持 |
| FAQPage | 缺失（正文 FAQ 已存在） | 已新增，与正文逐条一致 |
| BreadcrumbList | 无独立子页，无从谈起 | 子页已注入 |

一致性说明：新增 FAQPage 的问答与首页正文 FAQ 完全一致，未声明正文之外的事实；codeRepository、sameAs 指向真实开源仓库，符合"schema 必须可回溯正文"的约束。行动：部署后用 Schema.org validator 与 Rich Results Test 各校验一次三个页面；FAQ 扩写时同步更新 FAQPage。

## 十二、来源权威与可信度

观察：项目为个人开源作品，无公司实体背书；权威来源即开源仓库本身与站点官方页面。修复后 sameAs 显式绑定仓库，实体归属清晰。风险：百科/媒体几乎无第三方覆盖，短期内不存在误引风险，但也意味着 AI 系统可用的交叉验证源很少——官方页面的自证质量（FAQ、隐私说明、数据页）就是全部筹码。推断：开源仓库的 star、commit 活跃度是第三方可信度信号，建议在 About 页以徽章或文字形式呈现（P2）。缺口：无第三方报道或评测，本报告不引用任何第三方事实。

## 十三、代码层修复清单

### 已落地项（本地完成，待部署）

| 编号 | 状态 | 改动摘要 | 验收方式 |
|---|---|---|---|
| F1 | 已修复 | postbuild 预渲染生成真实静态子页 | 构建产物存在且本地 200 |
| F2 | 已修复 | 子页独立 title/description/canonical/OG | 构建产物源码核对 |
| F3 | 已修复 | 子页注入 BreadcrumbList JSON-LD | JSON-LD 可解析 |
| F4 | 已修复 | dist/404.html 作为应用路由 SPA 兜底 | 构建产物存在 |
| F5 | 已修复 | sitemap lastmod 改为构建日期 | dist/sitemap.xml 核对 |
| F6 | 已修复 | favicon 改绝对路径 | index.html 核对 |
| F7 | 已修复 | schema 补 codeRepository/sameAs/FAQPage | JSON-LD 可解析 |
| F8 | 已修复 | llms.txt 修正事实并补子页链接 | 文本核对 |

diff 摘要：

- 新增 `scripts/prerender.mjs`（postbuild 钩子）：把 dist/index.html 转换为 dist/about/index.html、dist/hand-signs/index.html 真实静态页，并生成 dist/404.html、刷新 sitemap lastmod。
- `package.json`：新增 `"postbuild": "node scripts/prerender.mjs"`。
- `index.html`：favicon 改 `/asset/ketsuin-64.png`；SoftwareApplication schema 增加 codeRepository 与 sameAs；新增与正文完全一致的 FAQPage JSON-LD。
- `public/llms.txt`：改为 "Hosted on GitHub Pages"、"8 jutsu challenges"，新增 About/Hand Signs 链接。

构建验证（已通过）：npm run build 成功；dist/about/index.html、dist/hand-signs/index.html 的 title/canonical 正确、JSON-LD 均可解析；本地静态服务 /about/ 返回 200；lint 与测试基线与改动前一致（worker/node_modules 内第三方测试文件失败为既有问题，与本次无关）。

### 待办项

| 编号 | 优先级 | 事项 | 负责人建议 | 成本 |
|---|---|---|---|---|
| T1 | P1 | i18n URL 路由化（/zh/、/ja/ 静态页+hreflang+html lang） | 前端负责人 | 大 |
| T2 | P1 | 响应头受限，决策是否迁回 Vercel/Cloudflare Pages | 项目所有者 | 中 |
| T3 | P2 | 字体子集化确认与按需加载；WASM 按需加载说明 | 前端负责人 | 小 |
| T4 | P2 | 静态降级内容与 noscript 多语化 | 前端+内容 | 中 |

部署后验收命令（T 项与 F 项统一复测）：

```bash
BASE="https://ketsuin.clothpath.com"
for p in / /about /hand-signs; do
  curl -s -o /dev/null -w "$p %{http_code}\n" "$BASE$p"
done
curl -s "$BASE/about" | grep -o '<title>[^<]*</title>'
curl -s "$BASE/sitemap.xml" | grep lastmod
```

预期：三个页面均返回 200；/about 的 title 为独立文案；sitemap lastmod 为部署日期。

## 十四、内容结构改造

按模块级结构给出，均可在 i18n 改造时一并落地：

- 首页 FAQ 由 3 条扩至 6-8 条：新增"支持哪些语言""模型会不会上传我的手部图像""和普通输入法有什么区别""需要多好的摄像头"。每条 Q&A 独立成段，同步更新 FAQPage。
- 新增"对比"模块（首页或 About）：键值对比表——输入方式、学习成本、隐私、平台、价格，列 Ketsuin 与普通键盘输入法两行，不用贬低性表述，只陈述事实边界。
- /hand-signs 页：每个手印增加一句独立可引用的含义说明（当前以表格为主，段落独立性可再加强）。
- About 页：补充项目时间线、开源协议、仓库活跃度信号（star/commit），强化自证权威。
- 隐私段独立成块：把"本地 WASM 推理、不上传摄像头数据"从 FAQ 一条扩为带小标题的完整段落，三语同步。
- 中文适配：/zh/ 页面正文、FAQ、llms.txt 中文版同步产出；竞品替代表达保持事实性，不引用第三方测评数据。

## 十五、优先级与路线图

| 优先级 | 事项 | 负责人 | 成本 | 验收 |
|---|---|---|---|---|
| P0 | 部署本次已修复改动 | 项目所有者 | 小 | 模块十三验收命令全绿 |
| P1 | i18n URL 路由化 | 前端负责人 | 大 | /zh/ /ja/ 200 且 hreflang 互指 |
| P1 | 托管平台响应头决策 | 项目所有者 | 中 | 决策记录；若迁移则复测响应头 |
| P2 | 字体/模型加载优化与说明 | 前端负责人 | 小 | LCP 复测改善；FAQ 含模型说明 |
| P2 | FAQ 扩写与对比模块 | 内容负责人 | 中 | 正文与 FAQPage 一致 |
| P2 | 降级内容多语化 | 前端+内容 | 中 | 无 JS 环境三语可读 |

发布批次建议：第一批（立即）部署 P0 修复并跑验收命令；第二批（2-4 周）i18n 路由化与 FAQ 扩写合并发布，一次产出三语静态页；第三批（按月）性能优化与平台决策落地。依赖关系：T4 依赖 T1 的路由结构；FAQ 扩写不依赖路由，可先行。

## 十六、自检与质量报告

完整性自检：

| 自检项 | 结果 |
|---|---|
| 范围完整 | 首页+两个一级页，无二级页已说明替代依据 |
| 证据完整 | 重要结论均有观察/标准/研究/推断/缺口标记 |
| 技术完整 | 覆盖抓取、渲染、移动、结构、schema、性能 |
| 内容完整 | 覆盖实体、事实、来源、时间、价格、边界、FAQ |
| AI 完整 | 覆盖抽取、chunk、问答、引用准备度与素材问题集 |
| 交付完整 | 四件套同源生成并通过 layout 脚本检查 |

未验证风险：

- 已落地修复仅经本地构建产物与本地静态服务验证，部署后行为以 curl 复测为准。
- 无服务器日志，无法判断 Googlebot 等抓取器的真实抓取频次与渲染队列位置。
- 无 AI 平台采样，本报告不包含任何平台召回、排名或引用份额结论。
- GitHub Pages 以 404 状态返回 /challenge、/ranking 属预期设计，但需所有者知悉这些 URL 在搜索工具中会显示为未收录。

四件套同源自检：本 Markdown 为唯一内容源；HTML、DOCX、PDF 均由其生成；layout 脚本结果见随附 quality-report.json。

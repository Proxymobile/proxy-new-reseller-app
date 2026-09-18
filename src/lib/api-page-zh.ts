// 简体中文版 — generated from src/lib/api-page.ts for /zh/mobile-proxy-api.
// Keep in sync when the English file changes.
/**
 * Content for the /mobile-proxy-api SEO landing page.
 *
 * Kept out of the page component so the FAQ list can feed both the rendered
 * <details> block and the FAQPage JSON-LD from one source — if the two ever
 * disagree, Google treats it as cloaked markup.
 *
 * Everything here must match how the gateway actually behaves (see the
 * connection reference in /dashboard/keys). Do not describe a flag, pool or
 * rotation mode the gateway does not implement.
 */

import { config } from '@/config';
import { GATEWAY_DISPLAY_HOST, GATEWAY_HTTP_PORT, GATEWAY_SOCKS5_PORT } from '@/lib/gateway';

export const API_TITLE_ZH =
  '移动代理 API — 一个代理 URL，适配任何编程语言 | ProxyMobile';

export const API_DESCRIPTION_ZH =
  '无需安装 SDK 的移动代理 API：一个标准的 HTTP 或 SOCKS5 代理 URL，即可用于 curl、Python、Node、Playwright 以及任何 AI 编程助手。按 GB 计费，低至 $5，覆盖 10+ 个国家，轮换功能内置于 URL 中。';

export const API_H1_ZH = '可以粘贴到任何地方的移动代理 API';

export const API_INTRO_ZH =
  '无需安装客户端库，也无需学习专有的 REST 接口规范。ProxyMobile 使用所有 HTTP 客户端都已支持的标准代理协议，接入只需设置一个环境变量。国家、IP 池和轮换方式都编码在代理用户名中，这意味着改变行为只需修改一个字符串，而不必重写代码。';

/** Why this shape of API suits AI-assisted / "vibe coded" projects. */
export const VIBE_POINTS_ZH = [
  {
    heading: '模型没有可以"幻觉"的东西',
    body: '编程助手早就知道如何在 requests、axios、httpx、Playwright 和 Puppeteer 中设置代理——十多年来，这一直写在每个框架的文档里。让它"把请求改为走我的代理"，第一次就能得到可用的代码，因为不存在任何 ProxyMobile 专属的 SDK 接口需要模型去猜测。',
  },
  {
    heading: '一个环境变量就是全部接入工作',
    body: '把 PROXY_URL 放进 .env，然后传给 HTTP 客户端接受代理参数的地方。改动就这么多。您构建请求、重试和解析数据的逻辑完全不需要知道代理的存在，因此可以在正常运行的项目中随时添加或移除代理，而不必触碰那些好不容易才调通的部分。',
  },
  {
    heading: '改变国家或轮换方式，无需改代码',
    body: '用户名承载着路由信息：把 -us- 换成 -de- 即可切换国家，把 -rot-sticky 换成 -rot-auto10 即可每 10 分钟轮换一次。在 Vibe Coding 项目中这一点尤为重要——您可以通过配置项或环境变量调整行为，而不必让模型去重构一个本来能正常运行的文件。',
  },
  {
    heading: '出错信息一目了然',
    body: '因为它就是一个普通代理，密钥错误就返回 407，目标网站拦截就返回该网站本身的响应。您可以用熟悉的工具和错误信息排查问题，而不必去解读某个厂商专有的错误格式。',
  },
];

/** Copy-paste snippets. This is marketing copy, so it names the brand host
 *  (GATEWAY_DISPLAY_HOST) rather than the routing host — see src/lib/gateway.ts.
 *  USERNAME and PAK_KEY stay as placeholders, so nothing here runs as-is; the
 *  real host a customer connects to is the one shown in /dashboard/keys. */
export const CODE_SAMPLES_ZH = [
  {
    label: 'curl',
    lang: 'bash',
    code: `export PROXY_URL="http://USERNAME-mbl-us-rot-sticky:PAK_KEY@${GATEWAY_DISPLAY_HOST}:${GATEWAY_HTTP_PORT}"

curl -x "$PROXY_URL" https://api.ipify.org?format=json`,
  },
  {
    label: 'Python',
    lang: 'python',
    code: `import os, requests

proxy = os.environ["PROXY_URL"]

r = requests.get(
    "https://api.ipify.org?format=json",
    proxies={"http": proxy, "https": proxy},
    timeout=30,
)
print(r.json())`,
  },
  {
    label: 'Node.js',
    lang: 'javascript',
    code: `import { HttpsProxyAgent } from 'https-proxy-agent';

const agent = new HttpsProxyAgent(process.env.PROXY_URL);

const res = await fetch('https://api.ipify.org?format=json', { agent });
console.log(await res.json());`,
  },
  {
    label: 'Playwright',
    lang: 'javascript',
    code: `import { chromium } from 'playwright';

const url = new URL(process.env.PROXY_URL);

const browser = await chromium.launch({
  proxy: {
    server: \`http://\${url.host}\`,
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  },
});`,
  },
];

/** The prompt a vibe coder can hand to their assistant verbatim. */
export const ASSISTANT_PROMPT_ZH = `把本项目中所有对外的 HTTP 请求，都改为通过环境变量 PROXY_URL 中的代理发送。
这是一个标准的 HTTP 代理，凭证包含在 URL 中。不要安装任何厂商 SDK——
使用我所用 HTTP 客户端自带的代理选项。请复用同一个共享的客户端/agent，
不要为每个请求单独创建。`;

export const URL_PARTS_ZH = [
  { part: 'pool', values: 'mbl · peer', meaning: 'mbl 是真实的 4G/5G 移动调制解调器；peer 是住宅安卓设备 IP 池。' },
  // Derived from config so the documented codes can never drift from the ones
  // we actually offer.
  { part: 'country', values: config.countries.join(', '), meaning: '出口 IP 所在国家的两位字母代码。' },
  { part: 'sid', values: '任意 [a-z0-9_] 字符串', meaning: '会话 ID。使用相同的 sid 重新连接，会回到同一台设备。' },
  { part: 'rot', values: 'sticky · auto10 · auto30 · hard · none', meaning: '出口 IP 的更换频率，详见下表。' },
  { part: 'port', values: `${GATEWAY_HTTP_PORT} · ${GATEWAY_SOCKS5_PORT}`, meaning: `${GATEWAY_HTTP_PORT} 用于 HTTP/HTTPS，${GATEWAY_SOCKS5_PORT} 用于 SOCKS5。` },
];

export const ROTATION_MODES_ZH = [
  { mode: 'sticky', body: '在整个会话中保持同一台设备。配合 -sid- 使用，可在重新连接后仍保持同一台设备，稳定性以运营商允许的程度为准。' },
  { mode: 'auto10', body: '大约每 10 分钟轮换一次。长时间运行的爬虫的常用选择。' },
  { mode: 'auto30', body: '以更长的间隔轮换，适合希望 IP 更替更慢的任务。' },
  { mode: 'hard', body: '严格绑定设备，与 sticky 类似。' },
  { mode: 'none', body: '网关默认行为，不设置轮换参数。' },
];

/**
 * Ordered deliberately. Ad verification, pricing, SERP and developer
 * automation lead; we do not advertise multi-account social automation as a
 * headline use case, because that traffic converts into chargebacks and
 * compliance load rather than revenue. See src/lib/use-cases.ts.
 */
export const USE_CASES_ZH = [
  {
    heading: '广告验证',
    body: '在您购买广告位的国家，检查广告活动在真实运营商的真实用户那里是否正确呈现。移动 IP 在这里至关重要，因为广告服务器会区别对待机房流量——常常返回不同的素材，甚至什么都不返回。',
  },
  {
    heading: '价格与电商平台监控',
    body: '跨地区追踪竞争对手的价格、库存和运费估算。零售网站高度本地化且限流严格，固定 IP 只会拿到过期价格或拦截页面，而轮换的移动 IP 池能让您获得稳定一致的数据。',
  },
  {
    heading: 'SERP 与排名追踪',
    body: '搜索结果因国家、运营商和设备类型而异。通过您关注的市场中的移动 IP 进行查询，得到的就是该市场真实用户看到的排名，而不是机房环境下的近似结果。',
  },
  {
    heading: 'AI 智能体与浏览器自动化',
    body: '会浏览网页的智能体——研究型爬虫、购物机器人、QA 测试程序——从云服务器 IP 出发很快就会撞上反爬虫墙，因为整个机房 IP 段都是已知的。在 Playwright 或 Puppeteer 中把智能体的浏览器指向移动代理只需改一行代码，就能消除一整类失败。',
  },
  {
    heading: '网页爬取与数据采集',
    body: '在按您设定的节奏轮换的运营商 IP 上，长时间爬取更稳定。设置 auto10，运行任务，只为实际传输的流量付费，而不是按请求次数加价。',
  },
  {
    heading: 'QA 与地理测试',
    body: '在目标市场内部测试您自己的应用或结账流程的本地化版本——币种、语言、税费、运费规则、地区限定内容——而不是去猜测当地用户会看到什么。',
  },
  {
    heading: '市场与评价研究',
    body: '跨地区汇总商品信息、用户评价和库存情况用于研究，避免您办公室的 IP 影响返回的结果。',
  },
];

export const API_FAQS_ZH = [
  {
    q: '使用移动代理 API 需要安装 SDK 吗？',
    a: '不需要。ProxyMobile 是标准的 HTTP 和 SOCKS5 代理，任何支持代理的 HTTP 客户端、浏览器自动化框架或爬虫库都能直接使用。设置一个代理 URL 就完成了。',
  },
  {
    q: '如何配合 AI 编程助手使用？',
    a: '告诉您的助手：使用 HTTP 客户端自带的代理选项，通过 PROXY_URL 环境变量中的代理发送请求，并且不要安装任何厂商 SDK。由于代理支持是所有主流库的标准功能，生成的代码无需任何 ProxyMobile 专属知识即可运行。',
  },
  {
    q: '如何切换国家或轮换方式？',
    a: '两者都编码在代理用户名中。替换两位字母的国家参数即可切换国家，修改 -rot- 参数即可在粘性会话和定时轮换之间切换。代码无需改动——只需改 URL 字符串。',
  },
  {
    q: 'mbl 和 peer 两个 IP 池有什么区别？',
    a: 'mbl 池是真实的 4G/5G 运营商调制解调器。peer 池是住宅安卓设备 IP 池。您通过用户名中的第一个参数选择使用哪一个，两者的每 GB 价格相同。',
  },
  {
    q: '支持 Playwright、Puppeteer 和 Selenium 吗？',
    a: '支持。三者都可以在启动时传入带凭证的代理服务器，这正是连接 URL 所提供的。浏览器自动化是我们客户使用 IP 池最常见的方式之一。',
  },
  {
    q: 'API 用量如何计费？',
    a: '按流量 GB 计费，从 $7/GB 起，用量越大越便宜，最低 $5/GB。不按请求收费，没有月度订阅，API 调用本身也不收费——您充值余额，所用带宽从余额中扣除。',
  },
  {
    q: '可以在多个请求之间保持同一个 IP 吗？',
    a: '可以。添加 -sid- 参数（标识符可自定义），并使用 sticky 轮换模式。使用相同的 sid 重新连接会回到同一台设备，因此登录会话可以跨请求、跨重启保持。',
  },
  {
    q: '有免费试用吗？',
    a: '首次充值会额外赠送 $2 免费额度，足以在充值更多之前，用您自己的目标网站充分测试 IP 池。',
  },
];

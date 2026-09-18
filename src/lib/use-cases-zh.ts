// 简体中文版 — generated from src/lib/use-cases.ts for the /zh SEO pages.
// Same structure and slugs; only prose is translated. Code samples are unchanged.
// Keep in sync when the English file changes.
/**
 * Content for the intent-based SEO landing pages at /{slug}.
 *
 * These target buying intent ("mobile proxies for price monitoring") rather
 * than geography, which the /mobile-proxies/[country] pages already cover.
 * Each entry carries its own problem statement, runnable code, rotation
 * guidance and bandwidth maths — deliberately not a template with the use case
 * swapped in, because near-duplicate pages get filtered rather than ranked.
 *
 * Positioning rule: these pages lead with ad verification, regional QA,
 * pricing data and developer automation. Multi-account social automation is
 * not a headline use case anywhere in here — it drives chargebacks and
 * compliance load, and it attracts the traffic we least want to convert.
 *
 * Every code sample must actually run against the pool as written, given a
 * real PROXY_URL. If you change how the gateway behaves, change these too.
 */

import { GATEWAY_DISPLAY_HOST, GATEWAY_HTTP_PORT } from '@/lib/gateway';

export interface UseCaseCode {
  label: string;
  lang: string;
  code: string;
  /** One line under the block explaining what to look at. */
  note?: string;
}

export interface UseCaseFaq {
  q: string;
  a: string;
}

/** One row of the "what a gigabyte actually buys you" table. */
export interface BandwidthRow {
  workload: string;
  perUnit: string;
  perGb: string;
}

export interface RotationAlternative {
  mode: string;
  when: string;
}

export interface UseCaseCountry {
  /** Slug into COUNTRIES, so the page can link to the country page. */
  slug: string;
  why: string;
}

export interface UseCasePage {
  slug: string;
  /** Groups the cross-links: buyer-intent pages vs developer-stack pages. */
  group: 'use-case' | 'stack';
  /** Short label for cross-link lists and breadcrumbs. */
  label: string;
  title: string;
  description: string;
  h1: string;
  badge: string;
  intro: string;
  keywords: string[];
  problem: {
    heading: string;
    body: string;
    /** Concrete symptoms a buyer will recognise from their own logs. */
    symptoms: string[];
  };
  code: UseCaseCode[];
  rotation: {
    mode: string;
    /** The literal username token, e.g. "-rot-auto10". */
    token: string;
    why: string;
    alternatives: RotationAlternative[];
  };
  bandwidth: {
    lead: string;
    rows: BandwidthRow[];
    tip: string;
  };
  countries: UseCaseCountry[];
  /** Page-specific acceptable-use bullets, shown under the shared notice. */
  legitimate: string[];
  faqs: UseCaseFaq[];
  /** Slugs of related pages, for internal linking. */
  related: string[];
}

/** Shown on every intent page, above the page-specific bullets. */
export const LEGITIMATE_USE_NOTICE_ZH = {
  heading: '仅限合法用途',
  body:
    'ProxyMobile 仅用于在您拥有或已获授权测试的系统上进行测量、质量保证和研究。购买带宽并不代表您获得了访问第三方系统的许可。您仍需自行遵守每个目标网站的服务条款、robots 指令和速率限制，以及适用于您的数据保护法律。',
  /** Applies to every page; the per-page list adds to this. */
  universal: [
    '禁止撞库、盗用账户，或任何冒充他人进行身份验证的行为。',
    '禁止绕过您未获授权测试的访问控制、付费墙或安全措施。',
    '禁止收集您没有合法依据处理的个人数据。',
    '禁止产生合理运营方会视为拒绝服务攻击的负载——请限速，遇到 429 时退避，并遵守 Retry-After。',
  ],
  footer:
    '用于欺诈、入侵或批量滥用的账户将被终止且不予退款，我们会配合有效的法律程序。',
} as const;

/** The one-liner that puts a working URL in the environment. */
function proxyUrlExport(pool: string, country: string, rot: string, sid?: string) {
  const tokens = ['USERNAME', pool, country];
  if (sid) tokens.push('sid', sid);
  tokens.push('rot', rot);
  return `export PROXY_URL="http://${tokens.join('-')}:PAK_KEY@${GATEWAY_DISPLAY_HOST}:${GATEWAY_HTTP_PORT}"`;
}

export const USE_CASE_PAGES_ZH: UseCasePage[] = [
  // ───────────────────────────────────────────── ad verification
  {
    slug: 'mobile-proxies-for-ad-verification',
    group: 'use-case',
    label: '广告验证',
    title: '广告验证移动代理 — 看到真实用户看到的广告素材 | ProxyMobile',
    description:
      '通过真实 4G/5G 运营商 IP 验证广告投放、地理定向和素材渲染。提供可运行的 Playwright 与 Python 示例、轮换建议和带宽测算。按 GB 计费，低至 $5。',
    h1: '用于广告验证的移动代理',
    badge: '广告验证 · 真实运营商 IP',
    intro:
      '广告服务器并不会一视同仁地对待所有流量。来自云服务器 IP 的请求，常常会收到自家推广广告、空白广告位，或与付费用户看到的不同的素材——这意味着从您自己的基础设施发起的验证，测量的根本不是真实情况。从您购买广告库存的市场中的真实运营商 IP 发起检查，才能看到真实用户实际看到的投放结果。',
    keywords: [
      '广告验证移动代理',
      '广告验证代理',
      '广告欺诈检测代理',
      '广告素材验证代理',
      '地理定向验证代理',
      '4G代理 广告验证',
    ],
    problem: {
      heading: '问题所在：您的验证流量正在被识别',
      body:
        '程序化广告供应链在决定返回什么内容之前，会先对请求 IP 进行指纹识别。机房 IP 段是公开的，并被广泛列为无效流量，因此广告交易平台要么不出价，要么返回默认广告，要么悄悄降级返回的内容。结果就是：验证系统报告"素材未渲染"，而这些广告位对真实用户明明显示正常；与此同时，发布商确实替换了素材的情况却被漏掉。这两种错误在报告中都无法察觉——看起来都像正常数据。',
      symptoms: [
        'DSP 报告的投放情况，您自己的爬虫无法复现。',
        '客户投诉广告投放位置错误，您在办公室却无法复现。',
        '地理定向广告在您检查时似乎投放到了错误的国家，而且只在您检查时才这样。',
        '每次脚本访问都是空白广告位或自家推广广告，而用手机访问却显示正确素材。',
        '怀疑存在域名欺骗或素材替换时，拿不出任何证据。',
      ],
    },
    code: [
      {
        label: '设置连接 URL',
        lang: 'bash',
        code: `${proxyUrlExport('mbl', 'us', 'auto10', 'check01')}

# 从控制台复制您的完整 URL——USERNAME 和 PAK_KEY 是您自己的。
# -sid- 参数决定使用哪台设备；每次检查换一个值（见下方轮换说明）。`,
      },
      {
        label: 'Playwright — 渲染广告位并截图留证',
        lang: 'javascript',
        code: `import { chromium } from 'playwright';

const url = new URL(process.env.PROXY_URL);

const browser = await chromium.launch({
  proxy: {
    server: \`http://\${url.host}\`,
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  },
});

const page = await browser.newPage({
  viewport: { width: 390, height: 844 },   // iPhone 级别的视口
  isMobile: true,
  deviceScaleFactor: 3,
});

// 记录页面发出的每个广告请求，作为实际投放内容的证据。
const adCalls = [];
page.on('request', (r) => {
  if (/doubleclick|googlesyndication|adnxs|criteo|rubiconproject/.test(r.url())) {
    adCalls.push({ url: r.url(), type: r.resourceType() });
  }
});

await page.goto('https://publisher.example/article', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'placement.png', fullPage: false });

console.log(\`exit IP served \${adCalls.length} ad calls\`);
console.table(adCalls.slice(0, 10));

await browser.close();`,
        note: '截图是您的证据；adCalls 则记录了实际出价的广告交易平台，可作为审计依据。',
      },
      {
        label: 'Python — 在信任结果之前先确认出口 IP',
        lang: 'python',
        code: `import os, requests

proxy = os.environ["PROXY_URL"]
proxies = {"http": proxy, "https": proxy}

# 每次批量验证前都要先断言地理位置。从错误国家跑出的结果
# 比不跑更糟——它看起来就像投放失败。
who = requests.get("https://ipinfo.io/json", proxies=proxies, timeout=30).json()
assert who["country"] == "US", f"expected US exit, got {who['country']}"
print(f"verifying from {who['city']}, {who['org']}")`,
        note: '成本极低，却能把一整类悄无声息的漏报变成明确的断言失败。',
      },
    ],
    rotation: {
      mode: 'auto10',
      token: '-rot-auto10',
      why:
        '广告服务器会按用户做频次控制。来自同一 IP 的第二、第三次展示请求，会被刻意返回与第一次不同的结果，因此对单一出口做密集循环，测到的只是频次上限，而不是广告活动本身。auto10 大约每 10 分钟为您切换一个新的运营商 IP，与真实的检查节奏相符。如果需要在短时间内模拟大量不同的访客，请为每次检查设置独立的 -sid- 值：使用不同的会话 ID 重新连接会分配到不同的设备，这样连续的检查就不会由同一部手机应答。',
      alternatives: [
        { mode: 'sticky', when: '需要完成多步骤的落地页转化流程——点击、填写表单、触发转化像素——且不能在中途更换 IP 而破坏归因。' },
        { mode: 'auto30', when: '长时间无人值守的监控，较慢的 IP 更替已经足够，且不希望消耗大量不同 IP。' },
        { mode: 'none', when: '在此场景下很少用到。不设置轮换参数会沿用网关默认行为，导致采样模式难以分析。' },
      ],
    },
    bandwidth: {
      lead:
        '广告验证是我们所有业务中最耗带宽的场景，因为关键就在于像浏览器一样完整渲染页面——包括素材、跟踪器、视频等一切内容。请按完整页面加载来估算预算，而不是只算 HTML。',
      rows: [
        { workload: '含展示广告位的文章页，完整渲染', perUnit: '2–4 MB', perGb: '约 260–520 次检查' },
        { workload: '含自动播放视频素材的页面', perUnit: '8–20 MB', perGb: '约 50–130 次检查' },
        { workload: '屏蔽图片和字体后渲染', perUnit: '400–800 KB', perGb: '约 1,300–2,600 次检查' },
        { workload: '仅断言出口 IP（不渲染）', perUnit: '约 2 KB', perGb: '几乎不消耗流量' },
      ],
      tip:
        '如果您只需证明投放了哪个素材，而不关心其显示效果，可以通过路由拦截屏蔽图片、媒体和字体，只对真正出问题的广告位保留截图步骤。这通常能让一次验证的流量减少 70–80%，且不损失任何证据价值。以上数据是基于典型广告支持型页面的实测估算，您的目标网站会有所不同，请先小规模计量，再确定月度预算。',
    },
    countries: [
      { slug: 'usa', why: '程序化广告最成熟的市场，也是机房 IP 过滤最严格的市场——用美国运营商 IP 做验证，最能看出云端与移动端投放结果之间的差距。' },
      { slug: 'uk', why: '品牌安全审核严格的广告库存；当客户需要证明某个广告位满足地域与相邻内容要求时尤其有用。' },
      { slug: 'germany', why: '基于用户同意的投放机制意味着您看到的素材取决于 CMP 流程，而该流程对看起来像自动化的流量会有不同表现。' },
      { slug: 'france', why: '本地发布商生态强大，拥有自己的广告交易平台，基于云端的检查很难覆盖。' },
      { slug: 'spain', why: '区域投放拆分的常见目标，广告主需要证明实际投放的是西班牙版素材，而不是拉美版。' },
    ],
    legitimate: [
      '只验证您自己在投放的广告活动，或客户委托您审计的活动——不得验证竞争对手的非公开投放。',
      '不要点击、转化或以其他方式与您仅在验证的广告互动。无论出于何种动机，产生非预期的计费事件都属于广告欺诈。',
      '验证量应与广告活动规模相称。明显扭曲发布商展示量统计的检查频率，是在把成本转嫁给他人。',
    ],
    faqs: [
      {
        q: '为什么不直接用机房代理做广告验证？',
        a: '因为广告交易平台能识别出来。机房 IP 段是公开的，并被普遍归类为无效流量，许多竞价方根本不会向其投放真实素材。您得到的是一个技术上成功、内容却错误的请求——这是代价最高的一种测量误差。',
      },
      {
        q: '发生争议时，我能证明投放了哪个素材吗？',
        a: '可以——像 Playwright 示例那样，同时保存截图和页面发出的广告网络请求列表。截图展示渲染效果；请求日志则显示实际响应的交易平台和素材 ID，这部分在与发布商沟通时最具说服力。',
      },
      {
        q: '1 GB 流量能做多少次检查？',
        a: '在典型的广告支持型文章页上，大约可完成 260 到 520 次完整渲染；如果屏蔽图片和字体，则可达 1,300 到 2,600 次。视频素材的流量消耗要大得多。建议先对自己的目标做小规模计量，再确定月度预算。',
      },
      {
        q: '应该使用哪种轮换模式？',
        a: '先从 auto10 开始，并为每次检查设置独立的 -sid- 参数。频次控制意味着来自同一 IP 的重复请求会被有意返回不同结果，因此只从一个粘性会话中采样会低估实际投放量。',
      },
      {
        q: '可以试用吗？',
        a: '首次充值会额外赠送 $2，足够在投入更大预算之前，对您自己的广告位进行一次真实的验证测试。',
      },
    ],
    related: ['mobile-proxies-for-geo-testing', 'mobile-proxies-for-serp-tracking', 'playwright-mobile-proxy'],
  },

  // ───────────────────────────────────────────── price monitoring
  {
    slug: 'mobile-proxies-for-price-monitoring',
    group: 'use-case',
    label: '价格监控',
    title: '价格监控移动代理 — 获取准确的区域价格数据 | ProxyMobile',
    description:
      '采集竞争对手的价格、库存和运费数据，不再遇到过期数据或拦截页面。真实 4G/5G 运营商 IP，提供可运行的 Python 示例、轮换与带宽建议。低至 $5/GB。',
    h1: '用于价格监控的移动代理',
    badge: '价格数据 · 11 个国家',
    intro:
      '零售、旅游和电商平台的本地化非常激进：您看到的价格、币种、库存状态和配送时效，都取决于请求看起来来自哪里。同时，这些网站的限流也很严格。两者叠加意味着：依赖单一固定 IP 的调价系统会悄无声息地出错——而一个按时送达的错误价格，看起来和正确价格一模一样。',
    keywords: [
      '价格监控移动代理',
      '价格爬取代理',
      '竞品价格追踪代理',
      '电商数据采集移动代理',
      '零售价格监控代理',
      '动态定价数据代理',
    ],
    problem: {
      heading: '问题所在：悄无声息的过期数据，而不是明显的报错',
      body:
        '真正让您亏钱的不是 403——403 是看得见的。真正的问题是那些返回 200、内容却是缓存价、默认地区价或未登录价的页面，因为网站判断您的 IP 不是真实买家。解析器运行正常，仪表盘一片绿，而您的调价引擎却在依据一个任何顾客都不会看到的数字做决策。运营商 IP 会被当作真实买家对待，因为它们本来就像买家——这正是此类业务转向移动代理池的根本原因。',
      symptoms: [
        '竞争对手的价格几周都没变，而他们的网站上却每天都在变动。',
        '您追踪的市场出现了错误的币种或错误的增值税处理。',
        '到处都显示"缺货"，因为库存查询按地区划分，而您的出口不在该地区。',
        '爬取时间越长，验证码和拦截页出现得越频繁。',
        '运费估算始终不显示，因为它依赖一个可信的邮政地理位置。',
      ],
    },
    code: [
      {
        label: '设置连接 URL',
        lang: 'bash',
        code: `${proxyUrlExport('mbl', 'de', 'auto10')}

# 替换国家参数（de -> fr、es、gb ……）即可切换市场。
# 代码的其他部分无需任何改动。`,
      },
      {
        label: 'Python — 一个礼貌且稳健的价格采集器',
        lang: 'python',
        code: `import os, time, random
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

PROXY = os.environ["PROXY_URL"]

session = requests.Session()
session.proxies = {"http": PROXY, "https": PROXY}
session.headers["User-Agent"] = (
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36"
)

# 遇到 429/5xx 时退避并遵守 Retry-After，不要反复猛冲。
retry = Retry(
    total=4,
    backoff_factor=1.5,
    status_forcelist=(429, 500, 502, 503, 504),
    respect_retry_after_header=True,
    allowed_methods=frozenset(["GET"]),
)
session.mount("https://", HTTPAdapter(max_retries=retry, pool_maxsize=20))

def fetch_price(url: str) -> str:
    r = session.get(url, timeout=30)
    r.raise_for_status()
    # 防范静默过期问题：如果页面返回的
    # 不是预期币种，就视为未命中，而不是一个价格。
    if "€" not in r.text:
        raise ValueError(f"unexpected currency for DE exit: {url}")
    return r.text

for url in ["https://shop.example/p/1", "https://shop.example/p/2"]:
    html = fetch_price(url)
    print(len(html), url)
    time.sleep(random.uniform(1.5, 4.0))   # 控制请求节奏`,
        note: '币种断言是最关键的一行。它把代价高昂的静默失败变成了可见的失败。',
      },
      {
        label: 'Python — 需要购物车的会话级检查',
        lang: 'python',
        code: `# 运费和税费通常要在商品加入购物车后才会显示，
# 因此整个流程必须在同一个 IP 上完成。请使用粘性会话：
#   ...-mbl-de-sid-basket01-rot-sticky:PAK_KEY@...
import os, requests

s = requests.Session()
s.proxies = {"http": os.environ["PROXY_URL"], "https": os.environ["PROXY_URL"]}

s.post("https://shop.example/cart/add", data={"sku": "ABC", "qty": 1}, timeout=30)
quote = s.get("https://shop.example/cart/shipping", timeout=30).json()
print(quote["currency"], quote["total"], quote["eta_days"])`,
        note: '每个并发购物车对应一个 -sid-。两个 worker 复用同一个 sid 会让它们共用同一个购物车。',
      },
    ],
    rotation: {
      mode: 'auto10',
      token: '-rot-auto10',
      why:
        '商品目录遍历是典型的轮换场景：大量相互独立的读取，彼此之间无需保持状态，而且您也不想耗尽单个 IP 的请求额度。auto10 大约每 10 分钟为您分配一个新的运营商 IP，无需任何编排即可把长时间的爬取分散到大量出口上。请配合真实的请求节奏——每次请求之间随机间隔一两秒——因为轮换带来的是余量，而不是全速爬取的许可。',
      alternatives: [
        { mode: 'sticky', when: '任何跨多个请求的操作：加入购物车以查看运费、登录后的批发价、多步骤结账报价。每个并发 worker 使用一个 -sid-。' },
        { mode: 'auto30', when: '低频监控——每天或每小时遍历几百个 SKU——较慢的 IP 更替已绰绰有余。' },
        { mode: 'hard', when: '需要在长时间会话中固定设备，并希望获得 IP 池所能提供的最严格保证。' },
      ],
    },
    bandwidth: {
      lead:
        '只抓取 HTML 时，价格监控成本很低；需要渲染时则成本高昂。影响账单最大的因素就是是否使用浏览器——而对大多数零售网站来说，您并不需要。',
      rows: [
        { workload: '商品页，仅 HTML（requests/httpx）', perUnit: '150–400 KB', perGb: '约 2,600–7,000 页' },
        { workload: '分类/列表页，仅 HTML', perUnit: '300–700 KB', perGb: '约 1,500–3,500 页' },
        { workload: '内部价格 JSON/GraphQL 接口', perUnit: '5–40 KB', perGb: '约 26,000–200,000 次调用' },
        { workload: '对 JS 密集型商品详情页做完整浏览器渲染', perUnit: '2–5 MB', perGb: '约 200–520 页' },
      ],
      tip:
        '在动手写基于浏览器的爬虫之前，先打开开发者工具的网络面板，找到页面本身用于获取价格和库存的 JSON 接口。大多数现代电商网站都有这样的接口，直接调用它，每次读取的成本比渲染整个页面低 50 到 200 倍。以上数据为真实零售网站的典型范围——请先对自己的目标计量，再确定月度预算。',
    },
    countries: [
      { slug: 'germany', why: '欧洲最大的电商市场，价格展示含增值税，与美国商品页在结构上有所不同。' },
      { slug: 'uk', why: '脱欧后的关税与运输规则，使得同一 SKU 在英国的报价与欧盟不同。' },
      { slug: 'france', why: '本地电商平台和比价规则，从非法国出口无法看到。' },
      { slug: 'usa', why: '各州的税费和运费不同，大型零售网站的反爬虫机制也最为严格。' },
      { slug: 'spain', why: '定价和促销日历与欧盟其他地区明显不同。' },
      { slug: 'poland', why: '快速增长的电商市场，本地强势平台会只向波兰流量展示真实价格。' },
      { slug: 'netherlands', why: '市场虽小，跨境流动却很频繁——适合发现竞争对手对荷兰和德国采取了不同定价。' },
    ],
    legitimate: [
      '只采集公开展示的价格。不要登录您没有账户的批发或贸易门户。',
      '遵守目标网站的 robots 指令和任何公开的爬取速率指引。',
      '积极使用缓存，只重新抓取真正发生变化的内容。每晚重新爬取静态目录，您要付费，别人要承担负载。',
      '商品页附带的个人数据——卖家姓名、评论者身份——不属于价格监控的范围，不要顺带采集。',
    ],
    faqs: [
      {
        q: '为什么用机房代理会拿到过期或错误地区的价格？',
        a: '因为网站会在渲染前对 IP 进行地理定位和分类。云服务器 IP 段通常会收到缓存的默认地区页面、未登录价格，或仍返回 HTTP 200 的软拦截。解析器无法分辨，所以问题表现为数据错误，而不是报错。',
      },
      {
        q: '应该用浏览器还是普通 HTTP 请求？',
        a: '只要数据在 HTML 里，或在页面调用的 JSON 接口中，就用普通请求——每次读取大约便宜 10 到 200 倍。只有当价格确实需要客户端执行 JS 才能显示时，才使用浏览器。',
      },
      {
        q: '运费只在结账时才显示，怎么追踪？',
        a: '使用粘性会话，让整个购物车流程都走同一个 IP。在用户名中加入每个 worker 独立的 -sid- 和 -rot-sticky，然后在该会话上执行加购和运费报价步骤。',
      },
      {
        q: '遍历一次商品目录需要多少带宽？',
        a: '仅抓取 HTML 商品页时，每 GB 大约可抓取 2,600 到 7,000 页。如果网站提供价格 JSON 接口，同样 1 GB 往往能完成数万次读取。',
      },
      {
        q: '监控竞争对手的价格合法吗？',
        a: '在大多数司法辖区，采集公开展示的价格是常见的商业行为，但具体情况取决于您所在地区、目标网站的条款以及您使用数据的方式。我们要求您遵守每个目标的条款及适用法律；我们无法就您的具体方案提供法律建议。',
      },
    ],
    related: ['mobile-proxies-for-serp-tracking', 'mobile-proxies-for-geo-testing', 'python-mobile-proxy'],
  },

  // ───────────────────────────────────────────── geo testing
  {
    slug: 'mobile-proxies-for-geo-testing',
    group: 'use-case',
    label: '地理测试与 QA',
    title: '地理测试移动代理 — 在目标市场内测试本地化版本 | ProxyMobile',
    description:
      '通过目标国家的真实运营商 IP 测试本地化、币种、税费、同意横幅和地区限定内容。提供 Playwright 示例、粘性会话建议和带宽测算。低至 $5/GB。',
    h1: '用于地理测试和区域 QA 的移动代理',
    badge: '区域 QA · 粘性会话',
    intro:
      '您的本地化版本，本质上是一组关于其他国家用户会看到什么的假设：他们的币种、税费处理、语言、同意横幅、支付方式，以及 CDN 边缘节点。每一项都由请求看起来的来源决定，因此唯一可靠的测试方法，就是从目标市场内部发起请求。在这个场景中，移动代理与规避检测几乎无关，关键只是出现在正确的位置。',
    keywords: [
      '地理测试移动代理',
      '地理测试代理',
      '本地化测试代理',
      '地区限制内容测试',
      '区域QA移动代理',
      '从其他国家测试网站',
    ],
    problem: {
      heading: '问题所在：无法访问的市场就无法测试',
      body:
        '人们通常首先尝试消费级 VPN，但它会因一个特定原因失败：VPN 的出口 IP 段是公开的，并被广泛屏蔽，因此您想测试的地区限制功能往往直接拒绝 VPN。云服务器出口的失败方式则不同——它会被解析到与真实用户不同的 CDN 边缘节点和地理 IP 分类，结果您测试的是任何真实顾客都不会走到的代码路径。而目标国家的运营商 IP，在应用看来就是一个普通用户，这正是 QA 环境应有的样子。',
      symptoms: [
        '币种或税费 bug 只在顾客那里出现，QA 始终无法复现。',
        '同意横幅在生产环境中的表现与测试时不一致。',
        '地区限定内容或商店版本您根本看不到，无法验收。',
        '某个地区的 CDN 边缘节点返回了过期资源，而总部完全察觉不到。',
        '支付方式因国家而异，发布前无法验证。',
        '因为您不在对应国家，只能把工单以"无法复现"关闭。',
      ],
    },
    code: [
      {
        label: '设置连接 URL',
        lang: 'bash',
        code: `${proxyUrlExport('mbl', 'fr', 'sticky', 'qa-fr-01')}

# 粘性会话 + 稳定的 -sid- 让整个测试会话固定在一台设备上，
# 国家就不会在结账流程中途发生变化。`,
      },
      {
        label: 'Playwright — 用断言验证本地化，而不是靠肉眼',
        lang: 'javascript',
        code: `import { chromium, devices } from 'playwright';
import { expect } from '@playwright/test';

const url = new URL(process.env.PROXY_URL);

const browser = await chromium.launch({
  proxy: {
    server: \`http://\${url.host}\`,
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  },
});

// 让 locale 和时区与出口国家保持一致，否则您测试的是
// 一个几乎没有真实用户会用的组合（法国 IP + en-US 浏览器）。
const context = await browser.newContext({
  ...devices['Pixel 7'],
  locale: 'fr-FR',
  timezoneId: 'Europe/Paris',
  geolocation: { latitude: 48.8566, longitude: 2.3522 },
  permissions: ['geolocation'],
});

const page = await context.newPage();
await page.goto('https://your-app.example/pricing');

await expect(page.getByTestId('price')).toContainText('€');
await expect(page.getByTestId('vat-note')).toContainText('TVA');
await expect(page.locator('#cmp-banner')).toBeVisible();   // GDPR 同意横幅

await page.screenshot({ path: 'fr-pricing.png', fullPage: true });
await browser.close();`,
        note: '同时设置 locale 和时区，才能模拟一个真实的法国用户，而不是一个用着美国浏览器的法国 IP。',
      },
      {
        label: '在所有市场运行同一套测试',
        lang: 'javascript',
        code: `// playwright.config.js — one project per market, same specs.
const markets = [
  { name: 'fr', country: 'fr', locale: 'fr-FR', tz: 'Europe/Paris' },
  { name: 'de', country: 'de', locale: 'de-DE', tz: 'Europe/Berlin' },
  { name: 'gb', country: 'gb', locale: 'en-GB', tz: 'Europe/London' },
  { name: 'us', country: 'us', locale: 'en-US', tz: 'America/New_York' },
];

const proxyFor = (country, sid) => {
  const u = new URL(process.env.PROXY_URL);
  // 只改写国家和 sid 参数，其余部分保持不变。
  const user = decodeURIComponent(u.username)
    .replace(/-(?:us|gb|de|fr|es|nl|pl|ch|pa|am|ge)-/, \`-\${country}-\`)
    .replace(/-sid-[a-z0-9_]+/, \`-sid-\${sid}\`);
  return {
    server: \`http://\${u.host}\`,
    username: user,
    password: decodeURIComponent(u.password),
  };
};

export default {
  projects: markets.map((m) => ({
    name: m.name,
    use: {
      proxy: proxyFor(m.country, \`qa-\${m.name}\`),
      locale: m.locale,
      timezoneId: m.tz,
    },
  })),
};`,
        note: '整个市场矩阵只是一次字符串替换。无需为每个国家搭建基础设施，也无需维护 VPN 配置。',
      },
    ],
    rotation: {
      mode: 'sticky',
      token: '-rot-sticky',
      why:
        '地理测试是本站所有场景中，唯一需要让 IP 保持不变的场景。测试会话是有状态的——cookie、同意选择、购物车、登录、支付流程——中途更换 IP 要么会让您被登出，要么更糟：在步骤之间悄悄重新判定您的国家，给出一个不对应任何真实用户旅程的结果。使用 -rot-sticky 和稳定的 -sid-（每个并发测试 worker 一个）固定会话，出口在整个测试期间都不会改变。',
      alternatives: [
        { mode: 'hard', when: '长时间运行的测试套件，希望获得 IP 池所能提供的最严格设备绑定。' },
        { mode: 'auto10', when: '仅适用于无状态的抽查——例如"这个 URL 从波兰访问能否正确跳转"——请求之间不需要保持任何状态。' },
        { mode: 'none', when: '不建议用于 QA。把轮换交给网关默认行为，会让失败的测试难以定位原因。' },
      ],
    },
    bandwidth: {
      lead:
        'QA 测试在真实浏览器中渲染真实页面，所以请按浏览器的流量来估算预算。好消息是，测试套件的绝对规模通常不大——您运行的是几十或几百条用户旅程，而不是数百万次抓取。',
      rows: [
        { workload: '单页加载，完整资源，无缓存', perUnit: '2–5 MB', perGb: '约 200–520 次加载' },
        { workload: '完整结账流程（5–8 步）', perUnit: '6–15 MB', perGb: '约 70–170 次流程' },
        { workload: '屏蔽图片/字体/媒体后的页面加载', perUnit: '300–700 KB', perGb: '约 1,500–3,500 次加载' },
        { workload: '跳转/响应头抽查（不渲染）', perUnit: '约 5 KB', perGb: '约 200,000 次检查' },
      ],
      tip:
        '在同一条用户旅程的多个断言之间复用一个浏览器上下文，而不是每个测试都重新启动——热缓存能省掉大部分重复的资源流量。另外，完整资源的测试套件可以定时运行，而每次提交触发的 CI 使用屏蔽资源的版本；大多数本地化断言针对的是文本和响应头，并不需要图片。以上范围基于典型的商业 Web 应用，请先对自己的测试套件计量，再做规划。',
    },
    countries: [
      { slug: 'germany', why: '欧盟最严格的同意横幅规则，且价格含增值税，常常让美国开发的结账流程出错。' },
      { slug: 'france', why: '语言、币种和法国增值税（TVA）的处理，以及只对法国流量显示的本地支付方式。' },
      { slug: 'uk', why: '脱欧后拥有独立于欧盟的关税、增值税和同意制度——一条需要单独验收的代码路径。' },
      { slug: 'usa', why: '各州不同的税费逻辑，以及大多数产品中数量最多的地区性内容规则。' },
      { slug: 'switzerland', why: '非欧盟、多语言且使用独立货币——总能暴露本地化层中写死的假设。' },
      { slug: 'poland', why: '本地支付方式，以及既非欧元也非美元的货币，是四舍五入和格式化 bug 的常见来源。' },
      { slug: 'netherlands', why: '英语普及率很高的市场，语言协商经常出错，向期望荷兰语的用户返回英文。' },
    ],
    legitimate: [
      '只测试您拥有的应用，或客户书面授权您测试的应用。',
      '地理测试用于验证您自己的区域化行为——不得用于在授权地区以外观看第三方按地区授权的媒体内容。',
      '不要让合成测试流量混入生产环境的分析数据，也不要下您不会履行的真实订单。',
      '如果测试涉及支付服务商，请使用其沙箱环境。用测试流量驱动真实支付通道是合规问题，与是否使用代理无关。',
    ],
    faqs: [
      {
        q: '为什么不用 VPN 做地理测试？',
        a: '消费级 VPN 的出口 IP 段是公开的，并被广泛屏蔽，因此您想测试的地区限制功能往往直接拒绝 VPN——您只能得知网站屏蔽了 VPN，却无法验证本地化是否正常。运营商 IP 看起来就是普通用户，所以应用会走正常的代码路径。',
      },
      {
        q: '测试套件应使用哪种轮换模式？',
        a: '粘性会话，并为每个 worker 设置稳定的 -sid-。测试流程是有状态的；中途更换 IP 可能导致会话登出，或在步骤之间重新判定国家，产生与您的构建完全无关的失败。',
      },
      {
        q: '可以在 CI 中运行吗？',
        a: '可以。它只是 Playwright、Puppeteer 或 Selenium 配置中的一项代理设置，因此在 CI 中与本地运行完全一样。请为每个并行 worker 设置独立的 -sid-，避免它们共用同一台设备。',
      },
      {
        q: '还需要设置 locale 和时区吗？',
        a: '应该设置。法国出口 IP 搭配 en-US 浏览器和纽约时区，几乎没有真实用户会是这种组合，它会触发与您想模拟的顾客不同的代码路径。请把三者一起设置。',
      },
      {
        q: '一套 QA 测试需要多少带宽？',
        a: '包含全部资源的完整结账流程大约消耗 6–15 MB，即每 GB 约 70–170 次流程。屏蔽图片和字体后可以多跑数倍，而且大多数本地化断言本来就只针对文本和响应头。',
      },
    ],
    related: ['mobile-proxies-for-ad-verification', 'playwright-mobile-proxy', 'puppeteer-mobile-proxy'],
  },

  // ───────────────────────────────────────────── SERP tracking
  {
    slug: 'mobile-proxies-for-serp-tracking',
    group: 'use-case',
    label: 'SERP 排名追踪',
    title: 'SERP 排名追踪移动代理 — 获取真实手机用户看到的排名 | ProxyMobile',
    description:
      '通过目标国家的真实 4G/5G 运营商 IP，在移动端索引上追踪搜索排名。提供 Python 示例、轮换建议、带宽测算和国家覆盖说明。按 GB 计费，低至 $5。',
    h1: '用于 SERP 与排名追踪的移动代理',
    badge: '排名追踪 · 移动端索引',
    intro:
      '搜索结果是根据国家、设备类型以及搜索引擎对客户端的推断，逐个请求组装出来的。从其他国家的云服务器 IP 测得的排名，并不是真实排名的"噪声版本"——它回答的根本是另一个问题。如果您要汇报某个本地市场的移动端排名，就必须从该市场的移动 IP 进行测量。',
    keywords: [
      'SERP排名追踪移动代理',
      '排名追踪代理',
      'SERP抓取代理',
      '谷歌排名查询代理',
      '移动端SERP追踪',
      '本地SEO排名追踪代理',
    ],
    problem: {
      heading: '问题所在：您测量的是一个没人看到的搜索结果页',
      body:
        '两种偏差会叠加。第一是地理位置：搜索引擎会高度本地化搜索结果，从错误的国家发起查询，得到的排名是目标市场中任何用户都不会看到的。第二是设备类型：移动端索引和桌面端索引确实不同，而大部分商业搜索流量来自移动端，因此按桌面端测得的排名，会误判真正带来收入的排名。此外，从机房 IP 段持续自动查询还会招来拦截页和验证码，让排名追踪工具变成验证码破解开销。',
      symptoms: [
        '报告的排名与客户在手机上看到的不一致。',
        '关键词越多，验证码和"异常流量"拦截页就越多。',
        '抓取结果中完全缺少本地商家（Local Pack）和地图结果。',
        '更换托管服务商后排名就发生变化——这说明您测量的是自己的基础设施，而不是搜索索引。',
        '桌面端与移动端报告的排名完全相同，而这几乎不可能是真的。',
      ],
    },
    code: [
      {
        label: '设置连接 URL',
        lang: 'bash',
        code: `${proxyUrlExport('mbl', 'gb', 'auto10', 'serp01')}

# 国家参数 = 您要汇报排名的市场。
# 不同 worker 使用不同的 -sid-，让查询分散到多台设备上。`,
      },
      {
        label: 'Python — 在移动端索引上按节奏查询排名',
        lang: 'python',
        code: `import os, time, random, urllib.parse
import requests

PROXY = os.environ["PROXY_URL"]

MOBILE_UA = (
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0 Mobile Safari/537.36"
)

def serp(query: str, gl: str = "gb", hl: str = "en") -> str:
    params = urllib.parse.urlencode({"q": query, "gl": gl, "hl": hl, "num": 20})
    r = requests.get(
        f"https://www.google.com/search?{params}",
        headers={"User-Agent": MOBILE_UA, "Accept-Language": f"{hl},en;q=0.8"},
        proxies={"http": PROXY, "https": PROXY},
        timeout=45,
    )
    # 拦截页不是排名结果。直接报错，不要去解析它。
    if r.status_code == 429 or "/sorry/" in r.url:
        raise RuntimeError("rate limited — slow down and let the IP rotate")
    r.raise_for_status()
    return r.text

for kw in ["mobile proxy", "4g proxy uk", "rotating proxy api"]:
    html = serp(kw)
    print(f"{len(html):>7} bytes  {kw}")
    time.sleep(random.uniform(8, 20))   # 接近真人的查询节奏`,
        note: '请求间隔不是摆设。查询速度比人打字还快的排名追踪工具，就是被限流的那个。',
      },
      {
        label: '把关键词集分散到多个会话',
        lang: 'python',
        code: `import os, re

def proxy_for_worker(worker_id: int) -> str:
    """Give each worker its own device by rewriting the -sid- token."""
    base = os.environ["PROXY_URL"]
    return re.sub(r"-sid-[a-z0-9_]+", f"-sid-serp{worker_id:02d}", base)

# 4 个 worker，4 台设备，各自独立控制节奏。
for w in range(4):
    print(proxy_for_worker(w))`,
        note: '不同的 sid 对应不同的设备，所以四个慢速 worker 胜过一个快速 worker。',
      },
    ],
    rotation: {
      mode: 'auto10',
      token: '-rot-auto10',
      why:
        '排名追踪需要大量相互独立的查询，且查询之间不保存任何状态，这正是定时轮换的用武之地。auto10 大约每 10 分钟为您分配一个新的运营商 IP，让长时间的关键词查询分散到多个出口，而不是集中在一个出口上。不过，轮换并不意味着可以加速：请在查询之间保持数秒的真实间隔，并把关键词集拆分到多个 -sid- 值上，让负载分摊到多台设备，而不是压在一台设备上。',
      alternatives: [
        { mode: 'auto30', when: '每天或每周追踪数量适中的关键词，较慢的 IP 更替已绰绰有余。' },
        { mode: 'sticky', when: '在此场景下很少用到。仅当您刻意测量某个固定客户端的搜索结果如何变化时才需要。' },
        { mode: 'hard', when: '不建议用于 SERP 追踪——固定一台设备会把所有查询量集中到单个 IP 上。' },
      ],
    },
    bandwidth: {
      lead:
        '只要抓取搜索结果的 HTML 而不渲染页面，SERP 追踪就是 IP 池上成本最低的场景之一。排名数据就在页面标记中。',
      rows: [
        { workload: '搜索结果页，仅 HTML', perUnit: '250–450 KB', perGb: '约 2,300–4,200 次查询' },
        { workload: '含本地商家/富媒体结果的搜索结果页', perUnit: '400–700 KB', perGb: '约 1,500–2,600 次查询' },
        { workload: '对搜索结果页做完整浏览器渲染', perUnit: '2–4 MB', perGb: '约 260–520 次查询' },
        { workload: '缓存结果重新验证（条件 GET）', perUnit: '约 1 KB', perGb: '几乎不消耗流量' },
      ],
      tip:
        '每天追踪 1,000 个关键词、仅抓取 HTML，每月大约消耗 8–13 GB——值得在投入前先测算一下，因为在这个量级上，它通常比按次计费的排名查询 API 更便宜。除非您确实会根据日内波动采取行动，否则按天追踪即可，不必按小时；大多数排名决策依据的是每周趋势，额外的查询频率只是在为噪声支付带宽。',
    },
    countries: [
      { slug: 'uk', why: '与美国不同的独立索引，有自己的本地商家展示规则；是美国以外大多数英语排名追踪的默认市场。' },
      { slug: 'usa', why: '规模最大、竞争最激烈的索引，也是对自动化查询管控最严的市场。' },
      { slug: 'germany', why: '本地语言搜索结果强势，同一搜索意图下的排名结果与英语结果几乎没有重叠。' },
      { slug: 'france', why: '拥有独立竞争格局的本地语言索引；从非法国出口获得的结果几乎没有参考价值。' },
      { slug: 'spain', why: '常与拉美市场针对同一批西班牙语关键词分开追踪。' },
      { slug: 'poland', why: '本地语言市场，与泛欧洲英语关键词相比，在本国境内测量更为重要。' },
      { slug: 'netherlands', why: '荷兰语与英语混合的搜索结果，使出口地理位置对排名结果的影响格外明显。' },
    ],
    legitimate: [
      '只追踪您拥有的网站，或客户委托您汇报的网站排名。',
      '遵守各搜索引擎的服务条款和访问频率要求——有些搜索引擎专门为此提供了 API，这往往才是合适的工具。',
      '把查询节奏控制在人类水平。购买带宽并不意味着您有权让服务对其他用户变慢。',
      '不要收集或存储搜索结果中偶然出现的个人数据。',
    ],
    faqs: [
      {
        q: '为什么排名追踪特别需要移动代理？',
        a: '因为移动端索引与桌面端不同，而大部分商业搜索流量来自移动端。从桌面形态的机房连接测得的排名，并不对应您真正的收入来源。',
      },
      {
        q: '这能彻底避免验证码吗？',
        a: '不能，任何声称可以的说法都值得怀疑。与机房 IP 相比，运营商 IP 能显著降低拦截页出现的频率，但查询速度明显快于人类，依然会被限流。请求节奏与 IP 同样重要。',
      },
      {
        q: '追踪 1,000 个关键词需要多少带宽？',
        a: '每天追踪一次、仅抓取 HTML，每月大约 8–13 GB。如果改为在浏览器中渲染每个搜索结果页，流量会增加约 8 倍——而排名数据本来就在页面标记里，所以几乎不值得这样做。',
      },
      {
        q: '应该使用哪种轮换模式？',
        a: '使用 auto10，并拆分到多个 -sid- 值上，让查询负载分摊到多台设备。粘性会话和硬绑定会把所有请求集中到一个 IP 上，这与大量关键词的需求恰恰相反。',
      },
      {
        q: '可以追踪本地商家和地图结果吗？',
        a: '依赖地理位置的结果，正是最需要本国出口的结果，因此目标市场的运营商 IP 在这里帮助最大。出现富媒体结果时，页面体积会稍大一些。',
      },
    ],
    related: ['mobile-proxies-for-price-monitoring', 'mobile-proxies-for-ad-verification', 'python-mobile-proxy'],
  },

  // ───────────────────────────────────────────── playwright
  {
    slug: 'playwright-mobile-proxy',
    group: 'stack',
    label: 'Playwright',
    title: 'Playwright 移动代理 — 配置、认证、轮换与带宽 | ProxyMobile',
    description:
      '在 Playwright 中使用 4G/5G 移动代理：启动级与上下文级代理认证、每个上下文一个会话、拦截请求以节省带宽，以及可直接用于 CI 的配置。低至 $5/GB。',
    h1: 'Playwright 移动代理配置指南',
    badge: 'Playwright · Chromium、Firefox、WebKit',
    intro:
      'Playwright 支持在启动时和每个浏览器上下文中设置代理，因此它是最容易接入移动代理池的自动化框架——前提是您知道凭证要放在 proxy 对象里，而不是写在服务器 URL 中。本页介绍真正可用的配置方式、如何把会话映射到上下文，以及如何避免浏览器任务悄悄耗掉大量带宽。',
    keywords: [
      'Playwright移动代理',
      'Playwright代理认证',
      'Playwright 4G代理',
      'Playwright轮换代理',
      'Playwright上下文代理',
      'Playwright爬虫代理',
    ],
    problem: {
      heading: '问题所在：云端浏览器会被拦截，代理认证又很繁琐',
      body:
        '会先后遇到两个问题。第一，从 CI 或云服务器运行的无头浏览器，仅凭 IP 就能被识别——整个 IP 段都是已知的——因此在您的选择器运行之前，反爬虫机制就已经介入，您花几天时间调整指纹，而问题根本不在指纹。第二，当您开始使用代理时，把凭证直接写进服务器 URL 这种直观做法是行不通的：Playwright 要求用户名和密码作为单独字段传入，格式错误时只会报一个毫无帮助的连接错误。',
      symptoms: [
        '同样的 URL，选择器在本地正常，在 CI 中却超时。',
        '添加代理后出现 net::ERR_TUNNEL_CONNECTION_FAILED，或在 goto() 处卡住。',
        '返回的是验证页、拦截页或空壳页面，而不是真实内容。',
        '因为所有资源都会加载，带宽费用随页面体积同步增长。',
        '并行 worker 共用同一个出口，彼此互相干扰。',
      ],
    },
    code: [
      {
        label: '设置连接 URL',
        lang: 'bash',
        code: `${proxyUrlExport('mbl', 'us', 'sticky', 'pw01')}

# 每个浏览器上下文一个 -sid-。并行 worker 需要使用不同的 sid。`,
      },
      {
        label: '启动级代理（正确的认证写法）',
        lang: 'javascript',
        code: `import { chromium } from 'playwright';

const url = new URL(process.env.PROXY_URL);

const browser = await chromium.launch({
  proxy: {
    // 这里只写主机和端口。凭证不要放在这个字符串里。
    server: \`http://\${url.host}\`,
    username: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
  },
});

const page = await browser.newPage();
await page.goto('https://api.ipify.org?format=json');
console.log(await page.textContent('body'));   // 您的运营商出口 IP

await browser.close();`,
        note: 'decodeURIComponent 很重要：用户名包含带连字符的参数，密钥可能经过百分号编码。',
      },
      {
        label: '上下文级代理 — 一个浏览器，多个会话',
        lang: 'javascript',
        code: `import { chromium } from 'playwright';

const base = new URL(process.env.PROXY_URL);

function proxyForSession(sid) {
  return {
    server: \`http://\${base.host}\`,
    username: decodeURIComponent(base.username).replace(/-sid-[a-z0-9_]+/, \`-sid-\${sid}\`),
    password: decodeURIComponent(base.password),
  };
}

// 只启动一次浏览器；通过各自的 sid 为每个上下文分配独立设备。
const browser = await chromium.launch();

const sids = ['job-a', 'job-b', 'job-c'];
const contexts = await Promise.all(
  sids.map((sid) => browser.newContext({ proxy: proxyForSession(sid) })),
);

for (const [i, ctx] of contexts.entries()) {
  const page = await ctx.newPage();
  await page.goto('https://api.ipify.org?format=json');
  console.log(sids[i], await page.textContent('body'));
}

await browser.close();`,
        note: '"一个上下文对应一个会话"是正确的思路：上下文隔离 cookie 和存储，sid 隔离设备。',
      },
      {
        label: '通过拦截请求节省 70–80% 带宽',
        lang: 'javascript',
        code: `const context = await browser.newContext({ proxy: proxyForSession('job-a') });

// 流量按 GB 计费，所以不要下载您不会用到的内容。
await context.route('**/*', (route) => {
  const type = route.request().resourceType();
  if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
    return route.abort();
  }
  return route.continue();
});

const page = await context.newPage();
await page.goto('https://target.example/product/123', { waitUntil: 'domcontentloaded' });
console.log(await page.textContent('[data-testid="price"]'));`,
        note: '如果需要断言计算后的布局或截图，请把 stylesheet 从列表中移除。',
      },
    ],
    rotation: {
      mode: 'sticky',
      token: '-rot-sticky',
      why:
        '浏览器上下文就是一个会话：它保存着 cookie、本地存储，通常还有登录状态。如果出口 IP 在它底下发生变化，网站会认为这个会话"瞬移"了，并经常使其失效——表现为测试不稳定或爬取中途被登出，而不是明显的代理错误。请为每个上下文使用 -rot-sticky 并设置独立的 -sid-，让上下文的生命周期与 IP 的生命周期保持一致。需要新身份时，用新的 sid 创建新的上下文，而不是在旧上下文下轮换 IP。',
      alternatives: [
        { mode: 'auto10', when: '每个页面相互独立、无需保持会话的无状态爬取——例如批量检查链接。' },
        { mode: 'hard', when: '完全不能更换设备的长时间上下文，例如持续数小时的监控会话。' },
        { mode: 'auto30', when: '后台爬取，缓慢的 IP 更替可以增加 IP 多样性，又不会干扰短会话。' },
      ],
    },
    bandwidth: {
      lead:
        '真实浏览器会下载的内容，Playwright 都会下载——这正是它的意义所在，也是成本所在。在按 GB 计费的代理池上，请求拦截是脚本中性价比最高的一行代码。',
      rows: [
        { workload: '典型页面，全部资源，无缓存', perUnit: '2–5 MB', perGb: '约 200–520 页' },
        { workload: '同一页面，屏蔽图片/媒体/字体', perUnit: '400–900 KB', perGb: '约 1,150–2,600 页' },
        { workload: '同一页面，上下文缓存已预热（重复访问）', perUnit: '150–500 KB', perGb: '约 2,000–7,000 页' },
        { workload: '仅拦截 API（同时屏蔽文档）', perUnit: '5–50 KB', perGb: '约 20,000–200,000 次调用' },
      ],
      tip:
        '在多次页面跳转之间复用上下文，保持缓存有效——为每个页面启动新浏览器会重新下载所有资源，这是 Playwright 账单超出预估数倍的最常见原因。把预热的上下文与路由拦截结合起来，浏览器任务的流量只会是普通 HTTP 抓取的几倍。以上为商业网站的典型范围，请对您自己的目标进行计量。',
    },
    countries: [
      { slug: 'usa', why: '大多数自动化工作的默认市场，也是针对云服务器出口的反爬虫机制最严格的地方。' },
      { slug: 'uk', why: '英语自动化的常见第二市场，拥有自己的内容和同意机制。' },
      { slug: 'germany', why: '只对欧盟流量显示的同意流程——"本地正常、CI 失败"类选择器问题的常见来源。' },
      { slug: 'france', why: '本地语言渲染路径，部署在美国区域的 CI 永远不会触及。' },
      { slug: 'netherlands', why: '低延迟的欧洲出口，适合需要欧盟地理位置、又不想处理德国复杂同意流程的场景。' },
      { slug: 'poland', why: '性价比高的欧盟出口，IP 池充足，适合长时间爬取。' },
    ],
    legitimate: [
      '只对您拥有的网站，或您已获授权测试或采集的网站进行自动化操作。',
      '遵守 robots 指令和速率限制——无头浏览器产生负载的速度远超人类，限速是您的责任。',
      '不得使用自动化批量注册账户、破解不该由您通过的验证码，或绕过访问控制。',
      '当目标网站要求时，如实标明您的自动化身份；收到 Retry-After 时请遵守。',
    ],
    faqs: [
      {
        q: '为什么把凭证写在 URL 里，Playwright 的代理连接会失败？',
        a: '因为 Playwright 要求凭证单独传入。server 字段只接受主机和端口——请把凭证放在 proxy 对象的 username 和 password 字段中，并先用 decodeURIComponent 解码，因为连接 URL 是经过百分号编码的。',
      },
      {
        q: '可以为每个浏览器上下文使用不同的代理吗？',
        a: '可以，而且这是推荐做法。向 newContext() 传入 proxy，并为每个上下文改写 -sid- 参数，这样每个上下文都有自己的设备，而浏览器只需启动一次。',
      },
      {
        q: 'Playwright 该用粘性会话还是轮换？',
        a: '几乎所有情况下都用粘性会话。上下文保存着 cookie 和登录状态，如果 IP 在底层轮换，会话看起来就像"瞬移"了，随后会被判定失效。需要新身份时，用新的 sid 创建新的上下文。',
      },
      {
        q: '如何避免浏览器任务耗费大量带宽？',
        a: '用 context.route() 屏蔽图片、媒体和字体，并复用上下文以保持缓存有效。两者结合通常能减少 70–80% 的流量，使浏览器任务的消耗只比普通 HTTP 抓取高几倍。',
      },
      {
        q: '可以在 CI 和 playwright.config 中使用吗？',
        a: '可以。代理就是一个普通的配置项，您可以在 playwright.config 中按项目分别设置，用同一套测试覆盖多个市场。请为每个并行 worker 设置不同的 -sid-，避免它们共用同一台设备。',
      },
      {
        q: 'Firefox 和 WebKit 也支持吗？',
        a: '支持。proxy 选项属于 Playwright 通用的启动和上下文 API，并非 Chromium 专属功能，因此同样的配置适用于全部三种浏览器引擎。',
      },
    ],
    related: ['puppeteer-mobile-proxy', 'mobile-proxies-for-geo-testing', 'mobile-proxies-for-ad-verification'],
  },

  // ───────────────────────────────────────────── python
  {
    slug: 'python-mobile-proxy',
    group: 'stack',
    label: 'Python',
    title: 'Python 移动代理 — requests、httpx 与 aiohttp 配置 | ProxyMobile',
    description:
      '在 Python 中使用 4G/5G 移动代理：requests、httpx 和 aiohttp 示例，会话复用、重试、轮换选择与带宽测算。按 GB 计费，低至 $5，无需 SDK。',
    h1: 'Python 移动代理配置指南',
    badge: 'Python · requests、httpx、aiohttp',
    intro:
      '所有主流 Python HTTP 客户端都原生支持代理，所以无需安装任何东西，也无需学习厂商 SDK——接入只需一个环境变量和一个参数。真正值得做好的是底层细节：复用连接、正确重试，以及在长任务写入错误数据之前，先断言出口确实在您预期的位置。',
    keywords: [
      'Python移动代理',
      'Python requests代理',
      'httpx代理',
      'aiohttp代理',
      'Python 4G代理',
      'Python轮换代理',
      'Python爬虫代理',
    ],
    problem: {
      heading: '问题所在：简单的部分很简单，稳定运行却不简单',
      body:
        '让 requests 走代理只需一行代码，而大多数教程也就止步于此。问题会在之后出现：代码用的是 requests.get 而不是 Session，导致每次调用都新建 TCP 连接和 CONNECT 隧道，任务慢了好几倍；重试循环不遵守 Retry-After，反复冲击 429；异步客户端同时打开数百条隧道，被当作攻击。这些问题在报错堆栈里看起来都不像代理问题，这正是它们如此耗费时间的原因。',
      symptoms: [
        '吞吐量远低于连接应有的水平，大部分时间花在建立连接上。',
        '并发时出现 ProxyError 或 TunnelError，单线程运行时却消失。',
        '添加代理后出现 SSL 错误，通常是因为试图对代理而不是目标网站做证书校验。',
        '重试策略退避太少甚至不退避，429 越来越多。',
        '任务跑完，数据却全是错误地区的，因为没有任何地方断言出口国家。',
      ],
    },
    code: [
      {
        label: '设置连接 URL',
        lang: 'bash',
        code: `${proxyUrlExport('mbl', 'us', 'auto10')}

# 同一个字符串同时适用于 http:// 和 https:// 目标——
# 客户端会自动为 TLS 建立 CONNECT 隧道。`,
      },
      {
        label: 'requests — 一个可以全天运行的 Session',
        lang: 'python',
        code: `import os
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

PROXY = os.environ["PROXY_URL"]

session = requests.Session()
session.proxies = {"http": PROXY, "https": PROXY}

retry = Retry(
    total=4,
    backoff_factor=1.5,                    # 1.5 秒、3 秒、6 秒、12 秒
    status_forcelist=(429, 500, 502, 503, 504),
    respect_retry_after_header=True,
    allowed_methods=frozenset(["GET", "HEAD"]),
)
# pool_maxsize 让隧道保持存活，而不是每个请求都重新连接。
session.mount("https://", HTTPAdapter(max_retries=retry, pool_maxsize=20))
session.mount("http://", HTTPAdapter(max_retries=retry, pool_maxsize=20))

# 在任务写入任何数据之前，先断言出口位置。
who = session.get("https://ipinfo.io/json", timeout=30).json()
print(f"exit {who['ip']} — {who['country']} — {who['org']}")

r = session.get("https://example.com", timeout=30)
print(r.status_code, len(r.content))`,
        note: 'Session 加 pool_maxsize，就是"复用一条隧道"与"每个请求一条隧道"的区别。',
      },
      {
        label: 'httpx — 同一份配置，同步异步皆可',
        lang: 'python',
        code: `import os, asyncio, httpx

PROXY = os.environ["PROXY_URL"]

# 同步
with httpx.Client(proxy=PROXY, timeout=30.0) as client:
    print(client.get("https://api.ipify.org?format=json").json())

# 异步——请限制并发数，否则每个任务都会打开一条隧道。
async def main(urls):
    limits = httpx.Limits(max_connections=10, max_keepalive_connections=10)
    sem = asyncio.Semaphore(10)
    async with httpx.AsyncClient(proxy=PROXY, limits=limits, timeout=30.0) as c:
        async def one(u):
            async with sem:
                r = await c.get(u)
                return u, r.status_code, len(r.content)
        return await asyncio.gather(*(one(u) for u in urls))

print(asyncio.run(main(["https://example.com"] * 5)))`,
        note: 'httpx 0.26 及以上版本使用 proxy=，旧版本使用 proxies=。请显式限制并发数——不受限的异步请求正是客户端被限流的原因。',
      },
      {
        label: 'aiohttp — 代理按请求设置',
        lang: 'python',
        code: `import os, asyncio, aiohttp

PROXY = os.environ["PROXY_URL"]

async def main():
    conn = aiohttp.TCPConnector(limit=10)
    async with aiohttp.ClientSession(connector=conn) as s:
        # aiohttp 的 proxy= 要写在每次调用上，而不是会话上。
        async with s.get("https://api.ipify.org?format=json", proxy=PROXY) as r:
            print(r.status, await r.json())

asyncio.run(main())`,
        note: '常见陷阱：在 ClientSession 上设置 proxy 不起作用——它必须设置在每个请求上。',
      },
      {
        label: '无需改代码即可切换国家或会话',
        lang: 'python',
        code: `import os, re

def with_country(url: str, cc: str) -> str:
    return re.sub(r"-(us|gb|de|fr|es|nl|pl|ch|pa|am|ge)-", f"-{cc}-", url, count=1)

def with_session(url: str, sid: str) -> str:
    if "-sid-" in url:
        return re.sub(r"-sid-[a-z0-9_]+", f"-sid-{sid}", url)
    return url.replace("-rot-", f"-sid-{sid}-rot-")

base = os.environ["PROXY_URL"]
print(with_country(base, "de"))
print(with_session(with_country(base, "fr"), "worker07"))`,
        note: '路由信息都在用户名字符串中，所以切换市场只是一次字符串替换，而不是重新部署。',
      },
    ],
    rotation: {
      mode: 'auto10',
      token: '-rot-auto10',
      why:
        '对于常见的 Python 任务——爬取大量相互独立、无需保持会话的 URL——auto10 是合适的默认选择。您无需做任何编排，大约每 10 分钟就会获得一个新的运营商 IP，长任务因此分散到多个出口上。轮换期间请继续使用同一个 requests.Session：Session 是您的连接池和 cookie 容器，不受请求之间出口变化的影响。',
      alternatives: [
        { mode: 'sticky', when: '任何有状态的操作——已登录的账户、多步骤表单、购物车。为每个 worker 加上一个独立的 -sid-。' },
        { mode: 'auto30', when: '长时间后台任务，较慢的 IP 更替已经足够，并希望隧道保持更久。' },
        { mode: 'none', when: '临时的一次性脚本，不在乎调用之间出口如何变化。' },
      ],
    },
    bandwidth: {
      lead:
        '从 Python 发起普通 HTTP 请求是使用代理池最省钱的方式，因为您只下载请求的内容，别无其他。在这类任务中，1 GB 流量能用很久。',
      rows: [
        { workload: '抓取 HTML 页面（典型内容网站）', perUnit: '100–400 KB', perGb: '约 2,600–10,000 页' },
        { workload: 'JSON API 响应', perUnit: '2–50 KB', perGb: '约 20,000–500,000 次调用' },
        { workload: '启用 gzip/brotli 压缩的 HTML', perUnit: '30–120 KB', perGb: '约 8,700–35,000 页' },
        { workload: 'HEAD 请求 / 状态检查', perUnit: '约 1 KB', perGb: '几乎不消耗流量' },
      ],
      tip:
        '请发送 Accept-Encoding: gzip, br——requests 和 httpx 默认会发送，但手写的请求头经常把它覆盖掉，而仅压缩一项通常就能减少 70% 的 HTML 传输量。只需要状态码或某个响应头时使用 HEAD；对大响应使用 stream=True 流式读取，拿到所需内容后即可中止，不必为剩余部分付费。以上为典型范围，请先对自己的目标计量，再做规划。',
    },
    countries: [
      { slug: 'usa', why: '大多数 Python 爬虫任务的默认出口，也是规模最大的 IP 池。' },
      { slug: 'uk', why: '英语目标网站，内容和监管要求与美国不同。' },
      { slug: 'germany', why: '欧盟最大市场；同意机制和增值税逻辑只对欧盟出口显示。' },
      { slug: 'france', why: '本地语言目标网站，从非法国出口访问会返回完全不同的页面。' },
      { slug: 'netherlands', why: '快速稳定的欧洲出口——需要泛欧盟地理位置时的理想默认选择。' },
      { slug: 'poland', why: 'IP 池充足，适合持续的长时间任务。' },
      { slug: 'georgia', why: '对于区别对待高加索地区与西欧流量的目标网站，这是很有用的区域出口。' },
    ],
    legitimate: [
      '只从您拥有或已获授权采集的网站采集数据，并遵守其条款。',
      '遵守 robots 指令、Retry-After 和任何公开的速率指引——重试策略不仅关乎稳定性，也是合规的一部分。',
      '限制并发数。无论您的本意如何，对同一主机发起不受限的异步请求，与攻击无异。',
      '没有合法依据时不得采集个人数据，也不要保留您本不需要采集的内容。',
    ],
    faqs: [
      {
        q: '需要特殊的库或 SDK 吗？',
        a: '不需要。requests、httpx、aiohttp、urllib3 和 Scrapy 都原生支持标准 HTTP 代理。您只需设置一个代理 URL，代码的其他部分保持不变。',
      },
      {
        q: '为什么加了代理后爬虫变慢了？',
        a: '几乎都是因为每次调用都新建了连接。整个任务请使用同一个 requests.Session（或同一个 httpx.Client），并调大 pool_maxsize，这样 CONNECT 隧道只需建立一次并被复用，而不是每个请求都建立一次。',
      },
      {
        q: '如何通过代理访问 HTTPS？',
        a: '同一个 URL 同时适用于两种协议——对于 TLS 目标，客户端会自动建立 CONNECT 隧道。请保持证书校验开启；它校验的是目标网站的证书，而不是代理，所以没有理由关闭它。',
      },
      {
        q: 'httpx 中 proxy= 和 proxies= 有什么区别？',
        a: 'httpx 0.26 及以上版本接受单个 proxy= 参数；更早的版本使用 proxies= 映射。如果遇到"unexpected keyword argument"错误，请核对已安装的版本与示例所针对的版本是否一致。',
      },
      {
        q: '为什么在 aiohttp 的 ClientSession 上设置 proxy 不起作用？',
        a: '因为 aiohttp 是按请求而不是按会话设置代理的。请像上面的示例那样，在每次 .get() 或 .post() 调用中传入 proxy=PROXY。',
      },
      {
        q: 'Python 爬虫应使用哪种轮换模式？',
        a: '无状态地爬取大量独立 URL 时使用 auto10。一旦需要在请求之间保持登录、购物车或其他状态，就改用粘性会话，并为每个 worker 设置独立的 -sid-。',
      },
    ],
    related: ['playwright-mobile-proxy', 'mobile-proxies-for-price-monitoring', 'mobile-proxies-for-serp-tracking'],
  },

  // ───────────────────────────────────────────── puppeteer
  {
    slug: 'puppeteer-mobile-proxy',
    group: 'stack',
    label: 'Puppeteer',
    title: 'Puppeteer 移动代理 — 认证、轮换与带宽 | ProxyMobile',
    description:
      '在 Puppeteer 中使用 4G/5G 移动代理：--proxy-server 配合 page.authenticate、每个会话一个浏览器、拦截请求以节省带宽，以及 CI 配置。低至 $5/GB。',
    h1: 'Puppeteer 移动代理配置指南',
    badge: 'Puppeteer · Chrome DevTools 协议',
    intro:
      'Puppeteer 通过启动参数把代理传给 Chrome，而 Chrome 不接受写在该参数中的凭证——这就是为什么最直观的写法只会弹出一个代理认证对话框并卡住，而不是打开页面。正确的做法分两步：启动参数中只写服务器地址，凭证通过 page.authenticate 传入。其余一切都由此展开。',
    keywords: [
      'Puppeteer移动代理',
      'Puppeteer代理认证',
      'Puppeteer 4G代理',
      'Puppeteer proxy-server',
      'Puppeteer轮换代理',
      'Puppeteer爬虫代理',
    ],
    problem: {
      heading: '问题所在：--proxy-server 不接受密码',
      body:
        'Chrome 的 --proxy-server 参数只接受协议、主机和端口，别无其他。把凭证写进去，Chrome 会直接忽略，上游返回 407，而 Puppeteer 会停在一个无头模式下看不见的认证弹窗上——所以症状是页面导航永远不结束，而不是一个指明原因的报错。更深一层，促使大家使用 Puppeteer 的那个问题依然存在：从云服务器 IP 运行的无头 Chrome 很容易被识别，因此您自动化操作的内容，可能并不是真实访客看到的内容。',
      symptoms: [
        '在 --proxy-server 中加入凭证后，goto() 一直卡到超时，没有任何报错。',
        '出现 ERR_INVALID_AUTH_CREDENTIALS，或网络日志中出现无声的 407。',
        '认证在第一个页面有效，之后的每个页面都失败。',
        '新页面或弹窗绕过了您在第一个页面上设置的代理认证。',
        '因为没有拦截任何请求，带宽费用随完整页面体积增长。',
      ],
    },
    code: [
      {
        label: '设置连接 URL',
        lang: 'bash',
        code: `${proxyUrlExport('mbl', 'us', 'sticky', 'pptr01')}

# 每个会话一个浏览器实例。Chrome 在整个进程范围内应用代理参数，
# 所以第二个身份就需要第二个浏览器。`,
      },
      {
        label: '正确写法：参数指定主机，authenticate 传入凭证',
        lang: 'javascript',
        code: `import puppeteer from 'puppeteer';

const url = new URL(process.env.PROXY_URL);

const browser = await puppeteer.launch({
  headless: 'new',
  args: [
    // 这里只写主机和端口——Chrome 会忽略写在这里的凭证。
    \`--proxy-server=http://\${url.host}\`,
  ],
});

const page = await browser.newPage();

// 大多数示例都漏掉了这一步。
await page.authenticate({
  username: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
});

await page.goto('https://api.ipify.org?format=json', { waitUntil: 'domcontentloaded' });
console.log(await page.evaluate(() => document.body.innerText));

await browser.close();`,
        note: 'page.authenticate 是按页面生效的。每个新页面或弹窗都需要单独调用——见下文。',
      },
      {
        label: '为每个页面认证，包括弹窗',
        lang: 'javascript',
        code: `const creds = {
  username: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
};

// 捕获网站自行打开的页面，否则它们会遇到一个您看不到的 407。
browser.on('targetcreated', async (target) => {
  if (target.type() !== 'page') return;
  const p = await target.page();
  if (p) await p.authenticate(creds);
});

const page = await browser.newPage();
await page.authenticate(creds);`,
        note: '没有 targetcreated 钩子时，目标网站的一次 window.open 就会让任务悄悄中断。',
      },
      {
        label: '拦截请求——流量按 GB 计费',
        lang: 'javascript',
        code: `await page.setRequestInterception(true);

page.on('request', (req) => {
  if (['image', 'media', 'font', 'stylesheet'].includes(req.resourceType())) {
    return req.abort();
  }
  return req.continue();
});

// 使用移动端视口，让网站向您的移动 IP 返回移动版页面。
await page.setViewport({ width: 390, height: 844, isMobile: true, deviceScaleFactor: 3 });
await page.goto('https://target.example/product/123', { waitUntil: 'domcontentloaded' });`,
        note: '必须在 goto 之前启用拦截，并且每个请求都必须恰好调用一次 abort 或 continue。',
      },
    ],
    rotation: {
      mode: 'sticky',
      token: '-rot-sticky',
      why:
        'Chrome 把代理作为进程级启动参数，整个浏览器共用一个出口——在 Puppeteer 中，身份的最小单位是浏览器实例，而不是页面。因此粘性会话是最自然的选择：用 -rot-sticky 和独立的 -sid- 固定浏览器，完成整个会话后再关闭它。需要不同身份时，用不同的 sid 启动第二个浏览器，而不是试图在运行中的 Chrome 底下切换出口——那会让您已建立的会话状态全部失效。',
      alternatives: [
        { mode: 'auto10', when: '执行无状态任务的短时浏览器，每次启动只处理少量相互独立的页面。' },
        { mode: 'hard', when: '持续数小时、不能更换设备的长时间监控会话。' },
        { mode: 'auto30', when: '需要在长时间运行中获得一定 IP 多样性、又不干扰短会话的后台爬取。' },
      ],
    },
    bandwidth: {
      lead:
        'Puppeteer 驱动的是真实的 Chrome，所以 Chrome 下载什么，它就下载什么。在这里，请求拦截不是可有可无的优化——在按 GB 计费的代理池上，它是您最主要的成本控制手段。',
      rows: [
        { workload: '典型页面，全部资源，全新配置文件', perUnit: '2–5 MB', perGb: '约 200–520 页' },
        { workload: '同一页面，中止图片/媒体/字体请求', perUnit: '400–900 KB', perGb: '约 1,150–2,600 页' },
        { workload: '同一页面，复用已预热缓存的浏览器', perUnit: '150–500 KB', perGb: '约 2,000–7,000 页' },
        { workload: '屏蔽文档，仅保留 XHR/fetch', perUnit: '5–50 KB', perGb: '约 20,000–200,000 次调用' },
      ],
      tip:
        '为每个 URL 启动新浏览器会丢掉缓存、重新下载所有资源——这是 Puppeteer 账单超出预估数倍的最常见原因。在一个会话的多个页面之间复用同一个浏览器，积极拦截请求，只在真正出错的页面上截图。以上为商业网站的典型范围，请先对自己的目标计量，再确定预算。',
    },
    countries: [
      { slug: 'usa', why: '大多数自动化工作的默认市场，也是针对云服务器出口的反爬虫机制最严格的地方。' },
      { slug: 'uk', why: '第二大英语市场，拥有自己的内容和同意流程。' },
      { slug: 'germany', why: '欧盟的同意流程，部署在美国区域的 CI 永远看不到，却经常导致选择器失效。' },
      { slug: 'france', why: '本地语言渲染，从非法国出口无法触及。' },
      { slug: 'netherlands', why: '快速的欧盟出口，同意流程相对简单。' },
      { slug: 'poland', why: 'IP 池充足，适合持续爬取，每个会话成本更低。' },
    ],
    legitimate: [
      '只对您拥有或已获授权的网站进行自动化操作。',
      '无头浏览器产生负载的速度远超人类——请主动限速，并遵守 Retry-After。',
      '不得使用自动化批量注册账户、破解不该由您通过的验证码，或绕过访问控制。',
      '尽可能避免合成流量混入他人的分析数据，也绝不要产生非预期的计费事件。',
    ],
    faqs: [
      {
        q: '为什么把凭证写在 --proxy-server 的 URL 里不起作用？',
        a: 'Chrome 的这个参数只接受协议、主机和端口。写在其中的凭证会被忽略，上游返回 407，而无头 Chrome 会停在一个看不见的认证对话框上——所以症状是卡住而不是报错。请改用 page.authenticate 传入凭证。',
      },
      {
        q: '每个页面都要调用 page.authenticate 吗？',
        a: '是的。它按页面生效，而不是按浏览器。请在您创建的每个页面上调用它，并添加 browser.on("targetcreated") 钩子，让网站自行打开的页面也能完成认证。',
      },
      {
        q: '一个浏览器中的不同页面可以使用不同代理吗？',
        a: '通过启动参数做不到——Chrome 在整个进程范围内应用该参数，所以一个浏览器只有一个出口。请为每个身份启动单独的浏览器实例，并各自设置 -sid-。如果需要在单个浏览器中按上下文使用不同代理，Playwright 原生支持这一点。',
      },
      {
        q: 'Puppeteer 该用粘性会话还是轮换？',
        a: '粘性会话。浏览器是身份的最小单位，在其整个生命周期内保存着 cookie 和会话状态，所以出口应在这段时间内保持固定。需要新身份时，用新的 sid 启动新的浏览器。',
      },
      {
        q: '如何降低带宽消耗？',
        a: '在导航之前启用 setRequestInterception，中止图片、媒体、字体和样式表请求，然后复用同一个浏览器以保持缓存有效。这通常能减少 70–80% 的流量。',
      },
      {
        q: '可以配合 puppeteer-extra 和 stealth 插件使用吗？',
        a: '可以——代理配置使用的是普通的 Puppeteer 启动和页面 API，所以封装了启动器的插件会自动继承。代理和指纹是两个独立的问题，而运营商 IP 解决的恰恰是指纹插件无法解决的那一个。',
      },
    ],
    related: ['playwright-mobile-proxy', 'python-mobile-proxy', 'mobile-proxies-for-geo-testing'],
  },
];

/** Lookup by slug. */
export function getUseCasePageZh(slug: string): UseCasePage | undefined {
  return USE_CASE_PAGES_ZH.find((p) => p.slug === slug);
}

/** All slugs — used by generateStaticParams and the sitemap. */
export const USE_CASE_SLUGS_ZH = USE_CASE_PAGES_ZH.map((p) => p.slug);

/** Resolve the `related` slugs of a page into full entries. */
export function relatedPagesZh(slug: string): UseCasePage[] {
  const page = getUseCasePageZh(slug);
  if (!page) return [];
  return page.related
    .map(getUseCasePageZh)
    .filter((p): p is UseCasePage => Boolean(p));
}

// 简体中文版 — generated from src/lib/countries.ts for the /zh/mobile-proxies pages.
// Same slugs and codes; carrier names stay in their original form.
// Keep in sync when the English file changes.
/**
 * SEO country dataset for the programmatic /mobile-proxies/[country] pages.
 *
 * Each entry carries its own title, meta description, H1 and — importantly —
 * genuinely unique body copy (not a templated sentence with the country name
 * swapped). Copy mentions real local carriers and local use cases so each page
 * earns its own ranking rather than reading as boilerplate.
 */

export interface CountryFaq {
  q: string;
  a: string;
}

export interface CountrySection {
  heading: string;
  body: string;
}

export interface Country {
  /** ISO-ish code used in the pricing URL token (matches PRICING_COUNTRIES). */
  code: string;
  /** URL slug: /mobile-proxies/{slug} */
  slug: string;
  /** Full display name, e.g. "United States". */
  name: string;
  /** Short label, e.g. "USA". */
  shortName: string;
  flag: string;
  capital: string;
  /** Real mobile carriers whose IPs this pool draws from. */
  carriers: string[];
  title: string;
  description: string;
  h1: string;
  /** Lead paragraph. */
  intro: string;
  sections: CountrySection[];
  useCases: string[];
  faqs: CountryFaq[];
}

export const COUNTRIES_ZH: Country[] = [
  {
    code: 'us',
    slug: 'usa',
    name: '美国',
    shortName: '美国',
    flag: '\u{1F1FA}\u{1F1F8}',
    capital: '华盛顿特区',
    carriers: ['T-Mobile', 'Verizon', 'AT&T'],
    title: '购买美国移动代理 — 真实 T-Mobile 与 Verizon 4G/5G IP | ProxyMobile',
    description:
      '美国移动代理，基于真实 T-Mobile、Verizon 和 AT&T 4G/5G IP。按 GB 计费，低至 $5/GB，无需注册，即时开通。支持 HTTP 与 SOCKS5，城市级运营商 IP。',
    h1: '美国移动代理 — 真实 T-Mobile、Verizon 与 AT&T 4G/5G IP',
    intro:
      '我们的美国 IP 池通过 T-Mobile、Verizon 和 AT&T 的真实 SIM 卡转发您的流量——与美国手机在 4G 和 5G 网络上获得的运营商 IP 完全相同。这些是美国互联网上信任度最高的地址，正因如此，那些屏蔽机房甚至住宅 IP 段的网站，会直接放行运营商流量。',
    sections: [
      {
        heading: '为什么美国运营商 IP 胜过机房和住宅 IP',
        body: '美国的广告平台、社交网络和零售网站给予移动 ASN 的信任度远高于其他任何类型的 IP。T-Mobile 或 Verizon 的地址自带隐含的信任信号——通过运营商级 NAT，数以百万计的合法用户共享每个 IP，封禁一个 IP 就意味着封禁真实顾客。正是这种共享 IP 的现实，让美国移动代理成为账户操作、广告验证，以及任何因机房指纹而在第一个请求就被标记的工作流程的首选。',
      },
      {
        heading: '覆盖美国主要都市区',
        body: 'IP 池中的设备分布在全美各地，因此出口会落在真实的美国地理位置上，而不是某个机房的同一个机架。这对广告验证和本地化 SERP 检查很重要——达拉斯出口和纽约出口本应看到不同的广告素材和排名。每个请求都通过真实的消费级运营商 IP 出口，并具有可信的美国城市位置特征。',
      },
      {
        heading: '针对美国目标的轮换与会话',
        body: '使用粘性模式，在整个登录会话期间固定一个 Verizon IP；或在每个请求时轮换新的运营商 IP，进行大规模数据采集。同时运行数十个美国并行会话——每个会话对应自己的会话 ID 和 IP——无需调用任何 API。从移动 IP 池切换到美国住宅 IP 池，只需在同一个 URL 中改动三个字符。',
      },
    ],
    useCases: [
      '在各大都市区验证面向美国的广告投放',
      '管理多个美国社交与电商平台账户',
      '本地化的谷歌/零售价格与排名检查',
      '使用高信任度运营商 IP 参与球鞋和票务抢购',
    ],
    faqs: [
      {
        q: '这些 IP 来自哪些美国运营商？',
        a: '出口来自物理 4G/5G 调制解调器中 T-Mobile、Verizon 和 AT&T 的真实 SIM 卡——与美国手机获得的运营商 IP 相同。没有任何机房地址。',
      },
      {
        q: '可以指定美国的某个城市吗？',
        a: '美国 IP 池的出口分布在各大都市区。您可以通过 URL 控制国家和轮换方式；如果您的业务需要特定的区域分布，请联系客服。',
      },
      {
        q: '美国移动代理多少钱？',
        a: '按 GB 计费，用量越大越便宜，低至 $5/GB，无需订阅。未使用的流量永不过期，余额用完后密钥自动停止——没有超额费用。',
      },
    ],
  },
  {
    code: 'de',
    slug: 'germany',
    name: '德国',
    shortName: '德国',
    flag: '\u{1F1E9}\u{1F1EA}',
    capital: '柏林',
    carriers: ['Vodafone', 'Deutsche Telekom', 'O2'],
    title: '购买德国移动代理 — 真实 Vodafone 与 Telekom 4G/5G IP | ProxyMobile',
    description:
      '德国移动代理，基于真实 Vodafone、Deutsche Telekom 和 O2 4G/5G IP。按 GB 计费，低至 $5/GB，无需注册，即时开通。支持 HTTP 与 SOCKS5，重视 GDPR 合规。',
    h1: '德国移动代理 — 真实 Vodafone、Telekom 与 O2 4G/5G IP',
    intro:
      '我们的德国 IP 池通过 Vodafone DE、Deutsche Telekom 和 O2 的真实 SIM 卡出口——这些运营商 IP 与柏林或慕尼黑地铁上的手机毫无区别。德国平台对自动化流量出了名地严格，因此一个真正的 Telekom 或 Vodafone 地址，往往决定了会话是顺利进行还是立即被封。',
    sections: [
      {
        heading: '德国运营商，德国本土信任信号',
        body: 'Deutsche Telekom 和 Vodafone 运营的 ASN，被德国反欺诈系统视为本土消费者流量。由于运营商级 NAT 让成千上万的真实 Vodafone 用户共享每个 IP，这些地址几乎无法被封禁而不殃及无辜。因此，在 Otto、Zalando 和 Amazon.de 这类严格过滤机房 IP 段的平台上做电商研究，德国移动代理是务实之选。',
      },
      {
        heading: '为德国市场打造',
        body: '只有当网站相信您是真实的本国访客时，才会显示本地化价格、德语广告素材和区域库存。通过 Telekom 出口访问，您看到的 .de 网站与汉堡或科隆的顾客所见完全一致——正确的增值税、正确的库存、正确的促销——因此您的数据反映的是真实的德国在线商店，而不是地理围栏后的替代页面。',
      },
      {
        heading: '会话、轮换与隐私',
        body: '使用粘性会话，在完整的结账流程中保持同一个运营商 IP；或使用硬轮换进行大范围价格监控。我们仅出于计费目的记录带宽——从不记录您的流量内容或访问的网址——让您在德国的业务流程保持干净。只需在同一个代理 URL 中改动几个字符，即可切换到德国住宅 IP 池或其他国家。',
      },
    ],
    useCases: [
      '.de 零售网站的价格与库存监控',
      '德语广告投放的验证',
      '管理 DACH 地区（德奥瑞）的电商平台账户',
      '面向德国的地理定向网站体验 QA 测试',
    ],
    faqs: [
      {
        q: 'IP 池包含哪些德国运营商？',
        a: '出口使用物理 4G/5G 调制解调器中 Vodafone 德国、Deutsche Telekom 和 O2 的真实 SIM 卡——与德国手机获得的运营商 IP 相同。',
      },
      {
        q: '德国移动代理适合 .de 电商吗？',
        a: '适合。运营商 IP 被视为本土流量，因此德国零售网站会返回真实的本地化价格、库存和促销，而不是屏蔽您或进行地理限制。',
      },
      {
        q: '你们会记录我的流量吗？',
        a: '我们仅出于计费目的统计带宽，不会记录您的代理流量内容或您访问的网址。',
      },
    ],
  },
  {
    code: 'gb',
    slug: 'uk',
    name: '英国',
    shortName: '英国',
    flag: '\u{1F1EC}\u{1F1E7}',
    capital: '伦敦',
    carriers: ['EE', 'O2', 'Vodafone', 'Three'],
    title: '购买英国移动代理 — 真实 EE、O2 与 Vodafone 4G/5G IP | ProxyMobile',
    description:
      '英国移动代理，基于真实 EE、O2、Vodafone 和 Three 4G/5G IP。按 GB 计费，低至 $5/GB，无需注册，即时开通。支持 HTTP 与 SOCKS5，英国本土运营商地址。',
    h1: '英国移动代理 — 真实 EE、O2、Vodafone 与 Three 4G/5G IP',
    intro:
      '我们的英国 IP 池通过 EE、O2、Vodafone UK 和 Three 的真实 SIM 卡转发流量——与伦敦通勤者手机上的英国运营商 IP 完全相同。英国平台高度依赖 IP 信誉，因此 EE 或 O2 的地址可以轻松通过那些拦截机房和回收住宅 IP 段的信誉检查。',
    sections: [
      {
        heading: '拥有真实信誉的英国运营商 IP',
        body: 'EE 和 Vodafone 运营的移动 ASN，被英国反欺诈系统识别为普通消费者流量。运营商 NAT 让成千上万的真实用户共享每个地址，因此即使面对几分钟就能让机房 IP 段报废的任务，这些 IP 依然保持干净。正是这种可靠性，让英国移动代理适用于英国目标网站上的账户管理、零售研究和社交自动化。',
      },
      {
        heading: '以英国用户的视角浏览英国互联网',
        body: '只有当网站信任您的位置时，才会显示英镑价格、到店自提库存和按地区锁定的流媒体片库。通过真实的英国运营商出口，ASOS、Argos 和各大超市在您眼中的样子与曼彻斯特或格拉斯哥的购物者所见完全一致——准确的库存、准确的配送时段、准确的促销。',
      },
      {
        heading: '为英国业务提供轮换控制',
        body: '粘性模式可在多步骤流程中保持同一个 EE IP；自动轮换每 10 或 30 分钟更换一次；硬轮换则每个请求分配一个新的英国 IP。使用唯一的会话 ID 即可启动多个英国并行会话，无需任何 API 对接。国家和轮换方式都写在 URL 中，在英国移动与住宅 IP 之间切换只需一瞬间。',
      },
    ],
    useCases: [
      '管理英国社交与电商平台账户',
      '英国网站的零售价格与库存检查',
      '面向英国的广告投放验证',
      '英国各地区的 SERP 监控',
    ],
    faqs: [
      {
        q: '这些 IP 来自哪些英国运营商？',
        a: '出口来自物理 4G/5G 调制解调器中 EE、O2、Vodafone UK 和 Three 的真实 SIM 卡——与英国手机获得的运营商 IP 相同。',
      },
      {
        q: '英国网站会把这些 IP 视为本国访客吗？',
        a: '会。英国运营商 IP 被视为本土消费者流量，因此英国零售和流媒体网站会返回真实的本地化价格、库存和片库。',
      },
      {
        q: '起步费用是多少？',
        a: '按 GB 计费，用量越大越便宜，低至 $5/GB，无需订阅。余额用完后密钥自动停止，没有超额费用，未使用的流量永不过期。',
      },
    ],
  },
  {
    code: 'fr',
    slug: 'france',
    name: '法国',
    shortName: '法国',
    flag: '\u{1F1EB}\u{1F1F7}',
    capital: '巴黎',
    carriers: ['Orange', 'SFR', 'Bouygues Telecom', 'Free Mobile'],
    title: '购买法国移动代理 — 真实 Orange 与 SFR 4G/5G IP | ProxyMobile',
    description:
      '法国移动代理，基于真实 Orange、SFR、Bouygues 和 Free Mobile 4G/5G IP。按 GB 计费，低至 $5/GB，无需注册，即时开通。支持 HTTP 与 SOCKS5。',
    h1: '法国移动代理 — 真实 Orange、SFR、Bouygues 与 Free 4G/5G IP',
    intro:
      '我们的法国 IP 池通过 Orange、SFR、Bouygues Telecom 和 Free Mobile 的真实 SIM 卡出口——与巴黎地铁上手机的运营商 IP 完全相同。法国平台会严格过滤外国和机房流量，因此一个本土的 Orange 或 SFR 地址，是让您在法国网站上的会话保持稳定的关键。',
    sections: [
      {
        heading: 'Orange 与 SFR 的运营商信任度',
        body: 'Orange 运营着法国最受信任的移动 ASN 之一，法国反欺诈系统将其 IP 段视为普通消费者流量。运营商 NAT 让成千上万的真实用户共享每个 IP，封禁一个 Orange 地址必然会波及真实顾客——这正是法国移动代理能在 Leboncoin、Vinted 以及各大 .fr 零售网站上稳定运行的原因，而更便宜的 IP 类型在这些网站上会被过滤。',
      },
      {
        heading: '原汁原味的法国市场',
        body: '只有当网站确信您在法国境内浏览时，才会显示欧元价格、法语广告素材和仅限法国的商品。通过真实的法国运营商出口，您看到的 .fr 网店与里昂或马赛的购物者所见一致——正确的增值税（TVA）、正确的库存、正确的地区促销——因此采集到的数据与真实的法国用户体验相符。',
      },
      {
        heading: '针对法国目标的灵活轮换',
        body: '使用粘性模式在整个结账流程中固定一个 SFR IP，或使用硬轮换进行大规模的价格和商品信息监控。通过唯一的会话 ID，每个法国并行会话都有自己的 IP——无需会话管理后台，无需 API。国家和轮换方式都写在 URL 中，在法国移动与住宅出口之间切换只需几秒钟。',
      },
    ],
    useCases: [
      '监控 Leboncoin 和 Vinted 上的商品信息',
      '.fr 零售网站的价格检查',
      '法国广告投放的验证',
      '管理法国电商平台账户',
    ],
    faqs: [
      {
        q: 'IP 池包含哪些法国运营商？',
        a: '出口使用物理 4G/5G 调制解调器中 Orange、SFR、Bouygues Telecom 和 Free Mobile 的真实 SIM 卡——与法国手机获得的运营商 IP 相同。',
      },
      {
        q: '这些 IP 适合 .fr 分类信息网站和零售网站吗？',
        a: '适合。法国运营商 IP 被视为本土消费者流量，因此 Leboncoin、Vinted 和 .fr 零售商等网站会返回真实的本地化内容，而不是屏蔽您。',
      },
      {
        q: '如何计费？',
        a: '按 GB 计费，用量越大越便宜，低至 $5/GB，无需订阅。未使用的流量永不过期，也没有超额费用。',
      },
    ],
  },
  {
    code: 'es',
    slug: 'spain',
    name: '西班牙',
    shortName: '西班牙',
    flag: '\u{1F1EA}\u{1F1F8}',
    capital: '马德里',
    carriers: ['Movistar', 'Orange', 'Vodafone'],
    title: '购买西班牙移动代理 — 真实 Movistar 与 Orange 4G/5G IP | ProxyMobile',
    description:
      '西班牙移动代理，基于真实 Movistar、Orange 和 Vodafone 4G/5G IP。按 GB 计费，低至 $5/GB，无需注册，即时开通。支持 HTTP 与 SOCKS5，西班牙本土运营商 IP。',
    h1: '西班牙移动代理 — 真实 Movistar、Orange 与 Vodafone 4G/5G IP',
    intro:
      '我们的西班牙 IP 池通过 Movistar、Orange ES 和 Vodafone Spain 的真实 SIM 卡转发流量——与马德里或巴塞罗那的手机毫无区别。西班牙平台高度重视移动 ASN，因此一个真正的 Movistar 地址可以通过那些拦截机房和回收住宅流量的信誉检查。',
    sections: [
      {
        heading: 'Movistar 级别的运营商信誉',
        body: 'Movistar 是西班牙的老牌移动运营商，其 IP 段在西班牙反欺诈系统中被识别为本土消费者流量。运营商 NAT 让成千上万的真实用户共享每个 IP，因此即使面对会耗尽机房 IP 池的任务，这些地址依然可用。正是这种耐用性，让西班牙移动代理在 Wallapop、Vinted 西班牙站和 .es 零售研究中表现出色。',
      },
      {
        heading: '原汁原味的西班牙网店',
        body: '只有当网站信任您的来源时，才会显示欧元价格、西班牙语广告素材和仅限西班牙的促销。通过真实的西班牙运营商出口，El Corte Inglés、PcComponentes 以及各大电商平台在您眼中的样子与巴伦西亚或塞维利亚的购物者所见完全一致——正确的增值税（IVA）、正确的库存、正确的优惠——因此您的数据反映的是真实的西班牙市场。',
      },
      {
        heading: '轮换与并行会话',
        body: '使用粘性模式在登录流程中固定一个 Orange ES IP，或为每个请求轮换新的西班牙运营商 IP，进行大范围监控。通过唯一的会话 ID 同时运行多个西班牙会话，每个会话使用独立的 IP——无需 API。国家和轮换方式都写在 URL 中，在西班牙移动与住宅 IP 之间切换只需改两个字符。',
      },
    ],
    useCases: [
      '监控 Wallapop 和 Vinted 西班牙站的商品信息',
      '.es 零售网站的价格与库存检查',
      '西班牙广告投放的验证',
      '管理西班牙电商平台账户',
    ],
    faqs: [
      {
        q: 'IP 池包含哪些西班牙运营商？',
        a: '出口使用物理 4G/5G 调制解调器中 Movistar、Orange Spain 和 Vodafone Spain 的真实 SIM 卡——与西班牙手机获得的运营商 IP 相同。',
      },
      {
        q: '西班牙网站会对这些 IP 显示本地内容吗？',
        a: '会。西班牙运营商 IP 被视为本土流量，因此 .es 零售商和电商平台会返回真实的本地化价格、库存和促销。',
      },
      {
        q: '起步价格是多少？',
        a: '按 GB 计费，用量越大越便宜，低至 $5/GB，无需订阅。未使用的流量永不过期，余额用完后密钥自动停止。',
      },
    ],
  },
  {
    code: 'pl',
    slug: 'poland',
    name: '波兰',
    shortName: '波兰',
    flag: '\u{1F1F5}\u{1F1F1}',
    capital: '华沙',
    carriers: ['Orange', 'Play', 'Plus', 'T-Mobile'],
    title: '购买波兰移动代理 — 真实 Orange 与 Play 4G/5G IP | ProxyMobile',
    description:
      '波兰移动代理，基于真实 Orange、Play、Plus 和 T-Mobile 4G/5G IP。按 GB 计费，低至 $5/GB，无需注册，即时开通。支持 HTTP 与 SOCKS5，波兰本土运营商 IP。',
    h1: '波兰移动代理 — 真实 Orange、Play、Plus 与 T-Mobile 4G/5G IP',
    intro:
      '我们的波兰 IP 池通过 Orange PL、Play、Plus 和 T-Mobile Poland 的真实 SIM 卡出口——与华沙或克拉科夫手机的运营商 IP 完全相同。波兰是欧洲增长最快的电商市场之一，当地平台对本国运营商流量的信任度远高于任何机房 IP 段。',
    sections: [
      {
        heading: '平台信任的波兰运营商 IP',
        body: 'Play 和 Orange PL 运营的移动 ASN，被波兰反欺诈系统视为普通消费者流量。运营商 NAT 让成千上万的真实用户共享每个地址，因此即使面对高强度任务，这些 IP 依然可用。这种可靠性让波兰移动代理非常适合 Allegro、OLX 以及 .pl 零售生态——在这些平台上，便宜的 IP 一出现就会被过滤。',
      },
      {
        heading: '为 Allegro 主导的市场打造',
        body: '只有当网站相信您在波兰境内浏览时，才会显示兹罗提价格、波兰语商品信息和仅限波兰的商品。通过真实的波兰运营商出口，Allegro 和各大零售商在您眼中的样子与弗罗茨瓦夫或格但斯克的购物者所见一致——正确的价格、正确的库存、正确的促销——因此您的监控数据与真实的波兰网店相符。',
      },
      {
        heading: '针对波兰目标的轮换与会话',
        body: '使用粘性模式在整个会话期间保持一个 Play IP，或使用硬轮换在 Allegro 和 OLX 上大范围采集商品信息。通过唯一的会话 ID，每个波兰并行会话都有自己的 IP，无需 API。由于国家和轮换方式都写在 URL 中，在波兰移动与住宅出口之间切换即时生效。',
      },
    ],
    useCases: [
      '监控 Allegro 和 OLX 的商品信息与价格',
      '管理波兰电商平台账户',
      '波兰广告投放的验证',
      '本地化的 .pl 搜索排名与零售检查',
    ],
    faqs: [
      {
        q: 'IP 池包含哪些波兰运营商？',
        a: '出口使用物理 4G/5G 调制解调器中 Orange Poland、Play、Plus 和 T-Mobile Poland 的真实 SIM 卡——与波兰手机获得的运营商 IP 相同。',
      },
      {
        q: '这些 IP 适合 Allegro 和 OLX 吗？',
        a: '适合。波兰运营商 IP 被视为本土消费者流量，因此 Allegro、OLX 和 .pl 零售商会返回真实的本地化商品信息和价格。',
      },
      {
        q: '波兰移动代理多少钱？',
        a: '按 GB 计费，用量越大越便宜，低至 $5/GB，无需订阅。未使用的流量永不过期，也没有超额费用。',
      },
    ],
  },
  {
    code: 'ch',
    slug: 'switzerland',
    name: '瑞士',
    shortName: '瑞士',
    flag: '\u{1F1E8}\u{1F1ED}',
    capital: '伯尔尼',
    carriers: ['Swisscom', 'Sunrise', 'Salt'],
    title: '购买瑞士移动代理 — 真实 Swisscom 与 Sunrise 4G/5G IP | ProxyMobile',
    description:
      '瑞士移动代理，基于真实 Swisscom、Sunrise 和 Salt 4G/5G IP。按 GB 计费，低至 $5/GB，无需注册，即时开通。支持 HTTP 与 SOCKS5，瑞士本土运营商地址。',
    h1: '瑞士移动代理 — 真实 Swisscom、Sunrise 与 Salt 4G/5G IP',
    intro:
      '我们的瑞士 IP 池通过 Swisscom、Sunrise 和 Salt 的真实 SIM 卡转发流量——与苏黎世或日内瓦手机的运营商 IP 完全相同。瑞士市场规模小、价值高，网站很容易设置地理限制，因此一个本土的瑞士运营商地址，往往是看到本国用户体验的唯一途径。',
    sections: [
      {
        heading: '在门槛极高的市场中拥有 Swisscom 级别的信任',
        body: 'Swisscom 是瑞士的老牌运营商，其 IP 段被瑞士平台视为本土消费者流量。运营商 NAT 让众多真实用户共享每个 IP，因此在机房 IP 段会被立即封禁的地方，瑞士移动地址依然保持干净。由于瑞士市场小而高端，这种运营商信任对研究和验证工作尤为宝贵。',
      },
      {
        heading: '三种语言的瑞士网店',
        body: '只有受信任的本国访客，才能看到瑞士法郎价格、德语/法语/意大利语广告素材以及仅限瑞士的商品。通过真实的瑞士运营商出口，Digitec、Galaxus 等零售商在您眼中的样子与巴塞尔或洛桑的购物者所见一致——正确的价格、正确的库存、正确的地区促销——因此您的数据反映的是真实的瑞士市场，而不是地理围栏后的替代页面。',
      },
      {
        heading: '为高端市场提供轮换控制',
        body: '粘性模式可在结账过程中固定一个 Swisscom IP；自动轮换按设定时间更换；硬轮换则每个请求更换一次，适合更大范围的采集。通过唯一的会话 ID，每个瑞士并行会话都有自己的 IP。国家和轮换方式都写在 URL 中，在瑞士移动与住宅出口之间切换即时生效。',
      },
    ],
    useCases: [
      '瑞士零售网站的价格与库存检查',
      '瑞士广告投放的验证',
      '管理瑞士电商平台账户',
      '本地化的多语言 .ch 网站 QA 测试',
    ],
    faqs: [
      {
        q: 'IP 池包含哪些瑞士运营商？',
        a: '出口使用物理 4G/5G 调制解调器中 Swisscom、Sunrise 和 Salt 的真实 SIM 卡——与瑞士手机获得的运营商 IP 相同。',
      },
      {
        q: '瑞士网站会对这些 IP 做地理限制吗？',
        a: '不会。瑞士运营商 IP 被视为本土流量，因此 .ch 零售商会返回真实的本地化价格和库存，而不是地理围栏后的替代页面。',
      },
      {
        q: '起步费用是多少？',
        a: '按 GB 计费，用量越大越便宜，低至 $5/GB，无需订阅。未使用的流量永不过期，余额用完后密钥自动停止。',
      },
    ],
  },
  {
    code: 'pa',
    slug: 'panama',
    name: '巴拿马',
    shortName: '巴拿马',
    flag: '\u{1F1F5}\u{1F1E6}',
    capital: '巴拿马城',
    carriers: ['+Móvil (Cable & Wireless)', 'Tigo'],
    title: '购买巴拿马移动代理 — 真实 +Móvil 与 Tigo 4G/LTE IP | ProxyMobile',
    description:
      '巴拿马移动代理，基于真实 +Móvil 和 Tigo 4G/LTE 运营商 IP。按 GB 计费，低至 $5/GB，无需注册，即时开通。支持 HTTP 与 SOCKS5，巴拿马本土地址。',
    h1: '巴拿马移动代理 — 真实 +Móvil 与 Tigo 4G/LTE IP',
    intro:
      '我们的巴拿马 IP 池通过 +Móvil（Cable & Wireless）和 Tigo 的真实 SIM 卡出口——与巴拿马城手机的运营商 IP 完全相同。大多数代理网络中的拉美运营商 IP 都很稀缺，因此真正的巴拿马移动地址能让您进入一个机房 IP 段根本无法顺利触达的市场。',
    sections: [
      {
        heading: '稀缺的巴拿马运营商 IP',
        body: '很少有网络能提供真正的巴拿马移动 IP，这让 +Móvil 和 Tigo 出口具有真正的差异化优势。巴拿马平台和区域服务将这些 IP 段视为普通消费者流量，运营商 NAT 又让众多用户共享每个地址——因此在外国机房 IP 段会被过滤或直接地理封锁的地方，这些 IP 依然可用。',
      },
      {
        heading: '进入巴拿马市场',
        body: '只有受信任的本地访客，才能看到巴波亚/美元价格、西班牙语广告素材和仅限巴拿马的商品。通过真实的巴拿马运营商出口，区域零售和服务门户在您眼中的样子与巴拿马城的用户所见一致——正确的价格、正确的库存、正确的促销——对于这个原本难以观察的市场，这是本地化研究的关键。',
      },
      {
        heading: '轮换与会话',
        body: '粘性模式可在整个会话中保持一个 +Móvil IP；硬轮换则每个请求更换一次，适合更大范围的采集。通过唯一的会话 ID，每个巴拿马并行会话都有自己的 IP，无需管理任何 API。国家和轮换方式都写在 URL 中，在巴拿马移动与住宅出口之间切换即时生效。',
      },
    ],
    useCases: [
      '在难以触达的拉美市场进行本地化研究',
      '面向巴拿马的广告投放验证',
      '管理区域账户与服务',
      '巴拿马门户网站的可用性检查',
    ],
    faqs: [
      {
        q: 'IP 池包含哪些巴拿马运营商？',
        a: '出口使用物理 4G/LTE 调制解调器中 +Móvil（Cable & Wireless）和 Tigo 的真实 SIM 卡——与巴拿马手机获得的运营商 IP 相同。',
      },
      {
        q: '为什么要专门使用巴拿马移动代理？',
        a: '大多数网络中真正的巴拿马运营商 IP 都很稀缺。它们被视为本土流量，因此当地网站会返回真实内容，而不是像对待外国机房 IP 段那样进行地理封锁。',
      },
      {
        q: '如何计费？',
        a: '按 GB 计费，用量越大越便宜，低至 $5/GB，无需订阅。未使用的流量永不过期，也没有超额费用。',
      },
    ],
  },
  {
    code: 'am',
    slug: 'armenia',
    name: '亚美尼亚',
    shortName: '亚美尼亚',
    flag: '\u{1F1E6}\u{1F1F2}',
    capital: '埃里温',
    carriers: ['Team (Ucom)', 'Viva-MTS', 'Beeline'],
    title: '购买亚美尼亚移动代理 — 真实 Team 与 Viva-MTS 4G/LTE IP | ProxyMobile',
    description:
      '亚美尼亚移动代理，基于真实 Team、Viva-MTS 和 Beeline 4G/LTE 运营商 IP。按 GB 计费，低至 $5/GB，无需注册，即时开通。支持 HTTP 与 SOCKS5，亚美尼亚本土地址。',
    h1: '亚美尼亚移动代理 — 真实 Team、Viva-MTS 与 Beeline 4G/LTE IP',
    intro:
      '我们的亚美尼亚 IP 池通过 Team（Ucom）、Viva-MTS 和 Beeline 的真实 SIM 卡转发流量——与埃里温手机的运营商 IP 完全相同。亚美尼亚移动 IP 在商业代理网络中十分罕见，因此这些出口为您打开了一个几乎无法用机房 IP 段可信地触达的高加索市场。',
    sections: [
      {
        heading: '罕见的亚美尼亚运营商 IP',
        body: 'Viva-MTS 和 Team 运营的移动网络，被亚美尼亚平台识别为本土消费者流量。由于极少有服务商能提供真正的亚美尼亚移动 IP，这些出口很难被识别为代理流量，而运营商 NAT 又让众多真实用户共享每个地址——因此在外国机房 IP 会被立即封锁或地理限制的地方，它们依然可用。',
      },
      {
        heading: '观察亚美尼亚市场',
        body: '只有受信任的本地访客，才能看到德拉姆价格、亚美尼亚语广告素材和仅限亚美尼亚的商品。通过真实的亚美尼亚运营商出口，区域零售和服务门户在您眼中的样子与埃里温或久姆里的用户所见一致——正确的价格、正确的库存、正确的促销——对于任何面向亚美尼亚市场的研究或验证都至关重要。',
      },
      {
        heading: '轮换与并行会话',
        body: '粘性模式可在整个会话中固定一个 Viva-MTS IP；硬轮换则每个请求更换一次，适合更大范围的采集。通过唯一的会话 ID 运行多个亚美尼亚并行会话，每个会话使用独立的 IP——无需 API。国家和轮换方式都写在 URL 中，在亚美尼亚移动与住宅出口之间切换只需几秒钟。',
      },
    ],
    useCases: [
      '在服务稀缺的高加索市场进行本地化研究',
      '面向亚美尼亚的广告投放验证',
      '管理区域账户与服务',
      '亚美尼亚门户网站的可用性与价格检查',
    ],
    faqs: [
      {
        q: 'IP 池包含哪些亚美尼亚运营商？',
        a: '出口使用物理 4G/LTE 调制解调器中 Team（Ucom）、Viva-MTS 和 Beeline 的真实 SIM 卡——与亚美尼亚手机获得的运营商 IP 相同。',
      },
      {
        q: '亚美尼亚移动代理有什么用处？',
        a: '大多数网络中真正的亚美尼亚运营商 IP 都很罕见。它们被视为本土流量，因此亚美尼亚网站会返回真实内容，而不是像对待外国机房 IP 段那样进行地理封锁。',
      },
      {
        q: '起步价格是多少？',
        a: '按 GB 计费，用量越大越便宜，低至 $5/GB，无需订阅。未使用的流量永不过期，余额用完后密钥自动停止。',
      },
    ],
  },
  {
    code: 'nl',
    slug: 'netherlands',
    name: '荷兰',
    shortName: '荷兰',
    flag: '\u{1F1F3}\u{1F1F1}',
    capital: '阿姆斯特丹',
    carriers: ['KPN', 'Vodafone NL', 'Odido'],
    title: '购买荷兰移动代理 — 真实 KPN 与 Vodafone 4G/5G IP | ProxyMobile',
    description:
      '荷兰移动代理，基于真实 KPN、Vodafone NL 和 Odido 4G/5G 运营商 IP。按 GB 计费，低至 $5/GB，无需注册，即时开通。支持 HTTP 与 SOCKS5，荷兰本土地址。',
    h1: '荷兰移动代理 — 真实 KPN、Vodafone 与 Odido 4G/5G IP',
    intro:
      '我们的荷兰 IP 池通过 KPN、Vodafone NL 和 Odido 的真实 SIM 卡转发流量——与阿姆斯特丹或鹿特丹手机的运营商 IP 完全相同。荷兰移动网络拥有欧洲最好的基础设施之一，而且荷兰一直是我们美国以外规模最大的移动 IP 池之一，因此大规模运行荷兰并行会话时依然稳定。',
    sections: [
      {
        heading: '为什么荷兰运营商 IP 表现出色',
        body: '欧洲平台给予 KPN、Vodafone NL 等移动 ASN 的信任度远高于机房 IP 段。运营商级 NAT 让众多真实的荷兰用户共享每个地址，封禁一个 IP 就可能误伤真实顾客——这正是那些拒绝机房甚至住宅 IP 段的网站，会在第一个请求就放行荷兰运营商流量的原因。',
      },
      {
        heading: '规模大、稳定的荷兰 IP 池',
        body: '按在线节点数计算，荷兰是我们最大的移动 IP 池之一，因此您可以同时运行大量荷兰会话，而不会耗尽新 IP。对于账户管理和大范围采集而言，这种规模至关重要——每个会话都需要自己可信的地址，而不是反复使用少数几个 IP。',
      },
      {
        heading: '针对荷兰目标的轮换与会话',
        body: '使用粘性模式在登录会话中固定一个 KPN IP，或为每个请求轮换新的运营商 IP，进行大规模作业。同时运行数十个荷兰并行会话，每个会话对应自己的会话 ID 和 IP，无需调用 API。从荷兰移动 IP 池切换到荷兰住宅 IP 池，只需在同一个 URL 中改动三个字符。',
      },
    ],
    useCases: [
      '管理多个荷兰社交与电商平台账户',
      '面向荷兰的广告投放验证',
      '荷兰本地化的谷歌/零售价格与排名检查',
      '使用高信任度移动 IP 进行欧盟市场研究',
    ],
    faqs: [
      {
        q: 'IP 池包含哪些荷兰运营商？',
        a: '出口使用物理 4G/5G 调制解调器中 KPN、Vodafone NL 和 Odido 的真实 SIM 卡——与荷兰手机获得的运营商 IP 相同。',
      },
      {
        q: '荷兰移动代理有什么用处？',
        a: '荷兰运营商 IP 被视为本土消费者流量，因此荷兰及欧盟网站会返回真实的本地化内容，而不是像对待外国机房 IP 段那样进行地理封锁。荷兰也是我们规模最大的移动 IP 池之一，大规模使用时会话依然稳定。',
      },
      {
        q: '起步价格是多少？',
        a: '按 GB 计费，用量越大越便宜，低至 $5/GB，无需订阅。未使用的流量永不过期，余额用完后密钥自动停止。',
      },
    ],
  },
  {
    code: 'ge',
    slug: 'georgia',
    name: '格鲁吉亚',
    shortName: '格鲁吉亚',
    flag: '\u{1F1EC}\u{1F1EA}',
    capital: '第比利斯',
    carriers: ['Magti', 'Silknet', 'Cellfie'],
    title: '购买格鲁吉亚移动代理 — 真实 Magti 与 Silknet 4G/LTE IP | ProxyMobile',
    description:
      '格鲁吉亚（高加索地区）移动代理，基于真实 Magti、Silknet 和 Cellfie 4G/LTE 运营商 IP。按 GB 计费，低至 $5/GB，无需注册，即时开通。支持 HTTP 与 SOCKS5，格鲁吉亚本土地址。',
    h1: '格鲁吉亚移动代理 — 真实 Magti、Silknet 与 Cellfie 4G/LTE IP',
    intro:
      '我们的格鲁吉亚 IP 池通过 Magti、Silknet 和 Cellfie 的真实 SIM 卡转发流量——与第比利斯或巴统手机的运营商 IP 完全相同。格鲁吉亚移动 IP 在商业代理网络中十分稀缺，因此这些出口可以触达机房 IP 段无法可信覆盖的高加索市场。这里指的是格鲁吉亚这个国家（GE），而不是美国的佐治亚州。',
    sections: [
      {
        heading: '罕见的格鲁吉亚运营商 IP',
        body: 'Magti 和 Silknet 运营的移动网络，被格鲁吉亚平台视为本土消费者流量。由于很少有服务商能提供真正的格鲁吉亚移动 IP，这些出口很难被识别为代理流量，而运营商 NAT 又让众多真实用户共享每个地址——因此在外国机房 IP 一出现就会被地理封锁的地方，它们依然可用。',
      },
      {
        heading: '观察格鲁吉亚市场',
        body: '只有受信任的本地访客，才能看到拉里价格、格鲁吉亚语广告素材和仅限格鲁吉亚的商品。通过真实的格鲁吉亚运营商出口，区域零售和服务门户在您眼中的样子与第比利斯的用户所见一致——正确的价格、库存和促销——对于任何面向格鲁吉亚市场的研究或验证都至关重要。',
      },
      {
        heading: '轮换与并行会话',
        body: '粘性模式可在整个会话中固定一个 Magti IP；硬轮换则每个请求更换一次，适合更大范围的采集。通过唯一的会话 ID 运行多个格鲁吉亚并行会话，每个会话使用独立的 IP——无需 API。国家和轮换方式都写在 URL 中，在格鲁吉亚移动与住宅出口之间切换只需几秒钟。',
      },
    ],
    useCases: [
      '在服务稀缺的高加索市场进行本地化研究',
      '面向格鲁吉亚的广告投放验证',
      '管理区域账户与服务',
      '格鲁吉亚门户网站的可用性与价格检查',
    ],
    faqs: [
      {
        q: 'IP 池包含哪些格鲁吉亚运营商？',
        a: '出口使用物理 4G/LTE 调制解调器中 Magti、Silknet 和 Cellfie 的真实 SIM 卡——与格鲁吉亚手机获得的运营商 IP 相同。',
      },
      {
        q: '这里指的是国家还是美国的州？',
        a: '指的是位于高加索地区的格鲁吉亚（GE）这个国家，出口使用格鲁吉亚移动运营商——而不是美国的佐治亚州。',
      },
      {
        q: '起步价格是多少？',
        a: '按 GB 计费，用量越大越便宜，低至 $5/GB，无需订阅。未使用的流量永不过期，余额用完后密钥自动停止。',
      },
    ],
  },
];

export function getCountryZh(slug: string): Country | undefined {
  return COUNTRIES_ZH.find((c) => c.slug === slug);
}

/** Pick N sibling countries (for internal links), excluding the given slug. */
export function siblingCountriesZh(slug: string, n = 3): Country[] {
  const idx = COUNTRIES_ZH.findIndex((c) => c.slug === slug);
  const out: Country[] = [];
  for (let i = 1; out.length < n && i < COUNTRIES_ZH.length; i++) {
    out.push(COUNTRIES_ZH[(idx + i) % COUNTRIES_ZH.length]);
  }
  return out;
}

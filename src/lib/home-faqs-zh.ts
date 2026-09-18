/**
 * Simplified-Chinese homepage FAQ for /zh — shared by the rendered accordion
 * (client) and the FAQPage JSON-LD (server). Mirrors src/lib/home-faqs.ts.
 */
export const HOME_FAQS_ZH = [
  {
    q: '这些是什么类型的 IP？',
    a: '移动 IP 来自实体调制解调器中的真实 4G/5G SIM 卡，与您的手机从运营商获得的 IP 属于同一类型。住宅 IP 来自使用家庭宽带的真实安卓设备。我们的 IP 均不是机房（数据中心）IP。',
  },
  {
    q: '需要安装任何软件吗？',
    a: '不需要。我们使用标准的 HTTP 和 SOCKS5 代理协议。只要您的工具支持代理 URL——例如 curl、Python requests、Puppeteer、Scrapy——即可开箱即用。',
  },
  {
    q: '如何切换国家？',
    a: "只需修改代理 URL 中的两个字符。把 'us' 换成 'de'，下一个请求就会从德国出口。无需重新连接，也无需新凭证。",
  },
  {
    q: '流量用完后会怎样？',
    a: '您的密钥将停止接受连接。不会产生意外扣费，也没有超额费用。准备好后，在控制台充值即可继续使用。',
  },
  {
    q: '会记录我的浏览数据吗？',
    a: '我们仅出于计费目的统计带宽用量，不会记录代理流量的内容或您访问的网址。',
  },
  {
    q: '什么是访问码？',
    a: '访问码是您的登录凭证——一串简短的字母数字代码，无需邮箱或密码。可从您的服务商处获取，也可注册后自动生成。',
  },
];

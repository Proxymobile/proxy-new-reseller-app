import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'ProxyMobile — Mobile proxies on real 4G/5G LTE carrier IPs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px',
          background: 'linear-gradient(135deg, #070710 0%, #12122a 60%, #1b1b3a 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: '#a5b4fc',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#6366f1',
              color: '#fff',
              fontSize: 26,
            }}
          >
            ◈
          </div>
          ProxyMobile
        </div>

        <div
          style={{
            marginTop: 40,
            fontSize: 68,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            maxWidth: 900,
          }}
        >
          Mobile Proxies on Real 4G/5G LTE Carrier IPs
        </div>

        <div style={{ marginTop: 28, fontSize: 32, color: '#c7c9e0', maxWidth: 860 }}>
          Pay per GB from $5/GB · 9 countries · HTTP &amp; SOCKS5 · No signup
        </div>

        <div
          style={{
            marginTop: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: 26,
            color: '#34d399',
            fontFamily: 'monospace',
          }}
        >
          gw.proxies.sx:7000
        </div>
      </div>
    ),
    { ...size },
  );
}

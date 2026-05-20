import { ReactNode } from 'react';

const I = ({ children, className = 'h-4 w-4' }: { children: ReactNode; className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

export const IconHome = ({ className }: { className?: string }) => (
  <I className={className}><path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-7h4v7h4a1 1 0 001-1V10" /></I>
);
export const IconCart = ({ className }: { className?: string }) => (
  <I className={className}><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293A1 1 0 005.414 17H17M9 21a1 1 0 11-2 0 1 1 0 012 0zM20 21a1 1 0 11-2 0 1 1 0 012 0z" /></I>
);
export const IconKey = ({ className }: { className?: string }) => (
  <I className={className}><path d="M15 7a4 4 0 11-3.4 6.1L7 18H4v-3l5.9-5.9A4 4 0 0115 7zM18 6h.01" /></I>
);
export const IconBilling = ({ className }: { className?: string }) => (
  <I className={className}><rect x="2" y="6" width="20" height="13" rx="2" /><path d="M2 10h20M6 15h4" /></I>
);
export const IconSettings = ({ className }: { className?: string }) => (
  <I className={className}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></I>
);
export const IconSupport = ({ className }: { className?: string }) => (
  <I className={className}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" /></I>
);
export const IconShield = ({ className }: { className?: string }) => (
  <I className={className}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></I>
);
export const IconBell = ({ className }: { className?: string }) => (
  <I className={className}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></I>
);
export const IconPlus = ({ className }: { className?: string }) => (
  <I className={className}><path d="M12 5v14M5 12h14" /></I>
);
export const IconChevronDown = ({ className }: { className?: string }) => (
  <I className={className}><path d="M6 9l6 6 6-6" /></I>
);
export const IconLogOut = ({ className }: { className?: string }) => (
  <I className={className}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></I>
);
export const IconMenu = ({ className }: { className?: string }) => (
  <I className={className}><path d="M3 12h18M3 6h18M3 18h18" /></I>
);
export const IconX = ({ className }: { className?: string }) => (
  <I className={className}><path d="M18 6L6 18M6 6l12 12" /></I>
);
export const IconWallet = ({ className }: { className?: string }) => (
  <I className={className}><path d="M21 12V7H5a2 2 0 010-4h14v4M3 5v14a2 2 0 002 2h16v-5M18 12a2 2 0 100 4h3v-4z" /></I>
);
export const IconActivity = ({ className }: { className?: string }) => (
  <I className={className}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></I>
);
export const IconGlobe = ({ className }: { className?: string }) => (
  <I className={className}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 010 20 15 15 0 010-20" /></I>
);
export const IconClock = ({ className }: { className?: string }) => (
  <I className={className}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></I>
);
export const IconCheck = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
);
export const IconCopy = ({ className }: { className?: string }) => (
  <I className={className}><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></I>
);

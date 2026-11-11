/**
 * Cart Session Attribution & Traffic Source Parser
 * Matches attribution tracking from Smokey-React for full fidelity.
 */

export interface ParsedAttribution {
  source: string
  platform: string
  isAd: boolean
  badgeText: string
  color: string
  bg: string
  border: string
  campaign?: string | null
  medium?: string | null
  content?: string | null
  term?: string | null
  clickId?: string | null
  referrer?: string | null
  url?: string | null
  raw?: string
}

export function parseCartSessionAttribution(session: any = {}): ParsedAttribution {
  const meta = session?.metadata || {}
  const attr = meta.attribution || {}
  const ref = meta.referrer || ''
  const url = meta.url || ''

  let trafficSource = attr.traffic_source || ''
  let channel = attr.channel || ''
  let isAd = attr.is_ad ?? false
  const campaign = attr.utm_campaign || null
  const medium = attr.utm_medium || null
  const content = attr.utm_content || null
  const term = attr.utm_term || null
  const clickId = attr.ad_click_id || null

  // Fallback 1: Infer from referrer if trafficSource is not set
  if (!trafficSource && ref) {
    const refLower = String(ref).toLowerCase()
    if (refLower.includes('snapchat')) {
      trafficSource = 'Snapchat Ad'
      channel = 'Snapchat'
      isAd = true
    } else if (refLower.includes('instagram')) {
      trafficSource = 'Instagram'
      channel = 'Instagram'
    } else if (refLower.includes('facebook')) {
      trafficSource = 'Facebook'
      channel = 'Facebook'
    } else if (refLower.includes('google.')) {
      trafficSource = 'Google Search'
      channel = 'Google'
    } else if (refLower.includes('tiktok')) {
      trafficSource = 'TikTok'
      channel = 'TikTok'
    } else if (refLower.includes('t.co') || refLower.includes('twitter')) {
      trafficSource = 'Twitter / X'
      channel = 'Twitter / X'
    }
  }

  // Fallback 2: Check any raw string in metadata
  if (!trafficSource) {
    const metaStr = JSON.stringify(meta).toLowerCase()
    if (metaStr.includes('snapchat') || metaStr.includes('sccid')) {
      trafficSource = 'Snapchat Ad'
      channel = 'Snapchat'
      isAd = true
    } else if (
      metaStr.includes('whatsapp') ||
      metaStr.includes('l.wl.co') ||
      metaStr.includes('wl.co') ||
      metaStr.includes('wa.link')
    ) {
      trafficSource = 'WhatsApp'
      channel = 'WhatsApp'
    } else if (metaStr.includes('instagram')) {
      trafficSource = 'Instagram'
      channel = 'Instagram'
    } else if (metaStr.includes('facebook') || metaStr.includes('fbclid')) {
      trafficSource = 'Facebook'
      channel = 'Facebook'
    }
  }

  if (!trafficSource) {
    trafficSource = 'Direct'
    channel = 'Direct'
  }

  const sLower = trafficSource.toLowerCase()

  // Snapchat
  if (sLower.includes('snap')) {
    return {
      source: 'Snapchat Ad',
      platform: 'Snapchat',
      isAd: true,
      badgeText: 'Snapchat Ad',
      color: '#854d0e',
      bg: '#fef9c3',
      border: '#fde047',
      campaign,
      medium: medium || 'paid',
      content,
      term,
      clickId,
      referrer: ref,
      url,
      raw: trafficSource,
    }
  }

  // WhatsApp
  if (
    sLower.includes('whatsapp') ||
    sLower === 'wa' ||
    (ref && (ref.includes('l.wl.co') || ref.includes('wl.co') || ref.includes('whatsapp') || ref.includes('wa.link') || ref.includes('wa.me')))
  ) {
    return {
      source: 'WhatsApp',
      platform: 'WhatsApp',
      isAd: false,
      badgeText: 'WhatsApp',
      color: '#15803d',
      bg: '#dcfce7',
      border: '#86efac',
      campaign,
      medium: medium || 'chat',
      content,
      term,
      clickId,
      referrer: ref,
      url,
      raw: trafficSource,
    }
  }

  // Instagram
  if (sLower.includes('instagram') || sLower.includes('ig')) {
    const isIgAd = isAd || sLower.includes('ad')
    return {
      source: isIgAd ? 'Instagram Ad' : 'Instagram',
      platform: 'Instagram',
      isAd: isIgAd,
      badgeText: isIgAd ? 'Instagram Ad' : 'Instagram (Bio/Link)',
      color: '#be185d',
      bg: '#fce7f3',
      border: '#fbcfe8',
      campaign,
      medium: medium || (isIgAd ? 'paid' : 'social'),
      content,
      term,
      clickId,
      referrer: ref,
      url,
      raw: trafficSource,
    }
  }

  // Facebook
  if (sLower.includes('facebook') || sLower.includes('fb')) {
    const isFbAd = isAd || sLower.includes('ad')
    return {
      source: isFbAd ? 'Facebook Ad' : 'Facebook',
      platform: 'Facebook',
      isAd: isFbAd,
      badgeText: isFbAd ? 'Facebook Ad' : 'Facebook',
      color: '#1d4ed8',
      bg: '#dbeafe',
      border: '#bfdbfe',
      campaign,
      medium: medium || (isFbAd ? 'paid' : 'social'),
      content,
      term,
      clickId,
      referrer: ref,
      url,
      raw: trafficSource,
    }
  }

  // Google
  if (sLower.includes('google')) {
    const isGoogleAd = isAd || sLower.includes('ad')
    return {
      source: isGoogleAd ? 'Google Ad' : 'Google Search',
      platform: 'Google',
      isAd: isGoogleAd,
      badgeText: isGoogleAd ? 'Google Ad' : 'Google',
      color: '#047857',
      bg: '#d1fae5',
      border: '#a7f3d0',
      campaign,
      medium: medium || (isGoogleAd ? 'cpc' : 'organic'),
      content,
      term,
      clickId,
      referrer: ref,
      url,
      raw: trafficSource,
    }
  }

  // Direct / Fallback
  return {
    source: channel || 'Direct',
    platform: channel || 'Direct',
    isAd: false,
    badgeText: channel || 'Direct Storefront',
    color: '#4b5563',
    bg: '#f3f4f6',
    border: '#e5e7eb',
    campaign,
    medium,
    content,
    term,
    clickId,
    referrer: ref,
    url,
    raw: trafficSource,
  }
}


import { WhiteLabelConfig } from '../types/game';
import { DEFAULT_WHITE_LABEL } from '../data/whiteLabelDefaults';

// Token Replacer to scrub proprietary names and format generic white-label UI text
export function formatLabel(text: string, config: WhiteLabelConfig = DEFAULT_WHITE_LABEL): string {
  if (!text) return '';

  return text
    .replace(/Acme Tycoon/gi, `${config.appName} (White-Label)`)
    .replace(/Acme Plus/gi, `${config.appName} VIP`)
    .replace(/Acme/gi, config.appName)
    .replace(/Zesto/gi, config.rivalAlphaName)
    .replace(/Swish/gi, config.rivalBetaName)
    .replace(/Bengaluru/gi, config.metroName)
    .replace(/Bellandur/gi, 'Tech Park District')
    .replace(/Koramangala/gi, 'Urban Residential Sector')
    .replace(/Whitefield/gi, 'Suburban Tech Corridor')
    .replace(/Indiranagar/gi, 'Commercial Avenue')
    .replace(/HSR Layout|HSR/gi, 'Innovation Basin')
    .replace(/Jayanagar/gi, 'Heritage Quarter')
    .replace(/Biryani Yard/gi, 'Kitchen Alpha')
    .replace(/Embassy Bowl Co/gi, 'Kitchen Beta')
    .replace(/Dose Counter/gi, 'Kitchen Gamma')
    .replace(/5th Block Shawarma/gi, 'Kitchen Delta')
    .replace(/Church Street Pasta/gi, 'Kitchen Epsilon')
    .replace(/Filter Lab/gi, 'Kitchen Zeta')
    .replace(/100ft Thali House/gi, 'Kitchen Eta')
    .replace(/Night Kitchen/gi, 'Kitchen Theta')
    .replace(/Mega Sale|BBD/gi, 'Annual Festival Campaign')
    .replace(/FSSAI/gi, config.regulatorName)
    .replace(/WhatsApp/gi, 'Fleet Messenger')
    .replace(/IPL/gi, 'Stadium Championship')
    .replace(/₹/g, config.currencySymbol);
}

// Currency formatting helper
export function formatCurrency(amount: number, config: WhiteLabelConfig = DEFAULT_WHITE_LABEL): string {
  const symbol = config?.currencySymbol || '₹';
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  return `${isNegative ? '-' : ''}${symbol}${Math.round(abs).toLocaleString('en-US')}`;
}

// Compact currency (e.g. ₹50k, ₹1.5L, $100k)
export function formatMoneyShort(amount: number, config: WhiteLabelConfig = DEFAULT_WHITE_LABEL): string {
  const symbol = config?.currencySymbol || '₹';
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  let formatted = '';
  if (abs >= 1000000) {
    formatted = `${(abs / 1000000).toFixed(1)}M`;
  } else if (abs >= 100000) {
    formatted = `${(abs / 100000).toFixed(1)}L`;
  } else if (abs >= 1000) {
    formatted = `${Math.round(abs / 1000)}k`;
  } else {
    formatted = `${Math.round(abs)}`;
  }

  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}

export function formatClock(minutes: number): string {
  const hrs = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

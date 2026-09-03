/**
 * Converts numbers into official French verbal currency strings for receipts & invoices
 * e.g. 4858 -> "QUATRE MILLE HUIT CENT CINQUANTE-HUIT"
 */

const UNITS = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF'];
const TEENS = ['DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIX-SEPT', 'DIX-HUIT', 'DIX-NEUF'];
const TENS = ['', 'DIX', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTE-DIX', 'QUATRE-VINGT', 'QUATRE-VINGT-DIX'];

function convertUnder100(num: number): string {
  if (num === 0) return '';
  if (num < 10) return UNITS[num];
  if (num >= 10 && num < 20) return TEENS[num - 10];
  
  const ten = Math.floor(num / 10);
  const rem = num % 10;

  if (ten === 7) {
    if (rem === 1) return 'SOIXANTE ET ONZE';
    return `SOIXANTE-${TEENS[rem]}`;
  }
  if (ten === 9) {
    return `QUATRE-VINGT-${TEENS[rem]}`;
  }
  if (ten === 8 && rem === 0) {
    return 'QUATRE-VINGTS';
  }

  if (rem === 1 && ten < 8) {
    return `${TENS[ten]} ET UN`;
  }

  const remStr = rem > 0 ? `-${UNITS[rem]}` : '';
  return `${TENS[ten]}${remStr}`;
}

function convertUnder1000(num: number): string {
  if (num === 0) return '';
  const hundred = Math.floor(num / 100);
  const rem = num % 100;

  let hundredStr = '';
  if (hundred === 1) {
    hundredStr = 'CENT';
  } else if (hundred > 1) {
    hundredStr = `${UNITS[hundred]} CENT${rem === 0 ? 'S' : ''}`;
  }

  const remStr = convertUnder100(rem);
  if (hundredStr && remStr) return `${hundredStr} ${remStr}`;
  return hundredStr || remStr;
}

export function numberToFrenchWords(amount: number): string {
  if (!amount || amount === 0) return 'ZÉRO';

  const num = Math.round(Math.abs(amount));
  if (num === 0) return 'ZÉRO';

  const billions = Math.floor(num / 1000000000);
  const millions = Math.floor((num % 1000000000) / 1000000);
  const thousands = Math.floor((num % 1000000) / 1000);
  const remainder = num % 1000;

  const parts: string[] = [];

  if (billions > 0) {
    if (billions === 1) parts.push('UN MILLIARD');
    else parts.push(`${convertUnder1000(billions)} MILLIARDS`);
  }

  if (millions > 0) {
    if (millions === 1) parts.push('UN MILLION');
    else parts.push(`${convertUnder1000(millions)} MILLIONS`);
  }

  if (thousands > 0) {
    if (thousands === 1) parts.push('MILLE');
    else parts.push(`${convertUnder1000(thousands)} MILLE`);
  }

  if (remainder > 0) {
    parts.push(convertUnder1000(remainder));
  }

  return parts.join(' ').trim();
}

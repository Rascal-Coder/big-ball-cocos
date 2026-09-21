import { Color, Font, Label } from 'cc';

/** 全站字：Playfair Display（display-latin）。 */
export const GAME_FONT = 'fonts/display-latin';

export function applyGameFace(label: Label, font: Font | null = null): void {
    if (!font) {
        return;
    }
    label.useSystemFont = false;
    label.font = font;
}

const TITLE_INK = new Color(255, 226, 140, 255);
const TITLE_EDGE = new Color(58, 30, 8, 220);

/** 加载页 / 首页「泥球大侠」同一套金箔字。 */
export function applyTitleFace(label: Label): void {
    label.fontSize = 64;
    label.lineHeight = 80;
    label.spacingX = 4;
    label.color = TITLE_INK;
    label.enableOutline = true;
    label.outlineColor = TITLE_EDGE;
    label.outlineWidth = 3;
    label.cacheMode = Label.CacheMode.BITMAP;
}

/** 金币等数量展示。满 1000 用 k，满 10000 用 w，满 1 亿用 y。只截一位小数，不四舍五入虚高。 */
export function formatCompactAmount(value: number): string {
    const n = Math.max(0, Math.floor(value));
    if (n >= 100_000_000) {
        return compact(n, 100_000_000, 'y');
    }
    if (n >= 10_000) {
        return compact(n, 10_000, 'w');
    }
    if (n >= 1_000) {
        return compact(n, 1_000, 'k');
    }
    return String(n);
}

function compact(n: number, unit: number, suffix: string): string {
    const scaled = Math.floor((n / unit) * 10) / 10;
    const body = Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1);
    return `${body}${suffix}`;
}

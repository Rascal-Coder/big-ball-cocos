/** Engine-independent runner simulation. World coordinates increase toward the horizon. */
export type Power = 'magnet' | 'shield' | 'boot';
export type RunState = 'ready' | 'running' | 'paused' | 'over';
export interface RunItem {
    id: number; x: number; y: number; kind: 'coin' | 'obstacle' | 'heart' | Power;
    art: string; radius: number; taken: boolean; cleared?: boolean;
}
export interface RunEvent { type: 'coin' | 'hit' | 'shield' | 'power' | 'mission' | 'jump' | 'land'; x: number; }
export const LANES = [-145, 0, 145];
export const PLAYER_Y = -250;

export class RunnerModel {
    state: RunState = 'ready';
    lane = 1;
    x = 0;
    travel = 0;
    coins = 0;
    lives = 3;
    time = 0;
    height = 0;
    weight = 12;
    private verticalSpeed = 0;
    private jumpCooldown = 0;
    get ballScale(): number { return 1 + (this.weight - 12) / 220; }
    get airborne(): boolean { return this.height > 0 || this.verticalSpeed > 0; }
    invulnerable = 0;
    missionComplete = false;
    powers: Record<Power, number> = { magnet: 0, shield: 0, boot: 0 };
    charges: Record<Power, number> = { magnet: 1, shield: 1, boot: 1 };
    items: RunItem[] = [];
    events: RunEvent[] = [];
    private seed = 1;
    private nextRow = 430;
    private serial = 0;
    private rows = 0;
    private safeLane = 1;
    get distance(): number { return Math.floor(this.travel / 24); }
    get score(): number { return this.distance * 10 + this.coins * 25 + (this.missionComplete ? 1000 : 0); }
    get speed(): number { return (255 + Math.min(175, this.distance * 0.3)) * (this.powers.boot > 0 ? 1.45 : 1); }
    reset(seed = Date.now()): void {
        this.seed = seed >>> 0 || 1;
        this.state = 'running'; this.lane = 1; this.x = 0; this.travel = 0;
        this.coins = 0; this.lives = 3; this.time = 0; this.invulnerable = 0;
        this.height = 0; this.weight = 12; this.verticalSpeed = 0; this.jumpCooldown = 0;
        this.missionComplete = false; this.items = []; this.events = [];
        this.powers = { magnet: 0, shield: 0, boot: 0 };
        this.charges = { magnet: 1, shield: 1, boot: 1 };
        this.nextRow = 430; this.serial = 0; this.rows = 0; this.safeLane = 1;
        this.spawnAhead();
    }
    move(direction: number): void {
        if (this.state === 'running') this.lane = Math.max(0, Math.min(2, this.lane + Math.sign(direction)));
    }
    pause(): void { if (this.state === 'running') this.state = 'paused'; }
    jump(): boolean {
        if (this.state !== 'running' || this.airborne || this.jumpCooldown > 0) return false;
        this.verticalSpeed = 620; this.jumpCooldown = 0.16;
        this.events.push({ type: 'jump', x: this.x });
        return true;
    }
    resume(): void { if (this.state === 'paused') this.state = 'running'; }
    use(power: Power): boolean {
        if (this.state !== 'running' || this.charges[power] <= 0 || this.powers[power] > 0) return false;
        this.charges[power]--; this.activate(power); return true;
    }
    private activate(power: Power): void {
        this.powers[power] = power === 'shield' ? 12 : 8;
        this.events.push({ type: 'power', x: this.x });
    }
    tick(dt: number): void {
        if (this.state !== 'running') return;
        // Substeps prevent tunneling during long frames without teleporting after tab suspension.
        let remaining = Math.min(0.1, Math.max(0, dt));
        while (remaining > 0 && this.state === 'running') {
            const step = Math.min(remaining, 1 / 60);
            this.step(step); remaining -= step;
        }
    }
    private step(dt: number): void {
        this.time += dt;
        this.jumpCooldown = Math.max(0, this.jumpCooldown - dt);
        if (this.airborne) {
            this.height = Math.max(0, this.height + this.verticalSpeed * dt - 700 * dt * dt);
            this.verticalSpeed -= 1400 * dt;
            if (this.height === 0 && this.verticalSpeed < 0) {
                this.verticalSpeed = 0;
                this.events.push({ type: 'land', x: this.x });
            }
        }
        this.invulnerable = Math.max(0, this.invulnerable - dt);
        for (const key of ['magnet', 'shield', 'boot'] as Power[]) this.powers[key] = Math.max(0, this.powers[key] - dt);
        this.x += (LANES[this.lane] - this.x) * (1 - Math.exp(-18 * dt));
        this.travel += this.speed * dt;
        this.weight = Math.min(100, this.weight + dt * 0.12);
        this.spawnAhead();
        for (const item of this.items) {
            if (item.taken || item.cleared) continue;
            const dy = item.y - this.travel;
            if (item.kind === 'coin' && this.powers.magnet > 0 && Math.abs(dy) < 255) {
                item.x += (this.x - item.x) * Math.min(1, dt * 10);
            }
            if (item.kind === 'obstacle') {
                if (Math.abs(item.x - this.x) > item.radius + 32 || Math.abs(dy) > 36) continue;
                if (this.height > (item.art === 'cart' ? 76 : 48)) {
                    item.cleared = true;
                    continue;
                }
            } else {
                const radius = item.radius + 32;
                if (Math.abs(dy) > radius || Math.hypot(item.x - this.x, dy) > radius) continue;
            }
            item.taken = true;
            if (item.kind === 'coin') {
                this.coins++; this.weight = Math.min(100, this.weight + 0.65); this.events.push({ type: 'coin', x: item.x });
                if (this.coins >= 50 && !this.missionComplete) {
                    this.missionComplete = true; this.events.push({ type: 'mission', x: this.x });
                }
            } else if (item.kind === 'heart') {
                this.lives = Math.min(3, this.lives + 1); this.events.push({ type: 'power', x: this.x });
            } else if (item.kind !== 'obstacle') {
                this.activate(item.kind);
            } else if (this.invulnerable <= 0) {
                if (this.powers.shield > 0 || this.powers.boot > 0) {
                    if (this.powers.boot <= 0) this.powers.shield = 0;
                    this.invulnerable = 0.35;
                    this.events.push({ type: 'shield', x: this.x });
                } else {
                    this.lives--; this.weight = Math.max(12, this.weight - 8); this.invulnerable = 1.6;
                    this.events.push({ type: 'hit', x: this.x });
                    if (this.lives === 0) this.state = 'over';
                }
            }
        }
        this.items = this.items.filter(item => !item.taken && item.y > this.travel - 220);
    }
    private random(): number {
        this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
        return this.seed / 4294967296;
    }
    private add(lane: number, y: number, kind: RunItem['kind'], art = kind as string): void {
        this.items.push({ id: this.serial++, x: LANES[lane], y, kind, art, radius: kind === 'obstacle' ? 43 : 20, taken: false });
    }
    private spawnAhead(): void {
        const obstacles = ['stone-ball', 'rock-pile', 'tnt', 'cart', 'crate', 'spike-fence'];
        while (this.nextRow < this.travel + 1700) {
            // Only adjacent safe-lane changes; each row always has a guaranteed open route.
            if (this.rows > 1) this.safeLane = Math.max(0, Math.min(2, this.safeLane + (this.random() < 0.5 ? -1 : 1)));
            for (let lane = 0; lane < 3; lane++) {
                if (lane !== this.safeLane && this.random() < (this.rows < 3 ? 0.55 : 0.8)) {
                    this.add(lane, this.nextRow, 'obstacle', obstacles[Math.floor(this.random() * obstacles.length)]);
                }
            }
            for (let c = 0; c < 3; c++) this.add(this.safeLane, this.nextRow - 85 + c * 85, 'coin');
            if (this.rows > 0 && this.rows % 7 === 0) {
                const kind = (['magnet', 'shield', 'boot', 'heart'] as const)[Math.floor(this.random() * 4)];
                this.add(this.safeLane, this.nextRow + 170, kind);
            }
            this.rows++; this.nextRow += 355;
        }
    }
}

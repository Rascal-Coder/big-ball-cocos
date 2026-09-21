import { sys } from 'cc';
export class RunSessionService {
    static skin = 'cowboy';
    private static memoryBest = 0;
    static get best(): number {
        try { return Math.max(this.memoryBest, Number(sys.localStorage.getItem('golden-roll-best')) || 0); } catch { return this.memoryBest; }
    }
    static save(score: number, coins: number, distance = 0, weight = 12): void {
        this.memoryBest = Math.max(this.best, score);
        try {
            sys.localStorage.setItem('golden-roll-best', String(this.memoryBest));
            sys.localStorage.setItem('golden-roll-last-run', JSON.stringify({ score, coins, distance, weight: Math.round(weight) }));
            const wallet = Number(sys.localStorage.getItem('golden-roll-wallet') ?? '9999');
            sys.localStorage.setItem('golden-roll-wallet', String((Number.isFinite(wallet) ? wallet : 9999) + coins));
        } catch { /* Session record still works when storage is disabled. */ }
    }
}

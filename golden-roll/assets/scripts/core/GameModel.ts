import { sys } from 'cc';
import { resolveAvatarSkin } from '../avatar/AvatarSkinData';
import { DEFAULT_SKIN_ID } from './Skin';

const SKIN_KEY = 'nbdx-skin-id';

export class GameModel {
    gold = 0;
    wallet = 9999;
    skinId = resolveAvatarSkin(sys.localStorage.getItem(SKIN_KEY) || DEFAULT_SKIN_ID).id;
    distance = 0;
    weight = 12;
    lives = 3;
    readonly maxWeight = 100;
    readonly maxLives = 3;

    reset(): void {
        this.gold = 0;
        this.distance = 0;
        this.weight = 12;
        this.lives = this.maxLives;
    }

    addGold(amount: number): void {
        this.gold += Math.max(0, Math.floor(amount));
    }

    addMud(amount: number): void {
        this.weight = Math.min(this.maxWeight, this.weight + Math.max(0, amount));
    }

    addDistance(meters: number): void {
        if (meters > 0) {
            this.distance += meters;
        }
    }

    hitObstacle(): boolean {
        this.lives = Math.max(0, this.lives - 1);
        return this.lives <= 0;
    }

    get weightPercent(): number {
        return Math.round((this.weight / this.maxWeight) * 100);
    }

    get isDead(): boolean {
        return this.lives <= 0;
    }

    setSkin(id: string): void {
        this.skinId = resolveAvatarSkin(id).id;
        sys.localStorage.setItem(SKIN_KEY, this.skinId);
    }
}

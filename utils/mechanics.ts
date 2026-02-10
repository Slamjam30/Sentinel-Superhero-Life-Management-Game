
import { Player, LockCondition, GameState, PlayerStats, Item, Task, DowntimeActivity } from '../types';

export const getEffectiveStats = (player: Player): PlayerStats => {
    const stats: PlayerStats = { ...player.stats }; // Copy base stats

    // Apply equipment bonuses
    Object.values(player.equipment).forEach((item: Item | null) => {
        if (item && item.effects) {
            if (item.effects.smarts) stats.smarts += item.effects.smarts;
            if (item.effects.charm) stats.charm += item.effects.charm;
            if (item.effects.coordination) stats.coordination += item.effects.coordination;
            if (item.effects.will) stats.will += item.effects.will;
        }
    });

    // Floor the stats to ensure partial XP (e.g. 10.5) only counts as the integer value (10) for checks
    return {
        smarts: Math.floor(stats.smarts),
        charm: Math.floor(stats.charm),
        coordination: Math.floor(stats.coordination),
        will: Math.floor(stats.will)
    };
};

export const getPlayerAveragePowerLevel = (player: Player): number => {
    if (!player.powers || player.powers.length === 0) return 0;
    const totalLevel = player.powers.reduce((acc, p) => acc + p.level, 0);
    return parseFloat((totalLevel / player.powers.length).toFixed(1));
};

export const calculateTaskDifficulty = (task: Task, currentDay: number): number => {
    if (!task.scaling) return task.difficulty;

    const { startDay, intervalDays, levelIncrease, maxLevel } = task.scaling;
    
    if (currentDay < startDay) return task.difficulty;

    const intervalsPassed = Math.floor((currentDay - startDay) / intervalDays);
    const increase = intervalsPassed * levelIncrease;
    
    return Math.min(maxLevel, task.difficulty + increase);
};

export const calculateTrainingXp = (player: Player, activity: DowntimeActivity, targetType: 'STAT' | 'POWER', targetKey: string): { total: number, breakdown: string } => {
    let base = 0;
    if (targetType === 'STAT') {
        base = activity.trainingConfig?.attributeXp || 0.25; // Default .25
    } else {
        base = activity.trainingConfig?.powerXp || 20; // Default 20
    }

    let bonus = 0;
    const sources: string[] = [];

    // Check Upgrades
    player.baseUpgrades.forEach(u => {
        if (u.owned && u.trainingModifiers) {
            // Check specific stat key (e.g. 'smarts') or generic 'POWER' key
            const modKey = targetType === 'STAT' ? targetKey : 'POWER';
            if (u.trainingModifiers[modKey]) {
                const val = u.trainingModifiers[modKey];
                bonus += val;
                sources.push(`${u.name} (+${val})`);
            }
        }
    });

    const total = base + bonus;
    let breakdown = `Base: ${base}`;
    if (sources.length > 0) {
        breakdown += ` + Bonuses: ${sources.join(', ')}`;
    }
    
    return { total, breakdown };
};

export const calculateWorkIncome = (player: Player, activity: DowntimeActivity): { total: number, breakdown: string } => {
    let base = activity.autoRewards?.money || 0;
    let bonus = 0;
    const sources: string[] = [];

    // Check Upgrades for work bonuses
    player.baseUpgrades.forEach(u => {
        if (u.owned && u.workMoneyBonus) {
            bonus += u.workMoneyBonus;
            sources.push(`${u.name} (+$${u.workMoneyBonus})`);
        }
    });

    const total = base + bonus;
    let breakdown = `Base: $${base}`;
    if (sources.length > 0) {
        breakdown += ` + Bonuses: ${sources.join(', ')}`;
    }
    return { total, breakdown };
};

export const checkCondition = (player: Player, gameState: GameState, condition: LockCondition): boolean => {
    switch (condition.type) {
        case 'STAT': {
            // Use effective stats for checks (already floored)
            const stats = getEffectiveStats(player);
            const statVal = stats[condition.key as keyof PlayerStats];
            return compare(statVal, condition.value, condition.operator);
        }
        case 'RESOURCE': {
            const resVal = player.resources[condition.key as keyof typeof player.resources];
            return compare(resVal, condition.value, condition.operator);
        }
        case 'TAG': {
            const hasTag = player.tags.includes(condition.key);
            return condition.operator === 'HAS' ? hasTag : !hasTag;
        }
        case 'ITEM': {
            const hasItem = player.inventory.some(i => i.id === condition.key) || 
                            Object.values(player.equipment).some(i => i?.id === condition.key);
            return condition.operator === 'HAS' ? hasItem : !hasItem;
        }
        case 'DAY': {
            return compare(gameState.day, condition.value, condition.operator);
        }
        case 'REPUTATION': {
            const repVal = player.reputations[condition.key] || 0;
            return compare(repVal, condition.value, condition.operator);
        }
        case 'UPGRADE': {
            const upgrade = player.baseUpgrades.find(u => u.id === condition.key);
            const isOwned = upgrade ? upgrade.owned : false;
            return condition.operator === 'HAS' ? isOwned : !isOwned;
        }
        case 'MASK': {
             return compare(player.resources.mask, condition.value, condition.operator);
        }
        case 'TASK': {
            // Check global pool for persistent state
            const task = gameState.taskPool.find(t => t.id === condition.key);
            const count = task?.completionCount || 0;
            
            if (condition.operator === 'HAS') return count > 0;
            if (condition.operator === 'NOT_HAS') return count === 0;
            
            return compare(count, condition.value, condition.operator);
        }
        default:
            return true;
    }
};

export const checkAllConditions = (player: Player, gameState: GameState, conditions?: LockCondition[]): boolean => {
    if (!conditions || conditions.length === 0) return true;
    return conditions.every(c => checkCondition(player, gameState, c));
};

const compare = (a: any, b: any, op: string): boolean => {
    switch (op) {
        case 'GT': return a > b;
        case 'LT': return a < b;
        case 'EQ': return a === b;
        default: return false;
    }
};

export const applyDerivedStats = (player: Player): Player => {
    return player;
};
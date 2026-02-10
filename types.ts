
export enum Identity {
  CIVILIAN = 'CIVILIAN',
  SUPER = 'SUPER'
}

export enum StatType {
  SMARTS = 'Smarts',
  CHARM = 'Charm',
  COORDINATION = 'Coordination',
  WILL = 'Will'
}

export enum SuccessLevel {
  CRITICAL_FAILURE = 'CRITICAL_FAILURE',
  MAJOR_FAILURE = 'MAJOR_FAILURE',
  FAILURE = 'FAILURE',
  BARELY_SUCCESS = 'BARELY_SUCCESS',
  PARTIAL_SUCCESS = 'PARTIAL_SUCCESS',
  COMPLETE_SUCCESS = 'COMPLETE_SUCCESS'
}

export interface PlayerStats {
  smarts: number;
  charm: number;
  coordination: number;
  will: number;
}

export interface PlayerResources {
  money: number;
  mask: number; // 0-100
  fame: number;
  publicOpinion: number; // -100 (Villain) to 100 (Hero)
}

export interface RewardSet extends Partial<PlayerResources & PlayerStats> {
    itemIds?: string[];
    newSuggestions?: string[]; // New: Suggestions to add to the pool
    // Helper for specific targeted rewards handled by engine
    targetXp?: {
        targetId: string; // 'smarts' or power ID
        amount: number;
        type: 'STAT' | 'POWER';
    };
}

// --- New Locking Mechanism ---
export interface LockCondition {
    type: 'STAT' | 'RESOURCE' | 'ITEM' | 'TAG' | 'DAY' | 'REPUTATION' | 'UPGRADE' | 'MASK' | 'TASK';
    key: string; // e.g., 'smarts', 'fame', 'itemId', 'tagName', 'Faction Name', 'upgradeId'
    operator: 'GT' | 'LT' | 'EQ' | 'HAS' | 'NOT_HAS' | 'ACTIVE';
    value: number | string | boolean;
}

export interface PowerUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number; // Skill Points cost
  requiredLevel: number; // Power level required
  unlocked: boolean;
  parentId?: string; // For tree structure, null if root
  type: 'PASSIVE' | 'ABILITY';
  conditions?: LockCondition[];
}

export interface Power {
  id: string;
  name: string;
  description: string;
  level: number;
  xp: number;
  maxXp: number;
  abilities: string[]; // List of active ability names for display
  upgrades: PowerUpgrade[]; // The Skill Tree nodes
  tier?: 'STREET' | 'HEROIC' | 'COSMIC'; // Helper for creation cost
}

// --- New Equipment System ---
export type EquipmentSlotType = 'HEAD' | 'BODY' | 'GADGET' | 'ACCESSORY';

export interface Item {
  id: string;
  name: string;
  description: string;
  type: 'CONSUMABLE' | 'GEAR';
  slotType?: EquipmentSlotType; // New: Defined if type is GEAR
  cost: number;
  effects?: Partial<PlayerStats & PlayerResources>;
  singleUse: boolean;
  conditions?: LockCondition[];
}

export interface BaseUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  owned: boolean;
  effectDescription: string;
  conditions?: LockCondition[];
  trainingModifiers?: {
      [key: string]: number; // key can be 'smarts', 'charm', 'will', 'coordination', or 'POWER'
  };
  workMoneyBonus?: number; // New: Flat money bonus added to Work tasks
}

export interface Player {
  hasCreatedCharacter: boolean; // New flag for init flow
  hasPlayedFlashback?: boolean; // New flag for flashback
  name: string;
  civilianName: string;
  superName: string;
  civilianAppearance: string; // New
  superAppearance: string;    // New
  identity: Identity;
  stats: PlayerStats;
  resources: PlayerResources;
  powers: Power[];
  skillPoints: number;
  tags: string[];
  backstory: string;
  job: string; // New field
  inventory: Item[];
  equipment: {
      HEAD: Item | null;
      BODY: Item | null;
      GADGET: Item | null;
      ACCESSORY: Item | null;
  };
  baseUpgrades: BaseUpgrade[];
  downtimeTokens: number;
  reputations: Record<string, number>; // Cache of current identity's reputation
}

export enum TaskType {
  PATROL = 'Patrol',
  EVENT = 'Event',
  DOWNTIME = 'Downtime',
  MISSION = 'Mission',
  WORK = 'Work'
}

export enum ScenarioMode {
  STRUCTURED = 'STRUCTURED',
  FREEFORM = 'FREEFORM'
}

export interface ScenarioNode {
  id: string;
  text: string;
  options: {
    text: string;
    nextNodeId?: string; // If null, ends scenario
    requiredStat?: StatType;
    requiredVal?: number;
    requiredPower?: string;
    outcome?: string; // Text description of outcome
    rewards?: RewardSet;
  }[];
}

export interface ScalingConfig {
    startDay: number;
    intervalDays: number;
    levelIncrease: number;
    maxLevel: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  difficulty: number; // 1-10
  scaling?: ScalingConfig; // New: Scalable difficulty
  requiredIdentity: Identity;
  rewards: RewardSet;
  mode: ScenarioMode;
  // For structured
  initialNodeId?: string;
  nodes?: Record<string, ScenarioNode>;
  // For freeform
  context?: string;
  locked: boolean;
  lockConditions?: LockCondition[];
  isMandatory?: boolean;
  reputationTargets?: string[]; // NPCs or Factions involved
  listensToNews?: boolean; // New: Affected by news context
  completedDay?: number; // New: Track when it was finished
  completionCount?: number; // New: Track how many times it has been completed
  sourceSuggestionId?: string; // New: If generated from a suggestion
}

// --- Pools ---
export interface TaskPool {
  id: string;
  name: string;
  description?: string;
  tasks: string[]; // IDs of tasks included in this pool
}

export interface DayConfig {
  day: number;
  taskPoolId?: string; // Override default pool
  randomEventPoolId?: string; // Override default random pool
  randomEventChance?: number; // 0.0 to 1.0 (override default)
}

// --- New Downtime System ---
export interface DowntimeActivity {
    id: string;
    title: string;
    description: string;
    type: 'TRAINING' | 'WORK' | 'SOCIAL' | 'CUSTOM';
    conditions?: LockCondition[];
    // Auto-resolve properties
    autoRewards?: RewardSet;
    autoLog?: string;
    // Roleplay properties -> Leads to a generated/stored Task
    linkedTaskId?: string; // ID of a pre-defined task to run
    roleplayPrompt?: string; // If we need to generate on the fly
    // Training Specifics
    trainingConfig?: {
        attributeXp: number; // Default base XP for stats
        powerXp: number;     // Default base XP for powers
    };
}

export interface CalendarEvent {
  id: string;
  day: number; // If isRandom/triggered, this might be the start day or ignored
  title: string;
  description: string;
  type: 'DEADLINE' | 'EVENT' | 'HOLIDAY';
  conditions?: LockCondition[];
  isRandom?: boolean;
  // New Trigger Logic
  triggerCondition?: LockCondition; // e.g. MASK < 25
  resetCondition?: LockCondition; // e.g. MASK > 75
  active?: boolean; // Persisted state for triggers
  linkedTaskId?: string; // New: Optional linked task to spawn
}

export interface CodexSecret {
  text: string;
  unlocked: boolean;
}

export interface CodexEntry {
  id: string;
  title: string;
  category: 'NPC' | 'FACTION' | 'LORE' | 'LOCATION';
  content: string;
  appearance?: string;
  relationship?: {
    civilianRep: number;
    superRep: number;
    knowsIdentity: boolean;
  };
  secrets?: CodexSecret[];
  unlocked: boolean;
}

// --- Automators ---
export interface Automator {
    id: string;
    name: string;
    type: 'TASK' | 'EVENT' | 'ITEM' | 'UPGRADE';
    active: boolean;
    intervalDays: number;
    nextRunDay: number;
    startDay?: number; // New: Range start
    endDay?: number; // New: Range end (-1 for infinite)
    config: {
        targetPoolId?: string; // Where to add generated items
        amount?: number; // How many to generate
        difficultyMin?: number;
        difficultyMax?: number;
        context?: string; // Guiding prompt
        scalable?: boolean;
        // Item Specifics
        itemType?: 'GEAR' | 'CONSUMABLE';
        rarityCostMin?: number;
        // Event Specifics
        dateRange?: number;
    };
}

// --- News System ---
export interface NewsSettings {
    articleCount: number; // Default 3
    frequencyMin: number; // Default 5
    frequencyMax: number; // Default 8
    historyRetention: number; // Default 7
    generateRelatedTasks: boolean; // News Automator toggle
    newsContextPrompt?: string; // Optional user guidance for next generation
    articleTypesChance: {
        hero: number;
        villain: number;
        expose: number;
        other: number;
    };
}

export interface NewsArticle {
    headline: string;
    blurb?: string; // New: Brief description
    body: string;
    type: 'HERO' | 'VILLAIN' | 'EXPOSE' | 'TREND' | 'TRAGEDY' | 'OTHER';
}

export interface NewsImpact {
    statChanges: Partial<PlayerResources & PlayerStats>;
    newCodexEntries: Partial<CodexEntry>[];
}

export interface NewsIssue {
    day: number;
    articles: NewsArticle[];
    modifiers?: string; // How this news affects gameplay
    impact?: NewsImpact; // Suggested changes based on news
}

export interface TimelineEvent {
    day: number;
    description: string;
    type: 'MAJOR' | 'MINOR';
}

export interface DailyReportData {
    day: number;
    financials: {
        rent: number;
        income?: number;
    };
    automatorResults: {
        tasksGenerated: number;
        itemsGenerated: number;
        upgradesGenerated: number;
        newTasks?: Task[]; // Added: List of tasks for display
    };
    newsPublished: boolean;
    eventsTriggered: number;
}

export interface DailyTaskConfig {
    tasksAvailablePerDay: number; // Default 3-5
    taskEffortLimit: number; // Default 3 (Tasks you can DO per day)
}

// --- Music System ---
export type MusicContext = 'MENU' | 'ACTION' | 'DOWNTIME' | 'VICTORY' | 'DEFEAT' | 'SAD';

export interface MusicTrack {
    id: string;
    name: string;
    author: string;
    source: string;
    url: string;
    contexts: MusicContext[];
}

export interface WeekTheme {
    id: string;
    startDay: number;
    endDay: number; // Inclusive
    title: string;
    description: string; // The "Theme" e.g. "Street Level Crime"
    focus: 'COMBAT' | 'INVESTIGATION' | 'SOCIAL' | 'BALANCED';
}

export interface ProcessingState {
    step: string;
    itemsProcessed: number;
    totalItems: number;
    logs: string[];
}

export interface TaskSuggestion {
    id: string;
    text: string; // The prompt text
    createdDay: number;
}

export interface GameState {
  day: number;
  activeTasks: Task[];
  taskPool: Task[]; // The "Global" or "Default" list of tasks
  taskPools: TaskPool[]; // Named collections of tasks
  randomEventPools: TaskPool[]; // Named collections of random events
  powerTemplates: Power[]; // Templates for character creation and editor
  dayConfigs: Record<number, DayConfig>; // Day-specific configurations
  
  shopItems: Item[];
  calendarEvents: CalendarEvent[];
  codex: CodexEntry[];
  logs: string[];
  isProcessing: boolean;
  downtimeActivities: DowntimeActivity[];
  
  // New Features
  automators: Automator[];
  newsHistory: NewsIssue[];
  activeNews?: NewsIssue;
  timeline: TimelineEvent[];
  newsSettings: NewsSettings;
  dailyConfig: DailyTaskConfig;
  
  // Weeks & World
  weekThemes: WeekTheme[];
  generationModel: 'gemini-3-flash-preview' | 'gemini-3-pro-preview';

  // Music
  music: {
      currentMood: MusicContext;
      isPlaying: boolean;
      volume: number; // 0.0 to 1.0
      tracks: MusicTrack[];
  };

  // Suggestions
  taskSuggestions: TaskSuggestion[];
  archivedSuggestions: TaskSuggestion[];
}

export interface LogEntry {
  day: number;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'DANGER';
}

export interface FeatureSubItem {
    name: string;
    status: 'DONE' | 'IN_PROGRESS' | 'PENDING';
}

export interface FeatureItem {
  category: string;
  name: string;
  description: string;
  status: 'DONE' | 'IN_PROGRESS' | 'PENDING';
  subFeatures?: FeatureSubItem[];
}

export interface SystemFeature {
    title: string;
    description: string;
    icon: string;
    category: string;
    beta?: boolean;
}

export interface ScenarioResult {
    success: boolean;
    successLevel: SuccessLevel;
    rewards: RewardSet;
    reputationChanges?: Record<string, number>;
    summary: string;
}

export interface PlotPlan {
    overview: string;
    stages: string[];
    twists: string;
}

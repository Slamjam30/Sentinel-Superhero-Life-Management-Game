
import { Identity, Player, GameState, Task, TaskType, ScenarioMode, StatType, Item, BaseUpgrade, CalendarEvent, FeatureItem, CodexEntry, DowntimeActivity, TaskPool, Power, NewsSettings, MusicTrack, SystemFeature } from './types';

export const INITIAL_BASE_UPGRADES: BaseUpgrade[] = [
  { id: 'b1', name: 'Home Gym', description: 'Basic workout equipment.', cost: 300, owned: false, effectDescription: 'Reduces cost of training.' },
  { id: 'b2', name: 'Police Scanner', description: 'Intercepts emergency bands.', cost: 500, owned: false, effectDescription: 'Unlocks more Patrol tasks.' },
  { id: 'b3', name: 'Med Bay', description: 'Advanced first aid supplies.', cost: 800, owned: false, effectDescription: 'Recover health faster during rest.' }
];

export const INITIAL_PLAYER: Player = {
  hasCreatedCharacter: false,
  hasPlayedFlashback: false,
  name: "New Hero",
  civilianName: "",
  superName: "",
  civilianAppearance: "",
  superAppearance: "",
  identity: Identity.CIVILIAN,
  stats: {
    smarts: 10,
    charm: 10,
    coordination: 10,
    will: 10
  },
  resources: {
    money: 500,
    mask: 100,
    fame: 0,
    publicOpinion: 0
  },
  skillPoints: 0,
  powers: [],
  tags: [],
  backstory: "",
  job: "Unemployed",
  inventory: [],
  equipment: {
      HEAD: null,
      BODY: null,
      GADGET: null,
      ACCESSORY: null
  },
  baseUpgrades: INITIAL_BASE_UPGRADES,
  downtimeTokens: 2,
  reputations: {}
};

export const FLASHBACK_TASK: Task = {
    id: 'flashback-origin',
    title: 'Origin Story: The Catalyst',
    description: 'Before you became a hero, there was a moment that started it all. Relive your origin.',
    type: TaskType.EVENT,
    difficulty: 0, 
    requiredIdentity: Identity.CIVILIAN,
    rewards: { fame: 10, will: 0.5 },
    mode: ScenarioMode.FREEFORM,
    context: "You are playing through your Origin Story flashback. Describe the specific events that led to you gaining your powers or deciding to become a hero. This defines your character's motivation.",
    isMandatory: true,
    locked: false
};

export const INITIAL_NEWS_SETTINGS: NewsSettings = {
    articleCount: 3,
    frequencyMin: 5,
    frequencyMax: 8,
    historyRetention: 7,
    generateRelatedTasks: true,
    articleTypesChance: {
        hero: 20,
        villain: 20,
        expose: 5,
        other: 55
    }
};

export const INITIAL_MUSIC_TRACKS: MusicTrack[] = [];

export const PRESET_POWERS: Power[] = [
    {
        id: 'p-strength',
        name: 'Super Strength',
        description: 'Enhanced physical muscular density allowing for feats of massive lifting and striking.',
        tier: 'HEROIC',
        level: 1, xp: 0, maxXp: 100,
        abilities: ['Power Punch', 'Leap'],
        upgrades: [
            { id: 'str-1', name: 'Ground Smash', description: 'AOE knockdown.', cost: 1, requiredLevel: 1, unlocked: false, type: 'ABILITY' },
            { id: 'str-2', name: 'Unbreakable Skin', description: 'Passive defense boost.', cost: 2, requiredLevel: 2, unlocked: false, type: 'PASSIVE', parentId: 'str-1' }
        ]
    },
    {
        id: 'p-telepathy',
        name: 'Telepathy',
        description: 'Read minds and project thoughts. Mental manipulation.',
        tier: 'HEROIC',
        level: 1, xp: 0, maxXp: 100,
        abilities: ['Mind Read', 'Confusion'],
        upgrades: [
            { id: 'mind-1', name: 'Psionic Blast', description: 'Mental damage attack.', cost: 1, requiredLevel: 1, unlocked: false, type: 'ABILITY' },
            { id: 'mind-2', name: 'Mind Control', description: 'Take control of an enemy.', cost: 3, requiredLevel: 3, unlocked: false, type: 'ABILITY', parentId: 'mind-1' }
        ]
    },
    {
        id: 'p-pyro',
        name: 'Pyrokinesis',
        description: 'Generate and control fire.',
        tier: 'STREET',
        level: 1, xp: 0, maxXp: 100,
        abilities: ['Fireball'],
        upgrades: [
            { id: 'fire-1', name: 'Flame Shield', description: 'Defensive aura.', cost: 1, requiredLevel: 1, unlocked: false, type: 'ABILITY' },
            { id: 'fire-2', name: 'Inferno', description: 'Massive fire damage.', cost: 2, requiredLevel: 2, unlocked: false, type: 'ABILITY', parentId: 'fire-1' }
        ]
    }
];

export const SAMPLE_CHARACTER: Player = {
    ...INITIAL_PLAYER,
    hasCreatedCharacter: true,
    hasPlayedFlashback: true, // Skip for sample
    civilianName: "Alex Mercer",
    superName: "The Sentinel",
    civilianAppearance: "Average height, messy brown hair, glasses, wears flannel shirts.",
    superAppearance: "Sleek blue bodysuit with silver plating, glowing eyes, full face mask.",
    identity: Identity.SUPER,
    job: "Photojournalist",
    backstory: "Exposed to experimental cosmic radiation while investigating a corrupt lab.",
    stats: { smarts: 14, charm: 12, coordination: 16, will: 14 },
    powers: [{
        id: 'p-sample',
        name: 'Cosmic Energy',
        description: 'Ability to manipulate stellar energy for blasts and flight.',
        level: 1,
        xp: 0,
        maxXp: 100,
        abilities: ['Energy Blast', 'Hover'],
        upgrades: [
            { id: 'u1', name: 'Focused Beam', description: 'High damage single target.', cost: 1, requiredLevel: 1, unlocked: false, type: 'ABILITY' },
            { id: 'u2', name: 'Solar Flare', description: 'Area of effect blind.', cost: 2, requiredLevel: 2, unlocked: false, type: 'ABILITY', parentId: 'u1' }
        ]
    }],
    tags: ['Heroic', 'Investigator'],
    reputations: { 'The Iron Syndicate': -20, 'Mayor City': 10 }
};

export const MOCK_ITEMS: Item[] = [
  { id: 'i1', name: 'Energy Drink', description: 'Restores energy.', type: 'CONSUMABLE', cost: 20, singleUse: true, effects: { coordination: 1 } },
  { id: 'i2', name: 'Tactical Visor', description: 'Helps analyze threats.', type: 'GEAR', slotType: 'HEAD', cost: 250, singleUse: false, effects: { smarts: 2 } },
  { id: 'i3', name: 'Kevlar Vest', description: 'Basic protection.', type: 'GEAR', slotType: 'BODY', cost: 400, singleUse: false, effects: { will: 2 } },
  { id: 'i4', name: 'Utility Belt', description: 'Holds gadgets.', type: 'GEAR', slotType: 'ACCESSORY', cost: 150, singleUse: false, effects: { coordination: 1 } }
];

export const MOCK_DOWNTIME_ACTIVITIES: DowntimeActivity[] = [
    {
        id: 'da1',
        title: 'Train Powers',
        description: 'Focus on honing your abilities in a safe environment.',
        type: 'TRAINING',
        autoRewards: { will: 0.25 }, // XP handled in logic. 0.25 = 4 sessions for +1 stat.
        autoLog: 'You spent hours at the gym.',
        roleplayPrompt: 'You are at your training spot. Describe your routine, focusing on the mechanics of your powers and your physical exertion. There are no enemies, just you and your limits.'
    },
    {
        id: 'da2',
        title: 'Work Shift',
        description: 'Earn some money at your civilian job.',
        type: 'WORK',
        autoRewards: { money: 50 },
        autoLog: 'A standard shift. Boring but profitable.',
        roleplayPrompt: 'You arrive at work. Describe the mundane tasks you perform and how you interact with colleagues while keeping your secret identity safe.'
    },
    {
        id: 'da3',
        title: 'Socialize',
        description: 'Spend time with a contact or meet someone new. (Requires >20 Rep for specifics)',
        type: 'SOCIAL',
        roleplayPrompt: 'You arrange a casual meeting in a quiet location. The goal is to strengthen your bond, share news, or just relax.'
    },
    {
        id: 'da4',
        title: 'Investigate Rumors',
        description: 'Hit the streets or net to find new leads/tasks.',
        type: 'CUSTOM',
        roleplayPrompt: 'You are actively looking for trouble or clues. Where do you go? What sources do you check?'
    }
];

export const MOCK_EVENTS: CalendarEvent[] = [
  { id: 'e1', day: 2, title: 'Press Conference', description: 'The city wants to know who you are.', type: 'EVENT' },
  { id: 'e2', day: 5, title: 'Rent Due', description: 'Pay $500 or face eviction.', type: 'DEADLINE' },
  { id: 'e3', day: 10, title: 'Mayor\'s Gala', description: 'A high profile event.', type: 'EVENT' },
  { id: 'e4', day: 15, title: 'Comet Passing', description: 'Cosmic energy is high.', type: 'HOLIDAY' },
  { 
    id: 'e_mask_low', 
    day: 0, 
    title: 'Identity Risk', 
    description: 'Your mask integrity is critically low. Reporters are snooping.', 
    type: 'EVENT',
    triggerCondition: { type: 'MASK', key: '', operator: 'LT', value: 25 },
    resetCondition: { type: 'MASK', key: '', operator: 'GT', value: 75 },
    active: false
  }
];

export const MOCK_CODEX: CodexEntry[] = [
  {
    id: 'c1',
    title: 'Dr. Aris Thorne',
    category: 'NPC',
    content: 'A brilliant but reclusive scientist formerly employed by AetherCorp. He knows more about the accident than he lets on.',
    unlocked: true,
    relationship: { civilianRep: 0, superRep: 0, knowsIdentity: false }
  },
  {
    id: 'c2',
    title: 'The Iron Syndicate',
    category: 'FACTION',
    content: 'A group of tech-thieves stealing experimental weaponry. Known for their heavy armor and discipline.',
    unlocked: true,
    relationship: { civilianRep: -10, superRep: -50, knowsIdentity: false }
  },
  {
    id: 'c3',
    title: 'AetherCorp',
    category: 'FACTION',
    content: 'The mega-corporation that effectively runs the city\'s energy grid. Rumored to be conducting unethical experiments.',
    unlocked: true,
    relationship: { civilianRep: 0, superRep: 0, knowsIdentity: false }
  }
];

export const MOCK_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Civilian Job: Cafe Shift',
    description: 'Work a shift at the local cafe to pay the bills.',
    type: TaskType.WORK,
    difficulty: 1,
    requiredIdentity: Identity.CIVILIAN,
    rewards: { money: 100, will: -0.2 },
    mode: ScenarioMode.STRUCTURED,
    initialNodeId: 'start',
    nodes: {
      'start': {
        id: 'start',
        text: 'It is a busy morning at the cafe. A rude customer is demanding a refund for a half-eaten bagel.',
        options: [
          { text: 'Apologize and refund (Charm)', requiredStat: StatType.CHARM, requiredVal: 12, nextNodeId: 'success', rewards: { money: 10 }, outcome: "The customer calms down and tips you." },
          { text: 'Refuse firmly (Will)', requiredStat: StatType.WILL, requiredVal: 10, nextNodeId: 'conflict', outcome: "The customer starts yelling." },
          { text: 'Just pay them to leave', nextNodeId: 'end', rewards: { money: -5 }, outcome: "You lose money but save time." }
        ]
      },
      'success': {
        id: 'success',
        text: 'The shift ends peacefully.',
        options: [{ text: 'Go home', rewards: { money: 100 } }]
      },
      'conflict': {
        id: 'conflict',
        text: 'The manager steps in and handles it, but gives you a warning.',
        options: [{ text: 'Finish shift', rewards: { money: 100, fame: -1 } }]
      },
      'end': { id: 'end', text: 'Shift over.', options: [{ text: 'Done', rewards: { money: 95 } }] }
    },
    locked: false
  },
  {
    id: 't2',
    title: 'Stop Bank Heist',
    description: 'Armed robbers are at the First National Bank.',
    type: TaskType.PATROL,
    difficulty: 5,
    requiredIdentity: Identity.SUPER,
    rewards: { fame: 10, publicOpinion: 5 },
    mode: ScenarioMode.FREEFORM,
    context: "You are standing outside the First National Bank. Police are setting up a perimeter. Three masked robbers are inside with hostages. You have Energy Projection powers.",
    locked: false,
    reputationTargets: ['The Iron Syndicate']
  }
];

export const MOCK_RANDOM_EVENTS: Task[] = [
    {
        id: 're1',
        title: 'Runaway Train',
        description: 'A metro train has lost its brakes!',
        type: TaskType.EVENT,
        difficulty: 6,
        requiredIdentity: Identity.SUPER,
        rewards: { fame: 20, publicOpinion: 15 },
        mode: ScenarioMode.FREEFORM,
        context: "A metro train is speeding down the tracks towards a dead end. Passengers are panicking. You are currently on top of the train.",
        locked: false,
        reputationTargets: ['Mayor', 'City Transport']
    },
    {
        id: 're2',
        title: 'Cat in Tree',
        description: 'A classic hero dilemma.',
        type: TaskType.PATROL,
        difficulty: 1,
        requiredIdentity: Identity.SUPER,
        rewards: { publicOpinion: 2 },
        mode: ScenarioMode.STRUCTURED,
        initialNodeId: 'start',
        nodes: {
            'start': {
                id: 'start',
                text: 'A little girl is crying pointing at a cat stuck high in an oak tree.',
                options: [
                    { text: 'Climb up and get it', requiredStat: StatType.COORDINATION, requiredVal: 5, outcome: 'You easily retrieve the cat.', rewards: { publicOpinion: 2 } },
                    { text: 'Fly up (if able)', requiredPower: 'Flight', outcome: 'Show off.', rewards: { publicOpinion: 2, fame: 1 } },
                    { text: 'Ignore it', outcome: 'The girl cries louder.', rewards: { publicOpinion: -1 } }
                ]
            }
        },
        locked: false
    }
];

// --- Mock Pools ---
export const MOCK_TASK_POOLS: TaskPool[] = [
  { id: 'tp1', name: 'Downtown Patrol', description: 'Standard low-level crime fighting.', tasks: ['t1', 't2'] },
  { id: 'tp2', name: 'Alien Invasion Week', description: 'High difficulty alien scenarios.', tasks: [] }
];

export const MOCK_RANDOM_POOLS: TaskPool[] = [
  { id: 'rp1', name: 'City Disasters', description: 'Accidents and emergencies.', tasks: ['re1'] },
  { id: 'rp2', name: 'Pet Rescues', description: 'Low stakes wholesome moments.', tasks: ['re2'] }
];

export const INITIAL_GAME_STATE: GameState = {
  day: 1,
  activeTasks: [],
  taskPool: MOCK_TASKS,
  taskPools: MOCK_TASK_POOLS,
  randomEventPools: MOCK_RANDOM_POOLS,
  powerTemplates: PRESET_POWERS,
  dayConfigs: {},
  shopItems: MOCK_ITEMS,
  calendarEvents: MOCK_EVENTS,
  codex: MOCK_CODEX,
  logs: ["Welcome to Sentinel. Your journey begins."],
  isProcessing: false,
  downtimeActivities: MOCK_DOWNTIME_ACTIVITIES,
  automators: [],
  newsHistory: [],
  timeline: [],
  newsSettings: INITIAL_NEWS_SETTINGS,
  dailyConfig: {
      tasksAvailablePerDay: 4,
      taskEffortLimit: 3
  },
  weekThemes: [],
  generationModel: 'gemini-3-pro-preview',
  music: {
      currentMood: 'MENU',
      isPlaying: false,
      volume: 0.5,
      tracks: INITIAL_MUSIC_TRACKS
  },
  taskSuggestions: [],
  archivedSuggestions: []
};

export const SYSTEM_FEATURES: SystemFeature[] = [
    {
        category: "Core Gameplay",
        title: "Dual Identity System",
        icon: "Shield", 
        description: "Manage two distinct lives: your Civilian persona and your Super alter-ego. Actions in one life affect resources in the other. Maintain your 'Mask Integrity' to keep your secret safe from the public."
    },
    {
        category: "Core Gameplay",
        title: "The Daily Loop",
        icon: "Clock",
        description: "Each day grants limited Effort to perform tasks. You must pay Rent every 7 days. Choose wisely between Patrols, Work, Socializing, or Training."
    },
    {
        category: "Core Gameplay",
        title: "AI Dungeon Master",
        icon: "Bot",
        description: "Missions are narrated by an AI that adapts to your choices. It manages dice rolls, checks your stats against difficulty classes, and generates dynamic outcomes based on your creative input."
    },
    {
        category: "Progression",
        title: "Power Progression",
        icon: "Zap",
        description: "Earn XP to level up your powers. Use Skill Points in a branching Skill Tree to unlock new abilities (which you can use in combat) and passive bonuses."
    },
    {
        category: "Progression",
        title: "Economy & Base Building",
        icon: "Home",
        description: "Hold down a civilian job to pay weekly rent and buy gear. Invest in 'Base Upgrades' to gain passive benefits like faster training or better intel."
    },
    {
        category: "Progression",
        title: "Gear & Equipment",
        icon: "Package",
        description: "Purchase gadgets and costumes from the Black Market. Equipping gear provides stat boosts to Smarts, Charm, Coordination, or Will.",
        beta: true
    },
    {
        category: "World & Story",
        title: "Living Newspaper",
        icon: "Newspaper",
        description: "Periodically, the 'Sentinel' newspaper is published, reflecting recent events. Reading the news provides context for the world and can spawn unique, time-sensitive missions."
    },
    {
        category: "World & Story",
        title: "Procedural World",
        icon: "Globe",
        description: "The game world is alive. 'Automators' generate new tasks, items, and events daily. The 'Week Theme' system ensures that generated content follows a cohesive narrative arc over time.",
        beta: true
    },
    {
        category: "World & Story",
        title: "Codex & Reputation",
        icon: "BookOpen",
        description: "A dynamic database of NPCs, Factions, and Lore. Relationships are tracked separately for your Civilian and Super identities. Discovering 'Secrets' during missions permanently unlocks info in the Codex."
    },
    {
        category: "Tools",
        title: "World Generator",
        icon: "Sparkles",
        description: "Create entirely new campaign settings from scratch using the AI Wizard. Define genre, tone, and starting entities.",
        beta: true
    },
    {
        category: "Tools",
        title: "Editor Mode",
        icon: "PenTool",
        description: "A comprehensive set of creation tools allows you to modify any aspect of the game—items, quests, characters, and logic—in real-time, effectively acting as a GM toolset."
    }
];

// Deprecated: Kept for reference but UI now uses SYSTEM_FEATURES
export const FEATURE_LIST: FeatureItem[] = [
  {
    category: 'Design',
    name: 'Design Mentalities',
    description: 'Core development principles.',
    status: 'DONE',
    subFeatures: [
        { name: 'Robust Developer Documentation', status: 'DONE' },
        { name: 'Detailed Checkboxes for Tracking', status: 'DONE' },
        { name: 'File Size Management (<600 lines)', status: 'DONE' },
        { name: 'In-Depth Feature List', status: 'DONE' },
        { name: 'AI Creation Options for Features', status: 'DONE' },
        { name: 'User Review for Long Story Elements', status: 'DONE' }
    ]
  },
  {
    category: 'World Generation',
    name: 'Full World Generator',
    description: 'Batch creation of world state.',
    status: 'DONE',
    subFeatures: [
        { name: 'Genre & Prompt Input', status: 'DONE' },
        { name: 'Pipeline Progress Info', status: 'DONE' },
        { name: 'Batch Codex Generation (Lore, Factions, NPCs)', status: 'DONE' },
        { name: 'Inventory & Upgrades Generation', status: 'DONE' }
    ]
  },
  {
    category: 'Progression',
    name: 'Week Themes',
    description: 'Narrative arcs over time.',
    status: 'DONE',
    subFeatures: [
        { name: 'Unique Week Theme Definitions', status: 'DONE' },
        { name: 'Automators aware of Week Themes', status: 'DONE' },
        { name: 'Generation Quantity Settings', status: 'DONE' }
    ]
  },
  {
    category: 'Settings',
    name: 'Generation Model',
    description: 'AI Configuration.',
    status: 'DONE',
    subFeatures: [
        { name: 'Model Selector (Default Gemini 3 Pro)', status: 'DONE' }
    ]
  },
  {
    category: 'Automation',
    name: 'Automators',
    description: 'Content generation over time.',
    status: 'DONE',
    subFeatures: [
        { name: 'Automators for Tasks/Items', status: 'DONE' },
        { name: 'Automators for Upgrades', status: 'DONE' },
        { name: 'Task Suggestions', status: 'DONE' }
    ]
  },
  {
    category: 'Character',
    name: 'Character Creation & Sheet',
    description: 'Identity management.',
    status: 'DONE',
    subFeatures: [
        { name: 'Super & Civilian Appearance Fields', status: 'DONE' },
        { name: 'Editable Appearance post-creation', status: 'DONE' }
    ]
  },
  {
    category: 'Database',
    name: 'Pools',
    description: 'Content collections.',
    status: 'DONE',
    subFeatures: [
        { name: 'Editable Event Pools in Settings', status: 'DONE' },
        { name: 'Editable Task Pools in Settings', status: 'DONE' }
    ]
  },
  {
    category: 'Database',
    name: 'Codex (Characters & Factions)',
    description: 'World entities database.',
    status: 'DONE',
    subFeatures: [
        { name: 'Add/Edit Characters & Factions', status: 'DONE' },
        { name: 'Split Relationships (Civilian/Super)', status: 'DONE' },
        { name: 'Knows Identity Marker', status: 'DONE' },
        { name: 'Description & Appearance Sections', status: 'DONE' },
        { name: 'Lore Entries', status: 'DONE' },
        { name: 'Secrets Functionality (Hidden/Unlockable)', status: 'DONE' }
    ]
  },
  {
    category: 'UI',
    name: 'Calendar',
    description: 'Time management view.',
    status: 'DONE',
    subFeatures: [
        { name: 'Edit Mode: Show Assigned Pools', status: 'DONE' }
    ]
  },
  {
    category: 'Audio',
    name: 'Music',
    description: 'Background ambience.',
    status: 'DONE',
    subFeatures: [
        { name: 'Loop/Auto-continue Tracks', status: 'DONE' }
    ]
  },
  {
    category: 'Story',
    name: 'Narrative Tracking',
    description: 'History and context.',
    status: 'DONE',
    subFeatures: [
        { name: 'Story Summary in Settings', status: 'DONE' },
        { name: 'Context Visibility in Scenarios', status: 'DONE' }
    ]
  }
];

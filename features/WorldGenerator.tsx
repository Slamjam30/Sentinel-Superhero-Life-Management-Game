
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Globe, Book, Users, Building2, MapPin, Package, Cpu, Terminal, ArrowRight, ClipboardList, AlertTriangle, Trash2, CalendarRange, Layers, Settings, CheckCircle2, AlertCircle } from 'lucide-react';
import { generateBatchCodex, generateBatchItems, generateBatchUpgrades, generateTaskContent, generateEventContent, generatePoolContent, generateItemContent, generateUpgradeContent, generateBatchTasks } from '../services/gemini/generators';
import { CodexEntry, Item, BaseUpgrade, Task, CalendarEvent, TaskType, Identity, ScenarioMode, WeekTheme, Automator, TaskPool, DayConfig } from '../types';

interface Props {
    onComplete: (data: { 
        codex: CodexEntry[], 
        items: Item[], 
        upgrades: BaseUpgrade[], 
        tasks: Task[], 
        events: CalendarEvent[], 
        weekThemes: WeekTheme[],
        automators: Automator[],
        taskPools: TaskPool[],
        dayConfigs: Record<number, DayConfig>,
        wipeFirst: boolean 
    }) => void;
    currentModel: string;
}

const GENRES = ["Standard Superhero", "Gritty Noir", "Cyberpunk Future", "Silver Age Fun", "Cosmic Horror", "Post-Apocalyptic"];

const DEFAULT_THEMES: WeekTheme[] = [
    { id: 'wt-1', startDay: 1, endDay: 7, title: 'The Awakening', description: 'New supers are appearing. Low level street crime is evolving.', focus: 'INVESTIGATION' },
    { id: 'wt-2', startDay: 8, endDay: 14, title: 'Escalation', description: 'Organized crime adopts new tech. The city becomes dangerous.', focus: 'COMBAT' }
];

export const WorldGenerator: React.FC<Props> = ({ onComplete, currentModel }) => {
    const [step, setStep] = useState(1);
    
    // Step 1: Concept
    const [genre, setGenre] = useState(GENRES[0]);
    const [prompt, setPrompt] = useState("");
    const [wipeFirst, setWipeFirst] = useState(false);

    // Step 2: Entities
    const [counts, setCounts] = useState({
        lore: 3,
        factions: 2,
        npcs: 3,
        locations: 3,
        items: 5,
        upgrades: 3
    });

    // Step 3: Schedule
    const [weekThemes, setWeekThemes] = useState<WeekTheme[]>(DEFAULT_THEMES);

    // Step 4: Automation Settings
    const [autoSettings, setAutoSettings] = useState({
        genTasks: true,
        genEvents: true,
        genItems: true,
        genUpgrades: true,
        qtyTasks: 3,
        qtyItems: 5,
        qtyEvents: 1,
        qtyUpgrades: 2
    });

    // Step 5: Execution
    const [isGenerating, setIsGenerating] = useState(false);
    const [logs, setLogs] = useState<{msg: string, type: 'info' | 'success' | 'error'}[]>([]);
    const [progress, setProgress] = useState(0);

    const addLog = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
        setLogs(prev => [...prev, { msg, type }]);
    };

    // --- HELPER: Error Catching Wrapper ---
    const runSafe = async <T,>(name: string, fn: () => Promise<T>, fallback: T): Promise<T> => {
        try {
            // addLog(`Starting: ${name}...`, 'info'); 
            const result = await fn();
            if (result) {
                // addLog(`Completed: ${name}`, 'success');
                return result;
            } else {
                throw new Error("Returned null/undefined");
            }
        } catch (e: any) {
            addLog(`ERROR in ${name}: ${e.message || 'Unknown error'}. Skipping...`, 'error');
            return fallback;
        }
    };

    const handleGenerate = async () => {
        setIsGenerating(true);
        setLogs([{ msg: "Initializing World Generator Protocol...", type: 'info' }]);
        setProgress(0);

        try {
            const worldContext = `Genre: ${genre}. Concept: ${prompt}`;
            
            // Containers
            let allCodex: CodexEntry[] = [];
            let allItems: Item[] = [];
            let allUpgrades: BaseUpgrade[] = [];
            let allTasks: Task[] = [];
            let allEvents: CalendarEvent[] = [];
            let allPools: TaskPool[] = [];
            let allAutomators: Automator[] = [];
            let allDayConfigs: Record<number, DayConfig> = {};

            // 1. Lore & World Building
            if (counts.lore > 0) {
                addLog(`Generating ${counts.lore} Lore Entries...`, 'info');
                const entries = await runSafe('Lore Gen', () => generateBatchCodex('LORE', counts.lore, worldContext, currentModel), []);
                allCodex.push(...entries as CodexEntry[]);
                setProgress(5);
            }

            if (counts.factions > 0) {
                addLog(`Generating ${counts.factions} Factions...`, 'info');
                const entries = await runSafe('Faction Gen', () => generateBatchCodex('FACTION', counts.factions, worldContext, currentModel), []);
                allCodex.push(...entries as CodexEntry[]);
                setProgress(10);
            }

            if (counts.locations > 0) {
                addLog(`Generating ${counts.locations} Locations...`, 'info');
                const entries = await runSafe('Location Gen', () => generateBatchCodex('LOCATION', counts.locations, worldContext, currentModel), []);
                allCodex.push(...entries as CodexEntry[]);
                setProgress(15);
            }

            if (counts.npcs > 0) {
                addLog(`Generating ${counts.npcs} Characters...`, 'info');
                const entries = await runSafe('NPC Gen', () => generateBatchCodex('NPC', counts.npcs, worldContext, currentModel), []);
                allCodex.push(...entries as CodexEntry[]);
                setProgress(20);
            }

            // 2. Base Items & Upgrades
            if (counts.items > 0) {
                addLog(`Fabricating ${counts.items} Starter Items (Batch)...`, 'info');
                const items = await runSafe('Batch Item Gen', () => generateBatchItems(counts.items, worldContext, currentModel), []);
                items.forEach((item, i) => {
                    allItems.push({ ...item, id: `gen-item-${Date.now()}-${i}` } as Item);
                });
                setProgress(30);
            }

            if (counts.upgrades > 0) {
                addLog(`Designing ${counts.upgrades} Base Upgrades (Batch)...`, 'info');
                const upgrades = await runSafe('Batch Upgrade Gen', () => generateBatchUpgrades(counts.upgrades, worldContext, currentModel), []);
                upgrades.forEach((upg, i) => {
                    allUpgrades.push({ ...upg, id: `gen-upg-${Date.now()}-${i}` } as BaseUpgrade);
                });
                setProgress(40);
            }

            // 3. Week Themes & Automators
            addLog(`Configuring ${weekThemes.length} Narrative Arcs...`, 'info');
            
            for (let i = 0; i < weekThemes.length; i++) {
                const theme = weekThemes[i];
                const themeContext = `${worldContext}. Phase: ${theme.title} - ${theme.description}. Focus: ${theme.focus}`;
                const themePoolId = `pool-theme-${i}-${Date.now()}`;
                
                // Create Pool for this theme if Tasks/Events are enabled
                if (autoSettings.genTasks) {
                    addLog(`Creating Task Pool for: ${theme.title}`, 'info');
                    const poolMeta = await runSafe('Pool Meta', () => generatePoolContent(themeContext, currentModel), { name: theme.title, description: theme.description });
                    if (poolMeta) {
                        allPools.push({
                            id: themePoolId,
                            name: poolMeta.name || theme.title,
                            description: poolMeta.description || theme.description,
                            tasks: [] // populated dynamically by automator later
                        } as TaskPool);

                        // Assign Pool to Days in Range
                        for (let d = theme.startDay; d <= theme.endDay; d++) {
                            allDayConfigs[d] = {
                                day: d,
                                taskPoolId: themePoolId
                            };
                        }
                    }
                }

                // Create Automators
                if (autoSettings.genTasks) {
                    allAutomators.push({
                        id: `auto-task-${i}`,
                        name: `${theme.title} - Tasks`,
                        type: 'TASK',
                        active: true,
                        intervalDays: 1, // Daily generation potential
                        startDay: theme.startDay,
                        endDay: theme.endDay,
                        nextRunDay: theme.startDay,
                        config: {
                            targetPoolId: themePoolId, // Add to the theme pool
                            amount: Math.ceil(autoSettings.qtyTasks / 7), // Approx daily amount
                            context: themeContext,
                            difficultyMin: 1 + i, // Escalate difficulty per phase
                            difficultyMax: 3 + i
                        }
                    });
                }

                if (autoSettings.genEvents) {
                    allAutomators.push({
                        id: `auto-evt-${i}`,
                        name: `${theme.title} - Events`,
                        type: 'EVENT',
                        active: true,
                        intervalDays: 3, 
                        startDay: theme.startDay,
                        endDay: theme.endDay,
                        nextRunDay: theme.startDay,
                        config: {
                            amount: 1,
                            context: themeContext,
                            dateRange: 3
                        }
                    });
                }
                
                // Standard Items automators (global or per theme)
                if (autoSettings.genItems) {
                     allAutomators.push({
                        id: `auto-item-${i}`,
                        name: `${theme.title} - Market`,
                        type: 'ITEM',
                        active: true,
                        intervalDays: 3,
                        startDay: theme.startDay,
                        endDay: theme.endDay,
                        nextRunDay: theme.startDay,
                        config: { amount: 1, context: themeContext, itemType: 'GEAR' }
                    });
                }

                // Upgrades automators (global or per theme)
                if (autoSettings.genUpgrades) {
                     allAutomators.push({
                        id: `auto-upg-${i}`,
                        name: `${theme.title} - Tech`,
                        type: 'UPGRADE',
                        active: true,
                        intervalDays: 7,
                        startDay: theme.startDay,
                        endDay: theme.endDay,
                        nextRunDay: theme.startDay,
                        config: { amount: autoSettings.qtyUpgrades, context: themeContext }
                    });
                }
                
                setProgress(40 + Math.floor((i + 1) / weekThemes.length * 40)); // Up to 80%
            }

            // 4. Initial Population of Pools/Tasks (Optional pre-fill)
            if (autoSettings.genTasks) {
                addLog("Creating initial generic tasks...", 'info');
                const tasks = await runSafe('Starter Tasks', () => generateBatchTasks(3, `${worldContext}. Simple starter crimes.`, [], currentModel), []);
                tasks.forEach((task, i) => {
                    if (task) {
                        allTasks.push({ 
                            ...task, 
                            id: `gen-task-${Date.now()}-${i}`,
                            type: task.type || TaskType.PATROL,
                            difficulty: 1,
                            requiredIdentity: Identity.SUPER,
                            mode: ScenarioMode.FREEFORM,
                            locked: false
                        } as Task);
                    }
                });
            }

            setProgress(100);
            addLog("World Generation Complete.", 'success');
            
            // Finalize IDs for Codex
            const finalizedCodex = allCodex.map((c, i) => ({
                ...c,
                id: `gen-codex-${Date.now()}-${i}`
            }));

            setTimeout(() => {
                onComplete({ 
                    codex: finalizedCodex, 
                    items: allItems, 
                    upgrades: allUpgrades, 
                    tasks: allTasks, 
                    events: allEvents, 
                    weekThemes: weekThemes, 
                    automators: allAutomators, 
                    taskPools: allPools,
                    dayConfigs: allDayConfigs,
                    wipeFirst 
                });
            }, 1500);
        } catch (error: any) {
            console.error("World Gen Critical Error", error);
            addLog(`CRITICAL SYSTEM FAILURE: ${error.message || 'Unknown Error'}`, 'error');
            setIsGenerating(false);
        }
    };

    // --- Render Steps ---

    const renderStep1 = () => (
        <div className="space-y-6 animate-in fade-in">
            <div className="space-y-4 bg-slate-950 p-6 rounded-lg border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4">1. World Concept</h3>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Genre</label>
                    <div className="grid grid-cols-2 gap-2">
                        {GENRES.map(g => (
                            <button 
                                key={g} 
                                onClick={() => setGenre(g)}
                                className={`px-3 py-2 rounded text-xs font-bold transition-colors ${genre === g ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Prompt / Setting</label>
                    <textarea 
                        className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white h-24 text-sm" 
                        placeholder="e.g. A city floating in the sky where technology is magic..."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>
                <label className="flex items-center gap-3 cursor-pointer bg-red-900/10 border border-red-900/30 p-3 rounded">
                    <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-red-600"
                        checked={wipeFirst}
                        onChange={e => setWipeFirst(e.target.checked)}
                    />
                    <div>
                        <span className="block text-sm font-bold text-red-400">Wipe Existing Data</span>
                        <span className="block text-xs text-red-300/70">Start fresh (Recommended).</span>
                    </div>
                </label>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-slate-950 p-6 rounded-lg border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4">2. Initial Population</h3>
                <p className="text-xs text-slate-400 mb-4">How many entities to generate immediately.</p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                    {[
                        { label: 'Lore Entries', key: 'lore', icon: Book },
                        { label: 'Factions', key: 'factions', icon: Building2 },
                        { label: 'Locations', key: 'locations', icon: MapPin },
                        { label: 'Characters', key: 'npcs', icon: Users },
                        { label: 'Starter Items', key: 'items', icon: Package },
                        { label: 'Base Upgrades', key: 'upgrades', icon: Cpu },
                    ].map(item => (
                        <div key={item.key} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-300 text-sm">
                                <item.icon size={14} className="text-slate-500" /> {item.label}
                            </div>
                            <input 
                                type="number" 
                                min="0" max="20"
                                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-white"
                                value={counts[item.key as keyof typeof counts]}
                                onChange={(e) => setCounts({...counts, [item.key]: parseInt(e.target.value) || 0})}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-slate-950 p-6 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-white">3. Campaign Schedule</h3>
                    <button 
                        onClick={() => setWeekThemes([...weekThemes, { id: `wt-${Date.now()}`, startDay: (weekThemes.length * 7) + 1, endDay: (weekThemes.length * 7) + 7, title: 'New Phase', description: '', focus: 'BALANCED' }])}
                        className="text-xs bg-blue-600 px-2 py-1 rounded text-white"
                    >
                        + Add Arc
                    </button>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {weekThemes.map((theme, idx) => (
                        <div key={theme.id} className="bg-slate-900 border border-slate-700 p-3 rounded relative">
                            <div className="flex gap-2 mb-2">
                                <input 
                                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm font-bold flex-1"
                                    value={theme.title}
                                    onChange={e => { const n = [...weekThemes]; n[idx].title = e.target.value; setWeekThemes(n); }}
                                    placeholder="Arc Title"
                                />
                                <input 
                                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs w-16 text-center"
                                    value={theme.startDay}
                                    onChange={e => { const n = [...weekThemes]; n[idx].startDay = parseInt(e.target.value); setWeekThemes(n); }}
                                    type="number"
                                />
                                <span className="text-slate-500 self-center">-</span>
                                <input 
                                    className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-xs w-16 text-center"
                                    value={theme.endDay}
                                    onChange={e => { const n = [...weekThemes]; n[idx].endDay = parseInt(e.target.value); setWeekThemes(n); }}
                                    type="number"
                                />
                                <button onClick={() => setWeekThemes(weekThemes.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={14}/></button>
                            </div>
                            <textarea 
                                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-xs text-slate-300 h-16"
                                value={theme.description}
                                onChange={e => { const n = [...weekThemes]; n[idx].description = e.target.value; setWeekThemes(n); }}
                                placeholder="What happens during this time?"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-slate-950 p-6 rounded-lg border border-slate-800">
                <h3 className="text-lg font-bold text-white mb-4">4. Simulation Rules</h3>
                <p className="text-xs text-slate-400 mb-4">Configure what the Automators generate during each Week Theme.</p>
                
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-700 pb-1">Enabled Generators</h4>
                        {[
                            { key: 'genTasks', label: 'Generate Tasks' },
                            { key: 'genEvents', label: 'Generate Events' },
                            { key: 'genItems', label: 'Generate Market Items' },
                            { key: 'genUpgrades', label: 'Generate Upgrades' }
                        ].map(t => (
                            <label key={t.key} className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={(autoSettings as any)[t.key]} 
                                    onChange={e => setAutoSettings({...autoSettings, [t.key]: e.target.checked})}
                                    className="rounded border-slate-700 bg-slate-800 text-green-500"
                                />
                                <span className="text-sm text-slate-300">{t.label}</span>
                            </label>
                        ))}
                    </div>
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase border-b border-slate-700 pb-1">Target Quantities (Per Phase)</h4>
                        {[
                            { key: 'qtyTasks', label: 'Tasks per Week' },
                            { key: 'qtyEvents', label: 'Events per Phase' },
                            { key: 'qtyItems', label: 'Items per Week' },
                            { key: 'qtyUpgrades', label: 'Upgrades per Phase' }
                        ].map(q => (
                            <div key={q.key} className="flex justify-between items-center">
                                <span className="text-sm text-slate-400">{q.label}</span>
                                <input 
                                    type="number" 
                                    className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-right text-white"
                                    value={(autoSettings as any)[q.key]}
                                    onChange={e => setAutoSettings({...autoSettings, [q.key]: parseInt(e.target.value) || 0})}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTerminal = () => (
        <div className="h-full flex flex-col">
            <div className="flex-1 bg-black rounded-lg border border-slate-800 p-4 font-mono text-xs flex flex-col overflow-hidden">
                <div className="flex items-center gap-2 text-green-500 mb-2 pb-2 border-b border-slate-800 flex-shrink-0">
                    <Terminal size={14} /> System Output
                </div>
                <div className="flex-1 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
                    {logs.map((log, i) => (
                        <div key={i} className={`${log.type === 'error' ? 'text-red-500' : log.type === 'success' ? 'text-green-400' : 'text-slate-400'}`}>
                            {`> ${log.msg}`}
                        </div>
                    ))}
                    {isGenerating && (
                        <div className="text-green-500 animate-pulse">_ Processing...</div>
                    )}
                </div>
            </div>
            {/* Progress Bar */}
            <div className="mt-4">
                <div className="flex justify-between mb-1 text-slate-500 uppercase text-[10px]">
                    <span>Generation Progress</span>
                    <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden flex flex-col h-full animate-in fade-in">
            {/* Wizard Header */}
            <div className="p-6 border-b border-slate-800 bg-slate-950 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Globe className="text-blue-500" /> World Architect
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Procedural Universe Generation Wizard</p>
                </div>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(s => (
                        <div key={s} className={`h-2 w-8 rounded-full ${s <= step ? 'bg-blue-600' : 'bg-slate-800'}`}></div>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex">
                {/* Main Content Area */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}
                    {step === 5 && renderTerminal()}
                </div>
            </div>

            {/* Wizard Footer */}
            <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-between items-center">
                <Button 
                    variant="ghost" 
                    onClick={() => setStep(s => Math.max(1, s - 1))}
                    disabled={step === 1 || isGenerating}
                >
                    Back
                </Button>
                
                {step < 5 ? (
                    <Button 
                        onClick={() => setStep(s => s + 1)}
                        disabled={!prompt && step === 1}
                        className="w-32"
                    >
                        Next <ArrowRight size={16} className="ml-2"/>
                    </Button>
                ) : (
                    <Button 
                        onClick={handleGenerate} 
                        isLoading={isGenerating}
                        disabled={isGenerating}
                        className="w-48 bg-green-600 hover:bg-green-500"
                    >
                        Execute Generation
                    </Button>
                )}
            </div>
        </div>
    );
};


import React, { useState } from 'react';
import { GameState, NewsIssue, Automator, WeekTheme, CodexEntry, Item, BaseUpgrade, Task, CalendarEvent, TaskPool, DayConfig } from '../types';
import { Newspaper, Globe, Cpu, ToggleRight, ToggleLeft, Edit3, Trash2, CalendarRange, Sparkles, GitGraph } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { WorldGenerator } from './WorldGenerator';
import { WeekSchedule } from './WeekSchedule';
import { DependencyGraph } from './DependencyGraph';

interface WorldStateProps {
    gameState: GameState;
    baseUpgrades?: BaseUpgrade[];
    isEditorMode?: boolean;
    onEditAutomator?: (auto: Automator) => void;
    onDeleteAutomator?: (id: string) => void;
    onSaveAutomator?: (auto: Automator) => void;
    // New Props for World Gen & Weeks
    onSaveWeekThemes?: (themes: WeekTheme[]) => void;
    onImportWorldData?: (data: { 
        codex: CodexEntry[], 
        items: Item[], 
        upgrades: BaseUpgrade[], 
        tasks: Task[], 
        events: CalendarEvent[], 
        weekThemes?: WeekTheme[],
        automators?: Automator[],
        taskPools?: TaskPool[],
        dayConfigs?: Record<number, DayConfig>,
        wipeFirst: boolean 
    }) => void;
}

export const WorldState: React.FC<WorldStateProps> = ({
    gameState,
    baseUpgrades = [],
    isEditorMode,
    onEditAutomator,
    onDeleteAutomator,
    onSaveAutomator,
    onSaveWeekThemes,
    onImportWorldData
}) => {
    const [activeTab, setActiveTab] = useState<'NEWS' | 'AUTO' | 'WEEKS' | 'GEN' | 'GRAPH'>('NEWS');
    const [viewingIssueDay, setViewingIssueDay] = useState<number>(gameState.activeNews?.day || (gameState.newsHistory[0]?.day) || 0);

    const activeIssue = gameState.newsHistory.find(n => n.day === viewingIssueDay) || gameState.activeNews;

    const handleWorldGenComplete = (data: any) => {
        if (onImportWorldData) {
            onImportWorldData(data);
            setActiveTab('NEWS'); // Switch back to main view
        }
    };

    const renderNewspaper = () => {
        if (!activeIssue) {
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
                    <Newspaper size={64} className="mb-4" />
                    <p>No news issues published yet.</p>
                </div>
            );
        }

        return (
            <div className="max-w-4xl mx-auto bg-[#eaddcf] text-slate-900 p-8 shadow-2xl min-h-[600px] flex flex-col font-serif relative">
                {/* Paper Header */}
                <div className="border-b-4 border-slate-900 pb-4 mb-6 flex justify-between items-end">
                    <div>
                        <div className="text-xs font-sans uppercase font-bold tracking-widest mb-1 text-slate-600">The City Chronicle</div>
                        <h1 className="text-6xl font-black tracking-tighter leading-none">THE SENTINEL</h1>
                    </div>
                    <div className="text-right font-sans">
                        <div className="font-bold text-lg">Day {activeIssue.day}</div>
                        <div className="text-xs uppercase text-slate-600">Late Edition</div>
                    </div>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-12 gap-6 flex-1">
                    {activeIssue.articles.map((article, idx) => {
                        // Dynamic layout based on index
                        const colSpan = idx === 0 ? 'col-span-12 lg:col-span-8' : 'col-span-12 lg:col-span-4';
                        const isMain = idx === 0;

                        return (
                            <div key={idx} className={`${colSpan} flex flex-col border-b border-slate-900/20 pb-4 lg:border-none`}>
                                {isMain && (
                                    <div className="border-b-2 border-slate-900 mb-3 pb-1">
                                        <h2 className="text-4xl font-bold leading-tight">{article.headline}</h2>
                                    </div>
                                )}
                                {!isMain && (
                                    <h3 className="text-xl font-bold leading-snug mb-2">{article.headline}</h3>
                                )}
                                <div className={`text-justify leading-relaxed ${isMain ? 'text-lg columns-1 lg:columns-2 gap-6' : 'text-sm'}`}>
                                    {article.body}
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-900/10 flex justify-between items-center">
                                    <span className="text-[10px] font-sans bg-slate-900 text-[#eaddcf] px-2 py-0.5 uppercase">{article.type}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer / Modifiers */}
                {activeIssue.modifiers && (
                    <div className="mt-8 pt-4 border-t-4 border-slate-900 font-sans">
                        <h4 className="text-xs font-bold uppercase tracking-wider mb-2">City Alert Status</h4>
                        <p className="text-sm font-medium italic">"{activeIssue.modifiers}"</p>
                    </div>
                )}
            </div>
        );
    };

    const renderAutomators = () => {
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Cpu /> Active Automators</h2>
                    <div className="text-xs text-slate-400">Processed at the start of each new day.</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {gameState.automators.map(auto => (
                        <div key={auto.id} className={`bg-slate-900 border ${auto.active ? 'border-blue-500/50' : 'border-slate-800'} rounded-lg p-4 relative group transition-all`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${auto.active ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></span>
                                    <h3 className="font-bold text-slate-200">{auto.name}</h3>
                                </div>
                                <div className="flex gap-1">
                                    {onSaveAutomator && (
                                        <button onClick={() => onSaveAutomator({...auto, active: !auto.active})} className="text-slate-400 hover:text-white">
                                            {auto.active ? <ToggleRight size={20} className="text-green-500" /> : <ToggleLeft size={20} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="text-xs text-slate-400 mb-3 font-mono">
                                Type: {auto.type} | Interval: {auto.intervalDays}d | Next: Day {auto.nextRunDay}
                            </div>
                            
                            <div className="bg-slate-950 p-2 rounded text-xs text-slate-500 italic truncate border border-slate-800">
                                "{auto.config.context || 'Standard generation'}"
                            </div>

                            {/* Actions Overlay */}
                            {isEditorMode && (
                                <div className="absolute top-2 right-12 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onEditAutomator && onEditAutomator(auto)} className="p-1 rounded bg-blue-600 text-white hover:bg-blue-500"><Edit3 size={12}/></button>
                                    <button onClick={() => onDeleteAutomator && onDeleteAutomator(auto.id)} className="p-1 rounded bg-red-600 text-white hover:bg-red-500"><Trash2 size={12}/></button>
                                </div>
                            )}
                        </div>
                    ))}
                    {gameState.automators.length === 0 && (
                        <div className="col-span-full text-center p-8 border-2 border-dashed border-slate-800 rounded-lg text-slate-600">
                            No automators configured. Use the editor to add one.
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 bg-slate-950 p-8 overflow-y-auto">
            <header className="mb-8 border-b border-slate-800 pb-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
                        <Globe className="text-slate-500" /> World State
                    </h1>
                    <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
                        <button 
                            onClick={() => setActiveTab('NEWS')}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-colors ${activeTab === 'NEWS' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            The Sentinel
                        </button>
                        <button 
                            onClick={() => setActiveTab('WEEKS')}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-colors flex items-center gap-2 ${activeTab === 'WEEKS' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <CalendarRange size={14} /> Schedule
                            <span className="text-[8px] bg-amber-500 text-slate-900 px-1 rounded font-black">BETA</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('AUTO')}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-colors flex items-center gap-2 ${activeTab === 'AUTO' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Cpu size={14} /> Automators
                            <span className="text-[8px] bg-amber-500 text-slate-900 px-1 rounded font-black">BETA</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('GEN')}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-colors flex items-center gap-2 ${activeTab === 'GEN' ? 'bg-purple-900/50 text-purple-200 shadow border border-purple-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
                        >
                            <Sparkles size={14} /> World Gen
                            <span className="text-[8px] bg-amber-500 text-slate-900 px-1 rounded font-black">BETA</span>
                        </button>
                        <button 
                            onClick={() => setActiveTab('GRAPH')}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-colors flex items-center gap-2 ${activeTab === 'GRAPH' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
                        >
                            <GitGraph size={14} /> Graph
                            <span className="text-[8px] bg-amber-500 text-slate-900 px-1 rounded font-black">BETA</span>
                        </button>
                    </div>
                </div>

                {activeTab === 'NEWS' && gameState.newsHistory.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {gameState.newsHistory.map(issue => (
                            <button 
                                key={issue.day}
                                onClick={() => setViewingIssueDay(issue.day)}
                                className={`flex-shrink-0 px-3 py-1 rounded text-xs font-mono border transition-colors ${viewingIssueDay === issue.day ? 'bg-slate-200 text-slate-900 border-slate-200' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'}`}
                            >
                                Day {issue.day}
                            </button>
                        ))}
                    </div>
                )}
            </header>

            <div className="animate-in fade-in slide-in-from-bottom-2 h-full">
                {activeTab === 'NEWS' && renderNewspaper()}
                {activeTab === 'AUTO' && renderAutomators()}
                {activeTab === 'WEEKS' && onSaveWeekThemes && (
                    <WeekSchedule 
                        weekThemes={gameState.weekThemes} 
                        onSave={onSaveWeekThemes} 
                    />
                )}
                {activeTab === 'GEN' && (
                    <WorldGenerator 
                        onComplete={handleWorldGenComplete} 
                        currentModel={gameState.generationModel || 'gemini-3-flash-preview'}
                    />
                )}
                {activeTab === 'GRAPH' && (
                    <DependencyGraph gameState={gameState} baseUpgrades={baseUpgrades} />
                )}
            </div>
        </div>
    );
};

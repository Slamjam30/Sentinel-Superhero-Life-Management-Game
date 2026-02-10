
import React, { useState } from 'react';
import { Player, Identity, StatType, Power } from '../types';
import { Button } from '../components/ui/Button';
import { User, BookOpen, Zap, Activity, Check, Users, PlayCircle, Bot } from 'lucide-react';
import { SAMPLE_CHARACTER, PRESET_POWERS } from '../constants';
import { generateCharacterProfile } from '../services/gemini/generators';

interface Props {
    onComplete: (player: Partial<Player>) => void;
    availablePowers?: Power[];
}

const TOTAL_POINTS = 20;

const POWER_TIERS = [
    { id: 'STREET', name: 'Street Level', cost: 1, desc: 'Enhanced strength, minor blasts, peak human skill.' },
    { id: 'HEROIC', name: 'Heroic', cost: 3, desc: 'Flight, laser eyes, heavy lifting, elemental control.' },
    { id: 'COSMIC', name: 'Cosmic', cost: 5, desc: 'Reality warping, immense energy, planetary threats.' },
];

export const CharacterCreator: React.FC<Props> = ({ onComplete, availablePowers = PRESET_POWERS }) => {
    const [mode, setMode] = useState<'MANUAL' | 'AI'>('MANUAL');
    const [step, setStep] = useState(0);
    
    // AI State
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Data State
    const [data, setData] = useState<Partial<Player>>({
        civilianName: '',
        superName: '',
        civilianAppearance: '',
        superAppearance: '',
        identity: Identity.CIVILIAN,
        backstory: '',
        job: '',
        stats: { smarts: 0, charm: 0, coordination: 0, will: 0 },
        powers: [],
        reputations: {}
    });

    // Attribute State (Manual)
    const [spentPoints, setSpentPoints] = useState(0);

    // Power State (Manual)
    const [powerName, setPowerName] = useState('');
    const [powerDesc, setPowerDesc] = useState('');
    const [powerTier, setPowerTier] = useState<string>('STREET');
    const [selectedPreset, setSelectedPreset] = useState<any | null>(null);

    // Relationship State (Manual)
    const [selectedRelation, setSelectedRelation] = useState<'NONE' | 'FRIEND' | 'RIVAL'>('NONE');
    const [relationName, setRelationName] = useState('');

    const handleStatChange = (stat: keyof typeof data.stats, delta: number) => {
        const currentVal = data.stats![stat] || 0;
        if (currentVal + delta < 0) return;
        if (spentPoints + delta > TOTAL_POINTS) return;

        setData(prev => ({
            ...prev,
            stats: { ...prev.stats!, [stat]: currentVal + delta }
        }));
        setSpentPoints(p => p + delta);
    };

    const handleQuickStart = () => {
        onComplete(SAMPLE_CHARACTER);
    };

    const handleAiGenerate = async () => {
        if (!aiPrompt) return;
        setIsGenerating(true);
        const profile = await generateCharacterProfile(aiPrompt);
        setIsGenerating(false);
        
        if (profile) {
            // Apply generated profile to state
            setData({
                ...data,
                civilianName: profile.civilianName,
                superName: profile.superName,
                civilianAppearance: profile.civilianAppearance || '',
                superAppearance: profile.superAppearance || '',
                backstory: profile.backstory,
                job: profile.job,
                stats: profile.stats,
            });
            
            // Map the generated power to our state variables
            if (profile.powers && profile.powers.length > 0) {
                const aiPower = profile.powers[0];
                setPowerName(aiPower.name || 'Unknown Power');
                setPowerDesc(aiPower.description || '...');
                setPowerTier(aiPower.tier || 'STREET');
                
                const genPower = {
                    ...aiPower,
                    id: `p-${Date.now()}`,
                    abilities: aiPower.abilities || ['Basic'],
                    upgrades: []
                };
                setData(prev => ({ ...prev, powers: [genPower] }));
            }
            
            // Recalculate spent points
            const totalStats = Object.values(profile.stats || {}).reduce((a, b) => a + b, 0);
            const tierCost = POWER_TIERS.find(t => t.id === profile.powers?.[0]?.tier)?.cost || 1;
            setSpentPoints(totalStats + tierCost);

            // Move to review
            setMode('MANUAL');
            setStep(0);
        }
    };

    const handleNext = () => {
        if (step === 4) {
            // Finalize
            let initialPower;
            
            // Check if we already have a power from AI gen
            if (data.powers && data.powers.length > 0) {
                initialPower = data.powers[0];
            } else if (selectedPreset) {
                // Use Preset Structure but ensure ID is unique for this instance
                initialPower = {
                    ...selectedPreset,
                    id: `p-${Date.now()}`,
                    level: 1,
                    xp: 0,
                    maxXp: 100,
                    upgrades: selectedPreset.upgrades.map((u: any) => ({...u, unlocked: false}))
                };
            } else {
                // Custom Manual
                initialPower = {
                    id: `p-${Date.now()}`,
                    name: powerName || 'Generic Power',
                    description: powerDesc || 'A mysterious ability.',
                    level: 1,
                    xp: 0,
                    maxXp: 100,
                    abilities: ['Basic Move'],
                    upgrades: [],
                    tier: powerTier
                };
            }

            const startingReps: Record<string, number> = {};
            if (selectedRelation === 'FRIEND' && relationName) startingReps[relationName] = 20;
            if (selectedRelation === 'RIVAL' && relationName) startingReps[relationName] = -20;
            
            onComplete({
                ...data,
                name: data.civilianName, // Default display name
                powers: [initialPower], // Ensure array
                hasCreatedCharacter: true,
                resources: { money: 500, mask: 100, fame: 0, publicOpinion: 0 },
                skillPoints: 0,
                downtimeTokens: 2,
                tags: ['Rookie'],
                inventory: [],
                baseUpgrades: [],
                equipment: { HEAD: null, BODY: null, GADGET: null, ACCESSORY: null },
                reputations: startingReps
            });
        } else {
            setStep(s => s + 1);
        }
    };

    const handleTierSelect = (tierId: string, cost: number) => {
        const currentTierCost = POWER_TIERS.find(t => t.id === powerTier)?.cost || 0;
        // Check if we can afford the switch
        const availableAfterRefund = (TOTAL_POINTS - spentPoints) + currentTierCost;
        
        if (availableAfterRefund >= cost) {
            setSpentPoints(prev => prev - currentTierCost + cost);
            setPowerTier(tierId);
            setSelectedPreset(null); // Reset preset if tier changes manually
        }
    };

    const handlePresetSelect = (preset: any) => {
        const presetTierId = preset.tier || 'STREET';
        const tier = POWER_TIERS.find(t => t.id === presetTierId);
        if(!tier) return;

        const currentTierCost = POWER_TIERS.find(t => t.id === powerTier)?.cost || 0;
        const availableAfterRefund = (TOTAL_POINTS - spentPoints) + currentTierCost;

        if (availableAfterRefund >= tier.cost) {
            setSpentPoints(prev => prev - currentTierCost + tier.cost);
            setPowerTier(tier.id);
            setSelectedPreset(preset);
            setPowerName(preset.name);
            setPowerDesc(preset.description);
        }
    };

    const renderManualSteps = () => {
        switch(step) {
            case 0: return (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-8">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><User /> Identity</h2>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-sm mb-1">Civilian Name</label>
                                <input className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white" value={data.civilianName} onChange={e => setData({...data, civilianName: e.target.value})} placeholder="John Doe" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm mb-1">Civilian Look</label>
                                <textarea className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white h-24 text-sm" value={data.civilianAppearance} onChange={e => setData({...data, civilianAppearance: e.target.value})} placeholder="Average build, glasses, casual hoodies..." />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-slate-400 text-sm mb-1">Superhero Alias</label>
                                <input className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white" value={data.superName} onChange={e => setData({...data, superName: e.target.value})} placeholder="The Vindicator" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm mb-1">Super Costume/Look</label>
                                <textarea className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white h-24 text-sm" value={data.superAppearance} onChange={e => setData({...data, superAppearance: e.target.value})} placeholder="Black tactical armor, silver cowl, red cape..." />
                            </div>
                        </div>
                    </div>
                </div>
            );
            case 1: return (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-8">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><BookOpen /> Background</h2>
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Civilian Job</label>
                        <input className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white" value={data.job} onChange={e => setData({...data, job: e.target.value})} placeholder="Journalist, Barista, Scientist..." />
                    </div>
                    <div>
                        <label className="block text-slate-400 text-sm mb-1">Origin Story</label>
                        <textarea className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white h-32" value={data.backstory} onChange={e => setData({...data, backstory: e.target.value})} placeholder="How did you get your powers?" />
                    </div>
                </div>
            );
            case 2: return (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Activity /> Attributes</h2>
                        <span className={`font-mono font-bold ${spentPoints > TOTAL_POINTS ? 'text-red-500' : 'text-amber-500'}`}>{Math.max(0, TOTAL_POINTS - spentPoints)} Points Remaining</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        {Object.values(StatType).map(statName => {
                            const key = statName.toLowerCase() as keyof typeof data.stats;
                            return (
                                <div key={key} className="bg-slate-900 p-4 rounded border border-slate-700 flex justify-between items-center">
                                    <span className="text-white font-bold uppercase">{statName}</span>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => handleStatChange(key, -1)} className="w-8 h-8 rounded bg-slate-800 text-slate-400 hover:bg-slate-700">-</button>
                                        <span className="w-6 text-center font-bold text-xl">{data.stats![key]}</span>
                                        <button onClick={() => handleStatChange(key, 1)} className="w-8 h-8 rounded bg-slate-800 text-green-400 hover:bg-slate-700" disabled={spentPoints >= TOTAL_POINTS}>+</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
            case 3: 
                // If power was pre-generated by AI, show simplified view or allow overwrite
                const hasPreGenPower = data.powers && data.powers.length > 0;
                
                return (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-8">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Zap /> Primary Power</h2>
                        <span className={`font-mono font-bold ${spentPoints > TOTAL_POINTS ? 'text-red-500' : 'text-amber-500'}`}>{Math.max(0, TOTAL_POINTS - spentPoints)} Points Remaining</span>
                    </div>
                    
                    {!hasPreGenPower && (
                        <div className="bg-slate-950 p-3 rounded border border-slate-800">
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Preset Templates</label>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {availablePowers.map(preset => {
                                    const tierId = preset.tier || 'STREET';
                                    const tier = POWER_TIERS.find(t => t.id === tierId);
                                    const isSelected = selectedPreset?.name === preset.name;
                                    return (
                                        <button 
                                            key={preset.name}
                                            onClick={() => handlePresetSelect(preset)}
                                            className={`flex-shrink-0 p-3 rounded border w-32 text-left text-xs transition-colors ${isSelected ? 'bg-blue-900/30 border-blue-500 ring-1 ring-blue-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
                                        >
                                            <div className="font-bold text-white mb-1 truncate">{preset.name}</div>
                                            <div className="text-slate-400">{tier?.name}</div>
                                            <div className="text-amber-500 font-mono mt-1">{tier?.cost} pts</div>
                                        </button>
                                    );
                                })}
                                <button 
                                    onClick={() => { setSelectedPreset(null); setPowerName(''); setPowerDesc(''); }}
                                    className={`flex-shrink-0 p-3 rounded border w-32 text-left text-xs transition-colors flex items-center justify-center ${!selectedPreset ? 'bg-slate-800 border-slate-600' : 'bg-slate-900 border-slate-700'}`}
                                >
                                    <span className="font-bold text-slate-300">Custom...</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {!hasPreGenPower && (
                        <div>
                            <label className="block text-slate-400 text-sm mb-2">Power Tier</label>
                            <div className="grid grid-cols-1 gap-2">
                                {POWER_TIERS.map(tier => (
                                    <button
                                        key={tier.id}
                                        onClick={() => handleTierSelect(tier.id, tier.cost)}
                                        className={`p-3 rounded border text-left transition-all ${powerTier === tier.id ? 'bg-amber-900/20 border-amber-500 ring-1 ring-amber-500' : 'bg-slate-900 border-slate-700 hover:border-slate-500'}`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`font-bold ${powerTier === tier.id ? 'text-amber-400' : 'text-white'}`}>{tier.name}</span>
                                            <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-white">{tier.cost} pts</span>
                                        </div>
                                        <p className="text-xs text-slate-400">{tier.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {hasPreGenPower ? (
                        <div className="bg-slate-800 p-4 rounded border border-slate-600">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-bold text-white">{data.powers![0].name}</h3>
                                <span className="text-xs bg-amber-600 px-2 py-1 rounded text-white">{data.powers![0].tier}</span>
                            </div>
                            <p className="text-slate-300 text-sm mb-2">{data.powers![0].description}</p>
                            <Button size="sm" variant="ghost" onClick={() => setData({...data, powers: []})}>Edit / Reset</Button>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-slate-400 text-sm mb-1">Power Name</label>
                                <input className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white" value={powerName} onChange={e => setPowerName(e.target.value)} placeholder="e.g. Pyrokinesis" />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-sm mb-1">Description</label>
                                <textarea className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white h-20" value={powerDesc} onChange={e => setPowerDesc(e.target.value)} placeholder="Control over fire and heat..." />
                            </div>
                        </>
                    )}
                </div>
            );
            case 4: return (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-8">
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><Users /> Relationships</h2>
                    <p className="text-slate-400 text-sm">Do you have a significant connection in the city?</p>
                    
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <button onClick={() => setSelectedRelation('NONE')} className={`p-4 rounded border ${selectedRelation === 'NONE' ? 'bg-slate-800 border-blue-500' : 'bg-slate-900 border-slate-700'}`}>
                            None
                        </button>
                        <button onClick={() => setSelectedRelation('FRIEND')} className={`p-4 rounded border ${selectedRelation === 'FRIEND' ? 'bg-slate-800 border-green-500' : 'bg-slate-900 border-slate-700'}`}>
                            Friend/Mentor
                        </button>
                        <button onClick={() => setSelectedRelation('RIVAL')} className={`p-4 rounded border ${selectedRelation === 'RIVAL' ? 'bg-slate-800 border-red-500' : 'bg-slate-900 border-slate-700'}`}>
                            Rival/Enemy
                        </button>
                    </div>

                    {selectedRelation !== 'NONE' && (
                        <div>
                            <label className="block text-slate-400 text-sm mb-1">Name of NPC/Faction</label>
                            <input className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white" value={relationName} onChange={e => setRelationName(e.target.value)} placeholder="e.g. Detective Miller" />
                        </div>
                    )}
                </div>
            );
        }
    };

    const isNextDisabled = () => {
        if (step === 0) return !data.civilianName || !data.superName || !data.civilianAppearance || !data.superAppearance;
        if (step === 1) return !data.job || !data.backstory;
        if (step === 2) return false; // Allowed to save points for powers
        if (step === 3) return (!powerName || !powerDesc) && (!data.powers || data.powers.length === 0);
        if (step === 4) return selectedRelation !== 'NONE' && !relationName;
        return false;
    };

    return (
        <div className="fixed inset-0 bg-slate-950 z-[100] flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col h-[700px]">
                {/* Header */}
                <div className="p-6 bg-slate-950 border-b border-slate-800">
                    <div className="flex justify-between items-start mb-4">
                        <h1 className="text-3xl font-black text-white tracking-tight">Create Your Hero</h1>
                        
                        {/* Mode Switcher */}
                        <div className="bg-slate-900 rounded-lg p-1 border border-slate-800 flex">
                            <button onClick={() => { setMode('MANUAL'); setStep(0); }} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${mode === 'MANUAL' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>Manual</button>
                            <button onClick={() => setMode('AI')} className={`px-3 py-1 rounded text-xs font-bold transition-colors flex items-center gap-1 ${mode === 'AI' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                                <Bot size={12}/> AI
                                <span className="ml-1 text-[8px] bg-amber-500 text-slate-900 px-1 rounded font-black">BETA</span>
                            </button>
                        </div>
                    </div>
                    
                    {mode === 'MANUAL' && (
                        <div className="flex gap-2 mt-4">
                            {[0,1,2,3,4].map(i => (
                                <div key={i} className={`h-2 flex-1 rounded-full transition-colors ${i <= step ? 'bg-blue-600' : 'bg-slate-800'}`} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 p-8 overflow-y-auto">
                    {mode === 'MANUAL' ? renderManualSteps() : (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="bg-purple-900/20 border border-purple-500/50 p-6 rounded-lg text-center">
                                <Bot size={48} className="text-purple-400 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">AI Character Generation</h3>
                                <p className="text-slate-300 text-sm mb-6">Describe your hero concept, and the AI will draft your stats, powers, and backstory.</p>
                                
                                <textarea 
                                    className="w-full bg-slate-950 border border-purple-900/50 rounded p-4 text-white h-32 focus:ring-2 focus:ring-purple-500 focus:outline-none mb-4"
                                    placeholder="e.g. A former thief who merged with shadows. High stealth, low strength. Wants to redeem himself."
                                    value={aiPrompt}
                                    onChange={e => setAiPrompt(e.target.value)}
                                />
                                
                                <Button 
                                    onClick={handleAiGenerate} 
                                    isLoading={isGenerating} 
                                    disabled={!aiPrompt}
                                    className="w-full bg-purple-600 hover:bg-purple-500"
                                >
                                    Generate Profile
                                </Button>
                            </div>
                            <div className="text-center">
                                <span className="text-xs text-slate-500">OR</span>
                            </div>
                            <div className="bg-slate-950/50 p-4 rounded border border-slate-800 flex justify-between items-center">
                                <div className="text-sm text-slate-400">Want to jump right into the action with a preset?</div>
                                <Button onClick={handleQuickStart} variant="hero" size="sm" className="flex items-center gap-2">
                                    <PlayCircle size={16} /> Quick Start
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {mode === 'MANUAL' && (
                    <div className="p-6 bg-slate-950 border-t border-slate-800 flex justify-between">
                        <Button variant="ghost" disabled={step === 0} onClick={() => setStep(s => s - 1)}>Back</Button>
                        <div className="flex items-center gap-4">
                            <span className={`text-xs uppercase tracking-wider ${spentPoints > TOTAL_POINTS ? 'text-red-500 font-bold' : 'text-slate-500'}`}>{spentPoints} / {TOTAL_POINTS} Points Spent</span>
                            <Button variant="primary" onClick={handleNext} disabled={isNextDisabled()}>
                                {step === 4 ? <><Check size={18} className="mr-2"/> Finish</> : 'Next Step'}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

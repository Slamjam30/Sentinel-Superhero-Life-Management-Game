
import React, { useState } from 'react';
import { NewsIssue, PlayerResources, CodexEntry } from '../types';
import { Button } from '../components/ui/Button';
import { Edit3, CheckCircle2, ArrowRight } from 'lucide-react';

interface NewsModalProps {
    issue: NewsIssue;
    onClose: (finalImpacts: { resources: Partial<PlayerResources>, codex: Partial<CodexEntry>[], modifiers?: string }) => void;
}

export const NewsModal: React.FC<NewsModalProps> = ({ issue, onClose }) => {
    const [step, setStep] = useState<'FRONT_PAGE' | 'IMPACT'>('FRONT_PAGE');
    
    // Editable Impact State
    const [statChanges, setStatChanges] = useState<Partial<PlayerResources>>(issue.impact?.statChanges || {});
    const [codexEntries, setCodexEntries] = useState<Partial<CodexEntry>[]>(issue.impact?.newCodexEntries || []);
    const [modifiers, setModifiers] = useState<string>(issue.modifiers || '');

    const handleStatChange = (key: keyof PlayerResources, val: number) => {
        setStatChanges(prev => ({ ...prev, [key]: val }));
    };

    const handleCodexChange = (idx: number, field: keyof CodexEntry, val: string) => {
        const newEntries = [...codexEntries];
        newEntries[idx] = { ...newEntries[idx], [field]: val };
        setCodexEntries(newEntries);
    };

    const handleRemoveCodex = (idx: number) => {
        setCodexEntries(codexEntries.filter((_, i) => i !== idx));
    };

    const handleConfirm = () => {
        onClose({
            resources: statChanges,
            codex: codexEntries,
            modifiers: modifiers
        });
    };

    if (step === 'FRONT_PAGE') {
        return (
            <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4">
                <div className="max-w-4xl w-full bg-[#eaddcf] text-slate-900 shadow-2xl rounded-sm overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="p-8 pb-4 border-b-4 border-slate-900 flex justify-between items-end flex-shrink-0">
                        <div>
                            <div className="text-xs font-sans uppercase font-bold tracking-widest mb-1 text-slate-600">The City Chronicle</div>
                            <h1 className="text-5xl md:text-6xl font-black tracking-tighter leading-none">THE SENTINEL</h1>
                        </div>
                        <div className="text-right font-sans">
                            <div className="font-bold text-lg">Day {issue.day}</div>
                            <div className="text-xs uppercase text-slate-600">Special Edition</div>
                        </div>
                    </div>

                    <div className="overflow-y-auto p-8 flex-1 font-serif">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            {issue.articles.map((article, idx) => (
                                <div key={idx} className={`${idx === 0 ? 'col-span-1 md:col-span-8' : 'col-span-1 md:col-span-4'} flex flex-col border-b border-slate-900/20 pb-4 md:border-none`}>
                                    {idx === 0 ? (
                                        <h2 className="text-4xl font-bold leading-tight mb-4 border-b-2 border-slate-900 pb-2">{article.headline}</h2>
                                    ) : (
                                        <h3 className="text-xl font-bold leading-snug mb-2 border-t-2 border-slate-900 pt-2">{article.headline}</h3>
                                    )}
                                    <p className={`text-justify leading-relaxed ${idx === 0 ? 'text-lg' : 'text-sm'}`}>{article.body}</p>
                                    <span className="text-[10px] font-sans uppercase bg-slate-900 text-[#eaddcf] px-2 py-0.5 self-start mt-2">{article.type}</span>
                                </div>
                            ))}
                        </div>
                        {issue.modifiers && (
                            <div className="mt-8 pt-4 border-t-4 border-slate-900 font-sans bg-slate-900/5 p-4 italic text-center">
                                "{issue.modifiers}"
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-900 flex justify-end">
                        <Button variant="hero" onClick={() => setStep('IMPACT')} className="flex items-center gap-2">
                            Review Impact <ArrowRight size={16} />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-6 border-b border-slate-800 bg-slate-800/50">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Edit3 className="text-amber-500"/> World Updates
                    </h2>
                    <p className="text-slate-400 text-sm">Review how this news affects the game state. Edit if necessary.</p>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-8">
                    {/* World Modifiers */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-500 uppercase">World Modifiers</h3>
                        <textarea 
                            className="w-full bg-slate-950 border border-slate-700 rounded p-3 text-sm text-white h-24 placeholder-slate-600"
                            placeholder="Describe persistent world effects (e.g. 'Police are on high alert')"
                            value={modifiers}
                            onChange={(e) => setModifiers(e.target.value)}
                        />
                        <p className="text-[10px] text-slate-500">This text helps the AI Dungeon Master understand the current mood/state of the city.</p>
                    </div>

                    {/* Stats */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-500 uppercase">Stat Impact</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {['publicOpinion', 'fame', 'mask', 'money'].map(key => (
                                <div key={key} className="flex justify-between items-center bg-slate-950 p-3 rounded border border-slate-800">
                                    <span className="text-slate-300 capitalize text-sm">{key}</span>
                                    <input 
                                        type="number" 
                                        className="bg-slate-800 border border-slate-700 rounded w-20 px-2 py-1 text-right text-white text-sm"
                                        value={statChanges[key as keyof PlayerResources] || 0}
                                        onChange={(e) => handleStatChange(key as keyof PlayerResources, parseInt(e.target.value) || 0)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Codex */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-bold text-slate-500 uppercase">New Database Entries</h3>
                        {codexEntries.length === 0 && <p className="text-slate-500 text-sm italic">No new entities identified.</p>}
                        {codexEntries.map((entry, idx) => (
                            <div key={idx} className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                                <div className="flex justify-between">
                                    <input 
                                        className="bg-transparent border-b border-slate-700 text-white font-bold text-sm w-1/2 focus:outline-none focus:border-blue-500"
                                        value={entry.title || ''}
                                        onChange={(e) => handleCodexChange(idx, 'title', e.target.value)}
                                        placeholder="Name"
                                    />
                                    <div className="flex gap-2">
                                        <select 
                                            className="bg-slate-800 border border-slate-700 rounded text-xs text-white"
                                            value={entry.category || 'NPC'}
                                            onChange={(e) => handleCodexChange(idx, 'category', e.target.value)}
                                        >
                                            <option value="NPC">NPC</option>
                                            <option value="FACTION">Faction</option>
                                            <option value="LORE">Lore</option>
                                            <option value="LOCATION">Location</option>
                                        </select>
                                        <button onClick={() => handleRemoveCodex(idx)} className="text-slate-500 hover:text-red-400">&times;</button>
                                    </div>
                                </div>
                                <textarea 
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs text-slate-300 h-16"
                                    value={entry.content || ''}
                                    onChange={(e) => handleCodexChange(idx, 'content', e.target.value)}
                                    placeholder="Description..."
                                />
                            </div>
                        ))}
                        <Button size="sm" variant="secondary" onClick={() => setCodexEntries([...codexEntries, { title: 'New Entry', category: 'NPC', content: '' }])}>
                            + Add Entry
                        </Button>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-800 bg-slate-900 flex justify-end">
                    <Button onClick={handleConfirm} className="w-full md:w-auto px-8">
                        Confirm Changes
                    </Button>
                </div>
            </div>
        </div>
    );
};

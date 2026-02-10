
import React, { useState } from 'react';
import { WeekTheme } from '../types';
import { Button } from '../components/ui/Button';
import { CalendarRange, Plus, Trash2, Edit3, Save, X, Info } from 'lucide-react';

interface Props {
    weekThemes: WeekTheme[];
    onSave: (themes: WeekTheme[]) => void;
}

export const WeekSchedule: React.FC<Props> = ({ weekThemes, onSave }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    
    // Form State
    const [formTheme, setFormTheme] = useState<Partial<WeekTheme>>({
        focus: 'BALANCED'
    });

    const startAdd = () => {
        setIsAdding(true);
        // Default range suggestion
        const lastEnd = weekThemes.length > 0 ? Math.max(...weekThemes.map(t => t.endDay)) : 0;
        setFormTheme({
            id: `wt-${Date.now()}`,
            startDay: lastEnd + 1,
            endDay: lastEnd + 7,
            title: '',
            description: '',
            focus: 'BALANCED'
        });
    };

    const startEdit = (theme: WeekTheme) => {
        setEditingId(theme.id);
        setFormTheme(theme);
        setIsAdding(true);
    };

    const handleSave = () => {
        if (!formTheme.title || !formTheme.startDay || !formTheme.endDay) return;
        
        const newTheme = formTheme as WeekTheme;
        let newThemes = [...weekThemes];
        
        if (editingId) {
            newThemes = newThemes.map(t => t.id === editingId ? newTheme : t);
        } else {
            newThemes.push(newTheme);
        }
        
        // Sort by start day
        newThemes.sort((a, b) => a.startDay - b.startDay);
        
        onSave(newThemes);
        setIsAdding(false);
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        onSave(weekThemes.filter(t => t.id !== id));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <CalendarRange /> Campaign Schedule
                    </h2>
                    <p className="text-slate-400 text-xs">Define narrative arcs. Automators and events adapt to the active week theme.</p>
                </div>
                {!isAdding && (
                    <Button onClick={startAdd} size="sm" className="flex items-center gap-2">
                        <Plus size={16} /> Add Arc
                    </Button>
                )}
            </div>

            {isAdding && (
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase">{editingId ? 'Edit Arc' : 'New Arc'}</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Day</label>
                            <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={formTheme.startDay} onChange={e => setFormTheme({...formTheme, startDay: parseInt(e.target.value)})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Day</label>
                            <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" value={formTheme.endDay} onChange={e => setFormTheme({...formTheme, endDay: parseInt(e.target.value)})} />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Theme Title</label>
                        <input className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" placeholder="e.g. The Alien Invasion" value={formTheme.title} onChange={e => setFormTheme({...formTheme, title: e.target.value})} />
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Description / Focus</label>
                        <textarea className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white h-20 text-sm" placeholder="e.g. High intensity combat encounters, extra-terrestrial enemies." value={formTheme.description} onChange={e => setFormTheme({...formTheme, description: e.target.value})} />
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gameplay Focus</label>
                        <div className="flex gap-2">
                            {['COMBAT', 'INVESTIGATION', 'SOCIAL', 'BALANCED'].map(f => (
                                <button 
                                    key={f} 
                                    onClick={() => setFormTheme({...formTheme, focus: f as any})}
                                    className={`px-3 py-1 rounded text-xs border transition-colors ${formTheme.focus === f ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => { setIsAdding(false); setEditingId(null); }}>Cancel</Button>
                        <Button variant="primary" size="sm" onClick={handleSave} className="flex items-center gap-1"><Save size={14}/> Save Arc</Button>
                    </div>
                </div>
            )}

            <div className="space-y-3 relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-800 z-0"></div>

                {weekThemes.length === 0 && <div className="text-center text-slate-500 text-sm italic py-8">No specific themes scheduled. Standard generation applies.</div>}

                {weekThemes.map(theme => (
                    <div key={theme.id} className="relative z-10 flex gap-4 group">
                        <div className="w-12 flex-shrink-0 flex flex-col items-center pt-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500 ring-4 ring-slate-900"></div>
                        </div>
                        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-4 hover:border-slate-600 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <div>
                                    <h4 className="font-bold text-white text-lg">{theme.title}</h4>
                                    <div className="text-xs text-blue-400 font-mono mb-2">Day {theme.startDay} - {theme.endDay}</div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEdit(theme)} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white"><Edit3 size={14}/></button>
                                    <button onClick={() => handleDelete(theme.id)} className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400"><Trash2 size={14}/></button>
                                </div>
                            </div>
                            <p className="text-sm text-slate-300 mb-2">{theme.description}</p>
                            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 border border-slate-700">{theme.focus}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

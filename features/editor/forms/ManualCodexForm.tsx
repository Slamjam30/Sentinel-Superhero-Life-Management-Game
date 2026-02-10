
import React, { useState } from 'react';
import { CodexEntry, CodexSecret } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';

interface Props {
    entry: Partial<CodexEntry>;
    onChange: (entry: Partial<CodexEntry>) => void;
}

export const ManualCodexForm: React.FC<Props> = ({ entry, onChange }) => {
    const [newSecret, setNewSecret] = useState('');

    const handleAddSecret = () => {
        if (!newSecret) return;
        const secrets = entry.secrets || [];
        onChange({ ...entry, secrets: [...secrets, { text: newSecret, unlocked: false }] });
        setNewSecret('');
    };

    const toggleSecretLock = (index: number) => {
        const secrets = [...(entry.secrets || [])];
        secrets[index].unlocked = !secrets[index].unlocked;
        onChange({ ...entry, secrets });
    };

    const removeSecret = (index: number) => {
        const secrets = (entry.secrets || []).filter((_, i) => i !== index);
        onChange({ ...entry, secrets });
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="space-y-4 bg-slate-900 border border-slate-700 p-4 rounded-lg">
                <input 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold" 
                    placeholder="Entry Title (Name)" 
                    value={entry.title || ''} 
                    onChange={e => onChange({...entry, title: e.target.value})} 
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <select 
                        className="bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm" 
                        value={entry.category} 
                        onChange={e => onChange({...entry, category: e.target.value as any})}
                    >
                        <option value="NPC">NPC</option>
                        <option value="FACTION">Faction</option>
                        <option value="LORE">Lore</option>
                        <option value="LOCATION">Location</option>
                    </select>
                    
                    <div className="flex items-center gap-2">
                        <input 
                            type="checkbox" 
                            checked={entry.unlocked || false} 
                            onChange={e => onChange({...entry, unlocked: e.target.checked})}
                            className="rounded border-slate-700 bg-slate-800 text-blue-500"
                        />
                        <span className="text-sm text-slate-300">Unlocked (Visible)</span>
                    </div>
                </div>

                <textarea 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white h-24 text-sm" 
                    placeholder="General Description / Bio" 
                    value={entry.content || ''} 
                    onChange={e => onChange({...entry, content: e.target.value})} 
                />

                <textarea 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white h-20 text-sm" 
                    placeholder="Appearance Description" 
                    value={entry.appearance || ''} 
                    onChange={e => onChange({...entry, appearance: e.target.value})} 
                />
            </div>

            {(entry.category === 'NPC' || entry.category === 'FACTION') && (
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase">Relationships</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Civilian Rep</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm" 
                                value={entry.relationship?.civilianRep || 0} 
                                onChange={e => onChange({
                                    ...entry, 
                                    relationship: { ...(entry.relationship || { civilianRep: 0, superRep: 0, knowsIdentity: false }), civilianRep: parseInt(e.target.value) }
                                })} 
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Super Rep</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm" 
                                value={entry.relationship?.superRep || 0} 
                                onChange={e => onChange({
                                    ...entry, 
                                    relationship: { ...(entry.relationship || { civilianRep: 0, superRep: 0, knowsIdentity: false }), superRep: parseInt(e.target.value) }
                                })} 
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 bg-slate-950 rounded border border-slate-800">
                        <input 
                            type="checkbox" 
                            checked={entry.relationship?.knowsIdentity || false} 
                            onChange={e => onChange({
                                ...entry, 
                                relationship: { ...(entry.relationship || { civilianRep: 0, superRep: 0, knowsIdentity: false }), knowsIdentity: e.target.checked }
                            })}
                            className="rounded border-slate-700 bg-slate-800 text-red-500"
                        />
                        <span className="text-sm font-bold text-red-400">Knows Secret Identity (Syncs Rep)</span>
                    </div>
                </div>
            )}

            <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase">Secrets</h3>
                <p className="text-xs text-slate-500">Hidden details unlockable through gameplay.</p>
                
                <div className="space-y-2">
                    {entry.secrets?.map((s, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800">
                            <span className={`text-sm flex-1 ${s.unlocked ? 'text-white' : 'text-slate-500 italic'}`}>
                                {s.text}
                            </span>
                            <div className="flex items-center gap-1">
                                <button onClick={() => toggleSecretLock(i)} className="p-1 hover:text-white text-slate-500">
                                    {s.unlocked ? <Eye size={14}/> : <EyeOff size={14}/>}
                                </button>
                                <button onClick={() => removeSecret(i)} className="p-1 hover:text-red-400 text-slate-500">
                                    <Trash2 size={14}/>
                                </button>
                            </div>
                        </div>
                    ))}
                    {(!entry.secrets || entry.secrets.length === 0) && (
                        <div className="text-xs text-slate-600 italic text-center py-2">No secrets added.</div>
                    )}
                </div>

                <div className="flex gap-2">
                    <input 
                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white" 
                        placeholder="Add new secret..."
                        value={newSecret}
                        onChange={e => setNewSecret(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddSecret()}
                    />
                    <Button size="sm" onClick={handleAddSecret}><Plus size={14}/></Button>
                </div>
            </div>
        </div>
    );
};

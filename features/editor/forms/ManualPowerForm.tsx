
import React, { useState } from 'react';
import { Power, PowerUpgrade } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Plus, Trash2, ArrowUp, CornerDownRight, Check, X, Edit3 } from 'lucide-react';

interface Props {
    power: Partial<Power>;
    onChange: (power: Partial<Power>) => void;
}

export const ManualPowerForm: React.FC<Props> = ({ power, onChange }) => {
    const [newAbilityName, setNewAbilityName] = useState('');
    const [editingAbilityIndex, setEditingAbilityIndex] = useState<number | null>(null);
    const [editingAbilityValue, setEditingAbilityValue] = useState('');

    const handleAddAbility = () => {
        if (!newAbilityName) return;
        onChange({ ...power, abilities: [...(power.abilities || []), newAbilityName] });
        setNewAbilityName('');
    };

    const handleRemoveAbility = (index: number) => {
        const newAbs = [...(power.abilities || [])];
        newAbs.splice(index, 1);
        onChange({ ...power, abilities: newAbs });
    };

    const startEditingAbility = (index: number, val: string) => {
        setEditingAbilityIndex(index);
        setEditingAbilityValue(val);
    };

    const saveEditingAbility = (index: number) => {
        if (!editingAbilityValue.trim()) return;
        const newAbs = [...(power.abilities || [])];
        newAbs[index] = editingAbilityValue;
        onChange({ ...power, abilities: newAbs });
        setEditingAbilityIndex(null);
        setEditingAbilityValue('');
    };

    const handleAddUpgrade = () => {
        const newUpgrade: PowerUpgrade = {
            id: `u-${Date.now()}`,
            name: 'New Upgrade',
            description: 'Description',
            cost: 1,
            requiredLevel: 1,
            unlocked: false,
            type: 'PASSIVE',
            parentId: undefined
        };
        onChange({ ...power, upgrades: [...(power.upgrades || []), newUpgrade] });
    };

    const updateUpgrade = (id: string, updates: Partial<PowerUpgrade>) => {
        const newUpgrades = (power.upgrades || []).map(u => u.id === id ? { ...u, ...updates } : u);
        onChange({ ...power, upgrades: newUpgrades });
    };

    const deleteUpgrade = (id: string) => {
        // Also clear parentId of any children
        const newUpgrades = (power.upgrades || [])
            .filter(u => u.id !== id)
            .map(u => u.parentId === id ? { ...u, parentId: undefined } : u);
        onChange({ ...power, upgrades: newUpgrades });
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Core Info */}
            <div className="space-y-4 bg-slate-900 border border-slate-700 p-4 rounded-lg">
                <input 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold" 
                    placeholder="Power Name" 
                    value={power.name || ''} 
                    onChange={e => onChange({...power, name: e.target.value})} 
                />
                <textarea 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white h-20 text-sm" 
                    placeholder="Power Description" 
                    value={power.description || ''} 
                    onChange={e => onChange({...power, description: e.target.value})} 
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <select 
                        className="bg-slate-950 border border-slate-700 rounded p-2 text-white w-full text-sm" 
                        value={power.tier} 
                        onChange={e => onChange({...power, tier: e.target.value as any})}
                    >
                        <option value="STREET">Street Tier (Cost 1)</option>
                        <option value="HEROIC">Heroic Tier (Cost 3)</option>
                        <option value="COSMIC">Cosmic Tier (Cost 5)</option>
                    </select>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">Level</label>
                            <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm" value={power.level || 1} onChange={e => onChange({...power, level: parseInt(e.target.value)})} />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">XP</label>
                            <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm" value={power.xp || 0} onChange={e => onChange({...power, xp: parseInt(e.target.value)})} />
                        </div>
                        <div className="flex-1">
                            <label className="text-[10px] uppercase text-slate-500 font-bold">Max XP</label>
                            <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm" value={power.maxXp || 100} onChange={e => onChange({...power, maxXp: parseInt(e.target.value)})} />
                        </div>
                    </div>
                </div>
                
                {/* Abilities Tags */}
                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Abilities (Tags)</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {power.abilities?.map((ab, i) => (
                            <span key={i} className={`bg-slate-800 text-slate-300 px-2 py-1 rounded text-xs flex items-center gap-1 border ${editingAbilityIndex === i ? 'border-blue-500' : 'border-transparent'}`}>
                                {editingAbilityIndex === i ? (
                                    <div className="flex items-center gap-1">
                                        <input 
                                            className="bg-slate-900 border border-slate-600 rounded px-1 text-white w-24 focus:outline-none"
                                            value={editingAbilityValue}
                                            onChange={(e) => setEditingAbilityValue(e.target.value)}
                                            onKeyDown={(e) => { if(e.key === 'Enter') saveEditingAbility(i); }}
                                            autoFocus
                                        />
                                        <button onClick={() => saveEditingAbility(i)} className="text-green-400"><Check size={10}/></button>
                                        <button onClick={() => setEditingAbilityIndex(null)} className="text-red-400"><X size={10}/></button>
                                    </div>
                                ) : (
                                    <>
                                        {ab}
                                        <button onClick={() => startEditingAbility(i, ab)} className="hover:text-blue-400 ml-1"><Edit3 size={10}/></button>
                                        <button onClick={() => handleRemoveAbility(i)} className="hover:text-red-400"><Trash2 size={10}/></button>
                                    </>
                                )}
                            </span>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input 
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white flex-1" 
                            placeholder="Add Ability Tag"
                            value={newAbilityName}
                            onChange={e => setNewAbilityName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddAbility()}
                        />
                        <Button size="sm" onClick={handleAddAbility}><Plus size={14}/></Button>
                    </div>
                </div>
            </div>

            {/* Skill Tree Editor */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm font-bold text-slate-400 uppercase">Skill Tree Nodes</h3>
                    <Button size="sm" onClick={handleAddUpgrade}><Plus size={14} className="mr-1"/> Add Node</Button>
                </div>
                
                <div className="space-y-2">
                    {power.upgrades?.map((upgrade) => (
                        <div key={upgrade.id} className="bg-slate-900 border border-slate-700 p-3 rounded-lg relative group">
                            <div className="flex gap-2 mb-2">
                                <input 
                                    className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-sm text-white font-bold" 
                                    value={upgrade.name} 
                                    onChange={e => updateUpgrade(upgrade.id, { name: e.target.value })}
                                />
                                <select 
                                    className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-white w-24"
                                    value={upgrade.type}
                                    onChange={e => updateUpgrade(upgrade.id, { type: e.target.value as any })}
                                >
                                    <option value="ABILITY">Ability</option>
                                    <option value="PASSIVE">Passive</option>
                                </select>
                                <Button size="sm" variant="danger" className="h-7 w-7 p-0" onClick={() => deleteUpgrade(upgrade.id)}><Trash2 size={12}/></Button>
                            </div>
                            
                            <input 
                                className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-300 mb-2" 
                                value={upgrade.description} 
                                onChange={e => updateUpgrade(upgrade.id, { description: e.target.value })}
                                placeholder="Node Description"
                            />

                            <div className="flex gap-2 items-center">
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-slate-500 uppercase">Cost</span>
                                    <input 
                                        type="number" 
                                        className="w-12 bg-slate-950 border border-slate-700 rounded px-1 text-xs text-white" 
                                        value={upgrade.cost} 
                                        onChange={e => updateUpgrade(upgrade.id, { cost: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-slate-500 uppercase">Lvl Req</span>
                                    <input 
                                        type="number" 
                                        className="w-12 bg-slate-950 border border-slate-700 rounded px-1 text-xs text-white" 
                                        value={upgrade.requiredLevel} 
                                        onChange={e => updateUpgrade(upgrade.id, { requiredLevel: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="flex items-center gap-1 flex-1">
                                    <span className="text-[10px] text-slate-500 uppercase">Parent</span>
                                    <select 
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-1 text-xs text-white"
                                        value={upgrade.parentId || ''}
                                        onChange={e => updateUpgrade(upgrade.id, { parentId: e.target.value || undefined })}
                                    >
                                        <option value="">(None - Root Node)</option>
                                        {power.upgrades?.filter(u => u.id !== upgrade.id).map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <label className="flex items-center gap-1 ml-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={upgrade.unlocked} 
                                        onChange={e => updateUpgrade(upgrade.id, { unlocked: e.target.checked })} 
                                        className="rounded border-slate-700 bg-slate-900 text-green-500"
                                    />
                                    <span className="text-[10px] text-slate-400">Unlocked</span>
                                </label>
                            </div>
                            
                            {/* Visual Indicator of Parent */}
                            {upgrade.parentId && (
                                <div className="absolute -left-3 top-1/2 text-slate-600">
                                    <CornerDownRight size={16} />
                                </div>
                            )}
                        </div>
                    ))}
                    {(!power.upgrades || power.upgrades.length === 0) && (
                        <div className="text-center text-slate-600 text-xs italic py-4">No nodes defined in skill tree.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

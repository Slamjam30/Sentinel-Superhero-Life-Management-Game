
import React, { useState } from 'react';
import { BaseUpgrade } from '../../../types';
import { Button } from '../../../components/ui/Button';
import { Plus, X, Zap, Brain, Activity, Smile, Heart, DollarSign } from 'lucide-react';

interface Props {
    upgrade: Partial<BaseUpgrade>;
    onChange: (upgrade: Partial<BaseUpgrade>) => void;
}

export const ManualUpgradeForm: React.FC<Props> = ({ upgrade, onChange }) => {
    const [modKey, setModKey] = useState('smarts');
    const [modVal, setModVal] = useState(0);

    const addModifier = () => {
        if (modVal === 0) return;
        const current = upgrade.trainingModifiers || {};
        onChange({
            ...upgrade,
            trainingModifiers: { ...current, [modKey]: modVal }
        });
        setModVal(0);
    };

    const removeModifier = (key: string) => {
        const current = { ...(upgrade.trainingModifiers || {}) };
        delete current[key];
        onChange({ ...upgrade, trainingModifiers: current });
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg space-y-4">
                <input 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold" 
                    placeholder="Upgrade Name" 
                    value={upgrade.name || ''} 
                    onChange={e => onChange({...upgrade, name: e.target.value})} 
                />
                
                <div className="flex gap-4">
                    <input 
                        type="number" 
                        className="bg-slate-950 border border-slate-700 rounded p-2 text-white w-1/3" 
                        placeholder="Cost" 
                        value={upgrade.cost} 
                        onChange={e => onChange({...upgrade, cost: parseInt(e.target.value)})} 
                    />
                    <input 
                        className="bg-slate-950 border border-slate-700 rounded p-2 text-white flex-1" 
                        placeholder="Effect Description" 
                        value={upgrade.effectDescription || ''} 
                        onChange={e => onChange({...upgrade, effectDescription: e.target.value})} 
                    />
                </div>

                <textarea 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white h-20 text-sm" 
                    placeholder="Flavor Description" 
                    value={upgrade.description || ''} 
                    onChange={e => onChange({...upgrade, description: e.target.value})} 
                />
            </div>

            <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase">Bonuses & Modifiers</h3>
                
                <div className="bg-slate-950 p-3 rounded border border-slate-800 mb-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                        <DollarSign size={12} className="text-green-500" /> Work Income Bonus
                    </label>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-300">+$</span>
                        <input 
                            type="number" 
                            className="bg-slate-900 border border-slate-700 rounded p-1 text-white w-24 text-sm"
                            value={upgrade.workMoneyBonus || 0}
                            onChange={e => onChange({...upgrade, workMoneyBonus: parseInt(e.target.value)})}
                        />
                        <span className="text-xs text-slate-500">Added to every Work Shift</span>
                    </div>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Training Modifiers</label>
                    <p className="text-[10px] text-slate-400 mb-2">Bonuses applied to Training Downtime XP when this upgrade is owned.</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                        {Object.entries(upgrade.trainingModifiers || {}).map(([key, val]) => (
                            <div key={key} className="bg-slate-800 text-white px-3 py-1 rounded-full text-xs flex items-center gap-2 border border-slate-700">
                                <span className="capitalize text-slate-300">{key}</span>
                                <span className="font-bold text-green-400">+{val} XP</span>
                                <button onClick={() => removeModifier(key)} className="hover:text-red-400"><X size={12}/></button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2 items-center bg-slate-950 p-2 rounded border border-slate-800">
                        <select 
                            className="bg-slate-900 text-white text-xs p-2 rounded border border-slate-700"
                            value={modKey}
                            onChange={e => setModKey(e.target.value)}
                        >
                            <option value="smarts">Smarts</option>
                            <option value="charm">Charm</option>
                            <option value="coordination">Coordination</option>
                            <option value="will">Will</option>
                            <option value="POWER">Power XP</option>
                        </select>
                        <input 
                            type="number" 
                            step="0.1"
                            className="bg-slate-900 text-white text-xs p-2 rounded border border-slate-700 w-20"
                            placeholder="Amount"
                            value={modVal}
                            onChange={e => setModVal(parseFloat(e.target.value))}
                        />
                        <Button size="sm" onClick={addModifier} disabled={modVal === 0}><Plus size={14}/></Button>
                    </div>
                </div>
            </div>
        </div>
    );
};


import React from 'react';
import { Automator } from '../../../types';
import { Button } from '../../../components/ui/Button';

interface Props {
    automator: Partial<Automator>;
    onChange: (auto: Partial<Automator>) => void;
    availablePools: { id: string, name: string }[];
}

export const ManualAutomatorForm: React.FC<Props> = ({ automator, onChange, availablePools }) => {
    
    const updateConfig = (updates: Partial<Automator['config']>) => {
        onChange({
            ...automator,
            config: { ...automator.config, ...updates }
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg space-y-4">
                <input 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold" 
                    placeholder="Automator Name" 
                    value={automator.name || ''} 
                    onChange={e => onChange({...automator, name: e.target.value})} 
                />
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Generate Type</label>
                        <select 
                            className="bg-slate-950 border border-slate-700 rounded p-2 text-white w-full text-sm" 
                            value={automator.type} 
                            onChange={e => onChange({...automator, type: e.target.value as any})}
                        >
                            <option value="TASK">Task</option>
                            <option value="EVENT">Event</option>
                            <option value="ITEM">Item</option>
                            <option value="UPGRADE">Base Upgrade</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Interval (Days)</label>
                        <input 
                            type="number" 
                            className="bg-slate-950 border border-slate-700 rounded p-2 text-white w-full text-sm" 
                            value={automator.intervalDays || 1} 
                            onChange={e => onChange({...automator, intervalDays: parseInt(e.target.value)})} 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-950 p-2 rounded border border-slate-800">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Start Day</label>
                        <input 
                            type="number" 
                            className="bg-slate-900 border border-slate-700 rounded p-2 text-white w-full text-sm" 
                            value={automator.startDay || 0} 
                            onChange={e => onChange({...automator, startDay: parseInt(e.target.value)})} 
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">End Day (-1 = Forever)</label>
                        <input 
                            type="number" 
                            className="bg-slate-900 border border-slate-700 rounded p-2 text-white w-full text-sm" 
                            value={automator.endDay ?? -1} 
                            onChange={e => onChange({...automator, endDay: parseInt(e.target.value)})} 
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input 
                        type="checkbox" 
                        checked={automator.active} 
                        onChange={e => onChange({...automator, active: e.target.checked})}
                        className="rounded border-slate-700 bg-slate-800 text-green-500"
                    />
                    <span className="text-sm text-slate-300">Active</span>
                </div>
            </div>

            {/* Config Section */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase">Configuration</h3>
                
                <textarea 
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white h-24 text-sm" 
                    placeholder="Context / Prompt for Generation (e.g. 'Street crime in the slums')" 
                    value={automator.config?.context || ''} 
                    onChange={e => updateConfig({ context: e.target.value })} 
                />

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-slate-500 mb-1">Amount to Generate</label>
                        <input 
                            type="number" 
                            className="bg-slate-900 border border-slate-700 rounded p-2 text-white w-full text-sm" 
                            value={automator.config?.amount || 1} 
                            onChange={e => updateConfig({ amount: parseInt(e.target.value) })} 
                        />
                    </div>
                    {automator.type === 'TASK' && (
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Target Task Pool</label>
                            <select 
                                className="bg-slate-900 border border-slate-700 rounded p-2 text-white w-full text-sm"
                                value={automator.config?.targetPoolId || ''}
                                onChange={e => updateConfig({ targetPoolId: e.target.value })}
                            >
                                <option value="">(None - Add to Active)</option>
                                {availablePools.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>

                {(automator.type === 'TASK' || automator.type === 'EVENT') && (
                    <div className="grid grid-cols-2 gap-4 bg-slate-900 p-3 rounded border border-slate-700">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Min Level/Diff</label>
                            <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-white text-sm" value={automator.config?.difficultyMin || 1} onChange={e => updateConfig({ difficultyMin: parseInt(e.target.value) })} />
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Max Level/Diff</label>
                            <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-white text-sm" value={automator.config?.difficultyMax || 5} onChange={e => updateConfig({ difficultyMax: parseInt(e.target.value) })} />
                        </div>
                        {automator.type === 'TASK' && (
                            <div className="col-span-2 flex items-center gap-2">
                                <input type="checkbox" checked={automator.config?.scalable || false} onChange={e => updateConfig({ scalable: e.target.checked })} />
                                <span className="text-sm text-slate-300">Scalable (Increases diff over time)</span>
                            </div>
                        )}
                        {automator.type === 'EVENT' && (
                            <div className="col-span-2">
                                <label className="block text-xs text-slate-500 mb-1">Schedule Range (Days from Start)</label>
                                <div className="flex items-center gap-2">
                                    <input type="number" className="w-20 bg-slate-950 border border-slate-700 rounded p-1 text-white text-sm" value={automator.config?.dateRange || 0} onChange={e => updateConfig({ dateRange: parseInt(e.target.value) })} />
                                    <span className="text-xs text-slate-400">0 = Immediate, 5 = 1-5 days later</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {automator.type === 'ITEM' && (
                    <div className="bg-slate-900 p-3 rounded border border-slate-700 space-y-3">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Item Type</label>
                            <select className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-white text-sm" value={automator.config?.itemType || 'GEAR'} onChange={e => updateConfig({ itemType: e.target.value as any })}>
                                <option value="GEAR">Gear</option>
                                <option value="CONSUMABLE">Consumable</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">Min Cost/Rarity</label>
                            <input type="number" className="w-full bg-slate-950 border border-slate-700 rounded p-1 text-white text-sm" value={automator.config?.rarityCostMin || 50} onChange={e => updateConfig({ rarityCostMin: parseInt(e.target.value) })} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

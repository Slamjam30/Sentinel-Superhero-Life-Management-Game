
import React from 'react';
import { DowntimeActivity } from '../../../types';
import { RewardsBuilder } from '../../../components/ui/RewardsBuilder';

interface Props {
    activity: Partial<DowntimeActivity>;
    onChange: (activity: Partial<DowntimeActivity>) => void;
}

export const ManualDowntimeForm: React.FC<Props> = ({ activity, onChange }) => {
    
    const updateConfig = (field: 'attributeXp' | 'powerXp', val: number) => {
        onChange({
            ...activity,
            trainingConfig: { 
                attributeXp: 0.25, 
                powerXp: 20,
                ...(activity.trainingConfig),
                [field]: val 
            }
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg space-y-4">
                <input 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold" 
                    placeholder="Activity Title" 
                    value={activity.title || ''} 
                    onChange={e => onChange({...activity, title: e.target.value})} 
                />
                
                <textarea 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white h-24 text-sm" 
                    placeholder="Description" 
                    value={activity.description || ''} 
                    onChange={e => onChange({...activity, description: e.target.value})} 
                />

                <select 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm" 
                    value={activity.type} 
                    onChange={e => onChange({...activity, type: e.target.value as any})}
                >
                    <option value="TRAINING">Training</option>
                    <option value="WORK">Work</option>
                    <option value="SOCIAL">Social</option>
                    <option value="CUSTOM">Custom</option>
                </select>
                
                <input 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm" 
                    placeholder="Linked Task ID (Optional)" 
                    value={activity.linkedTaskId || ''} 
                    onChange={e => onChange({...activity, linkedTaskId: e.target.value})} 
                />
            </div>

            {activity.type === 'TRAINING' && (
                <div className="bg-amber-900/10 border border-amber-900/30 p-4 rounded-lg space-y-4">
                    <h4 className="text-xs font-bold text-amber-500 uppercase">Training Configuration</h4>
                    <p className="text-[10px] text-slate-400">Default base values for automated training. Can be boosted by Base Upgrades.</p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Base Attribute XP</label>
                            <input 
                                type="number" 
                                step="0.05"
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm" 
                                value={activity.trainingConfig?.attributeXp || 0.25} 
                                onChange={e => updateConfig('attributeXp', parseFloat(e.target.value))} 
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Usually &lt; 1.0 (e.g. 0.25)</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Base Power XP</label>
                            <input 
                                type="number" 
                                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm" 
                                value={activity.trainingConfig?.powerXp || 20} 
                                onChange={e => updateConfig('powerXp', parseInt(e.target.value))} 
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Usually 10-50</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Roleplay Prompt</h4>
                <textarea 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white h-24 text-sm" 
                    placeholder="Instructions for the AI when playing this scene..." 
                    value={activity.roleplayPrompt || ''} 
                    onChange={e => onChange({...activity, roleplayPrompt: e.target.value})} 
                />
            </div>

            <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Auto-Resolve Settings</h4>
                <input 
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white text-sm" 
                    placeholder="Log Message (e.g. 'You worked a shift.')" 
                    value={activity.autoLog || ''} 
                    onChange={e => onChange({...activity, autoLog: e.target.value})} 
                />
                <RewardsBuilder rewards={activity.autoRewards || {}} onChange={r => onChange({...activity, autoRewards: r})} />
            </div>
        </div>
    );
};

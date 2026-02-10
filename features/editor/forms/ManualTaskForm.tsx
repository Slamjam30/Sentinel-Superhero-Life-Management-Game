
import React from 'react';
import { Task, TaskType, Identity, ScenarioMode } from '../../../types';
import { RewardsBuilder } from '../../../components/ui/RewardsBuilder';

interface Props {
    task: Partial<Task>;
    onChange: (task: Partial<Task>) => void;
    reputationTargetsInput: string;
    onChangeReputationTargets: (val: string) => void;
    nodesJson: string;
    onChangeNodesJson: (val: string) => void;
    contextInput: string;
    onChangeContextInput: (val: string) => void;
    availableItems?: { id: string, name: string }[];
}

export const ManualTaskForm: React.FC<Props> = ({
    task,
    onChange,
    reputationTargetsInput,
    onChangeReputationTargets,
    nodesJson,
    onChangeNodesJson,
    contextInput,
    onChangeContextInput,
    availableItems = []
}) => {
    return (
        <div className="space-y-4 animate-in fade-in">
            <input 
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white" 
                placeholder="Task Title" 
                value={task.title || ''} 
                onChange={e => onChange({...task, title: e.target.value})} 
            />
            <textarea 
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white h-24" 
                placeholder="Description" 
                value={task.description || ''} 
                onChange={e => onChange({...task, description: e.target.value})} 
            />
            <div className="grid grid-cols-2 gap-4">
                <select 
                    className="bg-slate-900 border border-slate-700 rounded p-2 text-white" 
                    value={task.type} 
                    onChange={e => onChange({...task, type: e.target.value as TaskType})}
                >
                    {Object.values(TaskType).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input 
                    type="number" 
                    className="bg-slate-900 border border-slate-700 rounded p-2 text-white" 
                    placeholder="Difficulty (1-10)" 
                    value={task.difficulty} 
                    onChange={e => onChange({...task, difficulty: parseInt(e.target.value)})} 
                />
                <select 
                    className="bg-slate-900 border border-slate-700 rounded p-2 text-white" 
                    value={task.requiredIdentity} 
                    onChange={e => onChange({...task, requiredIdentity: e.target.value as Identity})}
                >
                    <option value={Identity.CIVILIAN}>Civilian</option>
                    <option value={Identity.SUPER}>Superhero</option>
                </select>
                <select 
                    className="bg-slate-900 border border-slate-700 rounded p-2 text-white" 
                    value={task.mode} 
                    onChange={e => onChange({...task, mode: e.target.value as ScenarioMode})}
                >
                    <option value={ScenarioMode.FREEFORM}>Freeform</option>
                    <option value={ScenarioMode.STRUCTURED}>Structured</option>
                </select>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex-1">
                    <label className="text-xs text-slate-400 uppercase font-bold">Reputation Targets</label>
                    <input 
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm" 
                        placeholder="e.g. Dr. Thorne, Iron Syndicate" 
                        value={reputationTargetsInput} 
                        onChange={e => onChangeReputationTargets(e.target.value)} 
                    />
                </div>
                <div className="flex items-center gap-2 pt-5">
                    <input 
                        type="checkbox" 
                        id="listensToNews" 
                        checked={task.listensToNews || false} 
                        onChange={e => onChange({...task, listensToNews: e.target.checked})} 
                        className="rounded border-slate-700 bg-slate-800 text-purple-500"
                    />
                    <label htmlFor="listensToNews" className="text-sm text-slate-300 select-none">Listens to News</label>
                </div>
            </div>
            
            <RewardsBuilder rewards={task.rewards || {}} onChange={r => onChange({...task, rewards: r})} availableItems={availableItems} />

            <div className="border-t border-slate-800 pt-4 mt-4">
                {task.mode === ScenarioMode.FREEFORM ? (
                    <div className="mb-3">
                        <label className="text-xs text-slate-500 uppercase">Context / Prompt</label>
                        <textarea 
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-slate-300 h-32" 
                            placeholder="Context for the AI Dungeon Master..." 
                            value={contextInput} 
                            onChange={(e) => onChangeContextInput(e.target.value)} 
                        />
                    </div>
                ) : (
                    <div className="mb-3">
                        <label className="text-xs text-slate-500 uppercase">Nodes JSON (Structured)</label>
                        <textarea 
                            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-xs font-mono text-amber-400 h-40" 
                            value={nodesJson} 
                            onChange={(e) => onChangeNodesJson(e.target.value)} 
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

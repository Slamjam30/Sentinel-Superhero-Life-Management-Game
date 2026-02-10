
import React, { useState } from 'react';
import { LockCondition } from '../../types';
import { Button } from './Button';
import { Plus, Trash2, Lock, Eye, EyeOff } from 'lucide-react';

interface Props {
    conditions: LockCondition[];
    onChange: (conditions: LockCondition[]) => void;
    availableItems?: { id: string, name: string }[];
    availableTasks?: { id: string, title: string }[];
    availableUpgrades?: { id: string, name: string }[];
}

export const LockConditionBuilder: React.FC<Props> = ({ 
    conditions, 
    onChange,
    availableItems = [],
    availableTasks = [],
    availableUpgrades = []
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newCondition, setNewCondition] = useState<Partial<LockCondition>>({
        type: 'STAT',
        operator: 'GT',
        value: 0
    });

    const handleAdd = () => {
        if (newCondition.type && (newCondition.key || newCondition.type === 'MASK') && newCondition.operator) {
            onChange([...(conditions || []), newCondition as LockCondition]);
            setIsAdding(false);
            setNewCondition({ type: 'STAT', operator: 'GT', value: 0 });
        }
    };

    const handleRemove = (index: number) => {
        const next = [...conditions];
        next.splice(index, 1);
        onChange(next);
    };

    const renderValueInput = () => {
        if (newCondition.operator === 'HAS' || newCondition.operator === 'NOT_HAS' || newCondition.operator === 'ACTIVE') {
            return null;
        }
        return (
            <div className="flex items-center gap-1">
                <input 
                    type="number" 
                    value={newCondition.value as number}
                    onChange={e => setNewCondition({...newCondition, value: parseInt(e.target.value)})}
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 w-20 text-sm text-white"
                    placeholder="Val"
                />
                {newCondition.type === 'MASK' && <span className="text-slate-500 text-xs">%</span>}
            </div>
        );
    };

    const renderKeyInput = () => {
        if (newCondition.type === 'MASK') return null;

        if (newCondition.type === 'ITEM' && availableItems.length > 0) {
             return (
                <select 
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white flex-1"
                    value={newCondition.key}
                    onChange={e => setNewCondition({...newCondition, key: e.target.value})}
                >
                    <option value="">Select Item</option>
                    {availableItems.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
            );
        }
        if (newCondition.type === 'UPGRADE' && availableUpgrades.length > 0) {
             return (
                <select 
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white flex-1"
                    value={newCondition.key}
                    onChange={e => setNewCondition({...newCondition, key: e.target.value})}
                >
                    <option value="">Select Upgrade</option>
                    {availableUpgrades.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            );
        }
        if (newCondition.type === 'TASK' && availableTasks.length > 0) {
             return (
                <select 
                    className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white flex-1"
                    value={newCondition.key}
                    onChange={e => setNewCondition({...newCondition, key: e.target.value})}
                >
                    <option value="">Select Task</option>
                    {availableTasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
            );
        }

        return (
             <input 
                type="text" 
                className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white flex-1"
                placeholder={getKeyPlaceholder()}
                value={newCondition.key}
                onChange={e => setNewCondition({...newCondition, key: e.target.value})}
             />
        );
    };

    const getKeyPlaceholder = () => {
        switch(newCondition.type) {
            case 'STAT': return 'e.g. smarts';
            case 'RESOURCE': return 'e.g. money';
            case 'REPUTATION': return 'NPC/Faction Name';
            case 'UPGRADE': return 'Base Upgrade ID';
            case 'ITEM': return 'Item ID';
            case 'TAG': return 'Tag Name';
            case 'TASK': return 'Task ID';
            default: return 'ID/Key';
        }
    };

    const getDescription = (c: LockCondition) => {
        if (c.type === 'MASK') {
            return c.operator === 'GT' 
                ? `Mask Integrity > ${c.value}% (Concealed)` 
                : `Mask Integrity < ${c.value}% (Exposed)`;
        }
        if (c.type === 'TASK') {
             if (c.operator === 'HAS') return `Completed Task: ${c.key}`;
             if (c.operator === 'NOT_HAS') return `Not Completed: ${c.key}`;
             if (c.operator === 'GT') return `Task Completions > ${c.value}`;
        }
        if (c.operator === 'HAS') return `Owns ${c.key}`;
        if (c.operator === 'NOT_HAS') return `Doesn't own ${c.key}`;
        return `${c.type} ${c.key} ${c.operator} ${c.value}`;
    };

    return (
        <div className="space-y-3 bg-slate-900/50 p-4 rounded border border-slate-800">
            <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Lock size={12} /> Lock Conditions
                </label>
                {!isAdding && (
                    <button onClick={() => setIsAdding(true)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
                        <Plus size={12} /> Add Condition
                    </button>
                )}
            </div>

            {/* List Existing */}
            <div className="space-y-2">
                {conditions?.map((c, i) => (
                    <div key={i} className="flex items-center justify-between bg-slate-800 px-3 py-2 rounded text-xs text-slate-300 border border-slate-700">
                        <div className="flex items-center gap-2">
                            {c.type === 'MASK' ? (c.operator === 'GT' ? <EyeOff size={12} className="text-purple-400"/> : <Eye size={12} className="text-red-400"/>) : <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>}
                            <span>{getDescription(c)}</span>
                        </div>
                        <button onClick={() => handleRemove(i)} className="text-slate-500 hover:text-red-400">
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
                {conditions?.length === 0 && !isAdding && (
                    <div className="text-xs text-slate-600 italic">No restrictions set.</div>
                )}
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="bg-slate-950 p-3 rounded border border-slate-700 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <select 
                            className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                            value={newCondition.type}
                            onChange={e => setNewCondition({...newCondition, type: e.target.value as any, key: ''})}
                        >
                            <option value="STAT">Stat</option>
                            <option value="RESOURCE">Resource</option>
                            <option value="REPUTATION">Reputation</option>
                            <option value="UPGRADE">Base Upgrade</option>
                            <option value="ITEM">Item</option>
                            <option value="TAG">Tag</option>
                            <option value="DAY">Day</option>
                            <option value="MASK">Mask Integrity</option>
                            <option value="TASK">Task Completion</option>
                        </select>

                        <select 
                             className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                             value={newCondition.operator}
                             onChange={e => setNewCondition({...newCondition, operator: e.target.value as any})}
                        >
                            <option value="GT">&gt; (Greater Than)</option>
                            <option value="LT">&lt; (Less Than)</option>
                            <option value="EQ">= (Equal)</option>
                            <option value="HAS">Has / Owned</option>
                            <option value="NOT_HAS">Missing</option>
                            <option value="ACTIVE">Active</option>
                        </select>
                    </div>

                    <div className="flex gap-2 mb-2">
                         {renderKeyInput()}
                         {renderValueInput()}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
                        <Button size="sm" variant="primary" onClick={handleAdd} disabled={(!newCondition.key && newCondition.type !== 'MASK') && newCondition.type !== 'DAY'}>Add</Button>
                    </div>
                </div>
            )}
        </div>
    );
};
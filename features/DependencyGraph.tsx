
import React, { useMemo } from 'react';
import { GameState, Task, LockCondition } from '../types';
import { GitGraph, Lock, ArrowRight, Layers, ScrollText, ClipboardList, Home } from 'lucide-react';

interface Props {
    gameState: GameState;
    baseUpgrades: any[];
}

interface Node {
    id: string;
    type: 'TASK' | 'UPGRADE' | 'POOL';
    label: string;
    level: number; // Hierarchical level for layout
}

interface Link {
    source: string;
    target: string;
    type: 'LOCK' | 'CONTAINS';
}

export const DependencyGraph: React.FC<Props> = ({ gameState, baseUpgrades }) => {
    const { nodes, links } = useMemo(() => {
        const nodes: Node[] = [];
        const links: Link[] = [];

        // Add Upgrades
        baseUpgrades.forEach(u => {
            nodes.push({ id: u.id, type: 'UPGRADE', label: u.name, level: 0 });
        });

        // Add Task Pools
        gameState.taskPools.forEach(p => {
            nodes.push({ id: p.id, type: 'POOL', label: p.name, level: 1 });
        });

        // Add Tasks
        gameState.taskPool.forEach(t => {
            nodes.push({ id: t.id, type: 'TASK', label: t.title, level: 2 });
            // Check locks
            t.lockConditions?.forEach(c => {
                if (c.type === 'UPGRADE' && c.operator === 'HAS') {
                    links.push({ source: c.key, target: t.id, type: 'LOCK' });
                }
            });
            
            // Check pool membership
            gameState.taskPools.forEach(p => {
                if (p.tasks.includes(t.id)) {
                    links.push({ source: p.id, target: t.id, type: 'CONTAINS' });
                }
            });
        });

        return { nodes, links };
    }, [gameState, baseUpgrades]);

    // Simple Layout Calculation
    // Group nodes by level
    const levels = [[], [], []] as Node[][];
    nodes.forEach(n => {
        if(levels[n.level]) levels[n.level].push(n);
        else levels[2].push(n); // Default to bottom
    });

    const getNodeIcon = (type: string) => {
        switch(type) {
            case 'UPGRADE': return <Home size={16} className="text-purple-400" />;
            case 'POOL': return <Layers size={16} className="text-cyan-400" />;
            case 'TASK': return <ClipboardList size={16} className="text-blue-400" />;
            default: return null;
        }
    };

    return (
        <div className="h-full bg-slate-950 p-6 overflow-auto">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <GitGraph className="text-slate-500" /> Dependency Graph
            </h2>
            
            <div className="flex gap-16 min-w-max pb-10">
                {/* Level 0: Upgrades / Origins */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase text-center mb-4">Base Upgrades</h3>
                    {levels[0].map(node => (
                        <div key={node.id} id={`node-${node.id}`} className="bg-slate-900 border border-slate-700 p-3 rounded-lg w-48 shadow-lg flex items-center gap-2 relative group hover:border-purple-500 transition-colors">
                            {getNodeIcon(node.type)}
                            <span className="text-sm font-bold text-slate-200 truncate">{node.label}</span>
                            
                            {/* Connector Out */}
                            <div className="absolute -right-2 top-1/2 w-2 h-2 bg-slate-600 rounded-full"></div>
                        </div>
                    ))}
                </div>

                {/* Level 1: Pools */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase text-center mb-4">Pools</h3>
                    {levels[1].map(node => {
                        const incomingLinks = links.filter(l => l.target === node.id);
                        return (
                            <div key={node.id} id={`node-${node.id}`} className="bg-slate-900 border border-slate-700 p-3 rounded-lg w-56 shadow-lg flex items-center gap-2 relative group hover:border-blue-500 transition-colors">
                                {/* Connector In */}
                                {incomingLinks.length > 0 && <div className="absolute -left-2 top-1/2 w-2 h-2 bg-slate-600 rounded-full"></div>}
                                
                                {getNodeIcon(node.type)}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-slate-200 truncate">{node.label}</div>
                                    {incomingLinks.length > 0 && (
                                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                            <Lock size={10} /> Req: {incomingLinks.length}
                                        </div>
                                    )}
                                </div>

                                {/* Connector Out */}
                                <div className="absolute -right-2 top-1/2 w-2 h-2 bg-slate-600 rounded-full"></div>
                            </div>
                        );
                    })}
                </div>

                {/* Level 2: Tasks */}
                <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase text-center mb-4">Tasks</h3>
                    {levels[2].map(node => {
                        const incomingLinks = links.filter(l => l.target === node.id);
                        return (
                            <div key={node.id} className="bg-slate-900 border border-slate-700 p-3 rounded-lg w-56 shadow-lg flex items-center gap-2 relative opacity-80 hover:opacity-100 hover:border-green-500 transition-all">
                                {/* Connector In */}
                                {incomingLinks.length > 0 && <div className="absolute -left-2 top-1/2 w-2 h-2 bg-slate-600 rounded-full"></div>}
                                
                                {getNodeIcon(node.type)}
                                <span className="text-sm text-slate-300 truncate">{node.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <p className="text-xs text-slate-500 mt-8 text-center italic">
                * Visual representation of logic flows. Lines are implied by "Connectors" for this iteration.
            </p>
        </div>
    );
};

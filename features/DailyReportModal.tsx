
import React, { useState } from 'react';
import { DailyReportData } from '../types';
import { Button } from '../components/ui/Button';
import { Sun, DollarSign, Newspaper, Cpu, AlertTriangle, ShieldCheck, ShoppingBag, Scroll } from 'lucide-react';

interface Props {
    report: DailyReportData;
    onAcknowledge: () => void;
}

export const DailyReportModal: React.FC<Props> = ({ report, onAcknowledge }) => {
    return (
        <div className="fixed inset-0 bg-slate-950/95 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-500">
            <div className="max-w-lg w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col relative max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-900 to-slate-900 p-8 text-center border-b border-slate-700 flex-shrink-0">
                    <Sun size={48} className="text-amber-400 mx-auto mb-4 animate-spin-slow" />
                    <h2 className="text-3xl font-black text-white tracking-tight uppercase">Day {report.day} Briefing</h2>
                    <p className="text-blue-200 text-sm mt-1">Morning Protocol Initiated</p>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto flex-1">
                    
                    {/* Financials */}
                    <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
                        <div className="flex items-center gap-4">
                            <div className="bg-red-900/20 p-2 rounded-full text-red-400">
                                <DollarSign size={20} />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-500 uppercase">Expenses</div>
                                <div className="text-white font-bold">Living Costs</div>
                            </div>
                        </div>
                        <span className="text-red-400 font-mono font-bold">-${report.financials.rent}</span>
                    </div>

                    {/* Automator Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-blue-400">
                                    <ShieldCheck size={16} />
                                    <span className="text-xs font-bold uppercase">New Intel</span>
                                </div>
                                <span className="bg-blue-900/30 text-blue-300 text-xs font-bold px-2 py-0.5 rounded-full">{report.automatorResults.tasksGenerated}</span>
                            </div>
                            
                            {report.automatorResults.newTasks && report.automatorResults.newTasks.length > 0 ? (
                                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-600">
                                    {report.automatorResults.newTasks.map(t => (
                                        <div key={t.id} className="text-sm text-slate-300 border-l-2 border-slate-700 pl-2 py-0.5 flex justify-between items-center">
                                            <span className="truncate mr-2">{t.title}</span>
                                            <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">Lvl {t.difficulty}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-slate-500 italic">No new leads discovered.</div>
                            )}
                        </div>
                        
                        <div className="col-span-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-green-400">
                                <ShoppingBag size={16} />
                                <span className="text-xs font-bold uppercase">New Market Items</span>
                            </div>
                            <span className="text-xl font-black text-white">{report.automatorResults.itemsGenerated}</span>
                        </div>
                    </div>

                    {/* News Alert */}
                    {report.newsPublished && (
                        <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl flex items-center gap-4 animate-pulse">
                            <Newspaper size={24} className="text-purple-400" />
                            <div>
                                <div className="text-purple-300 font-bold text-sm">Fresh off the Press</div>
                                <div className="text-purple-200/60 text-xs">A new issue of The Sentinel is available.</div>
                            </div>
                        </div>
                    )}

                    {/* Events */}
                    {report.eventsTriggered > 0 && (
                        <div className="flex items-center gap-2 text-xs text-amber-500 justify-center">
                            <AlertTriangle size={12} />
                            <span>{report.eventsTriggered} Calendar Events Triggered Today</span>
                        </div>
                    )}

                </div>

                <div className="p-6 bg-slate-950 border-t border-slate-800 flex-shrink-0">
                    <Button onClick={onAcknowledge} className="w-full h-12 text-lg font-bold tracking-wide" variant="hero">
                        Begin Day
                    </Button>
                </div>
            </div>
        </div>
    );
};

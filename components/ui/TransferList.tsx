
import React, { useState } from 'react';
import { Button } from './Button';
import { ChevronRight, ChevronLeft, Info } from 'lucide-react';

interface Item {
    id: string;
    label: string;
    description?: string;
    level?: number;
    tags?: string[];
}

interface TransferListProps {
    available: Item[];
    selected: Item[];
    onChange: (selectedIds: string[]) => void;
}

export const TransferList: React.FC<TransferListProps> = ({ available, selected, onChange }) => {
    // Determine which IDs are currently selected
    const selectedIds = new Set(selected.map(i => i.id));
    
    // Filter available to show only those NOT selected
    const availableToShow = available.filter(i => !selectedIds.has(i.id));
    
    // State for hover details
    const [hoveredItem, setHoveredItem] = useState<Item | null>(null);
    const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

    const handleAdd = (item: Item) => {
        const newSelected = [...selected, item];
        onChange(newSelected.map(i => i.id));
    };

    const handleRemove = (item: Item) => {
        const newSelected = selected.filter(i => i.id !== item.id);
        onChange(newSelected.map(i => i.id));
    };

    const handleMouseEnter = (e: React.MouseEvent, item: Item) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setHoverPos({ x: rect.right + 10, y: rect.top });
        setHoveredItem(item);
    };

    const handleMouseLeave = () => {
        setHoveredItem(null);
    };

    return (
        <div className="flex items-center gap-4 h-64 relative">
            {/* Tooltip */}
            {hoveredItem && (
                <div 
                    className="fixed z-50 w-64 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-4 text-xs pointer-events-none animate-in fade-in zoom-in-95 duration-200"
                    style={{ top: hoverPos.y, left: hoverPos.x }}
                >
                    <h4 className="font-bold text-white text-sm mb-1">{hoveredItem.label}</h4>
                    <div className="flex gap-2 mb-2">
                        {hoveredItem.level !== undefined && (
                            <span className="bg-slate-700 px-1.5 py-0.5 rounded text-amber-400 font-mono">Lvl {hoveredItem.level}</span>
                        )}
                        {hoveredItem.tags?.map(t => (
                            <span key={t} className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">{t}</span>
                        ))}
                    </div>
                    <p className="text-slate-400 leading-relaxed">{hoveredItem.description || "No description available."}</p>
                </div>
            )}

            {/* Available List */}
            <div className="flex-1 h-full flex flex-col bg-slate-950 border border-slate-700 rounded-lg overflow-hidden">
                <div className="p-2 bg-slate-900 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase flex justify-between">
                    <span>Available</span>
                    <span className="text-[10px] text-slate-600">{availableToShow.length} items</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {availableToShow.map(item => (
                        <div 
                            key={item.id} 
                            className="flex justify-between items-center p-2 rounded hover:bg-slate-800 group cursor-default transition-colors"
                            onMouseEnter={(e) => handleMouseEnter(e, item)}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <span className="text-sm truncate text-slate-300">{item.label}</span>
                                {item.description && <Info size={12} className="text-slate-600 group-hover:text-blue-400 transition-colors" />}
                            </div>
                            <button onClick={() => handleAdd(item)} className="text-slate-500 hover:text-green-400 p-1 rounded hover:bg-slate-700">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    ))}
                    {availableToShow.length === 0 && <div className="text-xs text-slate-600 p-2 italic">No items</div>}
                </div>
            </div>

            {/* Icons */}
            <div className="flex flex-col gap-2 text-slate-600">
                <ChevronRight />
                <ChevronLeft />
            </div>

            {/* Selected List */}
            <div className="flex-1 h-full flex flex-col bg-slate-950 border border-slate-700 rounded-lg overflow-hidden">
                <div className="p-2 bg-slate-900 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase flex justify-between">
                    <span>Selected</span>
                    <span className="text-[10px] text-slate-600">{selected.length} items</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {selected.map(item => (
                        <div 
                            key={item.id} 
                            className="flex justify-between items-center p-2 rounded hover:bg-slate-800 group cursor-default transition-colors"
                            onMouseEnter={(e) => handleMouseEnter(e, item)}
                            onMouseLeave={handleMouseLeave}
                        >
                             <button onClick={() => handleRemove(item)} className="text-slate-500 hover:text-red-400 mr-2 p-1 rounded hover:bg-slate-700">
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm truncate text-white">{item.label}</span>
                        </div>
                    ))}
                    {selected.length === 0 && <div className="text-xs text-slate-600 p-2 italic">Empty</div>}
                </div>
            </div>
        </div>
    );
};


import React, { useState } from 'react';
import { Player, Power, PowerUpgrade } from '../types';
import { Button } from '../components/ui/Button';
import { Zap, Lock, Unlock, X, Shield, Sparkles, AlertCircle, Edit3 } from 'lucide-react';

interface SkillTreeModalProps {
  player: Player;
  onClose: () => void;
  onPurchaseUpgrade: (powerId: string, upgradeId: string) => void;
  isEditorMode?: boolean;
  onEditPower?: (power: Power) => void;
}

export const SkillTreeModal: React.FC<SkillTreeModalProps> = ({ player, onClose, onPurchaseUpgrade, isEditorMode, onEditPower }) => {
  const [selectedPowerId, setSelectedPowerId] = useState<string>(player.powers[0]?.id);

  const selectedPower = player.powers.find(p => p.id === selectedPowerId);

  const getUpgradeStatus = (upgrade: PowerUpgrade) => {
    if (upgrade.unlocked) return 'UNLOCKED';
    
    // Check parents
    if (upgrade.parentId) {
      const parent = selectedPower?.upgrades.find(u => u.id === upgrade.parentId);
      if (!parent?.unlocked) return 'LOCKED_PARENT';
    }

    // Check Level
    if ((selectedPower?.level || 0) < upgrade.requiredLevel) return 'LOCKED_LEVEL';
    
    // Check Points
    if (player.skillPoints < upgrade.cost) return 'LOCKED_COST';

    return 'AVAILABLE';
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="bg-amber-500/10 p-2 rounded-full text-amber-500">
                <Zap size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Power Evolution</h2>
                <div className="text-sm text-slate-400">
                    Available Skill Points: <span className="text-amber-400 font-bold text-lg">{player.skillPoints}</span>
                </div>
            </div>
            {isEditorMode && selectedPower && onEditPower && (
                <button onClick={() => onEditPower(selectedPower)} className="p-2 bg-slate-800 rounded hover:bg-slate-700 text-slate-300">
                    <Edit3 size={16} />
                </button>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar - Power List */}
            <div className="w-72 border-r border-slate-800 bg-slate-950/50 overflow-y-auto p-4 space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-3 px-2">Your Powers</h3>
                {player.powers.map(power => (
                    <button
                        key={power.id}
                        onClick={() => setSelectedPowerId(power.id)}
                        className={`w-full text-left p-4 rounded-lg border transition-all relative overflow-hidden group ${
                            selectedPowerId === power.id 
                            ? 'bg-slate-800 border-amber-500/50 text-white shadow-lg' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-800/50'
                        }`}
                    >
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-0 transition-opacity group-hover:opacity-100" />
                        {selectedPowerId === power.id && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />}
                        
                        <div className="font-bold text-base mb-1">{power.name}</div>
                        <div className="flex justify-between items-center text-xs mb-2">
                            <span className="bg-slate-950 px-2 py-0.5 rounded text-amber-500 border border-slate-800">Lvl {power.level}</span>
                            <span className="text-slate-500">{Math.floor((power.xp/power.maxXp)*100)}% XP</span>
                        </div>
                        <div className="h-1 bg-slate-950 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-600 transition-all duration-500" style={{ width: `${(power.xp/power.maxXp)*100}%` }}></div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Main Area - Tree */}
            <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-slate-900 p-8 overflow-y-auto relative">
                {selectedPower ? (
                    <div className="space-y-8 max-w-4xl mx-auto">
                         <div className="text-center mb-10 bg-slate-950/80 p-6 rounded-xl border border-slate-800 backdrop-blur-sm">
                            <h3 className="text-3xl font-black text-white mb-2 tracking-tight">{selectedPower.name} Mastery</h3>
                            <p className="text-slate-300 max-w-2xl mx-auto text-lg leading-relaxed">{selectedPower.description}</p>
                         </div>

                         {/* Tree Grid */}
                         <div className="flex justify-center gap-12 flex-wrap">
                            {/* Root/Base Upgrades (No Parent) */}
                            {selectedPower.upgrades.filter(u => !u.parentId).map(rootUpgrade => (
                                <TreeBranch 
                                    key={rootUpgrade.id} 
                                    upgrade={rootUpgrade} 
                                    allUpgrades={selectedPower.upgrades}
                                    status={getUpgradeStatus(rootUpgrade)}
                                    onPurchase={() => onPurchaseUpgrade(selectedPower.id, rootUpgrade.id)}
                                    getUpgradeStatus={getUpgradeStatus}
                                    onChildPurchase={(id) => onPurchaseUpgrade(selectedPower.id, id)}
                                />
                            ))}
                         </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-500 flex-col gap-4">
                        <Zap size={48} className="opacity-20" />
                        <p>Select a power to view its evolution path.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

// Recursive Component for Tree Structure
interface TreeBranchProps {
    upgrade: PowerUpgrade;
    allUpgrades: PowerUpgrade[];
    status: string;
    onPurchase: () => void;
    getUpgradeStatus: (u: PowerUpgrade) => string;
    onChildPurchase: (id: string) => void;
}

const TreeBranch: React.FC<TreeBranchProps> = ({ upgrade, allUpgrades, status, onPurchase, getUpgradeStatus, onChildPurchase }) => {
    const children = allUpgrades.filter(u => u.parentId === upgrade.id);

    const isPassive = upgrade.type === 'PASSIVE';
    const isUnlocked = status === 'UNLOCKED';
    const isAvailable = status === 'AVAILABLE';
    
    // Status Styles
    let cardStyle = "bg-slate-900 border-slate-700 opacity-60";
    let iconColor = "text-slate-600";
    
    if (isUnlocked) {
        cardStyle = "bg-slate-800 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.15)]";
        iconColor = "text-amber-500";
    } else if (isAvailable) {
        cardStyle = "bg-slate-800 border-slate-500 hover:border-amber-400 cursor-pointer hover:-translate-y-1 hover:shadow-xl";
        iconColor = "text-slate-400";
    } else if (status === 'LOCKED_LEVEL') {
        cardStyle = "bg-red-950/20 border-red-900/50 opacity-70";
        iconColor = "text-red-900";
    }

    return (
        <div className="flex flex-col items-center">
            <div 
                className={`relative p-5 rounded-xl border-2 w-72 transition-all duration-300 group ${cardStyle}`}
                onClick={isAvailable ? onPurchase : undefined}
            >
                {/* Connector Line Top (Visual only, logic handled by parent mapping) */}
                {upgrade.parentId && <div className="absolute -top-6 left-1/2 w-0.5 h-6 bg-slate-700"></div>}

                <div className="flex justify-between items-start mb-3">
                    <div className={`p-2 rounded-lg ${isPassive ? 'bg-blue-900/20 text-blue-400' : 'bg-amber-900/20 text-amber-400'}`}>
                        {isPassive ? <Shield size={18} /> : <Sparkles size={18} />}
                    </div>
                    {isUnlocked ? <Unlock size={16} className="text-green-500" /> : <Lock size={16} className={iconColor} />}
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isPassive ? 'text-blue-500' : 'text-amber-500'}`}>{upgrade.type}</span>
                        {!isUnlocked && <span className="text-[10px] font-mono text-slate-500">Req Lvl {upgrade.requiredLevel}</span>}
                    </div>
                    <h4 className={`font-bold text-lg leading-tight ${isUnlocked ? 'text-white' : 'text-slate-300'}`}>{upgrade.name}</h4>
                    <p className="text-sm text-slate-400 leading-relaxed my-3 border-t border-slate-700/50 pt-2 min-h-[3rem]">
                        {upgrade.description}
                    </p>
                    
                    {/* Limits Section if implied */}
                    {upgrade.cost > 2 && (
                        <div className="flex items-center gap-1 text-[10px] text-orange-400 bg-orange-950/30 px-2 py-1 rounded mb-3">
                            <AlertCircle size={10} />
                            <span>High Energy Cost / Fatigue Risk</span>
                        </div>
                    )}
                </div>

                <div className="mt-auto">
                    {isAvailable && (
                        <Button size="sm" onClick={(e) => { e.stopPropagation(); onPurchase(); }} className="w-full">
                            Unlock ({upgrade.cost} SP)
                        </Button>
                    )}
                    {isUnlocked && (
                        <div className="text-center text-xs font-bold text-green-500 bg-green-950/30 py-1.5 rounded border border-green-900/50">ACQUIRED</div>
                    )}
                    {status.startsWith('LOCKED') && !isUnlocked && (
                         <div className="flex justify-between items-center text-xs bg-slate-950 py-1.5 px-3 rounded border border-slate-800">
                             <span className="text-slate-500">Locked</span>
                             <span className={`${status === 'LOCKED_COST' ? 'text-red-400' : 'text-slate-600'}`}>{upgrade.cost} SP</span>
                         </div>
                    )}
                </div>
            </div>

            {/* Connecting Line Down */}
            {children.length > 0 && (
                <div className="h-8 w-0.5 bg-slate-700"></div>
            )}

            {/* Children Container */}
            {children.length > 0 && (
                <div className="flex gap-8 relative">
                    {/* Horizontal Connector Bar */}
                    {children.length > 1 && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-18rem)] h-0.5 bg-slate-700"></div>
                    )}
                    
                    {children.map(child => (
                        <TreeBranch 
                            key={child.id}
                            upgrade={child}
                            allUpgrades={allUpgrades}
                            status={getUpgradeStatus(child)}
                            onPurchase={() => onChildPurchase(child.id)}
                            getUpgradeStatus={getUpgradeStatus}
                            onChildPurchase={onChildPurchase}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

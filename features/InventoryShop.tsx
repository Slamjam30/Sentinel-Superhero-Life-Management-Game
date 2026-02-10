
import React, { useState } from 'react';
import { Player, Item, BaseUpgrade, EquipmentSlotType, GameState, LockCondition } from '../types';
import { Button } from '../components/ui/Button';
import { Package, ShoppingCart, Home, ShieldCheck, Zap, User, Shirt, Watch, Laptop2, Lock, Edit3, Link, Plus } from 'lucide-react';
import { checkAllConditions } from '../utils/mechanics';

interface InventoryShopProps {
  player: Player;
  gameState: GameState;
  shopItems: Item[];
  onBuyItem: (item: Item) => void;
  onUpgradeBase: (upgrade: BaseUpgrade) => void;
  onUseItem: (item: Item) => void;
  onEquipItem?: (item: Item) => void;
  onUnequipItem?: (item: Item) => void;
  isEditorMode?: boolean;
  onEditItem?: (item: Item) => void;
  onEditUpgrade?: (upgrade: BaseUpgrade) => void;
  onAddLock?: (type: 'TASK', id: string, condition: LockCondition) => void; // New prop for reverse linking
}

export const InventoryShop: React.FC<InventoryShopProps> = ({ 
  player, 
  gameState,
  shopItems, 
  onBuyItem, 
  onUpgradeBase, 
  onUseItem,
  onEquipItem,
  onUnequipItem,
  isEditorMode,
  onEditItem,
  onEditUpgrade,
  onAddLock
}) => {
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'BASE' | 'SHOP'>('INVENTORY');
  
  // Linker Modal State
  const [linkingUpgrade, setLinkingUpgrade] = useState<BaseUpgrade | null>(null);
  const [linkTargetId, setLinkTargetId] = useState<string>('');

  const getSlotIcon = (type: EquipmentSlotType) => {
      switch(type) {
          case 'HEAD': return <User size={20} />;
          case 'BODY': return <Shirt size={20} />;
          case 'ACCESSORY': return <Watch size={20} />;
          case 'GADGET': return <Laptop2 size={20} />;
      }
  };

  const getUnlocksForUpgrade = (upgradeId: string) => {
      const unlocks: string[] = [];
      gameState.taskPool.forEach(t => {
          if(t.lockConditions?.some(c => c.type === 'UPGRADE' && c.key === upgradeId && c.operator === 'HAS')) {
              unlocks.push(`Task: ${t.title}`);
          }
      });
      gameState.shopItems.forEach(i => {
          if(i.conditions?.some(c => c.type === 'UPGRADE' && c.key === upgradeId && c.operator === 'HAS')) {
              unlocks.push(`Item: ${i.name}`);
          }
      });
      return unlocks;
  };

  const handleConfirmLink = () => {
      if (linkingUpgrade && linkTargetId && onAddLock) {
          onAddLock('TASK', linkTargetId, {
              type: 'UPGRADE',
              key: linkingUpgrade.id,
              operator: 'HAS',
              value: true
          });
          setLinkingUpgrade(null);
          setLinkTargetId('');
      }
  };

  const renderEquipmentSlot = (type: EquipmentSlotType, label: string) => {
      const item = player.equipment[type];
      return (
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 flex items-center justify-between relative group">
              {isEditorMode && item && (
                  <button 
                    onClick={() => onEditItem && onEditItem(item)}
                    className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full shadow-lg z-20 hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                      <Edit3 size={12} />
                  </button>
              )}
              <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${item ? 'bg-blue-900/30 text-blue-400' : 'bg-slate-800 text-slate-600'}`}>
                      {getSlotIcon(type)}
                  </div>
                  <div>
                      <div className="text-xs font-bold text-slate-500 uppercase">{label}</div>
                      <div className={`font-bold ${item ? 'text-white' : 'text-slate-600'}`}>
                          {item ? item.name : 'Empty Slot'}
                      </div>
                  </div>
              </div>
              {item && onUnequipItem && (
                  <Button size="sm" variant="secondary" onClick={() => onUnequipItem(item)}>Unequip</Button>
              )}
          </div>
      );
  };

  const renderInventory = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment Column */}
        <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Equipment</h3>
            {renderEquipmentSlot('HEAD', 'Headgear')}
            {renderEquipmentSlot('BODY', 'Armor/Suit')}
            {renderEquipmentSlot('ACCESSORY', 'Accessory')}
            {renderEquipmentSlot('GADGET', 'Gadget')}
        </div>

        {/* Inventory Grid */}
        <div className="lg:col-span-2">
            <h3 className="text-lg font-bold text-white mb-4">Backpack</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {player.inventory.length === 0 ? (
                    <div className="col-span-full text-center p-8 text-slate-500 italic border border-dashed border-slate-800 rounded-lg">
                    Your inventory is empty. Visit the shop!
                    </div>
                ) : (
                    player.inventory.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex flex-col justify-between relative group">
                        {isEditorMode && (
                            <button 
                                onClick={() => onEditItem && onEditItem(item)}
                                className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full shadow-lg z-20 hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Edit3 size={12} />
                            </button>
                        )}
                        <div>
                        <h3 className="font-bold text-white flex items-center gap-2">
                            <Package size={16} className="text-blue-400" /> {item.name}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                        <div className="mt-2 text-xs flex gap-2">
                            <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">{item.type}</span>
                            {item.slotType && <span className="bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded border border-blue-900">{item.slotType}</span>}
                            {item.singleUse && <span className="bg-red-900/30 text-red-400 px-2 py-0.5 rounded border border-red-900">Single Use</span>}
                        </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                             {item.type === 'GEAR' && item.slotType && onEquipItem ? (
                                 <Button variant="primary" size="sm" className="w-full" onClick={() => onEquipItem(item)}>Equip</Button>
                             ) : (
                                 <Button variant="secondary" size="sm" className="w-full" onClick={() => onUseItem(item)}>Use</Button>
                             )}
                        </div>
                    </div>
                    ))
                )}
            </div>
        </div>
    </div>
  );

  const renderBase = () => (
    <div className="space-y-6">
       <div className="bg-slate-900 p-6 rounded-lg border border-slate-800">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2"><Home className="text-purple-500"/> Secret Base</h2>
          <p className="text-slate-400">Upgrade your hideout to unlock passive benefits and new opportunities.</p>
       </div>

       <div className="grid grid-cols-1 gap-4">
          {player.baseUpgrades.map(upgrade => (
              <div key={upgrade.id} className={`p-4 rounded-lg border flex flex-col relative group ${upgrade.owned ? 'bg-slate-800/50 border-green-900' : 'bg-slate-900 border-slate-700'}`}>
                  {isEditorMode && (
                      <button 
                          onClick={() => onEditUpgrade && onEditUpgrade(upgrade)}
                          className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full shadow-lg z-20 hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                          <Edit3 size={12} />
                      </button>
                  )}
                  <div className="flex justify-between items-start mb-2">
                      <div>
                          <h3 className={`font-bold flex items-center gap-2 ${upgrade.owned ? 'text-green-400' : 'text-slate-200'}`}>
                              {upgrade.name} {upgrade.owned && <ShieldCheck size={16} />}
                          </h3>
                          <p className="text-sm text-slate-400">{upgrade.description}</p>
                          <p className="text-xs text-purple-400 mt-1 font-mono">{upgrade.effectDescription}</p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                          {upgrade.owned ? (
                              <span className="text-xs font-bold uppercase tracking-wider text-green-500 border border-green-900 px-3 py-1 rounded bg-green-900/20">Owned</span>
                          ) : (
                              <Button 
                                  disabled={player.resources.money < upgrade.cost}
                                  onClick={() => onUpgradeBase(upgrade)}
                                  variant="primary"
                                  size="sm"
                              >
                                  Buy ${upgrade.cost}
                              </Button>
                          )}
                          
                          {/* Editor Mode: Add Link */}
                          {isEditorMode && (
                              <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-xs border border-dashed border-slate-600 text-slate-400 hover:text-white"
                                  onClick={() => setLinkingUpgrade(upgrade)}
                              >
                                  <Plus size={10} className="mr-1"/> Link to Content
                              </Button>
                          )}
                      </div>
                  </div>
                  {/* Unlocks Section */}
                  {getUnlocksForUpgrade(upgrade.id).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-800">
                          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1 mb-1">
                              <Link size={10} /> Unlocks
                          </div>
                          <div className="flex flex-wrap gap-2">
                              {getUnlocksForUpgrade(upgrade.id).map((u, i) => (
                                  <span key={i} className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                                      {u}
                                  </span>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          ))}
       </div>
    </div>
  );

  const renderShop = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {shopItems.map(item => {
        const isLocked = !checkAllConditions(player, gameState, item.conditions);
        
        if (isLocked && !isEditorMode) {
             return (
                 <div key={item.id} className="bg-slate-950 border border-slate-800 p-4 rounded-lg flex items-center justify-center opacity-50">
                     <span className="flex items-center gap-2 text-slate-600 font-bold"><Lock size={16}/> Restricted Item</span>
                 </div>
             )
        }

        return (
            <div key={item.id} className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex flex-col justify-between hover:border-amber-500/50 transition-colors relative group">
                {isEditorMode && (
                    <button 
                        onClick={() => onEditItem && onEditItem(item)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white p-1 rounded-full shadow-lg z-20 hover:bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Edit3 size={12} />
                    </button>
                )}
                <div>
                <h3 className="font-bold text-white flex items-center gap-2">
                    <ShoppingCart size={16} className="text-amber-400" /> {item.name}
                </h3>
                <p className="text-sm text-slate-400 mt-1">{item.description}</p>
                <div className="mt-2 text-xs flex flex-wrap gap-2">
                    <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">{item.type}</span>
                    {item.effects && Object.entries(item.effects).map(([k,v]) => (
                        <span key={k} className="bg-blue-900/30 text-blue-300 px-2 py-0.5 rounded border border-blue-900 capitalize">
                            {k} +{v}
                        </span>
                    ))}
                </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                    <span className="text-lg font-mono font-bold text-green-400">${item.cost}</span>
                    <Button 
                        variant="primary" 
                        size="sm"
                        disabled={player.resources.money < item.cost && !isEditorMode}
                        onClick={() => onBuyItem(item)}
                    >
                        Purchase
                    </Button>
                </div>
            </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex-1 bg-slate-950 p-8 overflow-y-auto relative">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight mb-6">Logistics</h1>
        <div className="flex gap-4 border-b border-slate-800">
           <button 
             onClick={() => setActiveTab('INVENTORY')}
             className={`pb-3 px-4 text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${activeTab === 'INVENTORY' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
           >
             Inventory
             <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1 rounded font-black border border-blue-500/50">BETA</span>
           </button>
           <button 
             onClick={() => setActiveTab('BASE')}
             className={`pb-3 px-4 text-sm font-bold uppercase tracking-wider transition-colors ${activeTab === 'BASE' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-slate-500 hover:text-slate-300'}`}
           >
             Base Upgrades
           </button>
           <button 
             onClick={() => setActiveTab('SHOP')}
             className={`pb-3 px-4 text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${activeTab === 'SHOP' ? 'text-amber-500 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
           >
             Black Market
             <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1 rounded font-black border border-amber-500/50">BETA</span>
           </button>
        </div>
      </header>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'INVENTORY' && renderInventory()}
        {activeTab === 'BASE' && renderBase()}
        {activeTab === 'SHOP' && renderShop()}
      </div>

      {/* Linking Modal */}
      {linkingUpgrade && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-md w-full animate-in zoom-in-95">
                  <h3 className="text-lg font-bold text-white mb-2">Link Upgrade: {linkingUpgrade.name}</h3>
                  <p className="text-xs text-slate-400 mb-4">Select a Task. This action will add a Lock Condition to that item requiring you to own this upgrade.</p>
                  
                  <div className="space-y-4 mb-6">
                      <select 
                        className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                        value={linkTargetId}
                        onChange={(e) => setLinkTargetId(e.target.value)}
                      >
                          <option value="">Select Target Task...</option>
                          {gameState.taskPool.map(t => <option key={t.id} value={t.id}>{t.title} (Diff {t.difficulty})</option>)}
                      </select>
                  </div>

                  <div className="flex justify-end gap-2">
                      <Button variant="ghost" onClick={() => setLinkingUpgrade(null)}>Cancel</Button>
                      <Button variant="primary" onClick={handleConfirmLink} disabled={!linkTargetId}>Confirm Link</Button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

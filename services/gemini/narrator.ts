
import { Type } from "@google/genai";
import { Player, SuccessLevel, PlayerResources, PlayerStats, CodexEntry, TimelineEvent, NewsIssue, Identity, TaskType } from "../../types";
import { getClient } from "./core";

// Helper to find relevant lore/npcs based on text context
const getRelevantCodexEntries = (
    allCodex: CodexEntry[],
    contextText: string,
    explicitTargets: string[] = []
): CodexEntry[] => {
    if (!allCodex) return [];
    
    // 1. Create a set of relevant IDs/Titles to avoid duplicates
    const relevantEntries = new Set<CodexEntry>();
    const textToScan = contextText.toLowerCase();

    allCodex.forEach(entry => {
        // Check Explicit Targets (from Task definitions)
        if (explicitTargets.some(target => target.toLowerCase() === entry.title.toLowerCase())) {
            relevantEntries.add(entry);
            return;
        }

        // Check Text Presence
        const titleLower = entry.title.toLowerCase();
        
        // Exact match of full title
        if (titleLower.length > 2 && textToScan.includes(titleLower)) {
            relevantEntries.add(entry);
            return;
        }

        // Partial match logic (e.g. "Silas" triggers "Silas Vale")
        const nameParts = titleLower.split(' ').filter(part => part.length > 3);
        if (nameParts.length > 0) {
            const hasPartialMatch = nameParts.some(part => textToScan.includes(part));
            if (hasPartialMatch) {
                relevantEntries.add(entry);
            }
        }
    });

    return Array.from(relevantEntries);
};

export const getDMResponse = async (
  history: { role: 'user' | 'model', text: string }[], 
  context: string,
  player: Player,
  difficulty: number,
  codex: CodexEntry[],
  taskType: TaskType,
  reputationTargets: string[] = [],
  timeline?: TimelineEvent[],
  activeNews?: NewsIssue,
  listensToNews?: boolean
): Promise<{ text: string, contextSnapshot: string }> => {
  const ai = getClient();
  if (!ai) return { text: "Connection to AI lost.", contextSnapshot: "No Context" };

  // --- Context Building ---
  const recentHistoryText = history.slice(-3).map(h => h.text).join(' ');
  const fullScanText = `${context} ${recentHistoryText}`;
  const relevantCodex = getRelevantCodexEntries(codex, fullScanText, reputationTargets);

  let databaseContext = "";
  if (relevantCodex.length > 0) {
      databaseContext = `\nRELEVANT WORLD DATABASE (Use this for flavor, personality, and consistency):
      ${relevantCodex.map(c => {
        const knowsSecret = c.relationship?.knowsIdentity ? " [KNOWS SECRET IDENTITY]" : " [DOES NOT KNOW IDENTITY]";
        return `
      - [${c.category}] **${c.title}**${knowsSecret}: ${c.content}
        ${c.appearance ? `(Appearance: ${c.appearance})` : ''}
        ${c.secrets?.filter(s => s.unlocked).map(s => `(Known Secret: ${s.text})`).join(' ')}
      `;
      }).join('\n')}`;
  }

  const timelineStr = timeline && timeline.length > 0
    ? timeline.slice(-5).map(e => `[Day ${e.day}] ${e.description}`).join('\n')
    : 'No significant prior events.';

  const newsContext = (activeNews && listensToNews) 
     ? `CRITICAL NEWS CONTEXT: The player is engaging in a task heavily influenced by current events. HEADLINES: ${activeNews.articles.map(a => a.headline).join(' | ')}. MODIFIERS: "${activeNews.modifiers}".`
     : (activeNews ? `Current Headlines (Background): ${activeNews.articles.map(a => a.headline).join(' | ')}` : 'No recent news.');

  const avgPowerLevel = player.powers.length > 0 
    ? player.powers.reduce((acc, p) => acc + p.level, 0) / player.powers.length 
    : 0;
  const statsStr = `Smarts: ${Math.floor(player.stats.smarts)}, Charm: ${Math.floor(player.stats.charm)}, Coordination: ${Math.floor(player.stats.coordination)}, Will: ${Math.floor(player.stats.will)}`;
  
  const abilitiesStr = player.powers.map(p => `
    POWER: ${p.name} (Level ${p.level})
    UNLOCKED ABILITIES (Bonus: +${p.level} Power Level): ${p.abilities.length > 0 ? p.abilities.join(', ') : 'None yet (Raw power only)'}
  `).join('\n');

  const currentAppearance = player.identity === Identity.SUPER ? player.superAppearance : player.civilianAppearance;

  // Calculate Base DC
  // Base 12 + (Difficulty * 2). 
  // Diff 1 = 14. Diff 5 = 22. Diff 10 = 32.
  const baseDC = 12 + (difficulty * 2);

  const isDowntime = taskType === TaskType.DOWNTIME;

  const constraints = `
  STRICT DUNGEON MASTER RULES - SUPERHERO SIMULATOR:

  1. **CHARACTER CONTEXT:**
     - Identity State: **${player.identity}** (Current Name: ${player.identity === Identity.SUPER ? player.superName : player.civilianName})
     - Secret Identity: ${player.civilianName} is ${player.superName}.
     - Background: ${player.backstory || 'Unknown'}
     - Civilian Job: ${player.job || 'Unemployed'}
     - Appearance: ${currentAppearance || 'Standard look.'}
     - Power Level: ${avgPowerLevel.toFixed(1)}
     
  2. **POWERS & ABILITIES (CRITICAL):**
     ${abilitiesStr}
     - **RULE:** The player can ONLY use the "UNLOCKED ABILITIES" listed above efficiently.
     - **RULE:** If the player attempts to use a specific application of a power they do NOT have unlocked, you must **NARRATE THE FAILURE** or extreme difficulty.

  3. **WORLD CONTEXT:**
     - Recent Events: ${timelineStr}
     - News: ${newsContext}
     ${databaseContext}

  4. **SECRET IDENTITY LOGIC (STRICT):**
     - **Knowledge:** Only NPCs explicitly marked as [KNOWS SECRET IDENTITY] in the Database Context know that ${player.civilianName} and ${player.superName} are the same person.
     - **New Characters:** Any NEW characters generated in this scene **DO NOT** know the player's secret identity unless they are mind-readers or the plot explicitly reveals it.
     - **Behavior:**
       - If Player is **CIVILIAN**: NPCs treat them as a normal person. Using powers openly causes shock, suspicion, or Mask Integrity loss.
       - If Player is **SUPER**: NPCs treat them as a hero/vigilante. They do not know their civilian name or job.

  5. **SCOPE & PACING (${isDowntime ? 'DOWNTIME MODE' : 'MISSION MODE'}):**
     ${isDowntime 
        ? `- **SLICE OF LIFE:** This is a Downtime scenario. Focus on character introspection, relationships, skill practice, or mundane tasks.
           - **NO FORCED CONFLICT:** Do NOT spontaneously generate villains, disasters, or emergencies unless the player explicitly seeks them out.
           - **TRAINING:** If the user is training, focus on the description of their exertion, the visual effects of their powers, and their internal monologue. 
           - **AGENCY:** Allow the player to decide when to end the scene. Do not force a climax.`
        : `- **SCENE BOUNDARIES:** This conversation represents a SINGLE SCENE or TASK defined by the 'Task Context' provided.
           - **RESOLUTION:** Once the primary objective (e.g., stopping the robbery, rescuing the cat, defeating the boss) is achieved, you must **STOP ESCALATING**.
           - **FALLING ACTION:** After the climax, transition to the aftermath (police arriving, crowds cheering, villain secured) and give the player a moment to breathe or leave.
           - **NO NEW CRISES:** Do NOT spontaneously generate a *new*, unrelated emergency or combat encounter in a different location just to keep the chat going.`
     }

  6. **MECHANICAL FORMATTING (MANDATORY):**
     - **DICE SYSTEM:** Roll d20 + Attribute Value (or Power Level) vs Difficulty Class (DC).
     - **DC CALCULATION:** The Base DC for this task is **${baseDC}** (Based on Difficulty ${difficulty}). You may adjust this slightly (+/- 2) based on situation.
     - **ROLL OUTPUT:** You MUST output ALL dice checks (Player actions AND Enemy attacks) using this strict format:
       \`[ROLL: <Action Name> | d20(<Roll>) + <Stat>(<Value>) = <Total> vs DC <Target> | <RESULT>]\`
       
       *Examples:*
       - Attribute Check: \`[ROLL: Persuade | d20(12) + Charm(14) = 26 vs DC 18 | SUCCESS]\`
       - **POWER CHECK (CRITICAL):** If the action uses a specific UNLOCKED ABILITY, the bonus is the **Power Level** (e.g. if Fire Power is Level 5, bonus is 5). Do NOT use Attributes for power abilities unless it's a generic physical feat.
       - Power Example: \`[ROLL: Fireball | d20(15) + Power(5) = 20 vs DC 18 | HIT]\`
       - Enemy Action: \`[ROLL: Enemy Laser | d20(18) + Aim(5) = 23 vs DC ${Math.floor(player.stats.coordination) + 10} (Player Dodge) | HIT]\`
       
     - **SECRETS:** If the player discovers hidden info about a Database Entry through roleplay, output:
       \`[SECRET: <Exact Entry Title> | <The Secret Text>]\`
       *Example:* \`[SECRET: The Iron Syndicate | They are secretly funded by Mayor City.]\`

  7. **ATTRIBUTES:**
     - Use these stats for generic bonuses: ${statsStr}.
     - **REMINDER:** For specific Power Abilities, use the **Power Level** associated with that ability as the bonus, NOT the stats.

  Be concise. Keep the action moving towards the objective. Use the appearance details where appropriate for flavor.
  `;

  // Snapshot the exact context used for this turn
  const contextSnapshot = `
--- SYSTEM INSTRUCTION & CONTEXT ---
${constraints}

--- CURRENT TASK CONTEXT ---
${context}
  `;

  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: constraints,
        thinkingConfig: { thinkingBudget: 1024 }
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const lastMsg = history[history.length - 1];
    if (lastMsg.role !== 'user') return { text: "...", contextSnapshot };

    const result = await chat.sendMessage({ message: lastMsg.text });
    return { text: result.text || "The GM remains silent.", contextSnapshot };
  } catch (e) {
    console.error("DM Error", e);
    return { text: "The Dungeon Master is taking a break (Error).", contextSnapshot: "Error during generation." };
  }
};

export const generateScenarioSummary = async (
    history: { role: 'user' | 'model', text: string }[],
    reputationTargets: string[] = []
): Promise<{ 
    summary: string, 
    successLevel: SuccessLevel, 
    reputationChanges: Record<string, number>,
    suggestedRewards: Partial<PlayerResources & PlayerStats>
}> => {
    const ai = getClient();
    if(!ai) return { summary: "Mission ended.", successLevel: SuccessLevel.PARTIAL_SUCCESS, reputationChanges: {}, suggestedRewards: {} };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze this transcript for a superhero mission.
            
            CRITICAL SUCCESS CRITERIA:
            1. Did the player actually SOLVE the problem?
            2. If the player "left early" or "ignored the threat", this is a FAILURE.
            
            Task:
            1. Provide a 2-sentence summary.
            2. Determine Success Level.
            3. Calculate reputation changes for targets: ${reputationTargets.join(', ') || 'None'}.
            4. Suggest rewards.
            
            **IMPORTANT REWARD RULES:**
            - **Fame/PublicOpinion:** Scale is -100 to 100. **Standard reward is 2-5.** Do not suggest large values like 20.
            - **Identity Rule:** If the player was in CIVILIAN identity, suggest 0 for Fame and PublicOpinion (unless identity was revealed).
            - **Attributes (Smarts, Charm, Coordination, Will):** Do NOT reward these unless the player experienced a "Major Life Event", "Trauma", or "Intense Specialized Training" in the narrative. +1 is a MASSIVE upgrade. Default to 0.
            - **Resources (Money):** Be generous if successful.
            
            Transcript: ${JSON.stringify(history.slice(-10))}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        summary: { type: Type.STRING },
                        successLevel: { 
                            type: Type.STRING, 
                            enum: [
                                'CRITICAL_FAILURE', 'MAJOR_FAILURE', 'FAILURE', 
                                'BARELY_SUCCESS', 'PARTIAL_SUCCESS', 'COMPLETE_SUCCESS'
                            ] 
                        },
                        reputationChanges: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    targetName: { type: Type.STRING },
                                    changeAmount: { type: Type.INTEGER }
                                },
                                required: ["targetName", "changeAmount"]
                            }
                        },
                        suggestedRewards: {
                            type: Type.OBJECT,
                            properties: {
                                money: { type: Type.NUMBER },
                                fame: { type: Type.NUMBER },
                                mask: { type: Type.NUMBER },
                                publicOpinion: { type: Type.NUMBER },
                                smarts: { type: Type.NUMBER },
                                charm: { type: Type.NUMBER },
                                coordination: { type: Type.NUMBER },
                                will: { type: Type.NUMBER }
                            }
                        }
                    },
                    required: ["summary", "successLevel"]
                }
            }
        });

        if (response.text) {
             const json = JSON.parse(response.text);
             const reputationMap: Record<string, number> = {};
             if (json.reputationChanges && Array.isArray(json.reputationChanges)) {
                 json.reputationChanges.forEach((rc: any) => {
                     if(rc.targetName) reputationMap[rc.targetName] = rc.changeAmount || 0;
                 });
             }

             return {
                 summary: json.summary,
                 successLevel: json.successLevel as SuccessLevel,
                 reputationChanges: reputationMap,
                 suggestedRewards: json.suggestedRewards || {}
             };
        }
        return { summary: "Scenario Complete.", successLevel: SuccessLevel.PARTIAL_SUCCESS, reputationChanges: {}, suggestedRewards: {} };
    } catch(e) {
        console.error(e);
        return { summary: "Scenario Complete.", successLevel: SuccessLevel.PARTIAL_SUCCESS, reputationChanges: {}, suggestedRewards: {} };
    }
}

export const generateCodexEntryFromHistory = async (
    history: { role: 'user' | 'model', text: string }[],
    targetName: string,
    forcedCategory?: 'NPC' | 'FACTION' | 'LORE' | 'LOCATION'
): Promise<{ entry: Partial<CodexEntry> | null, initialReputation: number }> => {
    const ai = getClient();
    if (!ai) return { entry: null, initialReputation: 0 };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Create a generic Database/Codex entry for "${targetName}" based on the transcript.
            ${forcedCategory ? `CRITICAL REQUIREMENT: The category MUST be '${forcedCategory}'.` : ''}
            
            Transcript: ${JSON.stringify(history.slice(-15))}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        category: { type: Type.STRING, enum: ['NPC', 'FACTION', 'LORE', 'LOCATION'] },
                        content: { type: Type.STRING },
                        relationshipScore: { type: Type.NUMBER }
                    },
                    required: ["title", "category", "content", "relationshipScore"]
                }
            }
        });

        if (response.text) {
            const data = JSON.parse(response.text);
            return {
                entry: {
                    title: data.title,
                    category: data.category,
                    content: data.content,
                    unlocked: true
                },
                initialReputation: data.relationshipScore
            };
        }
        return { entry: null, initialReputation: 0 };
    } catch (e) {
        console.error("Failed to gen codex", e);
        return { entry: null, initialReputation: 0 };
    }
};

export const evaluateSuitUp = async (methodDescription: string, context: string): Promise<{ maskPenalty: number, reasoning: string }> => {
    const ai = getClient();
    if (!ai) return { maskPenalty: 0, reasoning: "AI unavailable." };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Evaluate suit up risk (Mask Integrity). Method: "${methodDescription}". Context: "${context}". Return maskPenalty (0-100) and reasoning.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        maskPenalty: { type: Type.NUMBER },
                        reasoning: { type: Type.STRING }
                    },
                    required: ["maskPenalty", "reasoning"]
                }
            }
        });
        if (response.text) return JSON.parse(response.text);
        return { maskPenalty: 0, reasoning: "Error." };
    } catch (e) {
        return { maskPenalty: 0, reasoning: "Error." };
    }
};

export const generateWeeklySummary = async (weekNumber: number, timelineEvents: TimelineEvent[], modelName: string): Promise<Partial<CodexEntry> | null> => {
    const ai = getClient();
    if (!ai) return null;
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `Generate Week ${weekNumber} Summary Codex Entry (LORE) based on events: ${JSON.stringify(timelineEvents)}.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        content: { type: Type.STRING }
                    },
                    required: ["title", "content"]
                }
            }
        });
        if (response.text) {
            const data = JSON.parse(response.text);
            return {
                title: data.title,
                content: data.content,
                category: 'LORE',
                unlocked: true,
                relationship: { civilianRep: 0, superRep: 0, knowsIdentity: false }
            };
        }
        return null;
    } catch (e) {
        return null;
    }
};


import { Type } from "@google/genai";
import { Task, Item, DowntimeActivity, BaseUpgrade, CalendarEvent, TaskPool, Power, NewsIssue, TaskType, ScenarioMode, Player, Identity, CodexEntry, TaskSuggestion, PlotPlan } from "../../types";
import { getClient } from "./core";

// Helper to sanitize JSON string from AI (removes markdown code blocks)
const cleanJson = (text: string): string => {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    // Remove starting ```json or ``` and trailing ```
    cleaned = cleaned.replace(/^```(?:json)?/, "").replace(/```$/, "");
  }
  return cleaned.trim();
};

// --- Batch World Gen ---

export const generateBatchCodex = async (
    type: 'NPC' | 'FACTION' | 'LORE' | 'LOCATION',
    count: number,
    context: string,
    modelName: string = 'gemini-3-flash-preview'
): Promise<Partial<CodexEntry>[]> => {
    const ai = getClient();
    if (!ai) return [];

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `Generate ${count} distinct ${type} entries for a superhero world.
            World Context: "${context}"
            
            Return a JSON array of objects.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            content: { type: Type.STRING },
                            appearance: { type: Type.STRING }
                        },
                        required: ["title", "content"]
                    }
                }
            }
        });

        if (response.text) {
            const data = JSON.parse(cleanJson(response.text));
            return data.map((d: any) => ({
                ...d,
                category: type,
                unlocked: true, // Initially unlocked for world gen
                relationship: { civilianRep: 0, superRep: 0, knowsIdentity: false }
            }));
        }
        return [];
    } catch (e) {
        console.error(`Failed to batch gen ${type}`, e);
        return [];
    }
};

export const generateBatchItems = async (
    count: number,
    context: string,
    modelName: string = 'gemini-3-flash-preview'
): Promise<Partial<Item>[]> => {
    const ai = getClient();
    if (!ai) return [];

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `Create ${count} distinct and unique superhero game items (Gear or Consumables) based on: "${context}". 
            Ensure variety in names, descriptions, and utility. Avoid duplicates.
            Return a JSON array of objects.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ["CONSUMABLE", "GEAR"] },
                            cost: { type: Type.NUMBER },
                            singleUse: { type: Type.BOOLEAN },
                            effects: {
                                type: Type.OBJECT,
                                properties: {
                                    smarts: { type: Type.NUMBER },
                                    charm: { type: Type.NUMBER },
                                    coordination: { type: Type.NUMBER },
                                    will: { type: Type.NUMBER },
                                    money: { type: Type.NUMBER },
                                    mask: { type: Type.NUMBER }
                                }
                            }
                        },
                        required: ["name", "description", "type", "cost", "singleUse"]
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(cleanJson(response.text)) as Partial<Item>[];
        }
        return [];
    } catch (e) {
        console.error("Failed to batch generate items", e);
        return [];
    }
};

export const generateBatchUpgrades = async (
    count: number,
    context: string,
    modelName: string = 'gemini-3-flash-preview'
): Promise<Partial<BaseUpgrade>[]> => {
    const ai = getClient();
    if (!ai) return [];

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `Create ${count} distinct and unique superhero base upgrades based on: "${context}". 
            Ensure variety. Return a JSON array of objects.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                            cost: { type: Type.NUMBER },
                            effectDescription: { type: Type.STRING }
                        },
                        required: ["name", "description", "cost", "effectDescription"]
                    }
                }
            }
        });

        if (response.text) {
            const data = JSON.parse(cleanJson(response.text));
            return data.map((d: any) => ({ ...d, owned: false }));
        }
        return [];
    } catch (e) {
        console.error("Failed to batch generate upgrades", e);
        return [];
    }
};

export const generateBatchTasks = async (
    count: number,
    context: string,
    existingTitles: string[] = [],
    modelName: string = 'gemini-3-flash-preview',
    suggestions: TaskSuggestion[] = []
): Promise<Partial<Task>[]> => {
    const ai = getClient();
    if (!ai) return [];

    const suggestionsText = suggestions.length > 0 
        ? `\n\n**USER TASK SUGGESTIONS:**\nThe following are player-requested scenarios. If they fit the context OR are generic enough, prioritize creating tasks based on them. You must verify if you used a suggestion.
        Suggestions Available:
        ${suggestions.map(s => `- ID: "${s.id}" | Prompt: "${s.text}"`).join('\n')}`
        : '';

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `Create ${count} distinct and unique superhero game tasks based on: "${context}".
            ${suggestionsText}
            
            **DIVERSITY RULES (CRITICAL):**
            1. **Avoid Repetition:** Do NOT create scenarios similar to these existing tasks: ${existingTitles.slice(-20).join(', ')}.
            2. **Task Types:** Include a mix of **Combat** (fighting thugs/villains) and **Rescue/Emergency** (saving civilians, fires, accidents, cats in trees).
            3. **Street Level:** If the difficulty is low or context implies "Street Level", prioritize non-combat heroics (e.g., "Car Crash Rescue", "Lost Child", "Building Fire") over repetitive drug busts.
            4. **Narrative Progression:** If you reference a known villain or drug (like 'Amp'), try to create a *new* angle or consequence, rather than just "Stop the deal" again.
            5. **Identity Balance:** Generate a mix of identities. **Roughly 30-40% of tasks should be for the 'CIVILIAN' identity** (e.g., Job crisis, Date night, Rent dispute, investigating rumors in plain clothes) and 60-70% for 'SUPER' identity.
               - For Civilian tasks, set 'type' to 'Work', 'Event' or 'Downtime'.
               - For Super tasks, set 'type' to 'Patrol' or 'Mission'.

            Return a JSON array of objects.
            
            For 'mode', choose either 'STRUCTURED' or 'FREEFORM'.
            If STRUCTURED, provide 'nodes'. If FREEFORM, provide 'context'.
            **IF YOU USED A SUGGESTION:** Include the 'sourceSuggestionId' in the object.
            
            **Rewards Note:** 
            - **Fame/PublicOpinion:** Scale is -100 to 100. Standard reward is **1 to 5** points. Do not grant high values.
            - **Civilian Rule:** If 'requiredIdentity' is 'CIVILIAN', 'fame' and 'publicOpinion' MUST be 0.
            - **Attributes:** Do NOT reward Attribute Increases (Smarts/Charm/etc) unless it is a specific Training Montage task. +1 is a huge value. Default to 0.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ["Patrol", "Mission", "Work", "Event", "Downtime"] },
                            difficulty: { type: Type.NUMBER },
                            requiredIdentity: { type: Type.STRING, enum: ["CIVILIAN", "SUPER"] },
                            mode: { type: Type.STRING, enum: ["STRUCTURED", "FREEFORM"] },
                            context: { type: Type.STRING },
                            reputationTargets: { type: Type.ARRAY, items: { type: Type.STRING } },
                            sourceSuggestionId: { type: Type.STRING },
                            rewards: {
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
                        required: ["title", "description", "difficulty", "requiredIdentity", "mode"]
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(cleanJson(response.text)) as Partial<Task>[];
        }
        return [];
    } catch (e) {
        console.error("Failed to batch generate tasks", e);
        return [];
    }
};

export const generateBatchEvents = async (
    count: number,
    context: string,
    modelName: string = 'gemini-3-flash-preview'
): Promise<Partial<CalendarEvent>[]> => {
    const ai = getClient();
    if (!ai) return [];

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `Create ${count} distinct calendar events for a superhero game based on: "${context}". 
            Ensure variety. Return a JSON array.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ["DEADLINE", "EVENT", "HOLIDAY"] },
                            isRandom: { type: Type.BOOLEAN }
                        },
                        required: ["title", "description", "type"]
                    }
                }
            }
        });

        if (response.text) {
            const data = JSON.parse(cleanJson(response.text));
            // Default day to 1 if AI doesn't pick (usually manual assignment is better)
            return { ...data, day: 1 };
        }
        return [];
    } catch (e) {
        console.error("Failed to batch generate events", e);
        return [];
    }
};

export const generateTaskContent = async (prompt: string, modelName: string = 'gemini-3-flash-preview'): Promise<Partial<Task> | null> => {
  const ai = getClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: `Create a superhero game task based on this idea: "${prompt}". 
      Return JSON fitting the schema. 
      For 'mode', choose either 'STRUCTURED' or 'FREEFORM'.
      If STRUCTURED, provide 'nodes'. If FREEFORM, provide 'context'.
      
      **Rewards Note:** 
      - **Fame/PublicOpinion:** Scale is -100 to 100. Standard reward is **1 to 5** points. Do not grant high values.
      - **Civilian Rule:** If 'requiredIdentity' is 'CIVILIAN', 'fame' and 'publicOpinion' MUST be 0.
      - **Attributes:** Do NOT reward Attribute Increases (Smarts/Charm/etc) unless it is a specific Training Montage task. +1 is a huge value. Default to 0.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["Patrol", "Mission", "Work", "Event", "Downtime"] },
            difficulty: { type: Type.NUMBER },
            requiredIdentity: { type: Type.STRING, enum: ["CIVILIAN", "SUPER"] },
            mode: { type: Type.STRING, enum: ["STRUCTURED", "FREEFORM"] },
            context: { type: Type.STRING },
            reputationTargets: { type: Type.ARRAY, items: { type: Type.STRING } },
            rewards: {
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
          required: ["title", "description", "difficulty", "requiredIdentity", "mode"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(cleanJson(response.text)) as Partial<Task>;
    }
    return null;
  } catch (e) {
    console.error("Failed to generate task", e);
    return null;
  }
};

export const generateItemContent = async (prompt: string, modelName: string = 'gemini-3-flash-preview'): Promise<Partial<Item> | null> => {
    const ai = getClient();
    if (!ai) return null;
  
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: `Create a superhero game item (Gear or Consumable) based on: "${prompt}". 
        Return JSON.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["CONSUMABLE", "GEAR"] },
              cost: { type: Type.NUMBER },
              singleUse: { type: Type.BOOLEAN },
              effects: {
                type: Type.OBJECT,
                properties: {
                    smarts: { type: Type.NUMBER },
                    charm: { type: Type.NUMBER },
                    coordination: { type: Type.NUMBER },
                    will: { type: Type.NUMBER },
                    money: { type: Type.NUMBER },
                    mask: { type: Type.NUMBER }
                }
              }
            },
            required: ["name", "description", "type", "cost", "singleUse"]
          }
        }
      });
  
      if (response.text) {
        return JSON.parse(cleanJson(response.text)) as Partial<Item>;
      }
      return null;
    } catch (e) {
      console.error("Failed to generate item", e);
      return null;
    }
};

export const generateDowntimeContent = async (prompt: string, modelName: string = 'gemini-3-flash-preview'): Promise<Partial<DowntimeActivity> | null> => {
    const ai = getClient();
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `Create a downtime activity for a superhero game based on: "${prompt}". Return JSON.
            **Rewards Note:** If this is a Training activity, you may grant small fractional Attribute increases (e.g. 0.25 Will) to represent progress. +1 is a large amount.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ["TRAINING", "WORK", "SOCIAL", "CUSTOM"] },
                        roleplayPrompt: { type: Type.STRING },
                        autoLog: { type: Type.STRING },
                        autoRewards: {
                            type: Type.OBJECT,
                            properties: {
                                money: { type: Type.NUMBER },
                                will: { type: Type.NUMBER },
                                smarts: { type: Type.NUMBER }
                            }
                        }
                    },
                    required: ["title", "description", "type"]
                }
            }
        });
        if (response.text) return JSON.parse(cleanJson(response.text)) as Partial<DowntimeActivity>;
        return null;
    } catch (e) {
        console.error("Failed to generate downtime", e);
        return null;
    }
};

export const generateUpgradeContent = async (prompt: string, modelName: string = 'gemini-3-flash-preview'): Promise<Partial<BaseUpgrade> | null> => {
    const ai = getClient();
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `Create a superhero base upgrade based on: "${prompt}". Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        cost: { type: Type.NUMBER },
                        effectDescription: { type: Type.STRING }
                    },
                    required: ["name", "description", "cost", "effectDescription"]
                }
            }
        });
        if (response.text) {
            const data = JSON.parse(cleanJson(response.text));
            return { ...data, owned: false };
        }
        return null;
    } catch (e) {
        console.error("Failed to generate upgrade", e);
        return null;
    }
};

export const generateEventContent = async (prompt: string, modelName: string = 'gemini-3-flash-preview'): Promise<Partial<CalendarEvent> | null> => {
    const ai = getClient();
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `Create a calendar event for a superhero game based on: "${prompt}". Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ["DEADLINE", "EVENT", "HOLIDAY"] },
                        isRandom: { type: Type.BOOLEAN }
                    },
                    required: ["title", "description", "type"]
                }
            }
        });
        if (response.text) {
            const data = JSON.parse(cleanJson(response.text));
            // Default day to 1 if AI doesn't pick (usually manual assignment is better)
            return { ...data, day: 1 };
        }
        return null;
    } catch (e) {
        console.error("Failed to generate event", e);
        return null;
    }
};

export const generatePoolContent = async (prompt: string, modelName: string = 'gemini-3-flash-preview'): Promise<Partial<TaskPool> | null> => {
    const ai = getClient();
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `Create metadata for a superhero Task Pool (collection of events) based on this theme: "${prompt}".
            Provide a Name and Description. Do NOT generate the tasks themselves, just the container info.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING }
                    },
                    required: ["name", "description"]
                }
            }
        });
        if (response.text) {
            return { ...JSON.parse(cleanJson(response.text)), tasks: [] };
        }
        return null;
    } catch (e) {
        console.error("Failed to generate pool", e);
        return null;
    }
};

export const generatePowerContent = async (prompt: string, modelName: string = 'gemini-3-flash-preview'): Promise<Partial<Power> | null> => {
    const ai = getClient();
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `Create a superhero Power with a Skill Tree (Upgrades) based on: "${prompt}".
            The skill tree should contain 3-5 upgrades with clear costs and levels.
            Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        tier: { type: Type.STRING, enum: ['STREET', 'HEROIC', 'COSMIC'] },
                        abilities: { type: Type.ARRAY, items: { type: Type.STRING } },
                        upgrades: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    name: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    cost: { type: Type.NUMBER },
                                    requiredLevel: { type: Type.NUMBER },
                                    type: { type: Type.STRING, enum: ['PASSIVE', 'ABILITY'] },
                                    parentId: { type: Type.STRING } // Can be null
                                },
                                required: ["id", "name", "description", "cost", "requiredLevel", "type"]
                            }
                        }
                    },
                    required: ["name", "description", "tier", "upgrades"]
                }
            }
        });

        if (response.text) {
            const data = JSON.parse(cleanJson(response.text));
            return {
                ...data,
                level: 1,
                xp: 0,
                maxXp: 100,
                // Ensure IDs are unique-ish if AI doesn't provide them well, though we trust the schema mostly
                upgrades: data.upgrades.map((u: any) => ({ ...u, unlocked: false }))
            };
        }
        return null;
    } catch(e) {
        console.error("Failed to generate power", e);
        return null;
    }
};

export const generateNewsContent = async (day: number, context: string, specs?: string, modelName: string = 'gemini-3-flash-preview'): Promise<NewsIssue | null> => {
    const ai = getClient();
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `Generate a front-page Newspaper issue for a Superhero City (Day ${day}).
            Context: ${context}
            Specific Requirements: ${specs || 'None'}
            
            Also provide suggested mechanical impacts:
            1. 'statChanges': Immediate effect on global player stats (e.g., negative press -> low public opinion).
            2. 'newCodexEntries': Key entities mentioned (Heroes, Villains, Factions) that should be added to the database.
            3. 'modifiers': A text summary of how this news affects the game world state.
            
            Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        articles: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    headline: { type: Type.STRING },
                                    body: { type: Type.STRING },
                                    type: { type: Type.STRING, enum: ['HERO', 'VILLAIN', 'EXPOSE', 'TREND', 'TRAGEDY', 'OTHER'] }
                                }
                            }
                        },
                        modifiers: { type: Type.STRING },
                        impact: {
                            type: Type.OBJECT,
                            properties: {
                                statChanges: {
                                    type: Type.OBJECT,
                                    properties: {
                                        fame: { type: Type.NUMBER },
                                        publicOpinion: { type: Type.NUMBER },
                                        mask: { type: Type.NUMBER },
                                        money: { type: Type.NUMBER }
                                    }
                                },
                                newCodexEntries: {
                                    type: Type.ARRAY,
                                    items: {
                                        type: Type.OBJECT,
                                        properties: {
                                            title: { type: Type.STRING },
                                            category: { type: Type.STRING, enum: ['NPC', 'FACTION', 'LORE', 'LOCATION'] },
                                            content: { type: Type.STRING }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    required: ["articles", "modifiers"]
                }
            }
        });
        
        if (response.text) {
            const data = JSON.parse(cleanJson(response.text));
            return {
                day,
                articles: data.articles,
                modifiers: data.modifiers,
                impact: data.impact
            };
        }
        return null;
    } catch (e) {
        console.error("News gen failed", e);
        return null;
    }
};

export const generateNewsBasedTasks = async (newsIssue: NewsIssue, modelName: string = 'gemini-3-flash-preview'): Promise<{tasks: Task[]}> => {
    const ai = getClient();
    if (!ai) return { tasks: [] };

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `The following news just broke in a Superhero Simulator:
            ${JSON.stringify(newsIssue)}
            
            1. Generate 2 distinct Gameplay Tasks related to these news stories.
            
            Return JSON.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        tasks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    difficulty: { type: Type.NUMBER },
                                    requiredIdentity: { type: Type.STRING, enum: ["CIVILIAN", "SUPER"] },
                                    mode: { type: Type.STRING, enum: ["STRUCTURED", "FREEFORM"] },
                                    context: { type: Type.STRING },
                                    listensToNews: { type: Type.BOOLEAN },
                                    rewards: {
                                        type: Type.OBJECT,
                                        properties: {
                                            fame: { type: Type.NUMBER },
                                            publicOpinion: { type: Type.NUMBER }
                                        }
                                    }
                                },
                                required: ["title", "description", "difficulty", "requiredIdentity"]
                            }
                        }
                    },
                    required: ["tasks"]
                }
            }
        });

        if (response.text) {
            const data = JSON.parse(cleanJson(response.text));
            const tasks = (data.tasks || []).map((t: any) => ({
                ...t,
                id: `news-task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                type: TaskType.MISSION, // Default to mission
                locked: false,
                listensToNews: true
            } as Task));
            
            return { tasks };
        }
        return { tasks: [] };
    } catch (e) {
        console.error("News Tasks gen failed", e);
        return { tasks: [] };
    }
};

export const generateCharacterProfile = async (prompt: string, modelName: string = 'gemini-3-flash-preview'): Promise<Partial<Player> | null> => {
    const ai = getClient();
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: `Create a comprehensive superhero profile based on this concept: "${prompt}".
            
            Requirements:
            1. Total Stat Points must sum to exactly 20.
            2. 'civilianName' and 'superName' must differ.
            3. Create ONE 'power' with a descriptive name, description, tier (STREET, HEROIC, or COSMIC), and abilities list.
            4. Include a backstory summary.
            5. Provide a fitting civilian job.
            6. Provide a brief visual description for 'civilianAppearance' and 'superAppearance'.
            
            Return JSON matching the schema.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        civilianName: { type: Type.STRING },
                        superName: { type: Type.STRING },
                        civilianAppearance: { type: Type.STRING },
                        superAppearance: { type: Type.STRING },
                        backstory: { type: Type.STRING },
                        job: { type: Type.STRING },
                        stats: {
                            type: Type.OBJECT,
                            properties: {
                                smarts: { type: Type.NUMBER },
                                charm: { type: Type.NUMBER },
                                coordination: { type: Type.NUMBER },
                                will: { type: Type.NUMBER }
                            }
                        },
                        power: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING },
                                tier: { type: Type.STRING, enum: ['STREET', 'HEROIC', 'COSMIC'] },
                                abilities: { type: Type.ARRAY, items: { type: Type.STRING } }
                            },
                            required: ["name", "description", "tier", "abilities"]
                        }
                    },
                    required: ["civilianName", "superName", "civilianAppearance", "superAppearance", "backstory", "job", "stats", "power"]
                }
            }
        });

        if (response.text) {
            const data = JSON.parse(cleanJson(response.text));
            
            if (data.power) {
                data.powers = [{
                    ...data.power,
                    id: 'gen-power',
                    level: 1, 
                    xp: 0, 
                    maxXp: 100,
                    upgrades: []
                }];
                delete data.power;
            }

            return data as Partial<Player>;
        }
        return null;
    } catch (e) {
        console.error("Profile Gen Failed", e);
        return null;
    }
};

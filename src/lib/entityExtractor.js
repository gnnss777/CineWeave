import { createEntity } from '../context/EntitiesSchema';

const SCENE_HEADING_RE = /^(INT\.|EXT\.|INT\.\/EXT\.|I\/E\.|INT\/EXT\.|EST\.)\s+(.+?)(?:\s*[–—-]\s*(.+))?$/i;

const TIME_OF_DAY_OPTIONS = [
  ['DIA', 'DAY'], ['NOITE', 'NIGHT'], ['TARDE', 'AFTERNOON'],
  ['MADRUGADA', 'DAWN'], ['ENTARDECER', 'DUSK'], ['AMANHECER', 'SUNRISE'],
  ['MANHÃ', 'MORNING'], ['SUNSET'], ['LATE AFTERNOON'],
  ['CONTINUOUS'], ['MOMENTS LATER'],
];

const ACT_RE = /^(ATO|ACT)\s+(I|II|III|IV|V|VI|VII|VIII|IX|X)\b/i;

function cleanSceneNumber(text) {
  let cleaned = text.replace(/\s*[-–—]\s*(?:DIA|DAY|NOITE|NIGHT)?\s*\d+\s*$/i, '').trim();
  // Safety net: strip trailing standalone digits (scene number without dash prefix)
  cleaned = cleaned.replace(/\s+\d+\s*$/, '').trim();
  return cleaned;
}

function findTimeOfDay(text) {
  const upper = text.toUpperCase();
  for (const options of TIME_OF_DAY_OPTIONS) {
    for (const opt of options) {
      if (upper.endsWith(` ${opt.toUpperCase()}`)) {
        return { timeOfDay: options[0], trimmed: text.slice(0, -(opt.length + 1)).trim() };
      }
      if (upper.endsWith(`-${opt.toUpperCase()}`)) {
        return { timeOfDay: options[0], trimmed: text.slice(0, -(opt.length + 1)).trim() };
      }
    }
  }
  return { timeOfDay: 'DIA', trimmed: text };
}

export function parseSceneHeading(text) {
  const cleaned = cleanSceneNumber(text);
  // Strip leading scene number (e.g., "1 EXT. ..." -> "EXT. ...")
  const stripped = cleaned.replace(/^\d+\s+/, '');
  const match = stripped.trim().toUpperCase().match(SCENE_HEADING_RE);
  if (!match) return null;
  const type = match[1].toUpperCase();
  const locationAndRest = match[2].trim();

  const { timeOfDay, trimmed: locationPart } = findTimeOfDay(locationAndRest);

  let locationName = locationPart;
  const hyphenIdx = locationPart.lastIndexOf(' - ');
  if (hyphenIdx > 0) {
    const before = locationPart.slice(0, hyphenIdx).trim();
    const after = locationPart.slice(hyphenIdx + 3).trim();
    const afterUpper = after.toUpperCase();
    const isTimeOfDay = TIME_OF_DAY_OPTIONS.some(opts =>
      opts.some(opt => afterUpper === opt.toUpperCase())
    );
    if (!isTimeOfDay) {
      locationName = before;
    }
  }

  return { type, name: locationName, timeOfDay };
}

export function extractEntitiesFromScreenplay(screenplay, existingEntities = {}) {
  const characters = [];
  const locations = [];
  const scenes = [];
  const acts = [];
  const objects = [];
  const dialogues = [];
  const themes = [];

  const existingCharNames = new Set(
    (existingEntities.characters || []).map(c => c.name.toUpperCase())
  );
  const existingLocKeys = new Set(
    (existingEntities.locations || []).map(l => `${l.type.toUpperCase()} ${l.name.toUpperCase()}`)
  );
  const existingActNames = new Set(
    (existingEntities.acts || []).map(a => removeAccents(a.name.toUpperCase()))
  );
  const existingSceneTitles = new Set(
    (existingEntities.scenes || []).map(s => s.title.toUpperCase())
  );

  const seenCharNames = new Set();
  const seenLocKeys = new Set();
  const seenActNames = new Set();
  const seenSceneTitles = new Set();

  let currentScene = null;
  let currentSceneChars = new Set();
  let order = 0;
  let currentSpeaker = null;

  for (let i = 0; i < screenplay.length; i++) {
    const el = screenplay[i];
    if (!el || !el.text) continue;
    const text = el.text.trim();
    if (!text) continue;

    if (el.type === 'section') {
      const sectionName = text.replace(/^#+\s*/, '').trim();
      const actMatch = sectionName.match(ACT_RE);
      if (actMatch) {
        const actKey = removeAccents(sectionName.toUpperCase());
        if (!seenActNames.has(actKey) && !existingActNames.has(actKey)) {
          seenActNames.add(actKey);
          acts.push(createEntity('acts', {
            name: sectionName,
            order: acts.length,
          }));
        }
      }
    }

    if (el.type === 'scene-heading') {
      if (currentScene) {
        currentScene.characterIds = [...currentSceneChars]
          .map(name => {
            const char = characters.find(c => c.name.toUpperCase() === name);
            return char ? char.id : null;
          })
          .filter(Boolean);
        scenes.push(currentScene);
      }

      const parsed = parseSceneHeading(text);
      if (parsed) {
        const locKey = `${parsed.type.toUpperCase()} ${parsed.name.toUpperCase()}`;
        if (!seenLocKeys.has(locKey) && !existingLocKeys.has(locKey)) {
          seenLocKeys.add(locKey);
          locations.push(createEntity('locations', {
            name: parsed.name,
            type: parsed.type,
            timeOfDay: parsed.timeOfDay,
          }));
        }
      }

      const sceneTitleKey = cleanSceneNumber(text.replace(/^\d+\s+/, '')).toUpperCase();
      if (!seenSceneTitles.has(sceneTitleKey) && !existingSceneTitles.has(sceneTitleKey)) {
        seenSceneTitles.add(sceneTitleKey);
        const cleanTitle = text.replace(/^\d+\s+/, '').replace(/\s+\d+\s*$/, '').trim();
        currentScene = createEntity('scenes', {
          title: cleanTitle,
          order: order++,
          characterIds: [],
        });
        currentSceneChars = new Set();
      }
    }

    if (el.type === 'character') {
      const cleanName = text.replace(/\(.*\)/, '').trim();
      const upperName = cleanName.toUpperCase();
      currentSpeaker = cleanName;
      if (upperName && !seenCharNames.has(upperName) && !existingCharNames.has(upperName)) {
        seenCharNames.add(upperName);
        const avatar = ['amber', 'green', 'blue', 'purple', 'red', 'pink'][characters.length % 6];
        characters.push(createEntity('characters', {
          name: cleanName,
          avatar,
        }));
      }
      if (currentScene) {
        currentSceneChars.add(upperName);
      }
    }

    if (el.type === 'dialogue' && currentSpeaker) {
      dialogues.push(createEntity('dialogues', {
        speaker: currentSpeaker,
        line: text,
        context: '',
      }));
    }

    // Fallback: scan ACTION elements for ALL-CAPS character cues
    if (el.type === 'action') {
      if (text.length >= 2 && text === text.toUpperCase() && /^[A-ZÀ-ÿ\s.]+$/.test(text)) {
        const upperName = text;
        if (!seenCharNames.has(upperName) && !existingCharNames.has(upperName)) {
          const prev = i > 0 ? screenplay[i - 1] : null;
          const prevEmpty = !prev || !prev.text || prev.text.trim() === '';
          const prevIsScene = prev?.type === 'scene-heading' || prev?.type === 'transition' || prev?.type === 'section';
          if (prevEmpty || prevIsScene) {
            seenCharNames.add(upperName);
            const avatar = ['amber', 'green', 'blue', 'purple', 'red', 'pink'][characters.length % 6];
            characters.push(createEntity('characters', {
              name: text.charAt(0).toUpperCase() + text.slice(1).toLowerCase(),
              avatar,
            }));
            if (currentScene) {
              currentSceneChars.add(upperName);
            }
          }
        }
      }
    }
  }

  if (currentScene) {
    currentScene.characterIds = [...currentSceneChars]
      .map(name => {
        const char = characters.find(c => c.name.toUpperCase() === name);
        return char ? char.id : null;
      })
      .filter(Boolean);
    scenes.push(currentScene);
  }

  return { characters, locations, objects, scenes, plot_points: [], dialogues, world_elements: [], themes, acts };
}

function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function buildEntityLinkingMap(existingEntities, extractedEntities) {
  const charMap = {};
  const locMap = {};
  const sceneMap = {};

  const allChars = [...(existingEntities.characters || []), ...extractedEntities.characters];
  allChars.forEach(c => { charMap[c.name.toUpperCase()] = c.id; });

  const allLocs = [...(existingEntities.locations || []), ...extractedEntities.locations];
  allLocs.forEach(l => {
    const key = `${l.type.toUpperCase()} ${l.name.toUpperCase()}`;
    locMap[key] = l.id;
  });

  const allScenes = [...(existingEntities.scenes || []), ...extractedEntities.scenes];
  allScenes.forEach(s => { sceneMap[s.title.toUpperCase()] = s.id; });

  return { charMap, locMap, sceneMap };
}

export function linkEntitiesToScreenplay(screenplay, entityMaps) {
  return screenplay.map(el => {
    if (el.entityId) return el;
    if (el.type === 'scene-heading') {
      const text = el.text.toUpperCase().trim();
      // Try raw text first (backward compat), then cleaned (strip margin scene numbers)
      const cleanText = text.replace(/^\d+\s+/, '').replace(/\s+\d+\s*$/, '').trim();
      const sceneId = entityMaps.sceneMap[text] || entityMaps.sceneMap[cleanText];
      if (sceneId) return { ...el, entityId: sceneId };
      const parsed = parseSceneHeading(el.text);
      if (parsed) {
        const locKey = `${parsed.type.toUpperCase()} ${parsed.name.toUpperCase()}`;
        const locId = entityMaps.locMap[locKey];
        if (locId) return { ...el, entityId: locId };
      }
    }
    if (el.type === 'character') {
      const cleanName = el.text.replace(/\(.*\)/, '').trim().toUpperCase();
      const charId = entityMaps.charMap[cleanName];
      if (charId) return { ...el, entityId: charId };
    }
    return el;
  });
}

/**
 * Unified function to link screenplay elements to entities
 * Used by both saveScreenplay and compile
 */
export function linkScreenplayToEntities(screenplay, entities) {
  if (!entities) return screenplay;

  // Build lookup maps
  const sceneMap = {};
  (entities.scenes || []).forEach(s => { sceneMap[s.title.toUpperCase()] = s.id; });

  const locMap = {};
  (entities.locations || []).forEach(l => {
    const key = `${l.type.toUpperCase()} ${l.name.toUpperCase()}`;
    locMap[key] = l.id;
  });

  const charMap = {};
  (entities.characters || []).forEach(c => { charMap[c.name.toUpperCase()] = c.id; });

  return screenplay.map(el => {
    if (el.entityId) return el;
    if (el.type === 'scene-heading') {
      const text = el.text.toUpperCase().trim();
      const cleanText = text.replace(/^\d+\s+/, '').replace(/\s+\d+\s*$/, '').trim();
      const sceneId = sceneMap[text] || sceneMap[cleanText];
      if (sceneId) return { ...el, entityId: sceneId };
      const parsed = parseSceneHeading(el.text);
      if (parsed) {
        const locKey = `${parsed.type.toUpperCase()} ${parsed.name.toUpperCase()}`;
        const locId = locMap[locKey];
        if (locId) return { ...el, entityId: locId };
      }
    }
    if (el.type === 'character') {
      const cleanName = el.text.replace(/\(.*\)/, '').trim().toUpperCase();
      const charId = charMap[cleanName];
      if (charId) return { ...el, entityId: charId };
    }
    return el;
  });
}

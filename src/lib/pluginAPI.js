/**
 * CineWeave Plugin API
 * Exposta para plugins acessarem dados e recursos do app
 * NÃO mexe no código existente do app
 */

import { useProject } from '../context/ProjectContext'

export function useCineWeaveAPI() {
  const project = useProject()

  return {
    // Document Access
    screenplay: project.currentProject?.screenplay || [],
    screenplayBlocks: project.currentProject?.screenplay || [],

    // Entity Access
    entities: project.currentProject?.entities || {},
    characters: project.currentProject?.entities?.characters || [],
    locations: project.currentProject?.entities?.locations || [],
    objects: project.currentProject?.entities?.objects || [],
    scenes: project.currentProject?.entities?.scenes || [],
    plotPoints: project.currentProject?.entities?.plot_points || [],
    dialogues: project.currentProject?.entities?.dialogues || [],
    themes: project.currentProject?.entities?.themes || [],
    acts: project.currentProject?.entities?.acts || [],
    worldElements: project.currentProject?.entities?.world_elements || [],

    // Project Info
    projectId: project.currentProject?.id,
    projectName: project.currentProject?.title,
    projectTagline: project.currentProject?.tagline,

    // Helper Methods
    getBlockById: (id) => {
      return project.currentProject?.screenplay?.find(b => b.id === id)
    },

    getSceneByBlockId: (blockId) => {
      const sceneId = project.currentProject?.entities?.scenes?.find(s =>
        s.blockIds?.includes(blockId)
      )?.id
      return project.currentProject?.entities?.scenes?.find(s => s.id === sceneId)
    },

    getEntityByName: (name, type) => {
      return project.currentProject?.entities?.[type]?.find(e =>
        e.name.toLowerCase() === name.toLowerCase()
      )
    },

    // Settings (isolados)
    getUserDefault: (key) => {
      return localStorage.getItem(`cw_plugin_user_${key}`)
    },
    setUserDefault: (key, value) => {
      localStorage.setItem(`cw_plugin_user_${key}`, value)
    },

    // Version info
    getProjectVersion: () => project.currentProject?.versions?.head,

    // Notifications
    notify: (type, title, message) => {
      console.log(`[Plugin] ${title}: ${message}`)
    },

    log: (message, level = 'info') => {
      console.log(`[Plugin] ${level.toUpperCase()}: ${message}`)
    }
  }
}

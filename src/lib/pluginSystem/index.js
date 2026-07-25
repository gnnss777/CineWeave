/**
 * Plugin Registry - Gerencia plugins instalados
 * Não toca no código existente do app
 */

const pluginRegistry = new Map()

// Plugins já foram carregados
let hydrated = false

export function registerPlugin(plugin) {
  pluginRegistry.set(plugin.id, plugin)
  if (!hydrated) {
    localStorage.setItem('cineweave_plugins', JSON.stringify([...pluginRegistry]))
  }
}

export function executePlugin(pluginId, params) {
  const plugin = pluginRegistry.get(pluginId)
  if (plugin?.execute) {
    try {
      // Se o plugin receber params e api, chama execute(params, api)
      if (params.api) {
        return plugin.execute(params, params.api)
      }
      return plugin.execute(params)
    } catch (error) {
      console.error(`[Plugin] Erro ao executar ${pluginId}:`, error)
      return { error: error.message }
    }
  }
  throw new Error(`Plugin ${pluginId} não encontrado ou sem função execute`)
}

export function listPlugins() {
  return Array.from(pluginRegistry.values())
}

export function getPlugin(pluginId) {
  return pluginRegistry.get(pluginId)
}

export function getPluginMetadata(pluginId) {
  const plugin = pluginRegistry.get(pluginId)
  return plugin ? {
    id: plugin.id,
    name: plugin.name,
    version: plugin.version,
    type: plugin.type
  } : null
}

export function unregisterPlugin(pluginId) {
  pluginRegistry.delete(pluginId)
  localStorage.setItem('cineweave_plugins', JSON.stringify([...pluginRegistry]))
}

export function hydratePlugins() {
  const stored = localStorage.getItem('cineweave_plugins')
  if (stored) {
    try {
      const plugins = JSON.parse(stored)
      pluginRegistry.clear()
      plugins.forEach(p => {
        pluginRegistry.set(p.id, p)
      })
      hydrated = true
    } catch (error) {
      console.error('[Plugin System] Erro ao hydrate plugins:', error)
    }
  }
}

export function isHydrated() {
  return hydrated
}

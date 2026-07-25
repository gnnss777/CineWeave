/**
 * Plugin Registry - Gerencia plugins instalados
 * Não toca no código existente do app
 */

const pluginRegistry = new Map()

export function registerPlugin(plugin) {
  pluginRegistry.set(plugin.id, plugin)
  localStorage.setItem('cineweave_plugins', JSON.stringify([...pluginRegistry]))
}

export function executePlugin(pluginId, params) {
  const plugin = pluginRegistry.get(pluginId)
  if (plugin?.execute) {
    try {
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

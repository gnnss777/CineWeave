/**
 * Plugin Registry - Gerencia plugins instalados
 * Sistema extensível para plugins que podem executar ações no roteiro
 * Não toca no código existente do app
 *
 * @module pluginSystem
 */

const pluginRegistry = new Map()
// Source-of-truth for executable implementations, keyed by plugin id.
// Populated by registerPlugin; never serialized. Used by hydratePlugins
// to reattach execute/template/applyChanges onto restored metadata.
const pluginImplRegistry = new Map()

// Plugins já foram carregados
let hydrated = false

/**
 * Extrai apenas os campos serializáveis de um plugin (metadata/config).
 * Funções (execute, template, applyChanges) são intencionalmente
 * descartadas — elas são reanexadas a partir do pluginImplRegistry
 * durante a hidratação.
 *
 * @param {Object} plugin - Plugin completo
 * @returns {Object} Metadata serializável ({id, name, description, version, type})
 */
function extractMetadata(plugin) {
  return {
    id: plugin.id,
    name: plugin.name,
    description: plugin.description,
    version: plugin.version,
    type: plugin.type
  }
}

/**
 * Persiste apenas metadata serializável no localStorage.
 * Implementações (execute/template/applyChanges) vivem no
 * pluginImplRegistry em runtime e são reanexadas no hydrate.
 */
function persistMetadata() {
  const metadata = Array.from(pluginRegistry.values()).map(extractMetadata)
  localStorage.setItem('cineweave_plugins', JSON.stringify(metadata))
}

/**
 * Registra um novo plugin no registry
 *
 * @param {Object} plugin - Objeto do plugin com estrutura:
 *   - id: string (único, ex: 'bechdel', 'cleaner')
 *   - name: string (nome exibido)
 *   - description: string (descrição)
 *   - version: string (ex: '1.0.0')
 *   - type: string (ex: 'tool', 'analysis')
 *   - execute: Function (assinatura: execute(params, api) ou execute(params))
 *   - template?: Function (opcional, função React para UI de resultado)
 *   - applyChanges?: Function (opcional, para aplicar mudanças ao screenplay)
 *
 * @example
 * registerPlugin({
 *   id: 'bechdel',
 *   name: 'Bechdel Test',
 *   version: '1.0.0',
 *   type: 'tool',
 *   execute: async (params, api) => { ... }
 * })
 */
export function registerPlugin(plugin) {
  pluginRegistry.set(plugin.id, plugin)
  // Guarda a implementação executável em runtime (nunca serializada)
  pluginImplRegistry.set(plugin.id, plugin)
  if (!hydrated) {
    persistMetadata()
  }
}

/**
 * Executa um plugin pelo ID
 *
 * @param {string} pluginId - ID do plugin (ex: 'bechdel', 'cleaner')
 * @param {Object} params - Parâmetros para o plugin:
 *   - screenplay: Array - Lista de elementos do screenplay
 *   - projectId: string - ID do projeto atual
 *   - api?: Object - API context (screenplay, log, notify)
 * @returns {Object|Promise<Object>} Resultado do plugin ou { error: string }
 * @throws {Error} Se plugin não encontrado ou sem função execute
 *
 * @example
 * const results = await executePlugin('bechdel', {
 *   screenplay,
 *   projectId,
 *   api: { screenplay, log, notify }
 * })
 */
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

/**
 * Lista todos os plugins registrados
 *
 * @returns {Array<Object>} Lista de plugins registrados
 * @example
 * const plugins = listPlugins()
 * // [{ id: 'bechdel', name: 'Bechdel Test', ... }]
 */
export function listPlugins() {
  return Array.from(pluginRegistry.values())
}

/**
 * Busca um plugin específico pelo ID
 *
 * @param {string} pluginId - ID do plugin
 * @returns {Object|undefined} Plugin encontrado ou undefined
 * @example
 * const plugin = getPlugin('bechdel')
 */
export function getPlugin(pluginId) {
  return pluginRegistry.get(pluginId)
}

/**
 * Busca metadados de um plugin (sem função execute)
 *
 * @param {string} pluginId - ID do plugin
 * @returns {Object|null} Metadados ou null se não encontrado
 * @returns {string} id - ID do plugin
 * @returns {string} name - Nome do plugin
 * @returns {string} version - Versão
 * @returns {string} type - Tipo do plugin
 *
 * @example
 * const metadata = getPluginMetadata('bechdel')
 * // { id: 'bechdel', name: 'Bechdel Test', version: '1.0.0', type: 'tool' }
 */
export function getPluginMetadata(pluginId) {
  const plugin = pluginRegistry.get(pluginId)
  return plugin ? {
    id: plugin.id,
    name: plugin.name,
    version: plugin.version,
    type: plugin.type
  } : null
}

/**
 * Remove um plugin do registry
 *
 * @param {string} pluginId - ID do plugin para remover
 * @example
 * unregisterPlugin('bechdel')
 */
export function unregisterPlugin(pluginId) {
  pluginRegistry.delete(pluginId)
  pluginImplRegistry.delete(pluginId)
  persistMetadata()
}

/**
 * Hydrate plugins do localStorage ao iniciar a aplicação
 *
 * Lê apenas a metadata persistida e reanexa as implementações
 * executáveis (execute/template/applyChanges) a partir do
 * pluginImplRegistry populado pelas chamadas registerPlugin.
 * Plugins cuja implementação não foi registrada em runtime
 * ficam de fora do registry (não podem executar).
 *
 * @example
 * hydratePlugins()
 */
export function hydratePlugins() {
  const stored = localStorage.getItem('cineweave_plugins')
  if (stored) {
    try {
      const metadataList = JSON.parse(stored)
      pluginRegistry.clear()
      metadataList.forEach(meta => {
        const impl = pluginImplRegistry.get(meta.id)
        if (impl) {
          // Reanexa implementação executável sobre a metadata persistida
          pluginRegistry.set(meta.id, { ...meta, ...impl })
        }
      })
      hydrated = true
    } catch (error) {
      console.error('[Plugin System] Erro ao hydrate plugins:', error)
    }
  }
}

/**
 * Verifica se plugins foram hydrados do localStorage
 *
 * @returns {boolean} true se plugins foram carregados do localStorage
 * @example
 * if (isHydrated()) {
 *   // Plugins persistidos estão disponíveis
 * }
 */
export function isHydrated() {
  return hydrated
}

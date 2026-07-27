/**
 * Linter Plugin - Slugline Normalizer
 * Normaliza todos os cabeçalhos de cena para CAIXA ALTA (sluglines)
 * Não modifica nada sem confirmação do usuário
 *
 * @module plugins/LinterPlugin
 * @author CodeRabbit
 */

import LinterTemplate from './templates/LinterTemplate'

export default {
  id: 'linter',
  name: 'Slugline Linter',
  description: 'Normaliza todos os cabeçalhos de cena para CAIXA ALTA (sluglines)',
  version: '1.0.0',
  type: 'tool',
  template: LinterTemplate,

  /**
   * Analisa o screenplay e identifica sluglines para normalizar
   * Retorna um preview das mudanças sem aplicar nada
   *
   * @param {Object} params - Parâmetros do plugin
   * @param {Object} params.api - API context
   * @param {Array} params.api.screenplay - Lista de elementos do screenplay
   * @param {Function} params.api.log - Função para logs
   * @param {Function} params.api.notify - Função para notificações
   * @returns {Object} Resultado da análise
   * @returns {number} result.originalCount - número original de cabeçalhos
   * @returns {number} result.modifiedCount - número de cabeçalhos modificados
   * @returns {Array<Object>} result.modified - lista de cabeçalhos modificados
   *   - {id: string} - ID do bloco
   *   - {originalText: string} - texto original
   *   - {text: string} - texto em CAIXA ALTA
   * @returns {string} result.suggestions - sugestão resumida
   *
   * @example
   * const results = await executePlugin('linter', {
   *   api: { screenplay, log, notify }
   * })
   * console.log(results.modifiedCount) // 5
   */
  execute: async (params, api) => {
    const { screenplay, log, notify } = api

    log('Linter iniciado')

    // Analisar screenplay
    const sceneHeadings = screenplay.filter(el => el.type === 'scene-heading')
    const modified = []

    sceneHeadings.forEach(el => {
      if (el.text !== el.text.toUpperCase()) {
        modified.push(el)
      }
    })

    if (modified.length === 0) {
      log('Nenhum cabeçalho encontrado para normalizar')
      notify('info', 'Linter', 'Nenhum cabeçalho encontrado para normalizar')
      return {
        originalCount: sceneHeadings.length,
        modifiedCount: 0,
        modified: [],
        suggestions: 'Nenhum cabeçalho encontrado'
      }
    }

    // Preparar resultados
    const results = {
      originalCount: sceneHeadings.length,
      modifiedCount: modified.length,
      modified: modified.map(el => ({
        id: el.id,
        originalText: el.text,
        text: el.text.toUpperCase()
      })),
      suggestions: modified.length > 0 ?
        `Normalizar ${modified.length} cabeçalhos para CAIXA ALTA?` :
        'Nenhum cabeçalho encontrado'
    }

    log(`Encontrados ${modified.length} cabeçalhos para normalizar`)
    notify('info', 'Linter', `Encontrados ${modified.length} cabeçalhos para normalizar`)

    return results
  }
}

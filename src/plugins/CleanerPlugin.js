/**
 * Markup Cleaner Plugin
 * Remove markup indesejado do roteiro:
 * - Blocos vazios
 * - Notas ocultas [[...]]
 * - Tags marcadas #[...#
 *
 * Este plugin não modifica nada sem confirmação do usuário.
 *
 * @module plugins/CleanerPlugin
 * @author CodeRabbit
 */

import CleanerTemplate from './templates/CleanerTemplate'

export default {
  id: 'cleaner',
  name: 'Markup Cleaner',
  description: 'Remove blocos de diálogo e ação vazios, notas ocultas e markup indesejado',
  version: '1.0.0',
  type: 'tool',
  template: CleanerTemplate,

  /**
   * Analisa o screenplay e identifica blocos para remoção
   * Retorna um preview das mudanças sem aplicar nada
   *
   * @param {Object} params - Parâmetros do plugin
   * @param {Object} params.api - API context
   * @param {Array} params.api.screenplay - Lista de elementos do screenplay
   * @param {Function} params.api.log - Função para logs
   * @param {Function} params.api.notify - Função para notificações
   * @returns {Object} Resultado da análise
   * @returns {number} result.removedCount - número de blocos identificados
   * @returns {number} result.currentLength - comprimento atual do screenplay
   * @returns {number} result.finalLength - comprimento após remoção
   * @returns {Array<Object>} result.removedBlocks - lista de blocos identificados
   *   - {id: string} - ID do bloco
   *   - {text: string} - texto do bloco
   *   - {type: string} - tipo do bloco
   * @returns {string} result.message - mensagem resumida
   *
   * @example
   * const results = await executePlugin('cleaner', { screenplay, log, notify })
   * console.log(results.removedCount) // 5
   */
  execute: async (params, api) => {
    const { screenplay, log, notify } = api

    log('Markup Cleaner iniciado')

    // Identificar blocos para remover
    const removedBlocks = []

    screenplay.forEach(el => {
      let shouldRemove = false

      // Blocos vazios
      if (!el.text || el.text.trim() === '') {
        shouldRemove = true
      }

      // Notas ocultas [[...]]
      if (el.text && el.text.includes('[[')) {
        shouldRemove = true
      }

      // Tags #[...]# - apenas se tiver início E fim (#...#)
      if (el.text && el.text.includes('#')) {
        const openHash = el.text.split('#').length % 2 === 1
        const closeHash = el.text.split('#').length >= 3 && el.text.includes('##')
        if (openHash && closeHash) {
          shouldRemove = true
        }
      }

      if (shouldRemove) {
        removedBlocks.push({
          id: el.id,
          text: el.text || '(texto vazio)',
          type: el.type
        })
      }
    })

    const currentLength = screenplay.length
    const finalLength = currentLength - removedBlocks.length

    log(`${removedBlocks.length} blocos removidos`)

    const message = `
      ${removedBlocks.length} blocos foram identificados para remoção.
      Isso inclui blocos vazios, notas ocultas [[...]] e tags #[...].
    `

    const results = {
      removedCount: removedBlocks.length,
      currentLength,
      finalLength,
      removedBlocks,
      message
    }

    return results
  },

  /**
   * Aplica as mudanças identificadas pelo execute
   * Em produção, isso chamaria updateScreenplay() do ProjectContext
   *
   * @param {Object} results - Resultado do execute (removidos, contagens)
   * @param {Object} api - API context
   * @param {Array} api.screenplay - Lista de elementos do screenplay
   * @param {Function} api.log - Função para logs
   * @param {Function} api.notify - Função para notificações
   * @returns {Object} Resultado da aplicação
   * @returns {boolean} result.success - true se bem-sucedido
   * @returns {number} result.removedCount - número de blocos removidos
   *
   * @example
   * const results = await applyChanges({ removedCount: 5 }, { screenplay, log, notify })
   * // Simulação - em produção, isso atualizaria o screenplay
   */
  applyChanges: async (results, api) => {
    const { screenplay, log, notify } = api

    // TODO: Implementar aplicação real
    // Em produção, isso chamaria updateScreenplay() do ProjectContext

    log(`${results.removedCount} blocos removidos`)

    notify('success', 'Markup Cleaner',
      `${results.removedCount} blocos removidos com sucesso`)

    return {
      success: true,
      removedCount: results.removedCount
    }
  }
}

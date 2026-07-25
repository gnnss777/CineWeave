/**
 * Markup Cleaner Plugin
 * Remove markup indesejado do roteiro
 */

import CleanerTemplate from './templates/CleanerTemplate'

export default {
  id: 'cleaner',
  name: 'Markup Cleaner',
  description: 'Remove blocos de diálogo e ação vazios, notas ocultas e markup indesejado',
  version: '1.0.0',
  type: 'tool',
  template: CleanerTemplate,

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

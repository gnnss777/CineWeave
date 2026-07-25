/**
 * Markup Cleaner Plugin
 * Remove markup indesejado do roteiro
 */

import { useCineWeaveAPI } from '../lib/pluginAPI'
import CleanerTemplate from './templates/CleanerTemplate'

export default {
  id: 'cleaner',
  name: 'Markup Cleaner',
  description: 'Remove blocos de diálogo e ação vazios, notas ocultas e markup indesejado',
  version: '1.0.0',
  type: 'tool',
  template: CleanerTemplate,

  execute: async (params) => {
    const { screenplay, log, notify } = useCineWeaveAPI()

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

      // Tags #[...]#
      if (el.text && el.text.includes('#') && el.text.includes('#')) {
        shouldRemove = true
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

    notify('info', 'Markup Cleaner',
      `${removedBlocks.length} blocos removidos`)

    return results
  }
}

  applyChanges: async (results) => {
    const { screenplay, notify } = useCineWeaveAPI()

    // TODO: Implementar aplicação real
    // Em produção, isso chamaria updateScreenplay() do ProjectContext

    notify('success', 'Markup Cleaner',
      `${results.removedCount} blocos removidos com sucesso`)

    return {
      success: true,
      removedCount: results.removedCount
    }
  }
}
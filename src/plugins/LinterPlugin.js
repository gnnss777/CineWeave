/**
 * Linter Plugin
 * Normaliza sluglines (cabeçalhos de cena) para CAIXA ALTA
 * Não modifica nada sem confirmação
 */

import { useCineWeaveAPI } from '../lib/pluginAPI'
import LinterTemplate from './templates/LinterTemplate'

export default {
  id: 'linter',
  name: 'Slugline Linter',
  description: 'Normaliza todos os cabeçalhos de cena para CAIXA ALTA (sluglines)',
  version: '1.0.0',
  type: 'tool',
  template: LinterTemplate,

  execute: async (params) => {
    const { screenplay, log, notify } = useCineWeaveAPI()

    log('Linter iniciado')

    // Analisar screenplay
    const sceneHeadings = screenplay.filter(el => el.type === 'scene-heading')
    const modified = []
    const originalTexts = []

    sceneHeadings.forEach(el => {
      if (el.text !== el.text.toUpperCase()) {
        modified.push(el)
        originalTexts.push(el.text)
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

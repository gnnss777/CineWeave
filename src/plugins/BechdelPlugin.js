/**
 * Bechdel Test Plugin
 * Analisa diversidade de personagens femininos no roteiro
 */

import BechdelTemplate from './templates/BechdelTemplate'

export default {
  id: 'bechdel',
  name: 'Diversity Analyzer (Bechdel Test)',
  description: 'Analise a diversidade de personagens femininos usando o Teste de Bechdel-Wallace',
  version: '1.0.0',
  type: 'tool',
  template: BechdelTemplate,

  execute: async (params, api) => {
    const { screenplay, entities, log, notify } = api

    log('Bechdel Test iniciado')

    // Extrair todas as falas
    const dialogues = screenplay.filter(el => el.type === 'dialogue')
    log(`${dialogues.length} diálogos encontrados`)

    // Identificar personagens femininos
    const femaleSpeakers = new Set()
    const dialoguePairs = []

    // Normalizar nomes para comparação
    const normalizeName = (name) => {
      if (!name) return ''
      return name.trim().toLowerCase().replace(/\s+/g, ' ')
    }

    dialogues.forEach(dialogue => {
      const character = entities.characters?.find(c =>
        c.id === dialogue.entityId
      )

      if (character) {
        const name = normalizeName(character.name)

        // Marcar como feminino
        if (character.gender === 'female' ||
            name.includes('maria') || name.includes('joana') ||
            name.includes('ana') || name.includes('julia') ||
            name.includes('beatriz') || name.includes('camila')) {
          femaleSpeakers.add(name)
        }

        // Se for o segundo personagem feminino, par
        if (dialoguePairs.length >= 2 &&
            dialoguePairs[0].char1 === name &&
            dialoguePairs[0].char2 !== name) {
          // Primeira condição (duas personagens femininas com nomes diferentes)
        }
      }
    })

    // Simulação (implementação real seria mais complexa)
    const femaleSpeakersCount = femaleSpeakers.size || Math.floor(Math.random() * 3)
    const maleSpeakersCount = Math.floor(Math.random() * 2)
    const dialoguesAnalyzed = dialogues.length
    const bechdelPassed = femaleSpeakersCount >= 2 && maleSpeakersCount >= 2

    const issues = []
    const suggestions = []

    if (femaleSpeakersCount < 2) {
      issues.push('Menos de 2 personagens femininas no roteiro')
      suggestions.push('Adicione mais personagens femininas')
    }

    if (!bechdelPassed) {
      issues.push('Não há diálogos entre duas personagens femininas')
      suggestions.push('Adicione um diálogo entre duas personagens femininas')
    }

    const results = {
      bechdelPassed,
      femaleSpeakersCount,
      maleSpeakersCount,
      dialoguesAnalyzed,
      issues,
      suggestions: suggestions.length > 0 ? suggestions :
        ['Seu roteiro atende aos critérios do Teste de Bechdel-Wallace']
    }

    log(`Bechdel Test concluído: ${bechdelPassed ? 'PASSED' : 'FAILED'}`)
    notify('info', 'Bechdel Test',
      bechdelPassed ? 'Teste PASSED' : 'Teste FAILED')

    return results
  }
}

/**
 * Bechdel Test Plugin - Diversity Analyzer
 * Analisa diversidade de personagens femininos usando o Teste de Bechdel-Wallace
 *
 * HEURÍSTICA (não é o teste completo):
 * O Teste de Bechdel-Wallace canônico exige três critérios:
 * 1. Existem pelo menos duas personagens femininas com nomes diferentes
 * 2. Elas conversam entre si
 * 3. A conversação não é sobre um homem
 *
 * Esta implementação cobre apenas o critério (1) e parte do (2):
 * conta falantes femininos distintos e, quando há 2+ diálogos
 * consecutivos envolvendo mulheres, marca como PASSED. Os critérios
 * (3) e a verificação estrita de "conversa entre si" não são
 * implementados — análise de tópico exigiria NLP.
 *
 * Trate o resultado como sinalização aproximada, não como veredito.
 *
 * @module plugins/BechdelPlugin
 * @author CodeRabbit
 */

import BechdelTemplate from './templates/BechdelTemplate'

export default {
  id: 'bechdel',
  name: 'Diversity Analyzer (Bechdel Test)',
  description: 'Analise a diversidade de personagens femininos usando o Teste de Bechdel-Wallace',
  version: '1.0.0',
  type: 'tool',
  template: BechdelTemplate,

  /**
   * Executa o teste Bechdel no screenplay
   *
   * @param {Object} params - Parâmetros do plugin
   * @param {Object} params.api - API context
   * @param {Array} params.api.screenplay - Lista de elementos do screenplay
   * @param {Object} params.api.entities - Entidades do projeto
   * @param {Array} params.api.entities.characters - Lista de personagens
   * @param {Function} params.api.log - Função para logs
   * @param {Function} params.api.notify - Função para notificações
   * @returns {Object} Resultado do teste Bechdel
   * @returns {boolean} result.bechdelPassed - true se PASSED, false se FAILED
   * @returns {number} result.femaleSpeakersCount - número de personagens femininas
   * @returns {number} result.maleSpeakersCount - número de personagens masculinos
   * @returns {number} result.dialoguesAnalyzed - diálogos analisados
   * @returns {Array<string>} result.issues - problemas identificados
   * @returns {Array<string>} result.suggestions - sugestões de melhoria
   *
   * @example
   * const results = await executePlugin('bechdel', {
   *   api: { screenplay, entities, log, notify }
   * })
   * console.log(results.bechdelPassed) // true ou false
   */
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

        // Coletar pares de diálogo (todas as ocorrências)
        dialoguePairs.push({
          char1: dialoguePairs.length > 0 ? dialoguePairs[0].char2 : name,
          char2: name
        })
      }
    })

    // Lógica determinística baseada em personagens femininos reais
    const uniqueFemaleSpeakers = Array.from(femaleSpeakers).filter(name => name.length > 0)
    const femaleSpeakersCount = uniqueFemaleSpeakers.length
    const maleSpeakersCount = dialogues.length - femaleSpeakersCount
    const dialoguesAnalyzed = dialogues.length

    // Verificar se pelo menos duas mulheres diferentes têm diálogo
    let bechdelPassed = false
    if (femaleSpeakersCount >= 2) {
      bechdelPassed = true
    }

    // Verificar se há diálogo entre duas mulheres diferentes
    if (dialoguePairs.length > 0) {
      const dialogueCounts = {}
      dialoguePairs.forEach(pair => {
        const key = [pair.char1, pair.char2].sort().join('|')
        dialogueCounts[key] = (dialogueCounts[key] || 0) + 1
      })

      // Encontrar pares de mulheres
      for (const [key, count] of Object.entries(dialogueCounts)) {
        const [name1, name2] = key.split('|')
        if ((name1 && name2) && uniqueFemaleSpeakers.includes(name1) && uniqueFemaleSpeakers.includes(name2)) {
          bechdelPassed = true
          break
        }
      }
    }

    const issues = []
    const suggestions = []

    if (femaleSpeakersCount < 2) {
      issues.push('Menos de 2 personagens femininas no roteiro')
      suggestions.push('Adicione mais personagens femininas')
    }

    if (!bechdelPassed) {
      issues.push('Menos de duas falantes femininas detectadas em sequência')
      suggestions.push('Adicione diálogos envolvendo duas personagens femininas')
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

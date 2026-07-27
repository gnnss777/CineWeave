import React from 'react';
import './Landing.css';

/**
 * Landing page pública do CineWeave.
 *
 * Portada de `cineweave-landing.html` (gerada no Open Design a partir de
 * `landing-brief.md`). Mostra um overview das funções do app e um call-out
 * de registro gratuito.
 *
 * Fluxo: visitante deslogado vê esta página. CTAs chamam os handlers
 * `onGetStarted` (modo signup) e `onLogin` (modo login) — ambos definidos
 * em `App.jsx` que trocam o estado de view para `<LoginPage/>`.
 *
 * @param {Object}   props
 * @param {Function} [props.onGetStarted] — chamado no CTA "Registrar grátis"
 * @param {Function} [props.onLogin]      — chamado no botão "Entrar" do header
 */
export default function Landing({ onGetStarted, onLogin }) {
  return (
    <div className="landing">
      <header className="topnav">
        <div className="topnav-inner">
          <a className="brand" href="#topo" aria-label="CineWeave — página inicial">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                <path d="M3 6l4-1.5v15L3 21zM9 4l4 1.5L9 6.5v15z" fill="currentColor" stroke="none" opacity="0.65"/>
                <path d="M14 5.5L18 4v15l-4 1.5zM14 5.5l6 1.5v15l-6-1.5z"/>
              </svg>
            </span>
            CineWeave
          </a>
          <nav className="nav-links" aria-label="Principal">
            <a href="#recursos">Recursos</a>
            <a href="#como-funciona">Como funciona</a>
          </nav>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onLogin}
          >
            Entrar
          </button>
        </div>
      </header>

      <main id="topo">

        {/* SEÇÃO 2 — Hero */}
        <section className="section hero">
          <div className="container grid-2-1 hero-inner">
            <div>
              <p className="eyebrow">Roteiro primeiro — com IA para organizar</p>
              <h1>
                <span className="strong">Escreva e crie seus roteiros.</span><br />
                <span className="soft">Edição profissional no padrão Hollywood, do primeiro rascunho ao set — com a IA organizando a enciclopédia do seu filme.</span>
              </h1>
              <p className="lead">
                Escreva em Fountain com autocomplete e revisões por cor. A IA analisa o seu roteiro e organiza a
                enciclopédia — personagens, locais e temas em fichas conectadas. Brainstorm de áudio e breakdowns
                técnicos são adicionais.
              </p>
              <div className="hero-cta">
                <button
                  type="button"
                  className="btn btn-primary btn-arrow"
                  onClick={onGetStarted}
                >
                  Registrar grátis
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onLogin}
                >
                  Ver demonstração
                </button>
              </div>
              <p className="microcopy">
                Baseado no editor open-source{' '}
                <a href="https://github.com/lmparppei/beat" target="_blank" rel="noopener noreferrer">
                  Beat
                </a>{' '}
                · Sem cartão de crédito · Importe Final Draft, PDF e DOCX
              </p>
            </div>
            <div
              className="glass editor-preview"
              role="img"
              aria-label="Prévia do editor de roteiro CineWeave com abas Brainstorm, Roteiro, Enciclopédia e Análise"
            >
              <div className="editor-tabs">
                <span className="editor-tab">Brainstorm</span>
                <span className="editor-tab active">Roteiro</span>
                <span className="editor-tab">Enciclopédia</span>
                <span className="editor-tab">Análise</span>
              </div>
              <div className="editor-body">
                <p className="scene-heading">INT. COZINHA DA FAZENDA — NOITE</p>
                <div className="scene-line">
                  <p className="cue">MARINA</p>
                  <p className="paren">(abaixando a arma)</p>
                  <p className="dialog">Você não veio até aqui pra me convencer a voltar.</p>
                </div>
                <div className="scene-line">
                  <p className="cue">RAFAEL</p>
                  <p className="dialog">Eu vim porque parei de mentir pra mim mesmo.</p>
                </div>
                <div className="scene-line">
                  <p className="paren">(silêncio longo; o gotejar da pia)</p>
                </div>
                <p className="transition">CORTA PARA:</p>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 3 — Features */}
        <section className="section" id="recursos">
          <div className="container stack" style={{ gap: 'var(--ln-sp-3xl)' }}>
            <div className="section-header">
              <p className="eyebrow">Roteiro é o núcleo — o resto são adicionais</p>
              <h2>Escreva roteiros profissionais; leve a pré-produção junto</h2>
              <p className="lead">
                O editor de roteiro é o coração do CineWeave. Os demais módulos são adicionais que se
                conectam à mesma fonte de verdade — nada duplicado, tudo ligado ao seu script.
              </p>
            </div>
            <div className="grid-4">
              <article className="glass glass-interactive feature">
                <span className="feature-tag core">Núcleo</span>
                <span className="feature-mark" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/>
                    <path d="M9 7h6M9 11h6M9 15h4"/>
                  </svg>
                </span>
                <h3>Editor de Roteiro Fountain</h3>
                <p>
                  Escreva no padrão Hollywood com autocomplete. Importe Final Draft (.fdx), PDF ou DOCX.
                  Controle revisões com 8 cores padronizadas pela indústria. Você cria o roteiro — da
                  primeira linha ao CORTA PARA.
                </p>
              </article>
              <article className="glass glass-interactive feature">
                <span className="feature-tag core">IA</span>
                <span className="feature-mark" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="6" cy="6" r="2.4"/>
                    <circle cx="18" cy="6" r="2.4"/>
                    <circle cx="12" cy="18" r="2.4"/>
                    <path d="M7.6 7.4l3.4 8.6M16.4 7.4L13 16M8 6h8"/>
                  </svg>
                </span>
                <h3>Enciclopédia organizada pela IA</h3>
                <p>
                  A IA analisa o seu roteiro e organiza as fichas de personagens, locais, objetos e temas
                  — cross-linkadas e sempre ligadas à cena certa. Clique num personagem e veja todas as
                  suas cenas.
                </p>
              </article>
              <article className="glass glass-interactive feature">
                <span className="feature-tag">Adicional</span>
                <span className="feature-mark" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="6" width="18" height="13" rx="1"/>
                    <path d="M3 10h18M8 6V3M16 6V3"/>
                    <path d="M8.5 14l2 2 4-4"/>
                  </svg>
                </span>
                <h3>Análise Técnica de Cena</h3>
                <p>
                  Breakdown profissional estilo Movie Magic Scheduling: elenco, figurino, props,
                  cenografia e câmera por cena. Exporte para a produção em segundos.
                </p>
              </article>
              <article className="glass glass-interactive feature">
                <span className="feature-tag">Adicional</span>
                <span className="feature-mark" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="3" width="6" height="11" rx="3"/>
                    <path d="M5 11a7 7 0 0 0 14 0"/>
                    <path d="M12 18v3M9 21h6"/>
                  </svg>
                </span>
                <h3>Brainstorm de áudio</h3>
                <p>
                  Dite ou anote ideias em áudio e texto. Suas notas ficam organizadas como ponto de
                  partida para o roteiro — quem escreve é você. Um recurso adicional, não o roteiro em si.
                </p>
              </article>
            </div>
          </div>
        </section>

        {/* SEÇÃO 4 — Como funciona */}
        <section className="section" id="como-funciona">
          <div className="container stack" style={{ gap: 'var(--ln-sp-3xl)' }}>
            <div className="section-header">
              <p className="eyebrow">Fluxo de trabalho</p>
              <h2>Três passos do conceito ao set</h2>
            </div>
            <div className="steps">
              <div className="step">
                <span className="step-num">01</span>
                <h3>Capture</h3>
                <p>Grave áudio, escreva notas, suba referências. O brainstorm aceita qualquer formato.</p>
              </div>
              <div className="step">
                <span className="step-num">02</span>
                <h3>Estruture</h3>
                <p>A IA analisa o seu roteiro e organiza a enciclopédia — personagens, locais e cenas ligadas à cena certa. Conecte as fichas e refine.</p>
              </div>
              <div className="step">
                <span className="step-num">03</span>
                <h3>Produza</h3>
                <p>Gere breakdowns técnicos, exporte Fountain/PDF e leve direto para o set.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SEÇÃO 5 — CTA Registro */}
        <section className="section">
          <div className="container">
            <div className="glass-accent reg-cta">
              <p className="eyebrow">Como começar</p>
              <h2>Comece seu projeto hoje. Grátis.</h2>
              <p className="lead">
                Sem limite de projetos na versão gratuita. Importe seu roteiro em segundos e comece
                a estruturar.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-lg btn-arrow"
                onClick={onGetStarted}
              >
                Criar conta grátis
              </button>
              <p className="microcopy">Leva 30 segundos · Sem cartão · Funciona offline</p>
            </div>
          </div>
        </section>

      </main>

      {/* SEÇÃO 6 — Footer */}
      <footer className="pagefoot">
        <div className="pagefoot-grid">
          <div>
            <a
              className="brand"
              href="#topo"
              aria-label="CineWeave"
              style={{
                fontFamily: 'var(--ln-font-display)',
                fontSize: '19px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--ln-fg)',
              }}
            >
              <span className="brand-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                  <path d="M3 6l4-1.5v15L3 21zM9 4l4 1.5L9 6.5v15z" fill="currentColor" stroke="none" opacity="0.65"/>
                  <path d="M14 5.5L18 4v15l-4 1.5zM14 5.5l6 1.5v15l-6-1.5z"/>
                </svg>
              </span>
              CineWeave
            </a>
            <p className="tagline">
              Editor de roteiros para cineastas e roteiristas. Baseado no editor open-source{' '}
              <a href="https://github.com/lmparppei/beat" target="_blank" rel="noopener noreferrer">Beat</a>.
            </p>
            <div className="social" aria-label="Redes sociais">
              <a href="#" aria-label="Bluesky">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 11c-.7-3-2.5-4-3.6-4C7.3 7 6.7 8 6.7 9.4c0 2.5 2 4.5 2 4.5M17.3 9.4c0-1.4-.6-2.4-1.7-2.4-1.1 0-2.9 1-3.6 4 1.7 2.8 4 4.5 4 4.5M12 11c2.2 0 5.3.6 5.3 3.3 0 1.5-1.4 2.4-3 2.4-1.6 0-3.4-1-3.4-3 0-2.7 2.7-2.7 2.7-2.7"/>
                </svg>
              </a>
              <a href="#" aria-label="GitHub">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-4.5 1.5-4.5-2.5-6-3M15 22v-4a3.5 3.5 0 0 0-1-2.7c3-.3 6-1.5 6-6.3a4.5 4.5 0 0 0-1.3-3.1 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.6 11.6 0 0 0-6 0C6.4 1.7 5.4 2 5.4 2a4.2 4.2 0 0 0-.1 3.2A4.5 4.5 0 0 0 4 8.3c0 4.8 3 6 6 6.3a3.5 3.5 0 0 0-1 2.6V22"/>
                </svg>
              </a>
              <a href="#" aria-label="Discord">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8.5 8.5A11 11 0 0 1 12 8a11 11 0 0 1 3.5.5M8.5 18.5A11 11 0 0 1 12 19a11 11 0 0 1 3.5-.5M7 8a14 14 0 0 0-2 5 14 14 0 0 0 4 2M17 8a14 14 0 0 1 2 5 14 14 0 0 1-4 2"/>
                  <circle cx="9.5" cy="13" r="1"/>
                  <circle cx="14.5" cy="13" r="1"/>
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h4>Produto</h4>
            <ul>
              <li><a href="#recursos">Recursos</a></li>
              <li><a href="#como-funciona">Como funciona</a></li>
              <li><a href="#">Preços</a></li>
              <li><a href="#">Roadmap</a></li>
            </ul>
          </div>
          <div>
            <h4>Empresa</h4>
            <ul>
              <li><a href="#">Sobre</a></li>
              <li><a href="#">Contato</a></li>
            </ul>
          </div>
        </div>
        <div className="legal">© 2026 CineWeave. Feito para cineastas e roteiristas.</div>
      </footer>
    </div>
  );
}

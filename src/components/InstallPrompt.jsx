import { useState, useEffect, useCallback } from 'react'

export default function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isIOS, setIsIOS] = useState(false)

  const checkAndShow = useCallback((promptEvent, delay = 0) => {
    if (!promptEvent) return
    setDeferredPrompt(promptEvent)
    setTimeout(() => setShow(true), delay)
  }, [])

  useEffect(() => {
    if (localStorage.getItem('pwa-install-dismissed')) return

    const isAlreadyInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    if (isAlreadyInstalled) return

    const ua = navigator.userAgent
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !window.MSStream

    if (isIOSDevice) {
      setIsIOS(true)
      const timer = setTimeout(() => setShow(true), 2000)
      return () => clearTimeout(timer)
    }

    // Use event captured early in index.html (before React mounted)
    if (window.__deferredPrompt) {
      checkAndShow(window.__deferredPrompt)
      return
    }

    // Fallback: listen for event (in case it fires after mount)
    const handler = (e) => {
      e.preventDefault()
      checkAndShow(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [checkAndShow])

  const handleInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      deferredPrompt.userChoice.finally(() => {
        setDeferredPrompt(null)
        setShow(false)
      })
    }
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      padding: '16px 20px 20px',
      background: 'rgba(10, 10, 10, 0.97)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderTop: '2px solid rgba(204, 238, 0, 0.25)',
      boxShadow: '0 -8px 30px rgba(0,0,0,0.6)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      animation: 'slideUp 0.3s ease-out',
    }}>
      {isIOS ? (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#ccee00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.5l-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z" />
              <path d="M9.5 2v2.5" />
              <path d="M12 13V8" />
              <path d="m9 11 3-3 3 3" />
            </svg>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>Instale o CineWeave</div>
              <div style={{ fontSize: '12px', color: '#a3a3a3', marginTop: '2px' }}>
                Toque em <strong style={{ color: '#ccee00' }}>Compartilhar</strong> <span style={{ color: '#a3a3a3' }}>→</span> <strong style={{ color: '#ccee00' }}>Adicionar à Tela de Início</strong>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleDismiss} style={{
              flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: '#a3a3a3', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
            }}>
              Agora não
            </button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#ccee00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: '#fff' }}>Instale o CineWeave</div>
              <div style={{ fontSize: '12px', color: '#a3a3a3', marginTop: '2px' }}>
                Instale como app para melhor experiência
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleDismiss} style={{
              flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: '#a3a3a3', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
            }}>
              Agora não
            </button>
            <button onClick={handleInstall} style={{
              flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, #ccee00, #b38542)', color: '#070709',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer'
            }}>
              Instalar App
            </button>
          </div>
        </>
      )}
    </div>
  )
}

import React, { useEffect, useState } from 'react';
import { Download, Monitor, Share2, Smartphone, X } from 'lucide-react';

const DISMISSED_KEY = 'trainly_device_notice_dismissed';

function getDeviceKind() {
  const userAgent = window.navigator.userAgent;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
  if (isStandalone) return null;

  const isIPadOs = window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1;
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent) || isIPadOs;
  const isIOSSafari = isIOS
    && /Safari/i.test(userAgent)
    && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(userAgent);
  if (isIOSSafari) return 'ios';
  if (/Android/i.test(userAgent)) return 'android';

  const isMobile = /Mobile|Tablet/i.test(userAgent) || window.matchMedia('(pointer: coarse)').matches;
  return isMobile ? null : 'desktop';
}

export default function DeviceExperienceNotice() {
  const [kind, setKind] = useState(null);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    if (window.sessionStorage.getItem(DISMISSED_KEY) !== 'true') {
      setKind(getDeviceKind());
    }

    const captureInstallPrompt = event => {
      event.preventDefault();
      setInstallPrompt(event);
      if (window.sessionStorage.getItem(DISMISSED_KEY) !== 'true') setKind('android');
    };
    const closeAfterInstall = () => setKind(null);

    window.addEventListener('beforeinstallprompt', captureInstallPrompt);
    window.addEventListener('appinstalled', closeAfterInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', captureInstallPrompt);
      window.removeEventListener('appinstalled', closeAfterInstall);
    };
  }, []);

  if (!kind) return null;

  const dismiss = () => {
    window.sessionStorage.setItem(DISMISSED_KEY, 'true');
    setKind(null);
  };

  const installAndroid = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === 'accepted') dismiss();
  };

  const content = kind === 'ios' ? {
    icon: <Share2 size={24} />,
    eyebrow: 'SAFARI SU IPHONE',
    title: 'Usa Trainly come un’app',
    description: 'Per avere più spazio durante l’allenamento, salva Trainly sulla schermata Home.',
    steps: <>Tocca <strong>Condividi</strong>, scegli <strong>Aggiungi alla schermata Home</strong>, attiva <strong>Apri come app web</strong> e premi <strong>Aggiungi</strong>.</>
  } : kind === 'android' ? {
    icon: <Download size={24} />,
    eyebrow: 'ANDROID',
    title: 'Installa Trainly',
    description: 'Aggiungi Trainly alla schermata Home per allenarti a schermo intero e accedervi più velocemente.',
    steps: installPrompt ? null : <>Apri il menu del browser e seleziona <strong>Installa app</strong> oppure <strong>Aggiungi a schermata Home</strong>.</>
  } : {
    icon: <Monitor size={24} />,
    eyebrow: 'VISUALIZZAZIONE DESKTOP',
    title: 'Trainly dà il meglio su mobile',
    description: 'L’app è progettata principalmente per accompagnarti durante l’allenamento. Ti consigliamo di aprirla da smartphone.',
    steps: <>Dal telefono visita questo stesso indirizzo per aprire una scheda condivisa o accedere all’area Personal Trainer.</>
  };

  return (
    <div className={`device-notice-overlay device-notice-overlay--${kind}`} role="presentation">
      <section className="device-notice" role="dialog" aria-modal="true" aria-labelledby="device-notice-title">
        <button className="device-notice-close" type="button" onClick={dismiss} aria-label="Chiudi suggerimento">
          <X size={19} />
        </button>
        <div className="device-notice-icon">{content.icon}</div>
        <span className="device-notice-eyebrow">{content.eyebrow}</span>
        <h2 id="device-notice-title">{content.title}</h2>
        <p>{content.description}</p>
        {content.steps && <div className="device-notice-steps"><Smartphone size={18} /> <span>{content.steps}</span></div>}
        {kind === 'android' && installPrompt && (
          <button className="device-notice-install" type="button" onClick={installAndroid}>
            <Download size={18} /> Installa ora
          </button>
        )}
        <button className="device-notice-later" type="button" onClick={dismiss}>
          {kind === 'desktop' ? 'Continua da desktop' : 'Non ora'}
        </button>
      </section>
    </div>
  );
}

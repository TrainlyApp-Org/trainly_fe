import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import LegalFooter from '../components/LegalFooter';

const LAST_UPDATED = '15 agosto 2026';
const OWNER = import.meta.env.VITE_LEGAL_OWNER || 'Piero De Lorenzis';
const CONTACT = import.meta.env.VITE_LEGAL_CONTACT_EMAIL || 'DA CONFIGURARE PRIMA DELLA PUBBLICAZIONE';

const pages = {
  privacy: {
    title: 'Informativa privacy',
    intro: 'Questa informativa descrive il trattamento dei dati personali effettuato tramite Trainly ai sensi del Regolamento (UE) 2016/679 (GDPR).',
    sections: [
      ['Titolare del trattamento', <p key="owner"><strong>{OWNER}</strong><br />Contatto privacy: <strong>{CONTACT}</strong></p>],
      ['Dati trattati', <ul key="data"><li>Dati dell’account: e-mail, username, nome e identificativo del profilo.</li><li>Dati inseriti nelle schede: esercizi, serie, ripetizioni, pesi e contenuti descrittivi.</li><li>Dati tecnici indispensabili al funzionamento e alla sicurezza, come token di sessione, log applicativi e indirizzo IP gestito dai fornitori infrastrutturali.</li><li>Dati di fatturazione e stato dell’abbonamento. I dati completi della carta sono trattati direttamente da Stripe e non vengono memorizzati da Trainly.</li></ul>],
      ['Finalità e basi giuridiche', <ul key="purposes"><li>Erogare account, schede e allenamenti: esecuzione del contratto o di misure precontrattuali.</li><li>Gestire abbonamenti e pagamenti: esecuzione del contratto e obblighi di legge.</li><li>Proteggere il servizio e prevenire abusi: legittimo interesse alla sicurezza.</li><li>Adempiere a obblighi fiscali, contabili o richieste dell’autorità: obbligo legale.</li></ul>],
      ['Destinatari e fornitori', <p key="providers">I dati possono essere trattati da fornitori necessari al servizio, in particolare Supabase per autenticazione e database, Stripe per pagamenti e abbonamenti, e dal fornitore che ospita frontend e backend. Alcuni fornitori possono trattare dati fuori dallo Spazio Economico Europeo applicando le garanzie previste dal GDPR.</p>],
      ['Conservazione', <p key="retention">I dati dell’account e delle schede sono conservati finché l’account rimane attivo e successivamente per il tempo strettamente necessario a cancellazione, sicurezza e obblighi di legge. I dati amministrativi relativi ai pagamenti sono conservati per i termini previsti dalla normativa fiscale. I log tecnici sono conservati per un periodo proporzionato alle esigenze di sicurezza.</p>],
      ['Schede condivise', <p key="shared">Chiunque possieda il codice o il link di una scheda condivisa può visualizzarla e modificarne i valori di peso e ripetizioni senza registrarsi. Il proprietario deve condividere il link solo con le persone autorizzate e non inserire dati sanitari, informazioni riservate o dati personali non necessari.</p>],
      ['Diritti', <p key="rights">Puoi chiedere accesso, rettifica, cancellazione, limitazione, portabilità e opposizione, ove applicabili, scrivendo al contatto indicato. Puoi inoltre proporre reclamo al Garante per la protezione dei dati personali. La cancellazione dell’account comporta anche la cancellazione dell’eventuale abbonamento Stripe, fermo restando quanto debba essere conservato per legge.</p>],
      ['Natura del conferimento', <p key="required">I dati contrassegnati come obbligatori sono necessari per creare e utilizzare l’account. In mancanza non sarà possibile fornire il servizio.</p>],
    ],
  },
  cookies: {
    title: 'Informativa cookie e memoria locale',
    intro: 'Trainly utilizza esclusivamente tecnologie tecniche necessarie al funzionamento e alla sicurezza dell’applicazione.',
    sections: [
      ['Tecnologie utilizzate', <p key="tech">L’app salva nella memoria locale del dispositivo token di autenticazione, informazioni essenziali della sessione e preferenze tecniche. Questi dati permettono di mantenere l’accesso, rinnovare in sicurezza la sessione e offrire il funzionamento PWA.</p>],
      ['Cookie non tecnici', <p key="none">Attualmente Trainly non utilizza cookie pubblicitari, di profilazione o analytics non tecnici. Per questo non viene richiesto un consenso tramite banner. L’informativa resta comunque disponibile come previsto per gli strumenti tecnici.</p>],
      ['Servizi esterni', <p key="external">Quando scegli di abbonarti vieni trasferito sulle pagine Stripe, che applica la propria informativa e può utilizzare tecnologie necessarie al pagamento e alla prevenzione delle frodi. I collegamenti esterni sono soggetti alle regole del relativo fornitore.</p>],
      ['Gestione e cancellazione', <p key="manage">Puoi eliminare i dati locali dalle impostazioni del browser o rimuovendo i dati della PWA. La cancellazione può terminare la sessione e richiedere un nuovo accesso.</p>],
      ['Modifiche future', <p key="changes">Se verranno introdotti strumenti non tecnici, questa informativa sarà aggiornata e, quando richiesto, tali strumenti resteranno disattivati fino al consenso dell’utente.</p>],
    ],
  },
  terms: {
    title: 'Termini e condizioni',
    intro: 'Questi termini regolano l’utilizzo di Trainly e dell’abbonamento Premium. Creando un account dichiari di averli letti e accettati.',
    sections: [
      ['Requisiti', <p key="age">La creazione di un account e la sottoscrizione di Premium sono riservate a persone che abbiano compiuto 18 anni. Le schede pubbliche possono essere consultate senza account; un minorenne deve utilizzarle esclusivamente con la supervisione di un genitore, tutore o professionista qualificato.</p>],
      ['Servizio', <p key="service">Trainly permette ai Personal Trainer di creare e condividere schede e agli utenti di consultarle e registrare pesi e ripetizioni. Il servizio non fornisce diagnosi, prescrizioni mediche o assistenza di emergenza.</p>],
      ['Account e sicurezza', <p key="account">Devi fornire informazioni corrette, custodire le credenziali e segnalare accessi non autorizzati. Sei responsabile dei contenuti che inserisci e dei link di condivisione che distribuisci.</p>],
      ['Schede condivise', <p key="sharing">Una scheda pubblicata tramite codice o link è accessibile senza autenticazione. Chi possiede il link può visualizzarla e modificare i valori condivisi di peso e ripetizioni. Il proprietario accetta questo funzionamento e deve creare e distribuire un link distinto quando vuole separare i dati dei diversi clienti.</p>],
      ['Trainly Premium', <p key="premium">Il prezzo addebitato per Premium è <strong>4,99 € al mese</strong>. L’abbonamento si rinnova automaticamente ogni mese fino alla cancellazione. Eventuali variazioni saranno comunicate prima che diventino efficaci. Pagamento e gestione sono effettuati tramite Stripe.</p>],
      ['Cancellazione e recesso', <p key="cancel">Puoi disattivare il rinnovo dalla gestione abbonamento; l’accesso Premium resta normalmente disponibile fino alla fine del periodo già pagato. Per i contratti a distanza può applicarsi il diritto di recesso entro 14 giorni, salvo le eccezioni previste per servizi o contenuti digitali iniziati con consenso espresso. Per esercitarlo contatta il titolare. Eliminando l’account, l’abbonamento Stripe attivo viene cancellato immediatamente.</p>],
      ['Uso consentito', <p key="conduct">Non puoi usare Trainly per attività illecite, tentare accessi non autorizzati, interferire con il servizio, distribuire malware o pubblicare contenuti che violino diritti altrui. Il servizio può limitare o sospendere account in caso di abuso o necessità di sicurezza.</p>],
      ['Disponibilità e responsabilità', <p key="availability">Il servizio può subire manutenzioni o interruzioni. Nei limiti consentiti dalla legge, Trainly non risponde di danni derivanti da uso improprio, programmi di allenamento creati da terzi o inosservanza delle avvertenze di sicurezza. Restano impregiudicati i diritti inderogabili del consumatore.</p>],
      ['Legge applicabile', <p key="law">Si applica la legge italiana, fatti salvi i diritti inderogabili riconosciuti al consumatore dal Paese in cui risiede. Per assistenza o reclami puoi usare il contatto indicato nell’informativa privacy.</p>],
    ],
  },
  disclaimer: {
    title: 'Avvertenze per la sicurezza',
    intro: 'Trainly è uno strumento organizzativo per allenamenti e non sostituisce un medico, fisioterapista o professionista qualificato.',
    sections: [
      ['Prima di allenarti', <p key="before">Chiedi il parere di un medico prima di iniziare o modificare un programma, soprattutto in presenza di patologie, gravidanza, infortuni, sintomi, terapie o dubbi sulla tua idoneità fisica.</p>],
      ['Durante l’allenamento', <p key="during">Usa carichi e tecniche adeguati alla tua esperienza. Interrompi immediatamente l’attività in caso di dolore, capogiri, difficoltà respiratoria, dolore toracico o altri sintomi anomali e, se necessario, contatta i servizi di emergenza.</p>],
      ['Contenuti dei Personal Trainer', <p key="trainer">Le schede sono create dagli utenti e non sono validate automaticamente da Trainly. Il professionista che prepara la scheda è responsabile di valutarne adeguatezza e personalizzazione per il destinatario.</p>],
      ['Minorenni', <p key="minors">I minorenni non possono creare un account o acquistare Premium. Possono consultare una scheda pubblica soltanto sotto la supervisione di un genitore, tutore o professionista qualificato.</p>],
      ['Emergenze', <p key="emergency">Trainly non è un servizio medico né di emergenza. In caso di emergenza chiama immediatamente il numero unico 112 o il servizio competente nel luogo in cui ti trovi.</p>],
    ],
  },
};

export default function LegalPage() {
  const { document } = useParams();
  const navigate = useNavigate();
  const page = pages[document];

  if (!page) return <div className="legal-page"><p>Documento non disponibile.</p><Link to="/">Torna alla home</Link></div>;

  return (
    <main className="legal-page">
      <header className="legal-page-header">
        <button type="button" className="button-circle" onClick={() => navigate(-1)} aria-label="Torna indietro"><ArrowLeft size={20} /></button>
        <div><h1>{page.title}</h1><p>Aggiornata il {LAST_UPDATED}</p></div>
      </header>
      <div className="legal-document">
        <p className="legal-intro">{page.intro}</p>
        {CONTACT.startsWith('DA CONFIGURARE') && <aside className="legal-warning"><strong>Configurazione necessaria:</strong> imposta <code>VITE_LEGAL_CONTACT_EMAIL</code> con un indirizzo valido prima di pubblicare l’app.</aside>}
        {page.sections.map(([title, content]) => <section key={title}><h2>{title}</h2>{content}</section>)}
        <p className="legal-version">Versione documento: 1.0</p>
      </div>
      <LegalFooter />
    </main>
  );
}

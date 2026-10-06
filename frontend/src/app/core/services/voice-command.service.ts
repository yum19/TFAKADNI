import { Injectable, NgZone, effect } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { SessionService } from './session.service';
import { AuthService } from './auth.service';

export interface VoiceCommand {
  keywords: string[];
  action: () => void;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class VoiceCommandService {

  private recognition: any = null;
  isListening = false;
  lastCommand = '';
  transcript = '';

  onCommand = new Subject<string>();
  onTranscript = new Subject<string>();
  onError = new Subject<string>();

  private commands: VoiceCommand[] = [];

  constructor(private router: Router, private zone: NgZone, private sessionService: SessionService, private authService: AuthService) {
    this.initRecognition();
    
    // Watch for user changes to ensure commands stay in sync
    effect(() => {
      const user = this.authService.currentUser();
      // This effect ensures the service reacts to user changes
      // The commands are determined dynamically in processCommand(), so this just ensures reactivity
    });

    // Also subscribe to session changes as a backup
    this.sessionService.auth$.subscribe(() => {
      // Ensure we're aware of auth changes
    });
  }

  private getRoleBasedRoute(baseRoute: string): string {
    const role = this.authService.currentUser()?.role;
    switch (role) {
      case 'ADMIN':
        return baseRoute.replace('/app/', '/admin/');
      case 'PARTNER':
        return baseRoute.replace('/app/', '/partner/');
      case 'USER':
      default:
        return baseRoute.replace('/app/', '/mother/');
    }
  }

  registerCommands(cmds: VoiceCommand[]): void {
    this.commands = [...this.commands, ...cmds];
  }

  // Method to force refresh of commands (useful for debugging or manual updates)
  refreshCommands(): void {
    // This method can be called to ensure commands are up to date
    console.log('VoiceCommandService: Commands refreshed for user role:', this.authService.currentUser()?.role);
  }

  private initRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition
                           || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'fr-FR';
    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event: any) => {
      this.zone.run(() => {
        const transcript = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('').toLowerCase().trim();
        this.transcript = transcript;
        this.onTranscript.next(transcript);

        if (event.results[0].isFinal) {
          this.processCommand(transcript);
        }
      });
    };

    this.recognition.onend = () => {
      this.zone.run(() => { this.isListening = false; });
    };

    this.recognition.onerror = (event: any) => {
      this.zone.run(() => {
        this.isListening = false;
        if (event.error !== 'no-speech')
          this.onError.next('Erreur microphone : ' + event.error);
      });
    };
  }

  toggleListening(): void {
    if (!this.recognition) { this.onError.next('Microphone non supporté par ce navigateur.'); return; }
    if (this.isListening) { this.recognition.stop(); this.isListening = false; }
    else { this.recognition.start(); this.isListening = true; this.transcript = ''; }
  }

  private processCommand(text: string): void {
    const user = this.authService.currentUser();
    const role = user?.role || 'USER';

    let roleCommands: VoiceCommand[] = [];

    switch (role) {
      case 'ADMIN':
        roleCommands = [
          { keywords: ['dashboard', 'accueil', 'tableau de bord', 'aller au dashboard', 'ouvre dashboard', 'va au dashboard'],
            action: () => this.router.navigate(['/admin/dashboard']),
            description: 'Dashboard' },
          { keywords: ['utilisateurs', 'users', 'gestion utilisateurs', 'aller aux utilisateurs', 'ouvre utilisateurs', 'va aux utilisateurs'],
            action: () => this.router.navigate(['/admin/users']),
            description: 'Utilisateurs' },
          { keywords: ['plans', 'gestion des plans', 'aller aux plans', 'ouvre plans', 'va aux plans'],
            action: () => this.router.navigate(['/admin/plans']),
            description: 'Plans' },
          { keywords: ['promotions', 'promo', 'codes promo', 'aller aux promotions', 'ouvre promotions', 'va aux promotions'],
            action: () => this.router.navigate(['/admin/promos']),
            description: 'Promotions' },
          { keywords: ['rapports', 'statistiques', 'reports', 'aller aux rapports', 'ouvre rapports', 'va aux rapports'],
            action: () => this.router.navigate(['/admin/reports']),
            description: 'Rapports' },
          { keywords: ['paramètres', 'settings', 'parametres', 'aller aux paramètres', 'ouvre paramètres', 'va aux paramètres'],
            action: () => this.router.navigate(['/admin/settings']),
            description: 'Paramètres' },
          { keywords: ['cours', 'courses', 'gestion des cours', 'aller aux cours', 'ouvre cours', 'va aux cours'],
            action: () => this.router.navigate(['/admin/courses']),
            description: 'Cours' },
          { keywords: ['guides', 'guides médicaux', 'aller aux guides', 'ouvre guides', 'va aux guides'],
            action: () => this.router.navigate(['/admin/guides']),
            description: 'Guides' },
          { keywords: ['profil', 'mon profil', 'aller au profil', 'ouvre profil', 'va au profil'],
            action: () => this.router.navigate(['/admin/profile']),
            description: 'Profil' },
        ];
        break;

      case 'PARTNER':
        roleCommands = [
          { keywords: ['dashboard', 'accueil', 'tableau de bord', 'aller au dashboard', 'ouvre dashboard', 'va au dashboard'],
            action: () => this.router.navigate(['/partner/home']),
            description: 'Dashboard' },
          { keywords: ['invitations', 'invites', 'centre d\'invitations', 'aller aux invitations', 'ouvre invitations', 'va aux invitations'],
            action: () => this.router.navigate(['/partner/invites']),
            description: 'Invitations' },
          { keywords: ['notifications', 'notif', 'aller aux notifications', 'ouvre notifications', 'va aux notifications'],
            action: () => this.router.navigate(['/partner/notifications']),
            description: 'Notifications' },
          { keywords: ['notes', 'mes notes', 'aller aux notes', 'ouvre notes', 'va aux notes'],
            action: () => this.router.navigate(['/partner/notes']),
            description: 'Notes' },
          { keywords: ['guides', 'guides médicaux', 'aller aux guides', 'ouvre guides', 'va aux guides'],
            action: () => this.router.navigate(['/partner/guides']),
            description: 'Guides' },
          { keywords: ['assistant ia', 'assistant', 'ia', 'aller à l\'assistant', 'ouvre assistant', 'va à l\'assistant'],
            action: () => this.router.navigate(['/partner/ai']),
            description: 'Assistant IA' },
          { keywords: ['grossesse', 'suivi grossesse', 'pregnancy', 'aller à grossesse', 'ouvre grossesse', 'va à grossesse'],
            action: () => this.router.navigate(['/partner/pregnancy']),
            description: 'Grossesse' },
          { keywords: ['examens', 'examens médicaux', 'exams', 'aller aux examens', 'ouvre examens', 'va aux examens'],
            action: () => this.router.navigate(['/partner/exams']),
            description: 'Examens' },
          { keywords: ['fœtal', 'foetal', 'développement fœtal', 'fetal', 'aller au fœtal', 'ouvre fœtal', 'va au fœtal'],
            action: () => this.router.navigate(['/partner/fetal']),
            description: 'Fœtal' },
        ];
        break;

      case 'USER':
      default:
        roleCommands = [
          { keywords: ['dashboard', 'accueil', 'tableau de bord', 'aller au dashboard', 'ouvre dashboard', 'va au dashboard'],
            action: () => this.router.navigate(['/mother/home']),
            description: 'Dashboard' },
          { keywords: ['profil', 'mon profil', 'aller au profil', 'ouvre profil', 'va au profil'],
            action: () => this.router.navigate(['/mother/profile']),
            description: 'Profil' },
          { keywords: ['profil santé', 'profil sante', 'health profile', 'aller au profil santé', 'ouvre profil santé', 'va au profil santé'],
            action: () => this.router.navigate(['/mother/health-profile']),
            description: 'Profil Santé' },
          { keywords: ['abonnement', 'subscription', 'aller à l\'abonnement', 'ouvre abonnement', 'va à l\'abonnement'],
            action: () => this.router.navigate(['/mother/subscription']),
            description: 'Abonnement' },
          { keywords: ['assistant ia', 'assistant', 'ia', 'aller à l\'assistant', 'ouvre assistant', 'va à l\'assistant'],
            action: () => this.router.navigate(['/mother/ai-health']),
            description: 'Assistant IA' },
          { keywords: ['maternités', 'maternité', 'maternite', 'maternites', 'clinique', 'hôpital', 'aller aux maternités', 'ouvre maternités', 'va aux maternités'],
            action: () => this.router.navigate(['/mother/maternities']),
            description: 'Maternités' },
          { keywords: ['carte médicale', 'carte medicale', 'carte', 'aller à la carte', 'ouvre carte', 'va à la carte'],
            action: () => this.router.navigate(['/mother/medical-card']),
            description: 'Carte Médicale' },
          { keywords: ['émotions', 'émotion', 'emotion', 'emotions', 'emotions ia', 'émotions ia', 'aller aux émotions', 'ouvre émotions', 'va aux émotions'],
            action: () => this.router.navigate(['/mother/emotion-detector']),
            description: 'Émotions IA' },
          { keywords: ['grossesse', 'suivi grossesse', 'pregnancy', 'aller à grossesse', 'ouvre grossesse', 'va à grossesse'],
            action: () => this.router.navigate(['/mother/pregnancy']),
            description: 'Grossesse' },
          { keywords: ['examens', 'examens médicaux', 'exams', 'aller aux examens', 'ouvre examens', 'va aux examens'],
            action: () => this.router.navigate(['/mother/exams']),
            description: 'Examens' },
          { keywords: ['fœtal', 'foetal', 'développement fœtal', 'fetal', 'aller au fœtal', 'ouvre fœtal', 'va au fœtal'],
            action: () => this.router.navigate(['/mother/fetal']),
            description: 'Fœtal' },
          { keywords: ['constantes', 'constantes vitales', 'vitals', 'aller aux constantes', 'ouvre constantes', 'va aux constantes'],
            action: () => this.router.navigate(['/mother/vitals']),
            description: 'Constantes' },
          { keywords: ['alertes', 'alertes médicales', 'alerts', 'aller aux alertes', 'ouvre alertes', 'va aux alertes'],
            action: () => this.router.navigate(['/mother/alerts']),
            description: 'Alertes' },
          { keywords: ['cours', 'courses', 'cours de grossesse', 'aller aux cours', 'ouvre cours', 'va aux cours'],
            action: () => this.router.navigate(['/mother/courses']),
            description: 'Cours' },
          { keywords: ['recommandations', 'recommendations', 'aller aux recommandations', 'ouvre recommandations', 'va aux recommandations'],
            action: () => this.router.navigate(['/mother/recommendations']),
            description: 'Recommandations' },
        ];
        break;
    }

    const defaultCommands: VoiceCommand[] = [
      { keywords: ['retour', 'précédent', 'revenir', 'retourne', 'revient', 'aller en arrière', 'retourner'],
        action: () => window.history.back(),
        description: 'Retour' },
    ];

    const allCommands = [...roleCommands, ...defaultCommands, ...this.commands];

    // More flexible matching: check if any keyword is contained in the text
    // Also check for partial matches and common variations
    for (const cmd of allCommands) {
      const matched = cmd.keywords.some(keyword => {
        // Exact match
        if (text.includes(keyword)) return true;

        // Check if text contains the core word (remove common prefixes/suffixes)
        const coreWords = keyword.split(' ').filter(word => word.length > 2);
        return coreWords.some(word => text.includes(word));
      });

      if (matched) {
        this.lastCommand = cmd.description;
        this.onCommand.next(cmd.description);
        cmd.action();
        return;
      }
    }

    this.lastCommand = '';
    this.onCommand.next('Commande non reconnue : "' + text + '"');
  }

  get isSupported(): boolean {
    return !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition;
  }
}
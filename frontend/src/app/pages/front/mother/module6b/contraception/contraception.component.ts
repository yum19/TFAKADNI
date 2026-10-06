import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { forkJoin } from 'rxjs';
import {
  ContraceptionChatMessageResponseDto,
  ContraceptionService
} from '../../../../../core/services/module6b/contraception.service';
import { AppLang, LocalTranslateService } from '../../../../../core/services/local-translate.service';

interface UiTexts {
  kicker: string;
  pageTitle: string;
  pageDescription: string;
  methodsTitle: string;
  methodsDescription: string;
  helperLabel: string;
  chatTitle: string;
  chatSubtitle: string;
  choiceTitle: string;
  choiceDescription: string;
  startNewSession: string;
  previousSessions: string;
  noPreviousSessions: string;
  sessions: string;
  newSession: string;
  firstQuestion: string;
  you: string;
  assistant: string;
  editPlaceholder: string;
  save: string;
  cancel: string;
  inputPlaceholder: string;
  previousConversation: string;
  sessionWord: string;
  translating: string;
}

@Component({
  selector: 'app-contraception',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './contraception.component.html',
  styleUrls: ['./contraception.component.css']
})
export class ContraceptionComponent implements OnInit, OnDestroy {
  loadingChat = false;
  loadingTranslations = false;

  currentLang: AppLang = 'en';
  readonly baseLang: AppLang = 'en';

  allChatHistory: ContraceptionChatMessageResponseDto[] = [];
  chatMessages: ContraceptionChatMessageResponseDto[] = [];

  currentSessionId = '';
  chatInput = '';

  showChatWidget = false;
  showSessionChoice = true;

  editingMessageId: number | null = null;
  editingText = '';

  uiTexts: UiTexts = {
    kicker: 'Women wellness',
    pageTitle: 'Understand contraception with clarity and confidence',
    pageDescription: 'Explore essential information about contraception, discover common methods, and get gentle support whenever you need help making sense of your options.',
    methodsTitle: 'Popular contraception methods',
    methodsDescription: 'Quick overview of some commonly used options',
    helperLabel: 'Do you need help in contraception?',
    chatTitle: 'AI Contraception Help',
    chatSubtitle: 'Soft guidance, session by session',
    choiceTitle: 'How would you like to continue?',
    choiceDescription: 'Select a previous session or begin a new conversation.',
    startNewSession: 'Start a new session',
    previousSessions: 'Previous sessions',
    noPreviousSessions: 'No previous sessions yet.',
    sessions: 'Sessions',
    newSession: 'New session',
    firstQuestion: 'Ask your first question about contraception.',
    you: 'You',
    assistant: 'Assistant',
    editPlaceholder: 'Edit your message...',
    save: 'Save',
    cancel: 'Cancel',
    inputPlaceholder: 'Write your question here...',
    previousConversation: 'Previous conversation',
    sessionWord: 'Session',
    translating: 'Translating...'
  };

  methodOptions = [
    { name: 'Pill', icon: 'medication' },
    { name: 'IUD', icon: 'device_hub' },
    { name: 'Condom', icon: 'health_and_safety' },
    { name: 'Implant', icon: 'vaccines' },
    { name: 'Injection', icon: 'monitor_heart' },
    { name: 'Vaginal ring', icon: 'radio_button_checked' }
  ];

  infoCards = [
    {
      icon: 'info',
      title: 'What is contraception?',
      text: 'Contraception includes methods that help prevent pregnancy and support women in planning the timing that feels right for them.'
    },
    {
      icon: 'favorite',
      title: 'Postpartum support',
      text: 'After childbirth, contraception choices may depend on breastfeeding, recovery, comfort, and your medical history.'
    },
    {
      icon: 'shield',
      title: 'Safe choices matter',
      text: 'Each method has different benefits, duration, and possible side effects, so a personalized choice is always better.'
    }
  ];

  methodDetails = [
    {
      title: 'Birth control pill',
      subtitle: 'Daily hormonal method',
      icon: 'medication',
      text: 'A common and effective option when taken regularly. It may not be the best choice for everyone, especially depending on postpartum timing and medical history.'
    },
    {
      title: 'IUD',
      subtitle: 'Long-term protection',
      icon: 'device_hub',
      text: 'A long-acting method placed by a healthcare professional. It can be hormonal or non-hormonal and is often chosen for convenience.'
    },
    {
      title: 'Condom',
      subtitle: 'Simple and accessible',
      icon: 'health_and_safety',
      text: 'A non-hormonal option that also helps protect against infections. It is easy to use and widely available.'
    },
    {
      title: 'Implant',
      subtitle: 'Discrete and long-lasting',
      icon: 'vaccines',
      text: 'A small device placed under the skin that offers long-term pregnancy prevention with minimal daily effort.'
    }
  ];

  private readonly baseUiTexts: UiTexts = { ...this.uiTexts };
  private readonly baseMethodOptions = this.methodOptions.map(item => ({ ...item }));
  private readonly baseInfoCards = this.infoCards.map(item => ({ ...item }));
  private readonly baseMethodDetails = this.methodDetails.map(item => ({ ...item }));

  private readonly languageChangeHandler = (event: Event) => {
    const customEvent = event as CustomEvent<AppLang>;
    const lang = customEvent.detail || 'en';
    this.changeLanguage(lang);
  };

  constructor(
    private contraceptionService: ContraceptionService,
    private localTranslateService: LocalTranslateService
  ) {}

  ngOnInit(): void {
    this.loadChatHistory();

    const savedLang = (localStorage.getItem('app-lang') as AppLang) || 'en';
    this.changeLanguage(savedLang);

    window.addEventListener('app-language-changed', this.languageChangeHandler as EventListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('app-language-changed', this.languageChangeHandler as EventListener);
  }

  get groupedSessions(): string[] {
    const ids = this.allChatHistory
      .map(message => message.sessionId)
      .filter((id): id is string => !!id);

    return [...new Set(ids)].reverse();
  }

  changeLanguage(lang: AppLang): void {
    this.currentLang = lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    if (lang === this.baseLang) {
      this.resetBaseTexts();
      return;
    }

    this.loadingTranslations = true;

    const uiArray = Object.values(this.baseUiTexts);
    const infoArray = this.baseInfoCards.flatMap(card => [card.title, card.text]);
    const methodsArray = this.baseMethodOptions.map(item => item.name);
    const detailsArray = this.baseMethodDetails.flatMap(item => [item.title, item.subtitle, item.text]);

    forkJoin({
      ui: this.localTranslateService.translateMany(uiArray, this.baseLang, lang),
      info: this.localTranslateService.translateMany(infoArray, this.baseLang, lang),
      methods: this.localTranslateService.translateMany(methodsArray, this.baseLang, lang),
      details: this.localTranslateService.translateMany(detailsArray, this.baseLang, lang)
    }).subscribe({
      next: ({ ui, info, methods, details }) => {
        this.uiTexts = {
          kicker: ui[0],
          pageTitle: ui[1],
          pageDescription: ui[2],
          methodsTitle: ui[3],
          methodsDescription: ui[4],
          helperLabel: ui[5],
          chatTitle: ui[6],
          chatSubtitle: ui[7],
          choiceTitle: ui[8],
          choiceDescription: ui[9],
          startNewSession: ui[10],
          previousSessions: ui[11],
          noPreviousSessions: ui[12],
          sessions: ui[13],
          newSession: ui[14],
          firstQuestion: ui[15],
          you: ui[16],
          assistant: ui[17],
          editPlaceholder: ui[18],
          save: ui[19],
          cancel: ui[20],
          inputPlaceholder: ui[21],
          previousConversation: ui[22],
          sessionWord: ui[23],
          translating: ui[24]
        };

        this.infoCards = this.baseInfoCards.map((card, index) => ({
          ...card,
          title: info[index * 2],
          text: info[index * 2 + 1]
        }));

        this.methodOptions = this.baseMethodOptions.map((item, index) => ({
          ...item,
          name: methods[index]
        }));

        this.methodDetails = this.baseMethodDetails.map((item, index) => ({
          ...item,
          title: details[index * 3],
          subtitle: details[index * 3 + 1],
          text: details[index * 3 + 2]
        }));

        this.loadingTranslations = false;
      },
      error: (err) => {
        console.error('Translation error', err);
        this.loadingTranslations = false;
      }
    });
  }

  private resetBaseTexts(): void {
    this.uiTexts = { ...this.baseUiTexts };
    this.infoCards = this.baseInfoCards.map(item => ({ ...item }));
    this.methodOptions = this.baseMethodOptions.map(item => ({ ...item }));
    this.methodDetails = this.baseMethodDetails.map(item => ({ ...item }));
    this.loadingTranslations = false;
  }

  getTranslationPopupTitle(): string {
    switch (this.currentLang) {
      case 'fr':
        return 'Traduction en cours';
      case 'ar':
        return 'الترجمة قيد التقدم';
      default:
        return 'Translation in progress';
    }
  }

  getTranslationPopupMessage(): string {
    switch (this.currentLang) {
      case 'fr':
        return "S'il te plaît, attends jusqu'à ce que nous finissions la traduction.";
      case 'ar':
        return 'يرجى الانتظار حتى ننتهي من الترجمة.';
      default:
        return 'Please wait until we finish the translation.';
    }
  }

  openChatWidget(): void {
    this.showChatWidget = true;
    this.showSessionChoice = true;
  }

  closeChatWidget(): void {
    this.showChatWidget = false;
    this.cancelEdit();
  }

  chooseNewSession(): void {
    this.currentSessionId = '';
    this.chatMessages = [];
    this.chatInput = '';
    this.showSessionChoice = false;
    this.cancelEdit();
  }

  chooseExistingSession(sessionId: string): void {
    this.currentSessionId = sessionId;
    this.showSessionChoice = false;
    this.cancelEdit();
    this.loadChatSession(sessionId);
  }

  backToSessionChoice(): void {
    this.showSessionChoice = true;
    this.cancelEdit();
  }

  sendMessage(): void {
    const message = this.chatInput.trim();
    if (!message || this.loadingChat) return;

    this.loadingChat = true;

    const draftMessage: ContraceptionChatMessageResponseDto = {
      id: Date.now(),
      motherId: 0,
      role: 'USER',
      content: message,
      sessionId: this.currentSessionId || 'pending',
      createdAt: new Date().toISOString()
    };

    this.chatMessages = [...this.chatMessages, draftMessage];
    this.chatInput = '';

    this.contraceptionService.sendChatMessage({
      message,
      sessionId: this.currentSessionId || undefined
    }).subscribe({
      next: (response) => {
        this.currentSessionId = response.sessionId;
        this.showSessionChoice = false;
        this.loadChatSession(response.sessionId);
        this.loadChatHistory();
        this.loadingChat = false;
      },
      error: (err) => {
        console.error('Chat error', err);
        this.chatMessages = this.chatMessages.filter(m => m.id !== draftMessage.id);
        this.loadingChat = false;
      }
    });
  }

  loadChatHistory(): void {
    this.contraceptionService.getChatHistory().subscribe({
      next: (res) => {
        this.allChatHistory = res;
      },
      error: (err) => console.error('Chat history error', err)
    });
  }

  loadChatSession(sessionId: string): void {
    this.currentSessionId = sessionId;
    this.contraceptionService.getChatSession(sessionId).subscribe({
      next: (res) => {
        this.chatMessages = res;
      },
      error: (err) => console.error('Chat session error', err)
    });
  }

  deleteMessage(messageId: number): void {
    this.contraceptionService.deleteChatMessage(messageId).subscribe({
      next: () => {
        this.chatMessages = this.chatMessages.filter(msg => msg.id !== messageId);
        this.allChatHistory = this.allChatHistory.filter(msg => msg.id !== messageId);

        const stillHasMessages = this.chatMessages.some(
          msg => msg.sessionId === this.currentSessionId
        );

        if (!stillHasMessages) {
          this.showSessionChoice = true;
          this.currentSessionId = '';
        }
      },
      error: (err) => console.error('Delete message error', err)
    });
  }

  deleteSession(sessionId: string): void {
    const sessionMessages = this.allChatHistory.filter(msg => msg.sessionId === sessionId);

    if (!sessionMessages.length) return;

    sessionMessages.forEach(msg => {
      this.contraceptionService.deleteChatMessage(msg.id).subscribe({
        error: (err) => console.error('Delete session message error', err)
      });
    });

    this.allChatHistory = this.allChatHistory.filter(msg => msg.sessionId !== sessionId);

    if (this.currentSessionId === sessionId) {
      this.currentSessionId = '';
      this.chatMessages = [];
      this.showSessionChoice = true;
      this.cancelEdit();
    }
  }

  startEdit(message: ContraceptionChatMessageResponseDto): void {
    if (message.role?.toUpperCase() !== 'USER') return;

    this.editingMessageId = message.id;
    this.editingText = message.content;
  }

  cancelEdit(): void {
    this.editingMessageId = null;
    this.editingText = '';
  }

  saveEdit(message: ContraceptionChatMessageResponseDto): void {
    const updatedText = this.editingText.trim();
    if (!updatedText || this.loadingChat) return;

    this.loadingChat = true;

    const editedIndex = this.chatMessages.findIndex(m => m.id === message.id);

    if (editedIndex === -1) {
      this.loadingChat = false;
      this.cancelEdit();
      return;
    }

    const messagesToDelete = this.chatMessages.slice(editedIndex);

    messagesToDelete.forEach(msg => {
      this.contraceptionService.deleteChatMessage(msg.id).subscribe({
        error: (err) => console.error('Delete following message error', err)
      });
    });

    this.chatMessages = this.chatMessages.slice(0, editedIndex);
    this.allChatHistory = this.allChatHistory.filter(msg => {
      if (msg.sessionId !== this.currentSessionId) return true;
      return !messagesToDelete.some(deleted => deleted.id === msg.id);
    });

    this.cancelEdit();

    this.contraceptionService.sendChatMessage({
      message: updatedText,
      sessionId: this.currentSessionId
    }).subscribe({
      next: () => {
        this.loadChatSession(this.currentSessionId);
        this.loadChatHistory();
        this.loadingChat = false;
      },
      error: (err) => {
        console.error('Regenerate AI response error', err);
        this.loadingChat = false;
      }
    });
  }

  formatDateTime(date?: string): string {
    if (!date) return '-';

    const locale =
      this.currentLang === 'fr' ? 'fr-FR' :
      this.currentLang === 'ar' ? 'ar-EG' :
      'en-US';

    return new Date(date).toLocaleString(locale);
  }

  getSessionPreview(sessionId: string): string {
    const sessionMessages = this.allChatHistory.filter(m => m.sessionId === sessionId);
    const firstUserMessage = sessionMessages.find(m => m.role?.toUpperCase() === 'USER');
    return firstUserMessage?.content || this.uiTexts.previousConversation;
  }

  trackByMessageId(_: number, msg: ContraceptionChatMessageResponseDto): number {
    return msg.id;
  }
}
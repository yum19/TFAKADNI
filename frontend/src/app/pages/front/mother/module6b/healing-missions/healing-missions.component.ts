import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  HealingBadgeResponseDto,
  HealingDashboardResponseDto,
  HealingMissionCompleteResponseDto,
  HealingMissionResponseDto,
  HealingMissionService,
  VoiceEvaluationResponseDto,
  VoiceMissionConfigResponseDto
} from '../../../../../core/services/module6b/healing-mission.service';
type BreathingPhase = 'READY' | 'INHALE' | 'HOLD' | 'EXHALE' | 'DONE';
type AppTab = 'map' | 'mission' | 'badges' | 'history';

interface MapNodeViewModel {
  id: number | string;
  index: number;
  mission: HealingMissionResponseDto | null;
  title: string;
  icon: string;
  isPlaceholder: boolean;
  isLocked: boolean;
}

@Component({
  selector: 'app-healing-missions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './healing-missions.component.html',
  styleUrls: ['./healing-missions.component.css']
})
export class HealingMissionsComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly mapSlotCount = 10;
  loading = true;
  dashboard: HealingDashboardResponseDto | null = null;
  selectedMission: HealingMissionResponseDto | null = null;
  mapMissions: HealingMissionResponseDto[] = [];
  allBadges: HealingBadgeResponseDto[] = [];
gratitudeComment = '';
  @ViewChild('mapScrollShell') mapScrollShell?: ElementRef<HTMLDivElement>;
  @ViewChild('movementVideo') movementVideoRef?: ElementRef<HTMLVideoElement>;
  failedDialogTitle = 'Challenge failed 💔';
  failedDialogDescription = '';
  failedDialogBadge = 'Failed challenge';
  failedDialogImageUrl = 'assets/img/helper-guide-triste.png';
  failedDialogPrimaryLabel = 'Replay';
  failedDialogSecondaryLabel = 'Skip this part';
  /* ─── Tab state ─── */
  activeTab: AppTab = 'map';

  /* ─── Map preview ─── */
  mapPreviewMission: HealingMissionResponseDto | null = null;
  mapPreviewTopPx = 0;
  isPopupGameMode = false;
  popupGameLoading = false;
  launchedFromPopup = false;
  readonly mapBackgroundUrl = 'assets/img/healing-map-soft.png';
  readonly helperAvatarUrl = 'assets/img/helper-guide-seated.png';
  readonly helperAvatarHappyUrl = 'assets/img/helper-guide-happy.png';
  readonly helperAvatarSadUrl = 'assets/img/helper-guide-triste.png';
  readonly gratitudeTimerTotal = 40;

  showFailedMissionDialog = false;
  failedMissionDialogMission: HealingMissionResponseDto | null = null;
  showCompletedMissionDialog = false;
  completedMissionDialogMission: HealingMissionResponseDto | null = null;
  failedMissionIds = new Set<number>();
  skippedFailedMissionIds = new Set<number>();
  replayFailedMissionIds = new Set<number>();
  

  gratitudeTimeLeft = this.gratitudeTimerTotal;
  gratitudeTimerProgress = 100;
  private gratitudeTimerInterval: ReturnType<typeof setInterval> | null = null;

  completionNotes = '';
  missionCompletedMessage = '';
  completingMissionId: number | null = null;
  missionRunning = false;
  showVictoryCard = false;
  private guideVoiceName: string | null = null;

  activeGame: 'NONE' | 'BREATHING' | 'GRATITUDE' | 'VOICE_COMFORT' | 'CALM_AUDIO' | 'GENTLE_MOVEMENT' = 'NONE';

  displayCoins = 0;
  lastEarnedCoins = 0;

  avatarTitle = 'Hi Mommy ✨';
  avatarMessage = 'Choose a mission on the map and I will guide you with my voice!';
  avatarTalking = false;

  confettiItems = Array.from({ length: 8 });

  // BREATHING
  breathingPhase: BreathingPhase = 'READY';
  breathingInstruction = 'Press start to begin your breathing mission';
  breathingTimeLeft = 60;
  breathingProgress = 0;
  breathingCircleScale = 1;
  private breathingInterval: ReturnType<typeof setInterval> | null = null;
  private breathingPatternIndex = 0;
  private breathingStepTimeLeft = 0;
  private breathingPattern: Array<{ phase: BreathingPhase; duration: number; instruction: string; scale: number }> = [
    { phase: 'INHALE', duration: 4, instruction: 'Inhale slowly...', scale: 1.18 },
    { phase: 'HOLD',   duration: 4, instruction: 'Hold softly...',   scale: 1.18 },
    { phase: 'EXHALE', duration: 6, instruction: 'Exhale gently...', scale: 0.88 }
  ];

  // GRATITUDE
  gratitudeChoices = [
    'A peaceful moment',
    'My baby\'s smile',
    'A kind person',
    'A quiet rest',
    'Fresh air',
    'A hopeful thought'
  ];
  selectedGratitudeChoice = '';

  // VOICE
  affirmations = [
    'I am strong and beautiful.',
    'I am healing one small step at a time.',
    'I deserve rest, love, and gentleness.',
    'My voice matters and my progress matters.',
    'I am doing my best and that is enough.'
  ];
  currentAffirmation = '';
  voiceRunning = false;

  isRecordingVoice = false;
  voiceSimilarityScore: number | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private micStream: MediaStream | null = null;
  voiceMissionConfig: VoiceMissionConfigResponseDto | null = null;
  voiceEvaluationResult: VoiceEvaluationResponseDto | null = null;
  isEvaluatingVoice = false;
  // CALM AUDIO
  calmAudioTimeLeft = 45;
  calmAudioRunning = false;
  calmAudioCompleted = false;
  private calmAudioInterval: ReturnType<typeof setInterval> | null = null;

// MOVEMENT
movementSteps = [
  {
    label: 'Lift your shoulders gently',
    hint: 'Raise them softly, then release all tension.',
    startPercent: 0,
    endPercent: 20,
    icon: '🌸'
  },
  {
    label: 'Roll your shoulders back',
    hint: 'Make slow circles and keep your breath calm.',
    startPercent: 20,
    endPercent: 40,
    icon: '🫧'
  },
  {
    label: 'Stretch your arms softly',
    hint: 'Lengthen the arms without forcing.',
    startPercent: 40,
    endPercent: 60,
    icon: '✨'
  },
  {
    label: 'Take a calm breath',
    hint: 'Inhale softly and stay relaxed.',
    startPercent: 60,
    endPercent: 80,
    icon: '🌿'
  },
  {
    label: 'Relax your neck and finish gently',
    hint: 'Slow down and complete the final motion.',
    startPercent: 80,
    endPercent: 100,
    icon: '💖'
  }
];

currentMovementStepIndex = 0;
currentMovementInstruction = 'Press play and follow the coach';
currentMovementHint = 'Stay until the end to complete the challenge';

movementState = {
  started: false,
  completed: false,
  failed: false,
  progressPercent: 0,
  watchedSeconds: 0,
  videoDuration: 0,
  currentTime: 0,
  pauseCount: 0,
  totalPausedSeconds: 0,
  maxSeekJumpDetected: false,
  leftEarly: false,
  status: 'IDLE' as 'IDLE' | 'PLAYING' | 'PAUSED' | 'COMPLETED' | 'FAILED'
};
private ytPlayer: any = null;
private ytInterval: any = null;
private ytReady = false;
private ytVideoId: string | null = null;
private movementPauseStartedAt: number | null = null;
private movementLastTime = 0;
private movementMaxAllowedPauseSeconds = 8;
private movementMinCompletionPercent = 95;
private voiceSampleAudio: HTMLAudioElement | null = null;
private calmAudioPlayer: HTMLAudioElement | null = null;
private calmAudioStarted = false;
private calmAudioEndedNaturally = false;
private isClosingCalmAudioProgrammatically = false;
private startMovementMission(mission: HealingMissionResponseDto): void {
  this.activeGame = 'GENTLE_MOVEMENT';
  this.missionRunning = true;
  this.completionNotes = '';

  const embedUrl = this.buildYoutubeEmbedUrl(mission.mediaUrl || '');
  this.safeMovementYoutubeUrl = embedUrl
    ? this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl)
    : null;

  this.movementState = {
    started: false,
    completed: false,
    failed: false,
    progressPercent: 0,
    watchedSeconds: 0,
    videoDuration: mission.durationSeconds || 60,
    currentTime: 0,
    pauseCount: 0,
    totalPausedSeconds: 0,
    maxSeekJumpDetected: false,
    leftEarly: false,
    status: 'IDLE'
  };

  this.currentMovementStepIndex = 0;
  this.currentMovementInstruction = this.movementSteps[0].label;
  this.currentMovementHint = this.movementSteps[0].hint;
  this.movementPauseStartedAt = null;
  this.movementLastTime = 0;
  this.ytVideoId = this.extractYoutubeId(mission.mediaUrl || '');

setTimeout(() => {
  this.initYoutubePlayer();
}, 300);
}
private initYoutubePlayer(): void {
  if (!this.ytReady || !this.ytVideoId) return;

  if (this.ytPlayer) {
    this.ytPlayer.destroy();
  }

  this.ytPlayer = new (window as any).YT.Player('movementYoutubePlayer', {
    videoId: this.ytVideoId,
    playerVars: {
      modestbranding: 1,
      rel: 0
    },
    events: {
      onReady: (event: any) => this.onYTReady(event),
      onStateChange: (event: any) => this.onYTStateChange(event)
    }
  });
}
private onYTReady(event: any): void {
  const duration = event.target.getDuration();

  this.movementState.videoDuration = duration;

  this.startYTTracking();
}
private startYTTracking(): void {
  if (this.ytInterval) {
    clearInterval(this.ytInterval);
  }

  this.ytInterval = setInterval(() => {
    if (!this.ytPlayer) return;

    const current = this.ytPlayer.getCurrentTime();
    const duration = this.ytPlayer.getDuration();

    const delta = current - this.movementLastTime;

    if (delta > 0 && delta < 1.5) {
      this.movementState.watchedSeconds += delta;
    }

    if (delta > 2.5) {
      this.movementState.maxSeekJumpDetected = true;
    }

    this.movementState.currentTime = current;
    this.movementState.videoDuration = duration;
    this.movementState.progressPercent = duration > 0
      ? (current / duration) * 100
      : 0;

    this.movementLastTime = current;

    this.updateMovementInstruction(current, duration);

  }, 500);
}
private onYTStateChange(event: any): void {
  const state = event.data;

  if (state === 1) {
    this.onMovementPlay();
  }

  if (state === 2) {
    this.onMovementPause();
  }

  if (state === 0) {
    this.onMovementEnded();
  }
}
private configureFailedDialog(mission: HealingMissionResponseDto, reason?: string): void {
  const fallbackReason =
    reason?.trim() ||
    this.avatarMessage?.trim() ||
    'You did not complete this challenge. Replay to try again, or skip and continue your path.';

  this.failedDialogImageUrl = this.helperAvatarSadUrl;
  this.failedDialogPrimaryLabel = 'Replay';
  this.failedDialogSecondaryLabel = 'Skip this part';

  switch (mission.missionType) {
    case 'GENTLE_MOVEMENT':
      this.failedDialogBadge = 'Movement challenge';
      this.failedDialogTitle = 'Movement not completed 💔';
      this.failedDialogDescription =
        fallbackReason || 'You did not complete the gentle movement correctly.';
      this.failedDialogImageUrl = this.helperAvatarSadUrl;
      break;

    case 'GRATITUDE':
      this.failedDialogBadge = 'Gratitude challenge';
      this.failedDialogTitle = 'No gratitude spark selected 💔';
      this.failedDialogDescription =
        fallbackReason || 'You should choose one gratitude card before the timer ends.';
      this.failedDialogImageUrl = this.helperAvatarHappyUrl;
      break;

    case 'VOICE_COMFORT':
      this.failedDialogBadge = 'Voice challenge';
      this.failedDialogTitle = 'Voice mission failed 🎙️';
      this.failedDialogDescription =
        fallbackReason || 'Your affirmation was not validated this time. Listen, record, and try again softly.';
      this.failedDialogImageUrl = this.helperAvatarSadUrl;
      break;

    case 'CALM_AUDIO':
      this.failedDialogBadge = 'Audio challenge';
      this.failedDialogTitle = 'Calm audio interrupted 🎧';
      this.failedDialogDescription =
        fallbackReason || 'You stopped the calm audio before the end.';
      this.failedDialogImageUrl = this.helperAvatarSadUrl;
      break;

    case 'BREATHING':
      this.failedDialogBadge = 'Breathing challenge';
      this.failedDialogTitle = 'Breathing rhythm lost 🌬️';
      this.failedDialogDescription =
        fallbackReason || 'You did not complete the breathing cycle this time.';
      this.failedDialogImageUrl = this.helperAvatarSadUrl;
      break;

    default:
      this.failedDialogBadge = 'Failed challenge';
      this.failedDialogTitle = 'Challenge failed 💔';
      this.failedDialogDescription = fallbackReason;
      this.failedDialogImageUrl = this.helperAvatarSadUrl;
      break;
  }
}
onMovementMetadata(event: Event): void {
  const video = event.target as HTMLVideoElement;
  const duration = video.duration || this.selectedMission?.durationSeconds || 60;
  this.movementState.videoDuration = duration;
}

onMovementPlay(): void {
  this.movementState.started = true;
  this.movementState.status = 'PLAYING';

  if (this.movementPauseStartedAt !== null) {
    const pausedFor = (Date.now() - this.movementPauseStartedAt) / 1000;
    this.movementState.totalPausedSeconds += pausedFor;
    this.movementPauseStartedAt = null;
  }

  this.avatarTitle = 'Movement Quest 💃';
  this.avatarMessage = 'Follow the coach gently and stay with the rhythm until the end.';
}

onMovementPause(): void {
  if (this.movementState.completed || this.movementState.failed) return;

  const video = this.movementVideoRef?.nativeElement;
  if (!video) return;

  if (!video.ended) {
    this.movementState.status = 'PAUSED';
    this.movementState.pauseCount += 1;
    this.movementPauseStartedAt = Date.now();
  }
}

onMovementSeeking(): void {
  const video = this.movementVideoRef?.nativeElement;
  if (!video) return;

  if (video.currentTime > this.movementLastTime + 2.5) {
    this.movementState.maxSeekJumpDetected = true;
  }
}

onMovementTimeUpdate(): void {
  const video = this.movementVideoRef?.nativeElement;
  if (!video) return;

  const current = video.currentTime || 0;
  const duration = video.duration || this.movementState.videoDuration || this.selectedMission?.durationSeconds || 60;
  const delta = current - this.movementLastTime;

  if (delta > 0 && delta < 1.5) {
    this.movementState.watchedSeconds += delta;
  }

  if (delta > 2.5) {
    this.movementState.maxSeekJumpDetected = true;
  }

  this.movementState.currentTime = current;
  this.movementState.videoDuration = duration;
  this.movementState.progressPercent = duration > 0 ? Math.min(100, (current / duration) * 100) : 0;
  this.movementLastTime = current;

  this.updateMovementInstruction(current, duration);
}

onMovementEnded(): void {
  if (!this.selectedMission) return;

  const completedEnough = this.movementState.progressPercent >= this.movementMinCompletionPercent;
  const pauseOk = this.movementState.totalPausedSeconds <= this.movementMaxAllowedPauseSeconds;
  const seekOk = !this.movementState.maxSeekJumpDetected;
  const leftEarlyOk = !this.movementState.leftEarly;

  if (completedEnough && pauseOk && seekOk && leftEarlyOk) {
    this.movementState.completed = true;
    this.movementState.status = 'COMPLETED';

    this.avatarTitle = 'Beautiful movement 💚';
    this.avatarMessage = 'You followed the full movement with calm and presence.';
    this.completeMissionFromGame(this.buildMovementCompletionNote());
    return;
  }

  let reason = 'You did not complete the movement correctly.';

  if (!completedEnough) {
    reason = 'You left the movement before the video finished.';
  } else if (!pauseOk) {
    reason = 'You paused too long before finishing the movement.';
  } else if (!seekOk) {
    reason = 'You skipped part of the movement video.';
  } else if (!leftEarlyOk) {
    reason = 'You closed the challenge before it was completed.';
  }

  this.failMovementMission(reason);
}

getMovementProgress(): number {
  return Math.round(this.movementState.progressPercent);
}

getMovementTimeLeft(): number {
  const total = this.movementState.videoDuration || this.selectedMission?.durationSeconds || 0;
  return Math.max(0, Math.ceil(total - this.movementState.currentTime));
}

getMovementStars(): number {
  if (this.movementState.failed) return 0;
  if (this.movementState.maxSeekJumpDetected) return 1;
  if (this.movementState.totalPausedSeconds > 5) return 2;
  return 3;
}

getMovementStatusLabel(): string {
  switch (this.movementState.status) {
    case 'PLAYING':
      return 'Playing';
    case 'PAUSED':
      return 'Paused';
    case 'COMPLETED':
      return 'Completed';
    case 'FAILED':
      return 'Failed';
    default:
      return 'Ready';
  }
}

private updateMovementInstruction(currentTime: number, duration: number): void {
  const percent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const index = this.movementSteps.findIndex(
    (step) => percent >= step.startPercent && percent < step.endPercent
  );

  this.currentMovementStepIndex =
    index >= 0 ? index : this.movementSteps.length - 1;

  this.currentMovementInstruction =
    this.movementSteps[this.currentMovementStepIndex].label;
  this.currentMovementHint =
    this.movementSteps[this.currentMovementStepIndex].hint;
}

private failMovementMission(reason: string): void {
  if (!this.selectedMission || this.movementState.failed) return;

  this.stopMovementPlayback(true);
  this.movementState.failed = true;
  this.movementState.status = 'FAILED';

  this.avatarTitle = 'Sorry Mommy 💔';
  this.avatarMessage = reason;

  this.markMissionFailed(this.selectedMission, reason);
}

private failGratitudeMission(reason?: string): void {
  if (!this.selectedMission) return;

  if (this.gratitudeTimerInterval) {
    clearInterval(this.gratitudeTimerInterval);
    this.gratitudeTimerInterval = null;
  }

  const finalReason =
    reason || 'You should choose one gratitude item before the timer ends.';

  this.avatarTitle = 'Sorry Mommy 💔';
  this.avatarMessage = finalReason;

  this.markMissionFailed(this.selectedMission, finalReason);
}
private stopMovementPlayback(silent = false): void {
  const video = this.movementVideoRef?.nativeElement;

  if (video) {
    video.pause();
    if (!silent) {
      video.currentTime = 0;
    }
  }

  this.movementPauseStartedAt = null;
  if (this.ytPlayer) {
  this.ytPlayer.stopVideo();
}

if (this.ytInterval) {
  clearInterval(this.ytInterval);
}
}
private failVoiceMission(reason?: string): void {
  if (!this.selectedMission) return;

  const finalReason =
    reason || 'Your affirmation was not validated this time. Please try again softly.';

  this.avatarTitle = 'Sorry Mommy 💔';
  this.avatarMessage = finalReason;

  this.markMissionFailed(this.selectedMission, finalReason);
}
private failBreathingMission(reason?: string): void {
  if (!this.selectedMission) return;

  if (this.breathingInterval) {
    clearInterval(this.breathingInterval);
    this.breathingInterval = null;
  }

  const finalReason =
    reason || 'You did not complete the breathing rhythm this time.';

  this.avatarTitle = 'Sorry Mommy 💔';
  this.avatarMessage = finalReason;

  this.markMissionFailed(this.selectedMission, finalReason);
}
private buildMovementCompletionNote(): string {
  const stars = this.getMovementStars();
  const base = this.completionNotes?.trim();
  const summary = `Completed gentle movement with ${stars} star${stars > 1 ? 's' : ''}.`;

  return base ? `${summary} Note: ${base}` : summary;
}
 constructor(
  private healingMissionService: HealingMissionService,
  private host: ElementRef<HTMLElement>,
  private sanitizer: DomSanitizer
) {}

  ngOnInit(): void {
    this.primeGuideVoice();
    this.loadPage();
    this.loadYoutubeAPI();
  }

  ngAfterViewInit(): void {
    this.scrollMapToChallenges();
    this.updateMapPreviewPosition();
  }

 ngOnDestroy(): void {
  this.clearAllIntervals();
  this.stopVoiceRecordingIfNeeded();
  window.speechSynthesis?.cancel();
  this.stopVoiceSample();
  this.stopCalmAudioPlayback(true);
  this.stopMovementPlayback(true);
}
private loadYoutubeAPI(): void {
  if ((window as any).YT) {
    return;
  }

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.body.appendChild(tag);

  (window as any).onYouTubeIframeAPIReady = () => {
    this.ytReady = true;
  };
}
private extractYoutubeId(url: string): string | null {
  if (!url) return null;

  const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (short?.[1]) return short[1];

  const long = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (long?.[1]) return long[1];

  return null;
}
safeMovementYoutubeUrl: SafeResourceUrl | null = null;

private buildYoutubeEmbedUrl(url: string): string | null {
  if (!url) return null;

  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  if (shortMatch?.[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}?rel=0&modestbranding=1`;
  }

  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (longMatch?.[1]) {
    return `https://www.youtube.com/embed/${longMatch[1]}?rel=0&modestbranding=1`;
  }

  return null;
}
  playVoiceSample(): void {
  const audioUrl =
    this.voiceMissionConfig?.referenceAudioUrl ||
    this.selectedMission?.mediaUrl ||
    null;

  if (!audioUrl) {
    this.avatarMessage = 'No sample audio was found for this mission.';
    return;
  }

  try {
    if (this.voiceSampleAudio) {
      this.voiceSampleAudio.pause();
      this.voiceSampleAudio.currentTime = 0;
    }

    this.stopVoice(); // arrête la voix helper/speech synthesis

    this.voiceSampleAudio = new Audio(audioUrl);
    this.voiceSampleAudio.play()
      .then(() => {
        this.voiceRunning = true;
      })
      .catch((err) => {
        console.error(err);
        this.voiceRunning = false;
        this.avatarMessage = 'The sample audio could not be played.';
      });

    this.voiceSampleAudio.onended = () => {
      this.voiceRunning = false;
    };
  } catch (err) {
    console.error(err);
    this.voiceRunning = false;
    this.avatarMessage = 'The sample audio could not be played.';
  }
}

stopVoiceSample(): void {
  if (this.voiceSampleAudio) {
    this.voiceSampleAudio.pause();
    this.voiceSampleAudio.currentTime = 0;
  }
  this.voiceRunning = false;
}

  // ──────────────────────────────────────────────
  // TAB NAVIGATION
  // ──────────────────────────────────────────────

  setTab(tab: AppTab): void {
    this.activeTab = tab;
    if (tab !== 'mission') {
      this.mapPreviewMission = null;
    }
  }

  onMapNodeClick(mission: HealingMissionResponseDto, index: number): void {
    if (this.isMissionCompleted(mission)) {
      this.openCompletedMissionDialog(mission);
      return;
    }

    if (this.isMissionFailed(mission)) {
      this.openFailedMissionDialog(mission);
      return;
    }

    if (this.isMissionLocked(index, mission)) {
      this.mapPreviewMission = null;
      this.avatarTitle = 'Locked 🔒';
      this.avatarMessage = 'Finish the previous challenge first to unlock this one.';
      this.speakText(this.avatarMessage);
      return;
    }
    this.mapPreviewMission = mission;
    this.selectedMission = mission;
    this.updateAvatarForMission();
    this.updateMapPreviewPosition();

    setTimeout(() => {
      if (this.mapPreviewMission?.id === mission.id) {
        this.stopVoice();
        this.speakText(this.avatarMessage);
      }
    }, 220);
  }

  onBlockedNodeClick(index: number): void {
    this.mapPreviewMission = null;
    this.selectedMission = null;
    this.avatarTitle = 'Locked mission 🔒';
    this.avatarMessage = `This challenge slot ${index + 1} is blocked for now. Finish the earlier missions to unlock it.`;
    this.stopVoice();
    this.speakText(this.avatarMessage);
  }

  openMissionDetail(mission: HealingMissionResponseDto): void {
    this.selectedMission = mission;
    this.mapPreviewMission = null;
    this.resetMissionState();
    this.updateAvatarForMission();
    this.activeTab = 'mission';
  }

  launchPopupMission(mission: HealingMissionResponseDto): void {
    this.selectedMission = mission;
    this.launchedFromPopup = true;
    this.isPopupGameMode = true;
    this.popupGameLoading = true;
    this.resetMissionState();
    this.updateAvatarForMission();
    this.stopVoice();

    this.healingMissionService.startMission(mission.id).subscribe({
      next: (updated) => {
        this.selectedMission = updated;
        this.popupGameLoading = false;
        this.initializeGameForMission(updated);
        this.updateAvatarForMission();
        this.playMissionStartCues(updated);
      },
      error: (err) => {
        console.error(err);
        this.popupGameLoading = false;
      }
    });
  }

  // ──────────────────────────────────────────────
  // MAP NODE POSITIONING
  // ──────────────────────────────────────────────

  getNodePosition(index: number): { [key: string]: string } {
    // Positions calées sur les cercles cœur de l'image healing-map-soft.png
    // Chemin serpentin : bas-gauche (Start) → haut-droite (Goal)
    const positions: Array<{ left: string; top: string }> = [
      { left: '13.0%', top: '83%' },   // 0 – cercle du bas-gauche (Start)
      { left: '25.5%', top: '69.8%' },   // 1 – 2e cercle sur le chemin
      { left: '42.0%', top: '72.0%' },   // 2 – 3e cercle (milieu-bas)
      { left: '52.6%', top: '62.3%' },   // 3 – 4e cercle (centre-bas)
      { left: '50.3%', top: '48.8%' },   // 4 – 5e cercle ki tnakes yata
      { left: '64%', top: '51%' },   // 5 – 6e cercle
      { left: '69.3%', top: '40.5%' },   // 6 – 7e cercle
      { left: '61.5%', top: '31.5%' },   // 7 – 8e cercle
      { left: '74.9%', top: '22.8%' },   // 8 – 9e cercle
      { left: '88.9%', top: '21.7%' }    // 9 – cercle du haut-droite (Goal/flag)
    ];

    const fallbackLeft = Math.min(94, 13.0 + (index * 7.7));
    const fallbackTop = Math.max(12, 79.9 - (index * 6.8));
    const pos = positions[index] ?? { left: `${fallbackLeft}%`, top: `${fallbackTop}%` };

    return { left: pos.left, top: pos.top };
  }

  // ──────────────────────────────────────────────
  // BADGES
  // ──────────────────────────────────────────────

  get earnedBadges(): HealingBadgeResponseDto[] {
    return this.allBadges.filter((badge) => this.isBadgeEarned(badge));
  }

  get lockedBadges(): HealingBadgeResponseDto[] {
    return this.allBadges.filter((badge) => !this.isBadgeEarned(badge));
  }

  private isBadgeEarned(badge: HealingBadgeResponseDto): boolean {
    if (badge.earned) return true;

    const badgeName = this.normalizeBadgeName(badge.name);
    const stats = this.dashboard?.stats;

    switch (badgeName) {
      case 'first step':
        return (stats?.completedMissionsCount ?? 0) >= 1;
      case 'calm breath':
        return this.hasCompletedMissionType('BREATHING');
      case 'gratitude spark':
        return this.hasCompletedMissionType('GRATITUDE');
      case 'gentle voice':
        return this.hasCompletedMissionType('VOICE_COMFORT');
      case 'healing streak':
        return (stats?.currentStreak ?? 0) >= 3;
      case 'self care bloom':
        return (stats?.completedMissionsCount ?? 0) >= 5 || (stats?.totalPoints ?? 0) >= 75;
      default:
        return false;
    }
  }

  private hasCompletedMissionType(missionType: string): boolean {
    return this.getCompletedMissions().some((mission) => mission.missionType === missionType);
  }

  private getCompletedMissions(): HealingMissionResponseDto[] {
    return this.mapMissions.filter((mission) => this.isMissionCompleted(mission));
  }

  private normalizeBadgeName(name: string): string {
    return (name ?? '').trim().toLowerCase();
  }

  // ──────────────────────────────────────────────
  // VOICE GUIDE
  // ──────────────────────────────────────────────

  private primeGuideVoice(): void {
    if (!('speechSynthesis' in window)) return;

    const synth = window.speechSynthesis;
    const voices = synth.getVoices?.() ?? [];
    this.guideVoiceName = this.pickGuideVoiceName(voices) ?? this.guideVoiceName;

    synth.onvoiceschanged = () => {
      const refreshedVoices = synth.getVoices?.() ?? [];
      this.guideVoiceName = this.pickGuideVoiceName(refreshedVoices) ?? this.guideVoiceName;
    };
  }

  private pickGuideVoiceName(voices: SpeechSynthesisVoice[]): string | null {
    const preferredVoice = voices.find((voice) =>
      /female|zira|samantha|susan|google us english|english us/i.test(voice.name)
    );
    return preferredVoice?.name ?? voices[0]?.name ?? null;
  }

  /** Stop the guide voice immediately */
  stopVoice(): void {
    window.speechSynthesis?.cancel();
    this.avatarTalking = false;
  }

  private scrollMapToChallenges(): void {
    setTimeout(() => {
      const shell = this.mapScrollShell?.nativeElement;
      if (!shell) return;

      const targetScroll = Math.max(0, shell.scrollHeight - shell.clientHeight - 120);
      shell.scrollTop = targetScroll;
      this.updateMapPreviewPosition();
    }, 0);
  }

  updateMapPreviewPosition(): void {
    const shell = this.mapScrollShell?.nativeElement;
    if (!shell) return;

    const shellRect = shell.getBoundingClientRect();
    this.mapPreviewTopPx = this.isPopupGameMode
      ? shellRect.top + (shell.clientHeight / 2)
      : shell.scrollTop + (shell.clientHeight / 2);
  }

  getMapNodes(): MapNodeViewModel[] {
    const missions = this.getDisplayMissions();

    return Array.from({ length: this.mapSlotCount }, (_, index) => {
      const mission = missions[index] ?? null;
      const isLocked = !mission || this.isMissionLocked(index, mission);

      return {
        id: mission?.id ?? `locked-slot-${index}`,
        index,
        mission,
        title: mission?.title ?? 'Défi bloqué',
        icon: mission ? this.getMissionIcon(mission.missionType) : '🔒',
        isPlaceholder: !mission,
        isLocked
      };
    });
  }

  closeMapPreview(): void {
    this.mapPreviewMission = null;
    this.isPopupGameMode = false;
    this.popupGameLoading = false;
    this.launchedFromPopup = false;
    this.showFailedMissionDialog = false;
    this.failedMissionDialogMission = null;
    this.showCompletedMissionDialog = false;
    this.completedMissionDialogMission = null;
    this.resetMissionState();
    this.stopVoice();
  }
closePopupGame(): void {
  if (
    this.activeGame === 'CALM_AUDIO' &&
    this.calmAudioStarted &&
    !this.calmAudioCompleted &&
    !this.calmAudioEndedNaturally
  ) {
    this.failCalmAudioGame('You closed the audio before it finished.');
    return;
  }

  if (
    this.activeGame === 'GENTLE_MOVEMENT' &&
    this.missionRunning &&
    !this.movementState.completed
  ) {
    this.movementState.leftEarly = true;
    this.failMovementMission('You closed the movement challenge before the video finished.');
    return;
  }

  this.closeMapPreview();
}

  openFailedMissionDialog(mission: HealingMissionResponseDto, reason?: string): void {
  this.failedMissionDialogMission = mission;
  this.showFailedMissionDialog = true;
  this.mapPreviewMission = null;
  this.isPopupGameMode = false;
  this.popupGameLoading = false;
  this.resetMissionState();

  this.configureFailedDialog(mission, reason);

  this.avatarTitle = 'Sorry Mommy 💔';
  this.avatarMessage = this.failedDialogDescription;
  this.stopVoice();
  setTimeout(() => this.speakText(this.failedDialogDescription), 180);
}

  openCompletedMissionDialog(mission: HealingMissionResponseDto): void {
    this.completedMissionDialogMission = mission;
    this.showCompletedMissionDialog = true;
    this.mapPreviewMission = null;
    this.isPopupGameMode = false;
    this.popupGameLoading = false;
    this.resetMissionState();
    this.avatarTitle = 'Mission completed 💚';
    this.avatarMessage = 'You already won this challenge. Do you want to replay it?';
    this.stopVoice();
    setTimeout(() => this.speakText(this.avatarMessage), 180);
  }

  closeCompletedMissionDialog(): void {
    this.showCompletedMissionDialog = false;
    this.completedMissionDialogMission = null;
    this.stopVoice();
  }

  replayCompletedMission(mission: HealingMissionResponseDto): void {
  this.closeCompletedMissionDialog();
  this.launchPopupMission(mission);
}

  closeFailedMissionDialog(): void {
    this.showFailedMissionDialog = false;
    this.failedMissionDialogMission = null;
    this.stopVoice();
  }

  replayFailedMission(mission: HealingMissionResponseDto): void {
    this.closeFailedMissionDialog();
    this.launchPopupMission(mission);
  }

  skipFailedMission(mission: HealingMissionResponseDto): void {
    this.applySkippedMissionState(mission);
    this.healingMissionService.skipMission(mission.id).subscribe({
      next: () => {
        this.avatarTitle = 'Path unlocked ✨';
        this.avatarMessage = 'This challenge stays red, but the next challenge is now unlocked.';
        this.closeFailedMissionDialog();
        this.loadPage();
        setTimeout(() => this.showNextMissionPreview(mission.id), 220);
      },
      error: (err) => {
        console.error(err);
        this.closeFailedMissionDialog();
      }
    });
  }

  isMissionFailed(mission: HealingMissionResponseDto | null): boolean {
    return !!mission?.id && !this.isMissionCompleted(mission) && this.isMissionFailureStatus(mission);
  }

  isMissionSkippedAfterFail(mission: HealingMissionResponseDto | null): boolean {
    return !!mission?.id && this.isMissionSkippedStatus(mission);
  }

  private isMissionFailureStatus(mission: HealingMissionResponseDto | null): boolean {
    const status = this.getMissionStatusValue(mission);
    return status.includes('FAIL');
  }

  private isMissionCompletedStatus(mission: HealingMissionResponseDto | null): boolean {
    const status = this.getMissionStatusValue(mission);
    return status.includes('COMPLETE');
  }

  private isMissionActiveStatus(mission: HealingMissionResponseDto | null): boolean {
    const status = this.getMissionStatusValue(mission);
    return status.includes('ACTIVE') || status.includes('CURRENT') || status.includes('START') || status.includes('PROGRESS');
  }

  private isMissionSkippedStatus(mission: HealingMissionResponseDto | null): boolean {
    const status = this.getMissionStatusValue(mission);
    return status.includes('SKIP');
  }

  private getMissionStatusValue(mission: HealingMissionResponseDto | null): string {
    return (mission?.status ?? '').toUpperCase();
  }

  private getMissionDisplayRank(mission: HealingMissionResponseDto | null): number {
    if (this.isMissionCompleted(mission) || this.isMissionFailed(mission) || this.isMissionSkippedAfterFail(mission)) {
      return 0;
    }

    if (this.isMissionActiveStatus(mission)) {
      return 1;
    }

    return 2;
  }

  private getDisplayMissions(): HealingMissionResponseDto[] {
    const sourceMissions = this.mapMissions.length ? this.mapMissions : (this.dashboard?.todaysMissions ?? []);
    return [...sourceMissions].sort((left, right) => {
      const rankDelta = this.getMissionDisplayRank(left) - this.getMissionDisplayRank(right);
      if (rankDelta !== 0) return rankDelta;

      return this.getMissionOrderIndex(left) - this.getMissionOrderIndex(right);
    });
  }

  private getMissionOrderIndex(mission: HealingMissionResponseDto): number {
    switch (mission.missionType) {
      case 'BREATHING':
        return 0;
      case 'GRATITUDE':
        return 1;
      case 'VOICE_COMFORT':
        return 2;
      case 'CALM_AUDIO':
        return 3;
      case 'GENTLE_MOVEMENT':
        return 4;
      default:
        return 99;
    }
  }

 private markMissionFailed(mission: HealingMissionResponseDto | null, reason?: string): void {
  if (!mission?.id) return;

  this.missionRunning = false;
  this.isPopupGameMode = false;
  this.popupGameLoading = false;
  this.showVictoryCard = false;
  this.clearAllIntervals();

  this.healingMissionService.failMission(mission.id).subscribe({
    next: (updated) => {
      this.failedMissionIds.add(mission.id);
      this.skippedFailedMissionIds.delete(mission.id);

      this.updateMissionStateInCollections(mission.id, (localMission) => {
        localMission.completedToday = updated.completedToday;
        localMission.status = updated.status;
      });

      if (this.selectedMission?.id === mission.id) {
        this.selectedMission = {
          ...this.selectedMission,
          completedToday: updated.completedToday,
          status: updated.status
        };
      }

      this.failedMissionDialogMission = updated;

      // ✅ backend is source of truth for coins
      this.loadPage();

      this.openFailedMissionDialog(updated, reason);
    },
    error: (err) => {
      console.error('Fail mission error', err);
    }
  });
}
  private applySkippedMissionState(mission: HealingMissionResponseDto): void {
    this.failedMissionIds.add(mission.id);
    this.skippedFailedMissionIds.add(mission.id);

    this.updateMissionStateInCollections(mission.id, (localMission) => {
      localMission.status = 'SKIPPED';
    });
  }

  private updateMissionStateInCollections(missionId: number, updater: (mission: HealingMissionResponseDto) => void): void {
    const collections = [this.dashboard?.todaysMissions, this.mapMissions];

    collections.forEach((collection) => {
      const localMission = collection?.find((item) => item.id === missionId);
      if (localMission) {
        updater(localMission);
      }
    });
  }

  private startGratitudeTimer(): void {
    this.gratitudeTimeLeft = this.gratitudeTimerTotal;
    this.gratitudeTimerProgress = 100;

    if (this.gratitudeTimerInterval) clearInterval(this.gratitudeTimerInterval);

    this.gratitudeTimerInterval = setInterval(() => {
      this.gratitudeTimeLeft--;
      this.gratitudeTimerProgress = Math.max(0, (this.gratitudeTimeLeft / this.gratitudeTimerTotal) * 100);

      if (this.gratitudeTimeLeft <= 0) {
        if (this.gratitudeTimerInterval) clearInterval(this.gratitudeTimerInterval);
        this.gratitudeTimerInterval = null;

        if (!this.selectedGratitudeChoice && this.activeGame === 'GRATITUDE' && this.selectedMission) {
          this.avatarTitle = 'Sorry Mommy 💔';
          this.avatarMessage = 'You lose this round. You should choose one item before the timer ends.';
          this.failGratitudeMission(this.avatarMessage);
        }
      }
    }, 1000);
  }

 loadPage(): void {
  this.loading = true;

  forkJoin({
    dashboard: this.healingMissionService.getDashboard(),
    missions: this.healingMissionService.getAllMissions()
  }).subscribe({
    next: ({ dashboard, missions }) => {
      this.dashboard = dashboard;
      this.mapMissions = (missions ?? []);
      this.displayCoins = dashboard?.stats?.coins ?? 0;

      const displayMissions = this.getDisplayMissions();
      this.selectedMission = this.getCurrentMission(displayMissions)
        ?? this.getFirstPendingPlayableMission(displayMissions)
        ?? this.getFirstPlayableMission(displayMissions)
        ?? displayMissions[0] ?? null;

      this.loading = false;
      this.loadBadges();
      this.updateAvatarForMission();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          this.scrollMapToChallenges();
        });
      });
    },
    error: (err) => {
      console.error(err);
      this.loading = false;
    }
  });
}
  loadBadges(): void {
    if (!this.healingMissionService.getAllBadges) return;

    this.healingMissionService.getAllBadges().subscribe({
      next: (badges) => {
        this.allBadges = (badges ?? []).map((badge) => ({
          ...badge,
          earned: this.isBadgeEarned(badge)
        }));
      },
      error: (err) => console.error(err)
    });
  }

  selectMission(mission: HealingMissionResponseDto): void {
    const missions = this.getDisplayMissions();
    const missionIndex = missions.findIndex((item) => item.id === mission.id);

    if (this.isMissionLocked(missionIndex, mission)) {
      this.avatarTitle = 'Locked mission 🔒';
      this.avatarMessage = 'Finish the previous challenge first to unlock this one.';
      this.speakText(`${this.avatarTitle}. ${this.avatarMessage}`);
      return;
    }

    this.selectedMission = mission;
    this.resetMissionState();
    this.updateAvatarForMission();
  }

  startMission(mission: HealingMissionResponseDto): void {
    this.healingMissionService.startMission(mission.id).subscribe({
      next: (updated) => {
        this.selectedMission = updated;
        this.initializeGameForMission(updated);
        this.updateAvatarForMission();
        this.playMissionStartCues(updated);
      },
      error: (err) => console.error(err)
    });
  }


  completeGratitudeMission(): void {
  if (!this.selectedGratitudeChoice || !this.selectedMission) return;

  const optionalComment = this.gratitudeComment?.trim();
  const gratitudeNote = optionalComment
    ? `Gratitude choice: ${this.selectedGratitudeChoice}. Comment: ${optionalComment}`
    : `Gratitude choice: ${this.selectedGratitudeChoice}.`;

  this.avatarTitle = 'Wow! Good job Mommy 💚';
  this.avatarMessage = 'Wow! Good job Mommy. You chose a beautiful gratitude spark before the timer finished!';
  this.stopVoice();
  this.speakText(this.avatarMessage);

  setTimeout(() => {
    this.completeMissionFromGame(gratitudeNote);
  }, 650);
}

  showNextMissionPreview(excludedMissionId?: number | null): void {
    const nextMission = this.getFirstPendingPlayableMission(this.getDisplayMissions(), excludedMissionId);
    if (!nextMission) return;

    this.selectedMission = nextMission;
    this.mapPreviewMission = nextMission;
    this.updateAvatarForMission();
    this.activeTab = 'map';
    this.updateMapPreviewPosition();

    setTimeout(() => {
      if (this.mapPreviewMission?.id === nextMission.id) {
        this.stopVoice();
        this.speakText('Next challenge unlocked ✨ ' + this.avatarMessage);
      }
    }, 280);
  }

  skipMission(mission: HealingMissionResponseDto): void {
    this.applySkippedMissionState(mission);
    this.missionRunning = false;
    this.isPopupGameMode = false;
    this.popupGameLoading = false;
    this.showVictoryCard = false;
    this.mapPreviewMission = null;
    this.stopVoice();

    this.healingMissionService.skipMission(mission.id).subscribe({
      next: () => {
        this.avatarTitle = 'No problem 💖';
        this.avatarMessage = 'This challenge stays red, but the next challenge is now unlocked.';
        this.activeTab = 'map';
        this.loadPage();
        setTimeout(() => this.showNextMissionPreview(), 220);
      },
      error: (err) => console.error(err)
    });
  }

  completeMissionFromGame(autoNote?: string): void {
    if (!this.selectedMission) return;

    this.completingMissionId = this.selectedMission.id;
    const finalNotes = this.completionNotes?.trim() || autoNote || this.buildAutoCompletionNote();

    this.healingMissionService.completeMission(this.selectedMission.id, { notes: finalNotes }).subscribe({
      next: (res: HealingMissionCompleteResponseDto) => {
  const completedMissionId = this.selectedMission?.id ?? null;

  if (completedMissionId) {
    this.failedMissionIds.delete(completedMissionId);
    this.skippedFailedMissionIds.delete(completedMissionId);
    this.replayFailedMissionIds.delete(completedMissionId);
    this.applyLocalMissionCompletion(completedMissionId);
  }

  this.lastEarnedCoins = res.pointsEarned ?? 0;

  if (this.dashboard?.stats) {
    this.dashboard.stats.totalPoints = res.totalPoints ?? this.dashboard.stats.totalPoints;
    this.dashboard.stats.currentLevel = res.currentLevel ?? this.dashboard.stats.currentLevel;
    this.dashboard.stats.currentStreak = res.currentStreak ?? this.dashboard.stats.currentStreak;
  }

  this.missionCompletedMessage = `+${res.pointsEarned} points • Level ${res.currentLevel} • Streak ${res.currentStreak}`;
  this.completingMissionId = null;
  this.missionRunning = false;
  this.showVictoryCard = true;
  this.clearAllIntervals();
  this.avatarSpeakVictory();
  this.playVictoryMusic();
  this.reloadDashboardKeepingVictory();
},
      error: (err) => {
        console.error(err);
        this.completingMissionId = null;
      }
    });
  }

  reloadDashboardKeepingVictory(): void {
  this.healingMissionService.getDashboard().subscribe({
    next: (data) => {
      this.displayCoins = data?.stats?.coins ?? this.displayCoins;

      if (this.dashboard?.stats && data?.stats) {
        this.dashboard.stats = {
          ...this.dashboard.stats,
          ...data.stats
        };
      } else if (data?.stats) {
        this.dashboard = {
          todaysMissions: this.dashboard?.todaysMissions ?? [],
          recentHistory: this.dashboard?.recentHistory ?? [],
          latestBadges: this.dashboard?.latestBadges ?? [],
          stats: data.stats
        };
      }
    },
    error: (err) => console.error(err)
  });

  if (this.healingMissionService.getAllBadges()) {
    this.loadBadges();
  }
}
  closeVictoryCard(): void {
    this.showVictoryCard = false;
    this.showCompletedMissionDialog = false;
    this.completedMissionDialogMission = null;

    const completedMissionId = this.selectedMission?.id ?? null;

    if (this.launchedFromPopup) {
      this.isPopupGameMode = false;
      this.popupGameLoading = false;
      this.launchedFromPopup = false;
      this.activeTab = 'map';
      this.resetMissionState();

      if (completedMissionId) {
        const completedMission = this.dashboard?.todaysMissions?.find((item) => item.id === completedMissionId) ?? null;
        this.mapPreviewMission = completedMission;
      }

      setTimeout(() => {
        this.showNextMissionPreview();
      }, 220);
      return;
    }

    this.activeTab = 'map';
    this.resetMissionState();
  }

  isMissionCompleted(mission: HealingMissionResponseDto | null): boolean {
    return !!mission?.id && (mission.completedToday || this.isMissionCompletedStatus(mission));
  }

  private getCurrentMission(missions: HealingMissionResponseDto[]): HealingMissionResponseDto | null {
    if (!missions.length) return null;
    return missions.find((mission) => this.isMissionActiveStatus(mission)) ?? null;
  }

  updateAvatarForMission(): void {
    if (!this.selectedMission) {
      this.avatarTitle = 'Choose a mission ✨';
      this.avatarMessage = 'Tap a node on the map to see your next quest!';
      return;
    }
    const m = this.selectedMission;
    switch (m.missionType) {
      case 'BREATHING':
        this.avatarTitle = 'Breathing Quest 🌬️';
        this.avatarMessage = 'Breathe with me softly. Inhale four counts, hold four, exhale six. You are doing amazing!';
        break;
      case 'GRATITUDE':
        this.avatarTitle = 'Gratitude Quest 💖';
        this.avatarMessage = 'Pick one thing you are grateful for today. Your heart deserves this moment of joy!';
        break;
      case 'VOICE_COMFORT':
        this.avatarTitle = 'Voice Quest 🎤';
        this.avatarMessage = 'Listen to the affirmation, then record yourself saying it with love and confidence!';
        break;
      case 'CALM_AUDIO':
        this.avatarTitle = 'Calm Audio 🎧';
        this.avatarMessage = 'Just sit quietly and listen to the healing audio. You deserve this peaceful moment.';
        break;
      case 'GENTLE_MOVEMENT':
        this.avatarTitle = 'Movement Quest 💃';
        this.avatarMessage = 'Follow each gentle step with me. Your body is strong and beautiful!';
        break;
      default:
        this.avatarTitle = 'New Quest ✨';
        this.avatarMessage = `Your mission is: ${m.title}. You have got this!`;
    }
  }

  initializeGameForMission(mission: HealingMissionResponseDto): void {
    this.missionRunning = true;
    this.completionNotes = '';

    switch (mission.missionType) {
      case 'BREATHING':
        this.activeGame = 'BREATHING';
        this.startBreathingGame(mission);
        break;
      case 'GRATITUDE':
  this.activeGame = 'GRATITUDE';
  this.selectedGratitudeChoice = '';
  this.gratitudeComment = '';
  this.startGratitudeTimer();
  break;
           case 'VOICE_COMFORT':
        this.activeGame = 'VOICE_COMFORT';
        this.voiceSimilarityScore = null;
        this.voiceEvaluationResult = null;
        this.voiceMissionConfig = null;
        this.currentAffirmation = this.getRandomAffirmation();
        this.loadVoiceMissionConfig(mission);
        break;
    case 'CALM_AUDIO':
  this.activeGame = 'CALM_AUDIO';
  this.missionRunning = true;
  this.calmAudioCompleted = false;
  this.calmAudioRunning = false;
  this.calmAudioStarted = false;
  this.calmAudioEndedNaturally = false;
  this.calmAudioTimeLeft = mission.durationSeconds || 45;
  this.avatarTitle = 'Soft listening time 🎧';
  this.avatarMessage = 'Press play and listen to the full audio to complete this mission.';
  break;
  case 'GENTLE_MOVEMENT':
  this.startMovementMission(mission);
  break;
      default:
        this.activeGame = 'NONE';
    }
  }

  resetMissionState(): void {
    this.missionRunning = false;
    this.showVictoryCard = false;
    this.activeGame = 'NONE';
    this.completionNotes = '';
    this.selectedGratitudeChoice = '';
    this.voiceSimilarityScore = null;
    this.voiceMissionConfig = null;
    this.voiceEvaluationResult = null;
    this.isEvaluatingVoice = false;
    this.isRecordingVoice = false;
    this.voiceRunning = false;
    this.currentMovementStepIndex = 0;
    this.breathingPhase = 'READY';
    this.breathingProgress = 0;
    this.breathingTimeLeft = 60;
    this.breathingCircleScale = 1;
    this.recordedChunks = [];
    this.clearAllIntervals();
    this.stopVoiceSample();
    this.stopCalmAudioPlayback(true);
    this.stopMovementPlayback(true);
    this.gratitudeComment = '';
this.currentMovementStepIndex = 0;
this.currentMovementInstruction = 'Press play and follow the coach';
this.currentMovementHint = 'Stay until the end to complete the challenge';

this.movementState = {
  started: false,
  completed: false,
  failed: false,
  progressPercent: 0,
  watchedSeconds: 0,
  videoDuration: 0,
  currentTime: 0,
  pauseCount: 0,
  totalPausedSeconds: 0,
  maxSeekJumpDetected: false,
  leftEarly: false,
  status: 'IDLE'
};

this.movementPauseStartedAt = null;
this.movementLastTime = 0;
  }

  // ──────────────────────────────────────────────
  // BREATHING GAME
  // ──────────────────────────────────────────────

  startBreathingGame(mission: HealingMissionResponseDto): void {
    this.clearAllIntervals();
    this.breathingTimeLeft = mission.durationSeconds || 60;
    this.breathingPatternIndex = 0;
    this.breathingProgress = 0;
    const total = this.breathingTimeLeft;

    this.enterBreathingStep();

    this.breathingInterval = setInterval(() => {
      this.breathingTimeLeft--;
      this.breathingProgress = Math.min(100, Math.round(((total - this.breathingTimeLeft) / total) * 100));
      this.breathingStepTimeLeft--;

      if (this.breathingStepTimeLeft <= 0) {
        this.breathingPatternIndex = (this.breathingPatternIndex + 1) % this.breathingPattern.length;
        this.enterBreathingStep();
      }

      if (this.breathingTimeLeft <= 0) {
        this.clearAllIntervals();
        this.breathingPhase = 'DONE';
        this.breathingInstruction = 'Beautiful! Mission complete 🌸';
        this.completeMissionFromGame('Completed breathing relaxation mission.');
      }
    }, 1000);
  }

  private enterBreathingStep(): void {
    const step = this.breathingPattern[this.breathingPatternIndex];
    this.breathingPhase = step.phase;
    this.breathingInstruction = step.instruction;
    this.breathingCircleScale = step.scale;
    this.breathingStepTimeLeft = step.duration;
  }

  // ──────────────────────────────────────────────
  // VOICE GAME
  // ──────────────────────────────────────────────

  speakCurrentAffirmation(): void {
    this.speakText(this.currentAffirmation);
  }

  refreshAffirmation(): void {
    this.currentAffirmation = this.voiceMissionConfig?.expectedText || this.getRandomAffirmation();
    this.voiceSimilarityScore = null;
    this.voiceEvaluationResult = null;
    this.recordedChunks = [];
  }
  async toggleVoiceRecording(): Promise<void> {
    if (this.isRecordingVoice) {
      this.stopVoiceRecording();
    } else {
      await this.startVoiceRecording();
    }
  }

  private async startVoiceRecording(): Promise<void> {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.micStream);
      this.recordedChunks = [];
      this.mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) this.recordedChunks.push(e.data); };
      this.mediaRecorder.onstop = () => this.processVoiceRecording();
      this.mediaRecorder.start();
      this.isRecordingVoice = true;
      this.voiceRunning = true;
    } catch {
      this.avatarMessage = 'Please allow microphone access to record your voice.';
    }
  }

  private stopVoiceRecording(): void {
    this.mediaRecorder?.stop();
    this.micStream?.getTracks().forEach(t => t.stop());
    this.isRecordingVoice = false;
    this.voiceRunning = false;
  }

  private stopVoiceRecordingIfNeeded(): void {
    if (this.isRecordingVoice) {
      this.stopVoiceRecording();
    }
  }



    private loadVoiceMissionConfig(mission: HealingMissionResponseDto): void {
    this.healingMissionService.getVoiceMissionConfig(mission.id).subscribe({
      next: (config) => {
        this.voiceMissionConfig = config;
        this.currentAffirmation = config.expectedText || this.currentAffirmation;
        this.avatarMessage = `Say this sentence with a ${config.expectedVoiceStyle?.toLowerCase() || 'confident'} voice.`;
      },
      error: (err) => {
        console.error(err);
        this.voiceMissionConfig = null;
        this.avatarMessage = 'Voice mission config could not be loaded. You can still try recording.';
      }
    });
  }

  private getRecordedAudioBlob(): Blob | null {
    if (!this.recordedChunks.length) return null;
    return new Blob(this.recordedChunks, { type: 'audio/webm' });
  }

  private processVoiceRecording(): void {
    if (!this.recordedChunks.length) {
      this.voiceSimilarityScore = null;
      this.voiceEvaluationResult = null;
      this.avatarMessage = 'No voice detected. Please record again.';
      return;
    }

    this.voiceSimilarityScore = null;
    this.voiceEvaluationResult = null;
    this.avatarMessage = 'Recording saved. Tap Validate to analyze your voice.';
  }

  finishVoiceMissionWithScore(): void {
    if (!this.selectedMission) return;

    const audioBlob = this.getRecordedAudioBlob();
    if (!audioBlob) {
      this.avatarMessage = 'Please record your voice first.';
      return;
    }

    this.isEvaluatingVoice = true;
    this.avatarMessage = 'Analyzing your voice...';
    this.stopVoice();

    this.healingMissionService.evaluateVoiceMission(this.selectedMission.id, audioBlob).subscribe({
      next: (result) => {
        this.isEvaluatingVoice = false;
        this.voiceEvaluationResult = result;
        this.voiceSimilarityScore = result.finalScore ?? null;
        this.avatarMessage = result.feedback || 'Voice analysis completed.';

        if (result.accepted) {
  this.avatarTitle = 'Beautiful voice 💖';
  this.avatarMessage = result.feedback || 'Challenge accepted. Great job!';
  setTimeout(() => {
    this.completeMissionFromGame(
      `Voice style validated. Score: ${result.finalScore}%. Transcript: ${result.transcript || 'N/A'}`
    );
  }, 500);
} else {
  this.avatarTitle = 'Sorry Mommy 💔';
  this.avatarMessage = result.feedback || 'You lost this one. Replay to try again, or skip this part and continue your path.';

  setTimeout(() => {
    this.failVoiceMission(this.avatarMessage);
  }, 350);
}
      },
      error: (err) => {
        console.error(err);
        this.isEvaluatingVoice = false;
        this.voiceSimilarityScore = null;
        this.voiceEvaluationResult = null;
        this.avatarTitle = 'Oops 🎤';
        this.avatarMessage = 'Voice analysis failed. Please record again and try once more.';
      }
    });
  }

  getVoiceResultTitle(): string {
    if (this.voiceSimilarityScore === null) return '';
    if (this.voiceSimilarityScore >= 85) return 'Excellent! 🌟';
    if (this.voiceSimilarityScore >= 70) return 'Great job! 💖';
    return 'Nice try! Keep going 🎀';
  }

  getVoiceResultMessage(): string {
    if (this.voiceEvaluationResult?.feedback) {
      return this.voiceEvaluationResult.feedback;
    }

    if (this.voiceSimilarityScore === null) return '';
    if (this.voiceSimilarityScore >= 85) return 'Your voice is beautiful and confident!';
    if (this.voiceSimilarityScore >= 70) return 'You are doing so well, keep practicing!';
    return 'Every attempt makes you stronger. Try once more!';
  }
  // ──────────────────────────────────────────────
// CALM AUDIO
// ──────────────────────────────────────────────

startCalmAudioGame(): void {
  if (!this.selectedMission) return;

  const audioUrl = this.selectedMission.mediaUrl || null;
  if (!audioUrl) {
    this.avatarTitle = 'Audio unavailable 🎧';
    this.avatarMessage = 'No calm audio file was found for this mission.';
    return;
  }

  this.stopCalmAudioPlayback(true);

  this.clearAllIntervals();
  this.calmAudioTimeLeft = this.selectedMission.durationSeconds || 45;
  this.calmAudioRunning = false;
  this.calmAudioCompleted = false;
  this.calmAudioStarted = false;
  this.calmAudioEndedNaturally = false;
  this.isClosingCalmAudioProgrammatically = false;

  this.calmAudioPlayer = new Audio(audioUrl);
  this.calmAudioPlayer.currentTime = 0;
  this.calmAudioPlayer.preload = 'auto';

  this.calmAudioPlayer.onplay = () => {
    this.calmAudioRunning = true;
    this.calmAudioStarted = true;
    this.avatarTitle = 'Stay with the sound 🎧';
    this.avatarMessage = 'Listen until the end of the calm audio to win this mission.';
    this.startCalmAudioProgressTimer();
  };

  this.calmAudioPlayer.onended = () => {
    this.calmAudioEndedNaturally = true;
    this.finishCalmAudioGame();
  };

  this.calmAudioPlayer.onpause = () => {
    if (!this.calmAudioPlayer) return;

    const ended = this.calmAudioEndedNaturally || this.calmAudioPlayer.ended;
    if (ended || this.isClosingCalmAudioProgrammatically) {
      return;
    }

    if (this.calmAudioStarted) {
      this.failCalmAudioGame('You stopped the audio before the end.');
    }
  };

  this.calmAudioPlayer.onerror = () => {
    this.avatarTitle = 'Audio error 🎧';
    this.avatarMessage = 'The calm audio could not be played.';
    this.stopCalmAudioPlayback(true);
    this.failCalmAudioGame(this.avatarMessage);
  };

  this.calmAudioPlayer.play().catch((err) => {
    console.error(err);
    this.avatarTitle = 'Audio blocked 🎧';
    this.avatarMessage = 'Playback could not start. Please try again.';
    this.stopCalmAudioPlayback(true);
  });
}

pauseCalmAudioGame(): void {
  if (!this.calmAudioPlayer || !this.calmAudioRunning) return;
  this.calmAudioPlayer.pause();
}

private startCalmAudioProgressTimer(): void {
  if (!this.selectedMission) return;

  if (this.calmAudioInterval) {
    clearInterval(this.calmAudioInterval);
  }

  const total = this.selectedMission.durationSeconds || 45;
  this.calmAudioTimeLeft = Math.max(0, Math.ceil(total - (this.calmAudioPlayer?.currentTime || 0)));

  this.calmAudioInterval = setInterval(() => {
    if (!this.calmAudioPlayer || !this.selectedMission) return;

    const fullDuration =
      this.selectedMission.durationSeconds ||
      Math.ceil(this.calmAudioPlayer.duration || 0) ||
      45;

    const currentTime = this.calmAudioPlayer.currentTime || 0;
    this.calmAudioTimeLeft = Math.max(0, Math.ceil(fullDuration - currentTime));
  }, 250);
}

private finishCalmAudioGame(): void {
  this.clearAllIntervals();
  this.calmAudioRunning = false;
  this.calmAudioCompleted = true;

  this.isClosingCalmAudioProgrammatically = true;
  if (this.calmAudioPlayer) {
    this.calmAudioPlayer.pause();
    this.calmAudioPlayer.currentTime = 0;
  }
  this.isClosingCalmAudioProgrammatically = false;

  this.avatarTitle = 'Beautiful calm moment 💚';
  this.avatarMessage = 'You listened to the full audio. Mission completed.';
  this.completeMissionFromGame('Completed calm audio reflection mission.');
}

private failCalmAudioGame(reason?: string): void {
  if (!this.selectedMission) return;

  this.clearAllIntervals();
  this.calmAudioRunning = false;
  this.calmAudioCompleted = false;

  this.isClosingCalmAudioProgrammatically = true;
  if (this.calmAudioPlayer) {
    this.calmAudioPlayer.pause();
    this.calmAudioPlayer.currentTime = 0;
  }
  this.isClosingCalmAudioProgrammatically = false;

  const finalReason = reason || 'You stopped the calm audio before the end.';

  this.avatarTitle = 'Sorry Mommy 💔';
  this.avatarMessage = finalReason;

  this.markMissionFailed(this.selectedMission, finalReason);
}
private stopCalmAudioPlayback(silent = false): void {
  this.clearAllIntervals();

  if (this.calmAudioPlayer) {
    this.isClosingCalmAudioProgrammatically = true;
    this.calmAudioPlayer.onplay = null;
    this.calmAudioPlayer.onpause = null;
    this.calmAudioPlayer.onended = null;
    this.calmAudioPlayer.onerror = null;
    this.calmAudioPlayer.pause();
    this.calmAudioPlayer.currentTime = 0;
    this.isClosingCalmAudioProgrammatically = false;
    this.calmAudioPlayer = null;
  }

  this.calmAudioRunning = false;

  if (!silent) {
    this.calmAudioCompleted = false;
  }
}

getCalmAudioProgress(): number {
  const total =
    this.selectedMission?.durationSeconds ||
    Math.ceil(this.calmAudioPlayer?.duration || 0) ||
    0;

  if (!total) return 0;

  const currentTime = this.calmAudioPlayer?.currentTime || 0;
  return Math.min(100, Math.round((currentTime / total) * 100));
}
  // ──────────────────────────────────────────────
  // VICTORY
  // ──────────────────────────────────────────────

  avatarSpeakVictory(): void {
    this.speakText('Wow! Congrats Mommy! You won this challenge, and the next one is now unlocked!');
  }

  private applyLocalMissionCompletion(missionId: number): void {
    this.updateMissionStateInCollections(missionId, (mission) => {
      mission.completedToday = true;
      mission.status = 'COMPLETED';
    });
  }

  private syncSelectedMissionFromDashboard(): void {
    if (!this.selectedMission?.id || !this.dashboard?.todaysMissions?.length) return;

    const updatedMission = this.dashboard.todaysMissions.find((item) => item.id === this.selectedMission?.id);
    if (updatedMission) {
      this.selectedMission = updatedMission;
    }
  }

  private playVictoryMusic(): void {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 659.25, 880, 987.77];
    let startTime = ctx.currentTime;

    notes.forEach((freq: number, index: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = index % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.14, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.24);
      startTime += 0.11;
    });

    setTimeout(() => ctx.close(), 1200);
  }

  // ──────────────────────────────────────────────
  // UTILS
  // ──────────────────────────────────────────────

  trackMission(_: number, item: HealingMissionResponseDto): number { return item.id; }
  trackMapNode(_: number, item: MapNodeViewModel): number | string { return item.id; }
  trackBadge(_: number, item: HealingBadgeResponseDto): number { return item.id; }

  getMissionIcon(type: string): string {
    switch (type) {
      case 'BREATHING':       return '🌬️';
      case 'VOICE_COMFORT':   return '🎤';
      case 'GRATITUDE':       return '💖';
      case 'CALM_AUDIO':      return '🎧';
      case 'GENTLE_MOVEMENT': return '🧘';
      default:                return '✨';
    }
  }

  getMissionTypeLabel(type: string): string {
    switch (type) {
      case 'BREATHING':       return 'Breathing Challenge';
      case 'VOICE_COMFORT':   return 'Voice Challenge';
      case 'GRATITUDE':       return 'Gratitude Challenge';
      case 'CALM_AUDIO':      return 'Audio Challenge';
      case 'GENTLE_MOVEMENT': return 'Movement Challenge';
      default:                return 'Challenge';
    }
  }

  isMissionLocked(index: number, mission: HealingMissionResponseDto): boolean {
    const missions = this.getDisplayMissions();
    if (!missions.length) return false;
    if (this.isMissionCompleted(mission) || this.isMissionFailed(mission)) return false;
    if (missions[0]?.id === mission.id) return false;
    const resolvedIndex = missions.findIndex((item) => item.id === mission.id);
    const sequenceIndex = resolvedIndex >= 0 ? resolvedIndex : index;
    if (sequenceIndex <= 0) return false;
    const previousMission = missions[sequenceIndex - 1];
    const previousCleared = this.isMissionCompleted(previousMission) || this.isMissionSkippedAfterFail(previousMission);
    return !previousCleared;
  }

  getFirstPlayableMission(missions: HealingMissionResponseDto[]): HealingMissionResponseDto | null {
    if (!missions.length) return null;
    return missions.find((mission, index) => !this.isMissionLocked(index, mission)) ?? null;
  }

  getFirstPendingPlayableMission(missions: HealingMissionResponseDto[], excludedMissionId?: number | null): HealingMissionResponseDto | null {
    if (!missions.length) return null;
    return missions.find((mission, index) => {
      if (excludedMissionId && mission.id === excludedMissionId) return false;
      return !this.isMissionCompleted(mission) && !this.isMissionFailed(mission) && !this.isMissionSkippedAfterFail(mission) && !this.isMissionLocked(index, mission);
    }) ?? null;
  }

  getLevelProgressPercent(): number {
    if (!this.dashboard?.stats) return 0;
    return (this.dashboard.stats.totalPoints || 0) % 100;
  }

  getPhaseClass(): string {
    return this.breathingPhase.toLowerCase();
  }

  buildAutoCompletionNote(): string {
    switch (this.activeGame) {
      case 'BREATHING':       return 'Completed breathing mini-game.';
      case 'GRATITUDE':       return 'Completed gratitude mini-game.';
      case 'VOICE_COMFORT':   return 'Completed voice mini-game.';
      case 'CALM_AUDIO':      return 'Completed audio mini-game.';
      case 'GENTLE_MOVEMENT': return 'Completed movement mini-game.';
      default:                return 'Completed healing mission.';
    }
  }

  getRandomAffirmation(): string {
    return this.affirmations[Math.floor(Math.random() * this.affirmations.length)];
  }

  animateCoinsGain(gained: number): void {
    const start = this.displayCoins;
    const end = start + gained;
    const duration = 900;
    const startTime = performance.now();

    const step = (now: number) => {
      const progress = Math.min(1, (now - startTime) / duration);
      this.displayCoins = Math.round(start + (end - start) * progress);
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }

  playCelebrationSound(): void {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99];
    let startTime = ctx.currentTime;

    notes.forEach((freq: number, index: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.12, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.24);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.25);
      startTime += 0.12 + (index * 0.01);
    });

    setTimeout(() => ctx.close(), 1000);
  }

  playMissionStartCues(mission: HealingMissionResponseDto): void {
    this.playStartSound();
    this.playGuideNarration();
  }

  playStartSound(): void {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const notes = [392.0, 523.25, 659.25];
    let startTime = ctx.currentTime;

    notes.forEach((freq: number, index: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(0.08, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.2);
      startTime += 0.1 + (index * 0.01);
    });

    setTimeout(() => ctx.close(), 900);
  }

  private playGuideNarration(): void {
    if (!this.selectedMission) return;
    setTimeout(() => this.speakText(this.avatarMessage), 600);
  }

  speakText(text: string): void {
    if (!('speechSynthesis' in window)) return;

    const synth = window.speechSynthesis;
    const voices = synth.getVoices?.() ?? [];
    if (!this.guideVoiceName) {
      this.guideVoiceName = this.pickGuideVoiceName(voices);
    }

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.92;
    utterance.pitch = 1.28;
    utterance.volume = 1;

    const preferredVoice = this.guideVoiceName
      ? voices.find((voice) => voice.name === this.guideVoiceName)
      : null;

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    this.avatarTalking = true;
    utterance.onend = () => { this.avatarTalking = false; };
    synth.speak(utterance);
  }

  private clearAllIntervals(): void {
    if (this.breathingInterval) { clearInterval(this.breathingInterval); this.breathingInterval = null; }
    if (this.calmAudioInterval) { clearInterval(this.calmAudioInterval); this.calmAudioInterval = null; }
    if (this.gratitudeTimerInterval) { clearInterval(this.gratitudeTimerInterval); this.gratitudeTimerInterval = null; }
  }


}
import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import {
  PredictionResultResponseDto,
  ScreeningAssessmentRequestDto,
  ScreeningAssessmentResponseDto,
  ScreeningAssessmentService,
} from '../../../../../core/services/module6b/screening-assessment.service';

type QuestionKey =
  | 'feelingSadOrTearful'
  | 'irritableTowardsBabyPartner'
  | 'troubleSleepingAtNight'
  | 'problemsConcentratingOrMakingDecision'
  | 'overeatingOrLossOfAppetite'
  | 'feelingAnxious'
  | 'feelingOfGuilt'
  | 'problemsOfBondingWithBaby'
  | 'suicideAttempt';

@Component({
  selector: 'app-screening-assessment',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink, ReactiveFormsModule],
  templateUrl: './screening-assessment.component.html',
  styleUrls: ['./screening-assessment.component.css'],
})
export class ScreeningAssessmentComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  assessmentForm!: FormGroup;

  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  latestAssessment: ScreeningAssessmentResponseDto | null = null;
  loadingLatest = false;

  latestPrediction: PredictionResultResponseDto | null = null;

  calmModeOn = false;
  private audio: HTMLAudioElement | null = null;

  readonly totalFields = 11;

  readonly ageOptions: string[] = ['25-30', '30-35', '35-40', '40-45', '45-50'];

  readonly questionConfigs: Array<{
    key: QuestionKey;
    label: string;
    index: number;
    options: string[];
  }> = [
    {
      key: 'feelingSadOrTearful',
      label: 'Have you felt sad or tearful recently?',
      index: 1,
      options: ['No', 'Sometimes', 'Yes'],
    },
    {
      key: 'irritableTowardsBabyPartner',
      label: 'Have you felt more irritable towards your baby or partner?',
      index: 2,
      options: ['No', 'Sometimes', 'Yes'],
    },
    {
      key: 'troubleSleepingAtNight',
      label: 'Are you having trouble sleeping through the night?',
      index: 3,
      options: ['No', 'Yes', 'Two or more days a week'],
    },
    {
      key: 'problemsConcentratingOrMakingDecision',
      label: 'Do you find it hard to concentrate or make decisions?',
      index: 4,
      options: ['No', 'Often', 'Yes'],
    },
    {
      key: 'overeatingOrLossOfAppetite',
      label: 'Have you been overeating or lost your appetite?',
      index: 5,
      options: ['Not at all', 'No', 'Yes'],
    },
    {
      key: 'feelingAnxious',
      label: 'Have you felt more anxious than usual?',
      index: 6,
      options: ['No', 'Yes'],
    },
    {
      key: 'feelingOfGuilt',
      label: 'Have you had feelings of guilt or worthlessness?',
      index: 7,
      options: ['No', 'Maybe', 'Yes'],
    },
    {
      key: 'problemsOfBondingWithBaby',
      label: 'Have you had problems bonding with your baby?',
      index: 8,
      options: ['No', 'Sometimes', 'Yes'],
    },
    {
      key: 'suicideAttempt',
      label: 'Have you had any suicidal thoughts or intentions?',
      index: 9,
      options: ['No', 'Sometimes', 'Yes'],
    },
  ];

  constructor(
    private fb: FormBuilder,
    private screeningService: ScreeningAssessmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.assessmentForm = this.fb.group({
      age: ['', Validators.required],
      feelingSadOrTearful: ['', Validators.required],
      irritableTowardsBabyPartner: ['', Validators.required],
      troubleSleepingAtNight: ['', Validators.required],
      problemsConcentratingOrMakingDecision: ['', Validators.required],
      overeatingOrLossOfAppetite: ['', Validators.required],
      feelingAnxious: ['', Validators.required],
      feelingOfGuilt: ['', Validators.required],
      problemsOfBondingWithBaby: ['', Validators.required],
      suicideAttempt: ['', Validators.required],
      sharedWithDoctor: [null, Validators.required],
    });

    this.loadLatestAssessment();
  }

  ngAfterViewInit(): void {
    this.initAudio();
    this.tryAutoPlayCalmMusic();
  }

  ngOnDestroy(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  private initAudio(): void {
    this.audio = new Audio('assets/audio/calm-ambient.mp3');
    this.audio.loop = true;
    this.audio.volume = 0.22;
    this.audio.preload = 'auto';
  }

  private async tryAutoPlayCalmMusic(): Promise<void> {
    if (!this.audio) return;

    try {
      await this.audio.play();
      this.calmModeOn = true;
    } catch {
      this.calmModeOn = false;
    }
  }

  toggleCalmMode(): void {
    if (!this.audio) return;

    if (this.calmModeOn) {
      this.audio.pause();
      this.calmModeOn = false;
      return;
    }

    this.audio
      .play()
      .then(() => {
        this.calmModeOn = true;
      })
      .catch(() => {
        this.calmModeOn = false;
      });
  }

  stopMusic(): void {
    if (!this.audio) return;

    this.audio.pause();
    this.audio.currentTime = 0;
    this.calmModeOn = false;
  }

  loadLatestAssessment(): void {
    this.loadingLatest = true;

    this.screeningService.getLatestAssessment().subscribe({
      next: (res) => {
        this.latestAssessment = res;
        this.loadingLatest = false;
      },
      error: () => {
        this.latestAssessment = null;
        this.loadingLatest = false;
      },
    });
  }

  get answeredCount(): number {
    const values = this.assessmentForm?.value;
    if (!values) return 0;

    let count = 0;

    if (values.age) count++;

    this.questionConfigs.forEach((q) => {
      if (values[q.key]) count++;
    });

    if (values.sharedWithDoctor !== null && values.sharedWithDoctor !== undefined) {
      count++;
    }

    return count;
  }

  get progressPercent(): number {
    return Math.round((this.answeredCount / this.totalFields) * 100);
  }

  isSelected(field: string, value: string | boolean): boolean {
    return this.assessmentForm.get(field)?.value === value;
  }

  selectOption(field: QuestionKey, value: string): void {
    this.assessmentForm.get(field)?.setValue(value);
    this.assessmentForm.get(field)?.markAsTouched();
  }

  selectBoolean(field: 'sharedWithDoctor', value: boolean): void {
    this.assessmentForm.get(field)?.setValue(value);
    this.assessmentForm.get(field)?.markAsTouched();
  }

  submitAssessment(): void {
    this.submitSuccess = false;
    this.submitError = '';

    if (this.assessmentForm.invalid) {
      this.assessmentForm.markAllAsTouched();
      this.submitError = 'Please complete all required fields before saving.';
      return;
    }

    this.isSubmitting = true;

    const formValue = this.assessmentForm.value;

    const payload: ScreeningAssessmentRequestDto = {
      age: formValue.age,
      feelingSadOrTearful: formValue.feelingSadOrTearful,
      irritableTowardsBabyPartner: formValue.irritableTowardsBabyPartner,
      troubleSleepingAtNight: formValue.troubleSleepingAtNight,
      problemsConcentratingOrMakingDecision:
        formValue.problemsConcentratingOrMakingDecision,
      overeatingOrLossOfAppetite: formValue.overeatingOrLossOfAppetite,
      feelingAnxious: formValue.feelingAnxious,
      feelingOfGuilt: formValue.feelingOfGuilt,
      problemsOfBondingWithBaby: formValue.problemsOfBondingWithBaby,
      suicideAttempt: formValue.suicideAttempt,
      sharedWithDoctor: formValue.sharedWithDoctor,
    };

    this.screeningService.createAssessment(payload).subscribe({
      next: (prediction) => {
        this.latestPrediction = prediction;
        this.isSubmitting = false;
        this.submitSuccess = true;
        this.submitError = '';

        setTimeout(() => {
          this.router.navigate(['/mother/postpartum/predictions']);
        }, 700);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.submitSuccess = false;
        this.submitError = 'Unable to save the assessment right now. Please try again.';
        console.log(err);
      },
    });
  }

  get ageError(): string {
    const control = this.assessmentForm.get('age');
    if (!control?.touched && !control?.dirty) return '';

    if (control.hasError('required')) return 'Age range is required.';
    return '';
  }

  hasFieldError(field: string): boolean {
    const control = this.assessmentForm.get(field);
    return !!control && control.invalid && (control.touched || control.dirty);
  }
}
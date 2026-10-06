import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { NotifyService } from '../../../core/services/notify.service';
import { CourseCard, PartnerGuide } from '../../../core/models/api.models';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-admin-studio',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MatIcon],
  templateUrl: './studio.component.html',
  styleUrls: ['./studio.component.scss']
})
export class AdminStudioComponent implements OnInit {
  private admin = inject(AdminService);
  private notify = inject(NotifyService);
  private fb = inject(FormBuilder);

  courses: CourseCard[] = [];
  guides: PartnerGuide[] = [];
  activeTab: 'course' | 'module' | 'quiz' | 'guide' = 'course';
  videoStatus: string | null = null;
  videoUrl: string | null = null;
  selectedPdf: File | null = null;
  videoProgress: number = 0;

  courseForm: any = { title: '', titleAr: '', description: '', category: 'Prenatal care', durationMin: 20, level: 'BEGINNER', thumbnail: '' };
  moduleForm: any = { courseId: null, title: '', contentType: 'TEXT', contentText: '', contentUrl: '', orderIndex: 1, durationMin: 10 };
  guideForm: any = { title: '', titleAr: '', content: '', targetWeek: 20, category: 'Supportive communication' };
  aiForm!: FormGroup;
  quizReactiveForm!: FormGroup;
  isGenerating: boolean = false;
  questionTypes = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'OPEN_ENDED']

  ngOnInit(): void { 
    this.reload(); 
    this.initReactiveForms();
  }

  reload(): void {
    this.admin.getCourses().subscribe({ next: data => this.courses = data });
    this.admin.getGuides().subscribe({ next: data => this.guides = data });
  }

  initReactiveForms() {
    this.aiForm = this.fb.group({
      courseModuleId: [null, Validators.required],
      topic: ['', Validators.required],
      numberOfQuestions: [5, [Validators.required, Validators.min(1)]],
      passScore: [70, Validators.required]
    });

    this.quizReactiveForm = this.fb.group({
      id: [null],
      courseModuleId: [null, Validators.required],
      passScore: [70, Validators.required],
      questions: this.fb.array([])
    });
  }

  get questions(): FormArray {
    return this.quizReactiveForm.get('questions') as FormArray;
  }

  addQuestion() {
    const questionGroup = this.fb.group({
      questionText: ['', Validators.required],
      questionType: ['SINGLE_CHOICE', Validators.required],
      choices: this.fb.array([])
    });
    this.questions.push(questionGroup);
  }

  removeQuestion(index: number) {
    this.questions.removeAt(index);
  }

  getChoices(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('choices') as FormArray;
  }

  addChoice(questionIndex: number) {
    const choiceGroup = this.fb.group({
      choiceText: ['', Validators.required],
      correct: [false]
    });
    this.getChoices(questionIndex).push(choiceGroup);
  }

  removeChoice(questionIndex: number, choiceIndex: number) {
    this.getChoices(questionIndex).removeAt(choiceIndex);
  }

  generateWithAI() {
    if (this.aiForm.invalid) {
      this.notify.error('Please fill required AI fields.');
      return;
    }
    this.isGenerating = true;
    const vals = this.aiForm.getRawValue();

    this.admin.generateQuizViaAI(vals.courseModuleId, vals.topic, vals.numberOfQuestions, vals.passScore).subscribe({
      next: (quizData) => {
        this.notify.success('AI Quiz Generated! Review it in the editor.');
        this.isGenerating = false;
        this.patchQuizForm(quizData);
      },
      error: () => {
        this.notify.error('AI Generation failed.');
        this.isGenerating = false;
      }
    });
  }

  saveReactiveQuiz() {
    if (this.quizReactiveForm.invalid) {
      this.notify.error('Please complete all question fields.');
      return;
    }
    const data = this.quizReactiveForm.getRawValue();
    if (data.id) {
      this.admin.updateQuiz(data.id, data).subscribe({
        next: () => this.notify.success('Quiz updated successfully.'),
        error: () => this.notify.error('Quiz update failed.')
      });
    } else {
      // NOTE: Make sure 'admin.createQuiz' takes the raw data payload.
      this.admin.createQuiz(data).subscribe({
        next: () => {
            this.notify.success('Quiz created successfully.');
            this.quizReactiveForm.reset({ passScore: 70 });
            this.questions.clear();
        },
        error: () => this.notify.error('Quiz creation failed.')
      });
    }
  }

  patchQuizForm(quizData: any) {
    this.quizReactiveForm.patchValue({
      id: quizData.id,
      courseModuleId: quizData.courseModuleId || quizData.courseModule?.id,
      passScore: quizData.passScore
    });

    this.questions.clear();
    quizData.questions.forEach((q: any) => {
      const qGroup = this.fb.group({
        questionText: [q.questionText, Validators.required],
        questionType: [q.questionType, Validators.required],
        choices: this.fb.array([])
      });

      if (q.choices) {
        q.choices.forEach((c: any) => {
          (qGroup.get('choices') as FormArray).push(this.fb.group({
            choiceText: [c.choiceText, Validators.required],
            correct: [c.correct]
          }));
        });
      }
      this.questions.push(qGroup);
    });
  }

  saveCourse(): void {
    this.admin.createCourse(this.courseForm).subscribe({ next: () => { this.notify.success('Course created.'); this.courseForm = { title: '', titleAr: '', description: '', category: 'Prenatal care', durationMin: 20, level: 'BEGINNER', thumbnail: '' }; this.reload(); }, error: () => this.notify.error('Course creation failed.') });
  }

  saveModule(): void {
    this.admin.createModule(this.moduleForm).subscribe({ next: () => this.notify.success('Module created.'), error: () => this.notify.error('Module creation failed.') });
  }

  saveGuide(): void {
    this.admin.createGuide(this.guideForm).subscribe({ next: () => { this.notify.success('Guide created.'); this.reload(); }, error: () => this.notify.error('Guide creation failed.') });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      this.selectedPdf = file;
    } else if (file) {
      this.notify.error('Please select a valid PDF file.');
      this.selectedPdf = null;
    }
  }

  /* generateNotebookLmVideo(): void {
    if (!this.moduleForm.contentText && !this.selectedPdf) {
      this.notify.error('Please add textual content or upload a PDF first.');
      return;
    }
    
    this.videoStatus = 'Initializing NotebookLM...';
    this.videoProgress = 5;
    
    this.admin.triggerNotebookLmVideo(this.moduleForm.contentText, this.selectedPdf || undefined).subscribe({
      next: (response: any) => {
        this.videoStatus = 'Generating Studio Video...';
        this.pollVideoStatus(response.task_id);
      },
      error: () => {
        this.notify.error('Failed to connect to AI sidecar.');
        this.videoStatus = null;
        this.videoProgress = 0;
      }
    });
  } */

generateNotebookLmVideo(): void {
    if (!this.moduleForm.contentText && !this.selectedPdf) {
      this.notify.error('Please add textual content or upload a PDF first.');
      return;
    }

    if (!this.moduleForm.courseId) {
      this.notify.error('Please specify the Parent Course ID first.');
      return;
    }
    
    this.videoStatus = 'Initializing NotebookLM...';
    this.videoProgress = 5;
    
    // THE FIX: Find the actual course object from the loaded 'courses' array
    // using the courseId entered in the module form.
    const selectedCourseId = Number(this.moduleForm.courseId);
    const parentCourse = this.courses.find(c => c.id === selectedCourseId);
    
    const courseTitle = parentCourse ? parentCourse.title : 'Unknown Course';
    const courseId = selectedCourseId.toString();
    const moduleTitle = this.moduleForm.title || 'Untitled Module';
    
    this.admin.triggerNotebookLmVideo(
      this.moduleForm.contentText, 
      this.selectedPdf || undefined,
      courseTitle,
      courseId,
      moduleTitle
    ).subscribe({
      next: (response: any) => {
        this.videoStatus = 'Generating Studio Video...';
        this.pollVideoStatus(response.task_id);
      },
      error: () => {
        this.notify.error('Failed to connect to AI sidecar.');
        this.videoStatus = null;
        this.videoProgress = 0;
      }
    });
  }

  pollVideoStatus(taskId: string): void {
    const interval = setInterval(() => {
      // Increment progress smoothly up to 90% while polling
      if (this.videoProgress < 90) {
        this.videoProgress += Math.floor(Math.random() * 5) + 2; 
      }

      this.admin.checkVideoStatus(taskId).subscribe({
        next: (res: any) => {
          if (res.status === 'COMPLETED') {
            this.videoProgress = 100;
            this.videoStatus = 'Generation Complete!';
            this.videoUrl = res.url;
            this.moduleForm.contentUrl = res.url; // Auto-attach to module
            clearInterval(interval);
          } else if (res.status === 'FAILED') {
            this.videoProgress = 0;
            this.videoStatus = `Error: ${res.error}`;
            this.notify.error('NotebookLM generation failed.');
            clearInterval(interval);
          }
        }
      });
    }, 8000); // Poll every 8 seconds to avoid rate-limiting
  }
}

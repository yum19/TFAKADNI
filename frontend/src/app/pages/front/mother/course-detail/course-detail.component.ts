import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LearningService } from '../../../../core/services/learning.service';
import { Course, CourseModule, Enrollment, Quiz, QuizAttempt, Review } from '../../../../core/models/api.models';
import { NotifyService } from '../../../../core/services/notify.service';
import { AiService } from '../../../../core/services/ai.service';
import { MatIconModule } from '@angular/material/icon';
import { RichContentPipe } from '../../../../core/pipes/markdown-content.pipe';

@Component({
  selector: 'app-mother-course-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, RichContentPipe],
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.scss']
})
export class MotherCourseDetailComponent implements OnInit {
  private route    = inject(ActivatedRoute);
  private learning = inject(LearningService);
  private ai       = inject(AiService);
  private notify   = inject(NotifyService);

  courseId = Number(this.route.snapshot.paramMap.get('id'));

  course?:         Course;
  modules:         CourseModule[] = [];
  reviews:         Review[]       = [];
  enrollment?:     Enrollment;
  selectedModule?: CourseModule;
  selectedQuiz?:   Quiz;
  quizAttempt?:    any;
  answers:         Record<number, any> = {};
  reviewForm:      Review = { courseId: this.courseId, rating: 5, comment: '' };
  simplifiedText = '';
  loadingQuiz    = false;
  showReviewForm = false;

  // Expose range array for star display
  range5 = [1, 2, 3, 4, 5];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.learning.getCourse(this.courseId).subscribe({ next: c => this.course = c });
    this.learning.getCourseModules(this.courseId).subscribe({
      next: data => { this.modules = data; this.selectedModule = data[0]; }
    });
    this.learning.getReviews(this.courseId).subscribe({ next: data => this.reviews = data });
    this.learning.getMyEnrollmentForCourse(this.courseId).subscribe({
      next:  data => this.enrollment = data,
      error: ()   => this.enrollment = undefined
    });
  }

  enroll(): void {
    this.learning.enroll(this.courseId).subscribe({
      next:  data => { this.enrollment = data; this.notify.success('You are now enrolled!'); },
      error: ()   => this.notify.error('Enrollment failed.')
    });
  }

  openModule(module: CourseModule): void {
    this.selectedModule = module;
    this.selectedQuiz   = undefined;
    this.quizAttempt    = undefined;
    this.simplifiedText = '';
  }

  loadQuiz(module: CourseModule): void {
    if (!module.quizId) return;
    this.loadingQuiz = true;
    this.quizAttempt = undefined;

    this.learning.getQuiz(module.quizId).subscribe({
      next: data => {
        this.selectedQuiz = data;
        this.answers      = {};
        if (data.questions) {
          data.questions.forEach((q: any) => {
            if      (q.questionType === 'MULTIPLE_CHOICE') this.answers[q.id] = [];
            else if (q.questionType === 'OPEN_ENDED')      this.answers[q.id] = '';
            else                                           this.answers[q.id] = null;
          });
        }
      },
      error:    () => this.notify.error('Quiz could not be loaded.'),
      complete: () => this.loadingQuiz = false
    });
  }

  toggleMultipleChoice(questionId: number, choiceId: number, event: any): void {
    const isChecked  = event.target.checked;
    const arr        = this.answers[questionId] as number[];
    if (isChecked) { arr.push(choiceId); }
    else { const idx = arr.indexOf(choiceId); if (idx > -1) arr.splice(idx, 1); }
  }

  submitQuiz(): void {
    if (!this.selectedQuiz) return;
    this.loadingQuiz = true;

    const answersPayload = this.selectedQuiz.questions.map((q: any) => {
      const ans: any = { questionId: q.id };
      if      (q.questionType === 'SINGLE_CHOICE')   ans.selectedChoiceId  = this.answers[q.id];
      else if (q.questionType === 'MULTIPLE_CHOICE') ans.selectedChoiceIds = this.answers[q.id];
      else if (q.questionType === 'OPEN_ENDED')      ans.textAnswer        = this.answers[q.id];
      return ans;
    });

    this.learning.submitQuiz(this.selectedQuiz.id, answersPayload).subscribe({
      next: data => {
        this.quizAttempt = data;
        this.loadingQuiz = false;
        if (data.passed) {
          this.notify.success('Quiz passed! Progress updated.');
          this.learning.getMyEnrollmentForCourse(this.courseId).subscribe({ next: e => this.enrollment = e });
        } else {
          this.notify.error('Keep learning and try again!');
        }
      },
      error: () => { this.notify.error('Quiz submission failed.'); this.loadingQuiz = false; }
    });
  }

  saveReview(): void {
    this.learning.saveReview(this.reviewForm).subscribe({
      next:  () => { this.notify.success('Review saved!'); this.load(); this.showReviewForm = false; },
      error: () => this.notify.error('Review could not be saved.')
    });
  }

  simplifyModule(): void {
    if (!this.selectedModule?.id) return;
    this.ai.simplifyModule(this.selectedModule.id).subscribe({
      next:  res => this.simplifiedText = res.result,
      error: ()  => this.notify.error('AI simplify could not run.')
    });
  }

  downloadCertificate(): void {
    this.learning.downloadCertificate(this.courseId).subscribe({
      next: blob => {
        const url = window.URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href = url; a.download = `certificate-course-${this.courseId}.pdf`; a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.notify.error('Certificate not yet available. Complete the course first.')
    });
  }
}
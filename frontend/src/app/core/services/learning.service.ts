import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Course, CourseCard, CourseModule, Enrollment, Quiz, QuizAttempt, RecommendedCourse, Review } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class LearningService {
  private http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  getCourses(): Observable<CourseCard[]> {
    return this.http.get<CourseCard[]>(`${this.api}/learning/courses`);
  }

  searchCourses(keyword: string): Observable<CourseCard[]> {
    return this.http.get<CourseCard[]>(`${this.api}/learning/courses/search`, { params: { keyword } });
  }

  filterCourses(category?: string, level?: string): Observable<CourseCard[]> {
    const params: Record<string, string> = {};
    if (category) params['category'] = category;
    if (level) params['level'] = level;
    return this.http.get<CourseCard[]>(`${this.api}/learning/courses/filter`, { params });
  }

  getCourse(id: number): Observable<Course> {
    return this.http.get<Course>(`${this.api}/learning/courses/${id}`);
  }

  getCourseModules(courseId: number): Observable<CourseModule[]> {
    return this.http.get<CourseModule[]>(`${this.api}/learning/course-modules/course/${courseId}`);
  }

  getReviews(courseId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.api}/learning/reviews/course/${courseId}`);
  }

  saveReview(payload: Review): Observable<Review> {
    return this.http.post<Review>(`${this.api}/learning/reviews`, payload);
  }

  enroll(courseId: number): Observable<Enrollment> {
    return this.http.post<Enrollment>(`${this.api}/learning/enrollments`, { courseId });
  }

  getMyEnrollments(): Observable<Enrollment[]> {
    return this.http.get<Enrollment[]>(`${this.api}/learning/enrollments/me`);
  }

  getMyEnrollmentForCourse(courseId: number): Observable<Enrollment> {
    return this.http.get<Enrollment>(`${this.api}/learning/enrollments/me/course/${courseId}`);
  }

  updateProgress(courseId: number, progressPct: number): Observable<Enrollment> {
    return this.http.put<Enrollment>(`${this.api}/learning/enrollments/progress`, { courseId, progressPct });
  }

  getQuiz(quizId: number): Observable<Quiz> {
    return this.http.get<Quiz>(`${this.api}/learning/quizzes/${quizId}`);
  }

  submitQuiz(quizId: number, answers: any[]): Observable<any> {
    return this.http.post<any>(`${this.api}/learning/quizzes/submit`, { quizId, answers });
  }

  getMyAttempts(quizId: number): Observable<QuizAttempt[]> {
    return this.http.get<QuizAttempt[]>(`${this.api}/learning/quizzes/${quizId}/attempts/me`);
  }

  getRecommendations(currentWeek?: number): Observable<RecommendedCourse[]> {
    const params: Record<string, string> = {};
    if (currentWeek !== undefined && currentWeek !== null) params['currentWeek'] = String(currentWeek);
    return this.http.get<RecommendedCourse[]>(`${this.api}/learning/recommendations/me`, { params });
  }

  downloadCertificate(courseId: number): Observable<Blob> {
    return this.http.get(`${this.api}/learning/certificates/me/course/${courseId}`, { responseType: 'blob' });
  }

  updateQuiz(quizId: number, quizRequest: any): Observable<any> {
    return this.http.put(`${this.api}/learning/quizzes/${quizId}`, quizRequest);
  }

  deleteQuiz(quizId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/learning/quizzes/${quizId}`);
  }

  generateQuizViaAI(courseModuleId: number, topic: string, numberOfQuestions: number, passScore: number): Observable<any> {
    const params = {
      courseModuleId: courseModuleId.toString(),
      topic: topic,
      numberOfQuestions: numberOfQuestions.toString(),
      passScore: passScore.toString()
    };
    return this.http.post(`${this.api}/learning/quizzes/generate-ai`, {}, { params });
  }
}

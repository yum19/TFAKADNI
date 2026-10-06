import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, Course, CourseCard, CourseModule, PartnerGuide, Quiz } from '../models/api.models';
import { AdminUserResponse } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  getCourses(): Observable<CourseCard[]> {
    return this.http.get<CourseCard[]>(`${this.api}/learning/courses`);
  }

  createCourse(payload: Partial<Course>): Observable<Course> {
    return this.http.post<Course>(`${this.api}/learning/courses`, payload);
  }

  createModule(payload: any): Observable<CourseModule> {
    return this.http.post<CourseModule>(`${this.api}/learning/course-modules`, payload);
  }

  createGuide(payload: any): Observable<PartnerGuide> {
    return this.http.post<PartnerGuide>(`${this.api}/partner/partner-guides`, payload);
  }

  getGuides(): Observable<PartnerGuide[]> {
    return this.http.get<PartnerGuide[]>(`${this.api}/partner/partner-guides`);
  }

  // --- QUIZ MANAGEMENT ENDPOINTS ---

  createQuiz(payload: any): Observable<Quiz> {
    return this.http.post<Quiz>(`${this.api}/learning/quizzes`, payload);
  }

  updateQuiz(quizId: number, payload: any): Observable<Quiz> {
    return this.http.put<Quiz>(`${this.api}/learning/quizzes/${quizId}`, payload);
  }

  deleteQuiz(quizId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/learning/quizzes/${quizId}`);
  }

  generateQuizViaAI(courseModuleId: number, topic: string, numberOfQuestions: number, passScore: number): Observable<Quiz> {
    const params = {
      courseModuleId: courseModuleId.toString(),
      topic: topic,
      numberOfQuestions: numberOfQuestions.toString(),
      passScore: passScore.toString()
    };
    // We pass an empty object {} for the body because Spring Boot is expecting @RequestParams (query parameters)
    return this.http.post<Quiz>(`${this.api}/learning/quizzes/generate-ai`, {}, { params });
  }

  // --- AI VIDEO SYNC ENDPOINTS ---

  triggerNotebookLmVideo(content: string, file: File | undefined, courseTitle: string, courseId: string, moduleTitle: string) {
    const formData = new FormData();
    if (content) {
      formData.append('content', content);
    }
    if (file) {
      formData.append('file', file);
    }
    // Append the new synchronization parameters
    formData.append('course_title', courseTitle);
    formData.append('course_id', courseId);
    formData.append('module_title', moduleTitle);
    
    return this.http.post(`${this.api}/learning/ai/video`, formData);
  }

  checkVideoStatus(taskId: string) {
    return this.http.get(`${this.api}/learning/ai/video/${taskId}`);
  }

  updateCourse(id: number, payload: any): Observable<CourseCard> {
    return this.http.put<CourseCard>(`${this.api}/learning/courses/${id}`, payload);
  }

  deleteCourse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/learning/courses/${id}`);
  }

  updateModule(id: number, payload: any): Observable<CourseModule> {
    return this.http.put<CourseModule>(`${this.api}/learning/course-modules/${id}`, payload);
  }

  deleteModule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/learning/course-modules/${id}`);
  }

  updateGuide(id: number, payload: any): Observable<PartnerGuide> {
    return this.http.put<PartnerGuide>(`${this.api}/partner/partner-guides/${id}`, payload);
  }

  deleteGuide(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/partner/partner-guides/${id}`);
  }

  getAllUsers(): Observable<ApiResponse<AdminUserResponse[]>> {
    return this.http.get<ApiResponse<AdminUserResponse[]>>(`${this.api}/users`);
  }

  getUserDetail(userId: number): Observable<ApiResponse<AdminUserResponse>> {
    return this.http.get<ApiResponse<AdminUserResponse>>(`${this.api}/users/${userId}/detail`);
  }

  deleteUser(userId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/users/${userId}`);
  }

  getUserSessions(userId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.api}/users/${userId}/sessions`);
  }

  revokeSession(userId: number, sessionId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/users/${userId}/sessions/${sessionId}`);
  }
  
}
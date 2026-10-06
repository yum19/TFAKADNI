import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AdminService } from '../../../core/services/admin.service';
import { LearningService } from '../../../core/services/learning.service';
import { NotifyService } from '../../../core/services/notify.service';
import { CourseCard, CourseModule } from '../../../core/models/api.models';

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss']
})
export class AdminCoursesComponent implements OnInit {
  private admin = inject(AdminService);
  private learning = inject(LearningService);
  private notify = inject(NotifyService);

  courses: CourseCard[] = [];
  expandedCourseId: number | null = null;
  courseModules: CourseModule[] = [];
  editingCourse: any = null;

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.admin.getCourses().subscribe({ next: (data) => this.courses = data });
  }

  toggleCourseDetails(courseId: number) {
    if (this.expandedCourseId === courseId) {
      this.expandedCourseId = null;
      this.courseModules = [];
    } else {
      this.expandedCourseId = courseId;
      this.learning.getCourseModules(courseId).subscribe({
        next: (mods) => this.courseModules = mods,
        error: () => this.notify.error('Could not load modules.')
      });
    }
  }

  startEditCourse(course: CourseCard) {
    this.editingCourse = { ...course }; 
  }

  saveCourse() {
    this.admin.updateCourse(this.editingCourse.id, this.editingCourse).subscribe({
      next: () => {
        this.notify.success('Course updated successfully.');
        this.editingCourse = null;
        this.loadData();
      },
      error: () => this.notify.error('Update failed.')
    });
  }

  deleteCourse(id: number) {
    if (confirm('WARNING: Deleting this course will also delete ALL its modules and quizzes. Are you sure?')) {
      this.admin.deleteCourse(id).subscribe({
        next: () => {
          this.notify.success('Course deleted.');
          if (this.expandedCourseId === id) this.expandedCourseId = null;
          this.loadData();
        },
        error: () => this.notify.error('Failed to delete course.')
      });
    }
  }

  deleteModule(id: number, courseId: number) {
    if (confirm('Are you sure you want to delete this module and its associated quiz?')) {
      this.admin.deleteModule(id).subscribe({
        next: () => {
          this.notify.success('Module deleted.');
          this.learning.getCourseModules(courseId).subscribe(mods => this.courseModules = mods);
        },
        error: () => this.notify.error('Failed to delete module.')
      });
    }
  }

  deleteQuiz(quizId: number, courseId: number) {
    if (confirm('Are you sure you want to delete this quiz?')) {
      this.admin.deleteQuiz(quizId).subscribe({
        next: () => {
          this.notify.success('Quiz deleted.');
          this.learning.getCourseModules(courseId).subscribe(mods => this.courseModules = mods);
        },
        error: () => this.notify.error('Failed to delete quiz.')
      });
    }
  }
}
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LearningService } from '../../../../core/services/learning.service';
import { CourseCard } from '../../../../core/models/api.models';

@Component({
  selector: 'app-mother-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss']
})
export class MotherCoursesComponent {
  private learning = inject(LearningService);
  courses: CourseCard[] = [];
  filtered: CourseCard[] = [];
  search = '';
  selectedCategory = '';
  categories = ['Emotional balance', 'Nutrition', 'Prenatal care', 'Partner support', 'Birth prep'];

  ngOnInit(): void {
    this.learning.getCourses().subscribe({ next: data => { this.courses = data; this.filtered = data; } });
  }

  apply(): void {
    const term = this.search.toLowerCase().trim();
    this.filtered = this.courses.filter(course => {
      const matchesTerm = !term || [course.title, course.titleAr, course.category, course.level].join(' ').toLowerCase().includes(term);
      const matchesCategory = !this.selectedCategory || course.category === this.selectedCategory;
      return matchesTerm && matchesCategory;
    });
  }
}

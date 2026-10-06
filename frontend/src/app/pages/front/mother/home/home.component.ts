// home.component.ts
import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LearningService } from '../../../../core/services/learning.service';
import { PartnerService } from '../../../../core/services/partner.service';
import { SessionService } from '../../../../core/services/session.service';

@Component({
  selector: 'app-mother-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class MotherHomeComponent implements OnInit {
  private learning = inject(LearningService);
  private partner = inject(PartnerService);
  session = inject(SessionService);

  enrollmentsCount = 0;
  notificationsCount = 0;
  coursesCount = 0;

  stats: { icon: string; val: any; lbl: string }[] = [];

  highlights = [
    'Review one short learning module every week instead of saving everything for the same stressful day.',
    'Use notes to ask for concrete help: transport, meals, appointment reminders or emotional check-ins.',
    'Treat the partner space as teamwork, not surveillance: share what helps, not everything by default.'
  ];

  weekActions = [
    {
      title: 'Body comfort',
      text: 'Keep hydration visible, move gently and watch any unusual symptom pattern instead of guessing alone.'
    },
    {
      title: 'Mental load',
      text: 'Write down the next three appointments or tasks only. A short visible plan lowers stress better than a long invisible one.'
    },
    {
      title: 'Partner support',
      text: 'Ask for one specific support action this week: groceries, transport, pharmacy stop or quiet company.'
    }
  ];

  ngOnInit(): void {
    this.learning.getCourses().subscribe({ next: data => this.coursesCount = data.length });
    this.learning.getMyEnrollments().subscribe({ next: data => this.enrollmentsCount = data.length });
    this.partner.getUnreadNotificationsCount().subscribe({ next: data => this.notificationsCount = data });

    // Populate stats array after counts are available
    this.stats = [
      { icon: '📚', val: this.coursesCount, lbl: 'Academy Courses' },
      { icon: '📋', val: this.enrollmentsCount, lbl: 'Your Enrollments' },
      { icon: '🔔', val: this.notificationsCount, lbl: 'Unread Alerts' },
      { icon: '👤', val: this.session.user?.role || 'Mother', lbl: 'Current Role' }
    ];
  }
}
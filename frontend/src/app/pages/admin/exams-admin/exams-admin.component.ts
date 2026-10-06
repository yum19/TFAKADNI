import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { PrenatalExam } from '../../../core/models/pregnancy.model';
import { PrenatalExamService } from '../../../core/services/prenatal-exam.service';

@Component({
  selector: 'app-exams-admin',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDividerModule, FormsModule,
  ],
  templateUrl: './exams-admin.html',
  styleUrl: './exams-admin.scss'
})
export class ExamsAdminComponent implements OnInit {

  allExams: PrenatalExam[] = [];
  dataSource = new MatTableDataSource<PrenatalExam>([]);
  displayedColumns = [ 'pregnancy', 'examName', 'examType', 'recommendedWeek', 'done', 'doneDate', 'resultNotes'];

  loading = true;
  totalExams = 0;
  totalDone = 0;
  totalPending = 0;
  filterStatus = 'ALL';
  filterType = 'ALL';
  filterPatient = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private examService: PrenatalExamService) {}

  ngOnInit() { this.loadAll(); }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadAll() {
    this.loading = true;
    this.examService.getAllExamsAdmin().subscribe({
      next: (list) => {
        this.allExams = list;
        this.totalExams = list.length;
        this.totalDone = list.filter(e => e.done).length;
        this.totalPending = list.filter(e => !e.done).length;
        this.applyFilters();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

applyFilters() {
    let filtered = this.allExams;

    if (this.filterStatus === 'DONE')    filtered = filtered.filter(e => e.done);
    if (this.filterStatus === 'PENDING') filtered = filtered.filter(e => !e.done);
    if (this.filterType !== 'ALL')       filtered = filtered.filter(e => e.examType === this.filterType);

    if (this.filterPatient.trim()) {
      const q = this.filterPatient.toLowerCase();
      filtered = filtered.filter(e => {
        const user = e.pregnancy?.user;
        if (!user) return false;
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        return fullName.includes(q) || (user.email && user.email.toLowerCase().includes(q));
      });
    }

    this.dataSource.data = filtered;
  }

  getPatientName(e: PrenatalExam): string {
    const user = e.pregnancy?.user;
    if (user) {
      if (user.firstName || user.lastName) {
        return `${user.firstName || ''} ${user.lastName || ''}`.trim();
      }
      if (user.email) return user.email;
    }
    return 'Patient';
  }

  getPatientInitials(e: PrenatalExam): string {
    const user = e.pregnancy?.user;
    if (!user) return '?';
    
    if (user.firstName && user.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase();
    }
    if (user.firstName) return user.firstName.substring(0, 2).toUpperCase();
    if (user.email) return user.email.substring(0, 2).toUpperCase();
    
    return '?';
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getTypeLabel(t: string): string {
    const m: any = { MANDATORY: 'Mandatory', OPTIONAL: 'Optional', CUSTOM: 'Custom' };
    return m[t] || t;
  }

  getTypeColor(t: string): string {
    const m: any = { MANDATORY: '#f44336', OPTIONAL: '#03a9f4', CUSTOM: '#9c27b0' };
    return m[t] || '#999';
  }
}
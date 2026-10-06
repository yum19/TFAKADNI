import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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
import { MatChipsModule } from '@angular/material/chips';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Pregnancy } from '../../../core/models/pregnancy.model';
import { PregnancyService } from '../../../core/services/pregnancy.service';

@Component({
  selector: 'app-admin-pregnancies',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatDividerModule, MatChipsModule,
    ReactiveFormsModule, FormsModule,
  ],
  templateUrl: './pregnancies.html',
  styleUrl: './pregnancies.scss'
})
export class PregnanciesComponent implements OnInit, AfterViewInit {

  dataSource = new MatTableDataSource<Pregnancy>([]);
  displayedColumns = [ 'user', 'lmpDate', 'dueDate', 'pregnancyType', 'status', 'doctor', 'actions'];
  loading = true;

  totalPregnancies = 0;
  activePregnancies = 0;
  completedPregnancies = 0;

  showStatusForm = false;
  selectedPregnancy: Pregnancy | null = null;
  newStatus = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private pregnancyService: PregnancyService) {}

  ngOnInit() { this.loadAll(); }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // FIX: Filter by firstName, lastName, or email
    this.dataSource.filterPredicate = (data: Pregnancy, filter: string) => {
      const fName = (data.user?.firstName || '').toLowerCase();
      const lName = (data.user?.lastName || '').toLowerCase();
      const email = (data.user?.email || '').toLowerCase();
      const id    = String(data.user?.id || '');
      
      const fullName = `${fName} ${lName}`.trim();
      return fullName.includes(filter) || email.includes(filter) || id.includes(filter);
    };
  }

  loadAll() {
    this.loading = true;
    this.pregnancyService.getAllPregnanciesAdmin().subscribe({
      next: (list) => {
        this.dataSource.data = list;
        this.totalPregnancies = list.length;
        this.activePregnancies = list.filter(p => p.status === 'ACTIVE').length;
        this.completedPregnancies = list.filter(p => p.status === 'COMPLETED').length;
        this.loading = false;
      },
      error: (err) => { 
        console.error('Failed to load pregnancies:', err);
        this.loading = false; 
      }
    });
  }

  openStatusForm(p: Pregnancy) {
    this.selectedPregnancy = p;
    this.newStatus = p.status;
    this.showStatusForm = true;
  }

  closeStatusForm() { this.showStatusForm = false; this.selectedPregnancy = null; }

  changeStatus() {
    if (!this.selectedPregnancy || !this.newStatus) return;
    this.pregnancyService.updateStatusAdmin(this.selectedPregnancy.id, this.newStatus).subscribe({
      next: () => { this.closeStatusForm(); this.loadAll(); },
      error: (err) => { console.error('Failed to update status:', err); }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getStatusLabel(s: string): string {
    const map: any = { ACTIVE: 'Active', COMPLETED: 'Completed', MISCARRIAGE: 'Miscarriage', TERMINATED: 'Terminated' };
    return map[s] || s;
  }

  getStatusColor(s: string): string {
    const map: any = { ACTIVE: '#4caf50', COMPLETED: '#03a9f4', MISCARRIAGE: '#f44336', TERMINATED: '#ff9800' };
    return map[s] || '#999';
  }

  getTypeLabel(t: string): string {
    const map: any = { SINGLETON: 'Singleton', TWINS: 'Twins', TRIPLETS: 'Triplets' };
    return map[t] || t;
  }
}
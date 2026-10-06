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
import { Vitals } from '../../../core/models/pregnancy.model';
import { VitalsService } from '../../../core/services/vitals.service';

@Component({
  selector: 'app-vitals-admin',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatIconModule, MatButtonModule,
    MatProgressBarModule, MatTableModule, MatPaginatorModule,
    MatSortModule, MatFormFieldModule, MatInputModule,
  ],
  templateUrl: './vitals-admin.html',
  styleUrl: './vitals-admin.scss'
})
export class VitalsAdminComponent implements OnInit, AfterViewInit {

  dataSource = new MatTableDataSource<Vitals>([]);
  displayedColumns = [ 'user', 'measuredAt', 'systolicBp', 'weightKg', 'heartRate', 'temperatureC', 'oxygenPct'];
  loading = true;

  totalVitals = 0;
  totalHypertension = 0;
  totalFever = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private vitalsService: VitalsService) {}

  ngOnInit() { this.loadAll(); }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // FIX: Filter by firstName, lastName, or email
    this.dataSource.filterPredicate = (data: Vitals, filter: string) => {
      const fName = (data.user?.firstName || '').toLowerCase();
      const lName = (data.user?.lastName || '').toLowerCase();
      const email = (data.user?.email || '').toLowerCase();
      const fullName = `${fName} ${lName}`.trim();
      return fullName.includes(filter) || email.includes(filter);
    };
  }

  loadAll() {
    this.loading = true;
    this.vitalsService.getAllVitalsAdmin().subscribe({
      next: (list) => {
        this.dataSource.data = list;
        this.totalVitals = list.length;
        this.totalHypertension = list.filter(v => v.systolicBp >= 140).length;
        this.totalFever = list.filter(v => v.temperatureC && v.temperatureC > 38).length;
        this.loading = false;
      },
      error: (err) => { 
        console.error('Failed to load vitals:', err);
        this.loading = false; 
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  getTensionStatus(s: number, d: number): string {
    if (s >= 140 || d >= 90) return 'danger';
    if (s >= 130 || d >= 80) return 'warning';
    return 'normal';
  }
}
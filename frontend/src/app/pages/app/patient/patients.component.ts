import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, ViewChild, signal, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { MatSort, MatSortModule } from "@angular/material/sort";
import { MatDialog, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatChipsModule } from "@angular/material/chips";
import { MatFormField, MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatListModule } from "@angular/material/list";
import { MatMenuModule } from "@angular/material/menu";
import { FormsModule } from "@angular/forms";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { PageRightComponent } from "../../../components/page-right/pageright.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EditPatientDialogComponent } from "./editpatient.component";
import { MatDrawer, MatSidenavModule } from "@angular/material/sidenav";
import { ViewPatientDrawerComponent } from "./viewpatient.component";
import Swiper from "swiper";
import { register } from "swiper/element/bundle";
register();
declare const jsVectorMap: any;

export interface TableItem {
    patientImage: string;
    patientName: string;
    city: string;
    country: string;
    email: string;
    phone: string;
    lastVisit: string;
    lastVisitedTime: string;
    totalAdmitTime: number;
    totalAmountBill: number;
    activeTask: number;
    completedTask: number;
    cancelledTask: number;
    status: string;
}

@Component({
    selector: "app-patients",
    standalone: true,
    imports: [CommonModule, MatCardModule, MatIconModule, MatMenuModule, MatButtonModule, MatSidenavModule, MatFormFieldModule, MatDialogModule, FormsModule, MatTooltipModule, MatListModule, MatInputModule, MatSelectModule, MatTableModule, MatPaginatorModule, MatSortModule, MatChipsModule, MatProgressBarModule, PageRightComponent, ViewPatientDrawerComponent],
    template: `
        <mat-drawer-container class="bg-none p-0 m-0" hasBackdrop="false">
            <mat-drawer-content>
                <div class="container fade-in py-3 py-lg-4">
                    <div class="row gx-3 align-items-center">
                        <div class="col-12 col-md mb-3 mb-xl-0 py-1">
                            <h3 class="mb-1">Patients</h3>
                            <p class="small opacity-50">Manage your patient & support</p>
                        </div>

                        <div class="col-12 col-md-auto mb-3 mb-xl-0">
                            <app-page-right></app-page-right>
                        </div>
                    </div>
                </div>
                <div class="container fade-in">
                    <!-- summary -->
                    <div class="row gx-3 gx-lg-4">
                        <!-- active cases -->
                        <div class="col-6 col-sm-6 col-lg-3">
                            <mat-card class="theme-orange mb-3 mb-lg-4">
                                <mat-card-header>
                                    <div class="w-100">
                                        <div class="row gx-3 align-items-center mb-3">
                                            <div class="col-auto">
                                                <div class="avatar avatar-30 text-theme rounded">
                                                    <span class="material-symbols-outlined"> fluid_balance </span>
                                                </div>
                                            </div>
                                            <div class="col">
                                                <h3 class="mb-0 text-theme">Active Cases</h3>
                                            </div>
                                        </div>
                                    </div>
                                </mat-card-header>
                                <mat-card-content>
                                    <div class="row gx-3 align-items-center">
                                        <div class="col">
                                            <h1 class="fw-medium mb-1">750K</h1>
                                            <p class="small text-secondary"><span class=" text-theme theme-red">+7256</span> Today</p>
                                        </div>
                                    </div>
                                </mat-card-content>
                            </mat-card>
                        </div>

                        <!-- fatalities  -->
                        <div class="col-6 col-md-6 col-lg-3">
                            <mat-card class="theme-red mb-3 mb-lg-4">
                                <mat-card-header>
                                    <div class="w-100">
                                        <div class="row gx-3 align-items-center mb-3">
                                            <div class="col-auto">
                                                <div class="avatar avatar-30 text-theme rounded">
                                                    <span class="material-symbols-outlined"> skull_list </span>
                                                </div>
                                            </div>
                                            <div class="col">
                                                <h3 class="mb-1 text-theme">Fatalities</h3>
                                            </div>
                                        </div>
                                    </div>
                                </mat-card-header>
                                <mat-card-content>
                                    <div class="row gx-3 align-items-center">
                                        <div class="col">
                                            <h1 class="mb-1">10K</h1>
                                            <p class="small text-secondary"><span class=" text-theme theme-red">+11</span> Today</p>
                                        </div>
                                    </div>
                                </mat-card-content>
                            </mat-card>
                        </div>

                        <!-- recovered  -->
                        <div class="col-6 col-md-6 col-lg-3">
                            <mat-card class="mb-3 mb-lg-4 theme-green">
                                <mat-card-header>
                                    <div class="w-100">
                                        <div class="row gx-3 align-items-center mb-3">
                                            <div class="col-auto">
                                                <div class="avatar avatar-30 text-theme rounded">
                                                    <span class="material-symbols-outlined"> recent_patient </span>
                                                </div>
                                            </div>
                                            <div class="col">
                                                <h3 class="mb-0 text-theme">Recovered</h3>
                                            </div>
                                        </div>
                                    </div>
                                </mat-card-header>
                                <mat-card-content>
                                    <div class="row gx-3 align-items-center">
                                        <div class="col">
                                            <h1 class="mb-1">15K</h1>
                                            <p class="small text-secondary"><span class=" text-theme theme-green">+25</span> Today</p>
                                        </div>
                                    </div>
                                </mat-card-content>
                            </mat-card>
                        </div>

                        <!-- cases  -->
                        <div class="col-6 col-md-6 col-lg-3">
                            <mat-card class="theme-sky mb-3 mb-lg-4">
                                <mat-card-header>
                                    <div class="w-100">
                                        <div class="row gx-3 align-items-center mb-3">
                                            <div class="col-auto">
                                                <div class="avatar avatar-30 text-theme rounded">
                                                    <span class="material-symbols-outlined"> local_hospital </span>
                                                </div>
                                            </div>
                                            <div class="col">
                                                <h3 class="mb-0 text-theme">Total Cases</h3>
                                            </div>
                                        </div>
                                    </div>
                                </mat-card-header>
                                <mat-card-content>
                                    <div class="row gx-3 align-items-center">
                                        <div class="col">
                                            <h1 class="mb-1">2510K</h1>
                                            <p class="small text-secondary"><span class="text-theme">4.15%</span> Up today</p>
                                        </div>
                                    </div>
                                </mat-card-content>
                            </mat-card>
                        </div>
                    </div>

                    <div class="row gx-3 gx-lg-4">
                        <!-- list -->
                        <div class="col-12 col-md-12 position-relative">
                            <mat-card class="mb-3 mb-lg-4">
                                <mat-card-header>
                                    <div class="w-100">
                                        <div class="row gx-3 align-items-center">
                                            <div class="col-auto mb-3">
                                                <div class="avatar avatar-40 text-theme rounded">
                                                    <mat-icon class="material-icons-outlined">group</mat-icon>
                                                </div>
                                            </div>
                                            <div class="col mb-3">
                                                <h3 class="mb-1">Patients</h3>
                                                <p class="text-secondary small">All in patient</p>
                                            </div>
                                            <div class="col-12 col-md-6 col-lg-4 col-xl-3 mb-3">
                                                <mat-form-field appearance="outline" class="w-100 inline-small">
                                                    <mat-label>Search</mat-label>
                                                    <mat-icon matPrefix>search</mat-icon>
                                                    <input matInput placeholder="Search" (keyup)="applyFilter($event)" #searchinput />
                                                </mat-form-field>
                                            </div>
                                        </div>
                                    </div>
                                </mat-card-header>

                                <table mat-table [dataSource]="dataSource" matSort class="bg-none mb-3 responsive-table">
                                    <ng-container matColumnDef="patientName">
                                        <th mat-header-cell *matHeaderCellDef mat-sort-header>Patient Info</th>
                                        <td mat-cell *matCellDef="let element" class="py-2 hoverview">
                                            <div class="row gx-3">
                                                <div class="col-auto">
                                                    <div class="avatar avatar-40 rounded coverimg" (click)="openPatientDrawer(element)">
                                                        <img [src]="element.patientImage" alt="{{ element.patientName }}" class="" />
                                                        <mat-icon class="hoverview-icon bg-light-theme text-theme rounded circle avatar avatar-40 position-absolute start-0 top-0">visibility</mat-icon>
                                                    </div>
                                                </div>
                                                <div class="col">
                                                    <h4 class="mb-0">
                                                        {{ element.patientName }}
                                                        <span class="badge badge-sm badge-light" [ngClass]="{'theme-orange': element.status === 'Active', 'theme-green': element.status === 'Recovered','theme-red': element.status === 'Deceased',}"> {{ element.status }}</span>
                                                    </h4>
                                                    <p class="text-secondary small">{{ element.city }}, {{ element.country }}</p>
                                                </div>
                                            </div>
                                        </td>
                                    </ng-container>

                                    <ng-container matColumnDef="contactInfo">
                                        <th mat-header-cell *matHeaderCellDef mat-sort-header>Contact</th>
                                        <td mat-cell *matCellDef="let element">
                                            <p class="mat-mobile-label">Contact</p>
                                            <div>
                                                <p class="mb-1">{{ element.email }}</p>
                                                <p class="text-secondary small">{{ element.phone }}</p>
                                            </div>
                                        </td>
                                    </ng-container>

                                    <ng-container matColumnDef="lastVisited">
                                        <th mat-header-cell *matHeaderCellDef mat-sort-header>Last Visit</th>
                                        <td mat-cell *matCellDef="let element">
                                            <p class="mat-mobile-label">Last visit</p>
                                            <div>
                                                <p class="mb-1">{{ element.lastVisit }}</p>
                                                <p class="text-secondary small">{{ element.lastVisitedTime }}</p>
                                            </div>
                                        </td>
                                    </ng-container>

                                    <ng-container matColumnDef="totalPurchase">
                                        <th mat-header-cell *matHeaderCellDef mat-sort-header>Hospitalize Hours</th>
                                        <td mat-cell *matCellDef="let element">
                                            <p class="mat-mobile-label">Hospitalized</p>
                                            <div>
                                                <h4 class="mb-1">{{ element.totalAdmitTime | number : "1.2-2" }} hrs</h4>
                                                <p class="text-secondary small">Bill: {{ element.totalAmountBill | number : "1.2-2" }} USD</p>
                                            </div>
                                        </td>
                                    </ng-container>

                                    <ng-container matColumnDef="status">
                                        <th mat-header-cell *matHeaderCellDef>Treatment</th>
                                        <td mat-cell *matCellDef="let element">
                                            <p class="mat-mobile-label">Treatment</p>
                                            <div>
                                                <div class="badge badge-light theme-blue d-inline-block me-1" matTooltip="Syringe"><span class="material-symbols-outlined align-middle text-sm"> syringe </span> {{ element.activeTask }}</div>
                                                <div class="badge badge-light theme-green d-inline-block me-1" matTooltip="Tablet"><span class="material-symbols-outlined align-middle text-sm"> pill </span> {{ element.completedTask }}</div>
                                                <div class="badge badge-light theme-yellow d-inline-block" matTooltip="Surgery"><span class="material-symbols-outlined align-middle text-sm"> pacemaker </span> {{ element.cancelledTask }}</div>
                                            </div>
                                        </td>
                                    </ng-container>

                                    <ng-container matColumnDef="actions">
                                        <th mat-header-cell *matHeaderCellDef>Actions</th>
                                        <td mat-cell *matCellDef="let element">
                                            <button mat-icon-button [matMenuTriggerFor]="menu" aria-label="Actions menu">
                                                <mat-icon>more_vert</mat-icon>
                                            </button>
                                            <mat-menu #menu="matMenu">
                                                <button mat-menu-item (click)="editPatient(element)">
                                                    <mat-icon>edit</mat-icon>
                                                    <span>Edit</span>
                                                </button>
                                                <button mat-menu-item (click)="banPatient(element)">
                                                    <mat-icon>block</mat-icon>
                                                    <span>Ban</span>
                                                </button>
                                                <button mat-menu-item (click)="deletePatient(element)">
                                                    <mat-icon>delete</mat-icon>
                                                    <span>Delete</span>
                                                </button>
                                            </mat-menu>
                                        </td>
                                    </ng-container>

                                    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                                    <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>

                                    <tr class="mat-row" *matNoDataRow>
                                        <td class="mat-cell" [attr.colspan]="displayedColumns.length">No data matching the filter "{{ searchinput.value }}"</td>
                                    </tr>
                                </table>

                                <mat-card-content>
                                    <!-- Paginator -->
                                    <mat-paginator [pageSizeOptions]="[5, 10, 25, 100]" aria-label="Select page of patients" class="bg-none"></mat-paginator>
                                </mat-card-content>
                            </mat-card>
                        </div>
                    </div>
                </div>
            </mat-drawer-content>
            <mat-drawer #viewpatient mode="over" position="end" style="--mat-sidenav-container-elevation-shadow:0px 5px 15px rgba(0, 0, 0, 0.15);z-index:12">
                <app-view-patient-drawer [patient]="selectedPatient()" (editPatient)="editPatient(selectedPatient())" (closeDrawer)="closePatientDrawer()"></app-view-patient-drawer>
            </mat-drawer>
        </mat-drawer-container>
    `,
    styles: [
        `
            .mat-drawer-container {
                position: unset !important;
                mat-drawer {
                    position: fixed;
                    z-index: 20;
                }
            }
        `,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PatientsComponent implements OnInit {
    // mat drawer view patient
    @ViewChild("viewpatient") viewpatient!: MatDrawer;

    // dialog
    readonly dialog = inject(MatDialog);

    //table
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    originalTabledata: TableItem[] = [
        {
            patientImage: "assets/img/user-1.jpg",
            patientName: "Michael Johnson",
            city: "Los Angeles",
            country: "USA",
            email: "michael.j@email.com",
            phone: "555-234-5678",
            lastVisit: "2025-09-22",
            lastVisitedTime: "09:00 AM",
            totalAdmitTime: 24.5,
            totalAmountBill: 250.75,
            activeTask: 3,
            completedTask: 22,
            cancelledTask: 0,
            status: "Deceased",
        },
        {
            patientImage: "assets/img/user-2.jpg",
            patientName: "Emily Williams",
            city: "Paris",
            country: "France",
            email: "emily.w@email.com",
            phone: "555-876-5432",
            lastVisit: "2025-09-21",
            lastVisitedTime: "04:15 PM",
            totalAdmitTime: 15.0,
            totalAmountBill: 120.0,
            activeTask: 0,
            completedTask: 10,
            cancelledTask: 2,
            status: "Active",
        },
        {
            patientImage: "assets/img/user-3.jpg",
            patientName: "David Brown",
            city: "Tokyo",
            country: "Japan",
            email: "david.b@email.com",
            phone: "555-345-6789",
            lastVisit: "2025-09-20",
            lastVisitedTime: "11:50 AM",
            totalAdmitTime: 30.25,
            totalAmountBill: 450.5,
            activeTask: 1,
            completedTask: 5,
            cancelledTask: 0,
            status: "Recovered",
        },
        {
            patientImage: "assets/img/user-4.jpg",
            patientName: "Olivia Davis",
            city: "Sydney",
            country: "Australia",
            email: "olivia.d@email.com",
            phone: "555-765-4321",
            lastVisit: "2025-09-19",
            lastVisitedTime: "06:30 PM",
            totalAdmitTime: 28.0,
            totalAmountBill: 300.0,
            activeTask: 2,
            completedTask: 18,
            cancelledTask: 1,
            status: "Active",
        },
        {
            patientImage: "assets/img/user-5.jpg",
            patientName: "Daniel Wilson",
            city: "Berlin",
            country: "Germany",
            email: "daniel.w@email.com",
            phone: "555-456-7890",
            lastVisit: "2025-09-18",
            lastVisitedTime: "01:20 PM",
            totalAdmitTime: 35.8,
            totalAmountBill: 800.25,
            activeTask: 0,
            completedTask: 9,
            cancelledTask: 0,
            status: "Active",
        },
        {
            patientImage: "assets/img/user-6.jpg",
            patientName: "Sophia Martinez",
            city: "Madrid",
            country: "Spain",
            email: "sophia.m@email.com",
            phone: "555-654-3210",
            lastVisit: "2025-09-17",
            lastVisitedTime: "09:45 AM",
            totalAdmitTime: 10.9,
            totalAmountBill: 150.0,
            activeTask: 1,
            completedTask: 14,
            cancelledTask: 0,
            status: "Deceased",
        },
        {
            patientImage: "assets/img/user-7.jpg",
            patientName: "Matthew Taylor",
            city: "Toronto",
            country: "Canada",
            email: "matthew.t@email.com",
            phone: "555-543-2109",
            lastVisit: "2025-09-16",
            lastVisitedTime: "03:10 PM",
            totalAdmitTime: 30.0,
            totalAmountBill: 65.75,
            activeTask: 0,
            completedTask: 7,
            cancelledTask: 1,
            status: "Active",
        },
        {
            patientImage: "assets/img/user-8.jpg",
            patientName: "Isabella Anderson",
            city: "Rome",
            country: "Italy",
            email: "isabella.a@email.com",
            phone: "555-432-1098",
            lastVisit: "2025-09-15",
            lastVisitedTime: "08:00 PM",
            totalAdmitTime: 28.5,
            totalAmountBill: 450.0,
            activeTask: 4,
            completedTask: 30,
            cancelledTask: 2,
            status: "Recovered",
        },
        {
            patientImage: "assets/img/user-9.jpg",
            patientName: "Joseph Thomas",
            city: "Dubai",
            country: "UAE",
            email: "joseph.t@email.com",
            phone: "555-321-0987",
            lastVisit: "2025-09-14",
            lastVisitedTime: "05:00 AM",
            totalAdmitTime: 48.0,
            totalAmountBill: 950.0,
            activeTask: 1,
            completedTask: 11,
            cancelledTask: 0,
            status: "Active",
        },
        {
            patientImage: "assets/img/user-10.jpg",
            patientName: "Ava Hernandez",
            city: "Mexico City",
            country: "Mexico",
            email: "ava.h@email.com",
            phone: "555-210-9876",
            lastVisit: "2025-09-13",
            lastVisitedTime: "12:00 PM",
            totalAdmitTime: 40.0,
            totalAmountBill: 700.0,
            activeTask: 0,
            completedTask: 6,
            cancelledTask: 0,
            status: "Recovered",
        },
        {
            patientImage: "assets/img/user-1.jpg",
            patientName: "Christopher Moore",
            city: "Shanghai",
            country: "China",
            email: "chris.m@email.com",
            phone: "555-109-8765",
            lastVisit: "2025-09-12",
            lastVisitedTime: "07:45 PM",
            totalAdmitTime: 18.0,
            totalAmountBill: 200.0,
            activeTask: 2,
            completedTask: 25,
            cancelledTask: 1,
            status: "Active",
        },
        {
            patientImage: "assets/img/user-2.jpg",
            patientName: "Mia White",
            city: "Mumbai",
            country: "India",
            email: "mia.w@email.com",
            phone: "555-987-6543",
            lastVisit: "2025-09-11",
            lastVisitedTime: "02:30 PM",
            totalAdmitTime: 6.5,
            totalAmountBill: 85.0,
            activeTask: 1,
            completedTask: 12,
            cancelledTask: 0,
            status: "Active",
        },
        {
            patientImage: "assets/img/user-3.jpg",
            patientName: "James Harris",
            city: "Rio de Janeiro",
            country: "Brazil",
            email: "james.h@email.com",
            phone: "555-876-5432",
            lastVisit: "2025-09-10",
            lastVisitedTime: "10:15 AM",
            totalAdmitTime: 12.0,
            totalAmountBill: 110.0,
            activeTask: 0,
            completedTask: 16,
            cancelledTask: 0,
            status: "Active",
        },
        {
            patientImage: "assets/img/user-4.jpg",
            patientName: "Charlotte Clark",
            city: "Moscow",
            country: "Russia",
            email: "charlotte.c@email.com",
            phone: "555-765-4321",
            lastVisit: "2025-09-09",
            lastVisitedTime: "04:50 PM",
            totalAdmitTime: 14.75,
            totalAmountBill: 180.5,
            activeTask: 3,
            completedTask: 20,
            cancelledTask: 1,
            status: "Active",
        },
        {
            patientImage: "assets/img/user-5.jpg",
            patientName: "Ethan Lewis",
            city: "Cairo",
            country: "Egypt",
            email: "ethan.l@email.com",
            phone: "555-654-3210",
            lastVisit: "2025-09-08",
            lastVisitedTime: "09:20 AM",
            totalAdmitTime: 4.0,
            totalAmountBill: 55.0,
            activeTask: 0,
            completedTask: 4,
            cancelledTask: 0,
            status: "Active",
        },
    ];

    dataSource = new MatTableDataSource<TableItem>(this.originalTabledata);
    displayedColumns: string[] = ["patientName", "contactInfo", "lastVisited", "totalPurchase", "status", "actions"];
    public selectedPatient = signal<TableItem | null>(null);

    ngOnInit() {}
    ngAfterViewInit() {
        //table
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.dataSource.sortingDataAccessor = (item: TableItem, header: string): string | number => {
            switch (header) {
                case "patientName":
                    return item.patientName;
                case "contactInfo":
                    return item.email;
                case "lastVisited":
                    return item.lastVisit;
                case "totalPurchase":
                    return item.totalAdmitTime;
                case "status":
                    return item.activeTask;
                default:
                    return "";
            }
        };

        this.dataSource.filterPredicate = (data: TableItem, filter: string) => {
            const dataStr = Object.values(data).join(" ").toLowerCase();
            return dataStr.indexOf(filter) !== -1;
        };
    }
    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();

        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    editPatient(patient: TableItem | null) {
        this.dialog.open(EditPatientDialogComponent, {
            width: "990px",
            maxWidth: "990px",
            panelClass: "custom-dialog-container",
            autoFocus: false,
            data: { ...patient },
        });
    }
    banPatient(patient: TableItem) {
        console.log("Ban patient:", patient.patientName);
    }

    deletePatient(patient: TableItem) {
        console.log("Delete patient:", patient.patientName);
    }

    // drawer open
    openPatientDrawer(patient: TableItem) {
        this.selectedPatient.set(patient);
        this.viewpatient.open();
    }

    closePatientDrawer() {
        this.viewpatient.close();
        this.selectedPatient.set(null);
    }
}

import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, ViewChild, signal, computed, HostListener } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatChipsModule } from "@angular/material/chips";
import { MatFormField, MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatListModule } from "@angular/material/list";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { MatSort, MatSortModule } from "@angular/material/sort";
import { SemiDoughnutChartjs180Component } from "../../../components/charts/semi-doughnut-chartjs-180.component";
import { CircleProgressRedComponent } from "../../../components/charts/circle-progress-red.component";
import { CircleProgressYellowComponent } from "../../../components/charts/circle-progress-yellow.component";
import { CircleProgressGreenComponent } from "../../../components/charts/circle-progress-green.component";
import { CircleProgressBlueComponent } from "../../../components/charts/circle-progress-blue.component";
import { TimelineChartComponent } from "../../../components/charts/timelinechart.component";
import { FatalityChartComponent } from "../../../components/charts/fatalitieschart.component";
import Swiper from "swiper";
import { register } from "swiper/element/bundle";
register();
import { MatMenuModule } from "@angular/material/menu";
import { FormsModule } from "@angular/forms";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { PageRightComponent } from "../../../components/page-right/pageright.component";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { EmployeeSelectComponent } from "../../../components/employee-select/employee-select.component";
import { MobileFooterComponent } from "../../../components/app-mobile-footer/mobile-footer.component";

declare const jsVectorMap: any;

type ViewMode = "day" | "week" | "month";

interface CountryData {
    country: string;
    population: number; // in millions
    totalCases: number; // in millions
    activeCases: number; // in thousands
    recovered: number; // in millions
    fatalities: number; // in thousands
}

@Component({
    selector: "app-dashboard",
    standalone: true,
    imports: [
        CommonModule,
        MatCardModule,
        MatButtonToggleModule,
        MatIconModule,
        MatMenuModule,
        MatButtonModule,
        MatFormFieldModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        FormsModule,
        MatListModule,
        MatInputModule,
        MatSelectModule,
        MatChipsModule,
        MatProgressBarModule,
        SemiDoughnutChartjs180Component,
        CircleProgressRedComponent,
        CircleProgressYellowComponent,
        CircleProgressGreenComponent,
        CircleProgressBlueComponent,
        PageRightComponent,
        TimelineChartComponent,
        EmployeeSelectComponent,
        FatalityChartComponent,
        MobileFooterComponent,
    ],
    template: `
        <div class="container fade-in py-3 py-lg-4">
            <div class="row gx-3 align-items-center">
                <div class="col mb-3 mb-xl-0 py-1 order-1 order-lg-1">
                    <h3 class="mb-1">Dashboard</h3>
                    <p class="small opacity-50">Last updated Today at 05:30 pm</p>
                </div>
                @if(filterOn) {
                <div class="col-12 col-sm-6 col-lg-auto mb-3 mb-xl-0 order-3 order-lg-2">
                    <mat-button-toggle-group [value]="viewMode()" (change)="viewMode.set($event.value)">
                        <mat-button-toggle value="day">Day</mat-button-toggle>
                        <mat-button-toggle value="week">Week</mat-button-toggle>
                        <mat-button-toggle value="month">Month</mat-button-toggle>
                    </mat-button-toggle-group>
                </div>

                <div class="col-12 col-sm-6 col-lg-3 c col-xxl-2 mb-3 mb-xl-0 order-4 order-lg-3">
                    <app-employee-select></app-employee-select>
                </div>
                <div class="col-12 col-sm-6 col-lg-4 col-xl-3 col-xxl-auto mb-3 mb-xl-0 order-5 order-lg-4">
                    <app-page-right></app-page-right>
                </div>
                }
                <div class="col-auto order-2 order-lg-5 mb-3 mb-xl-0">
                    <button matIconButton (click)="toggleFilter()">
                        @if(filterOn) {
                        <mat-icon class="material-icons-outlined">filter_alt_off</mat-icon>
                        } @else{
                        <mat-icon class="material-icons-outlined">filter_alt</mat-icon>}
                    </button>
                </div>
            </div>
        </div>
        <!-- page content -->
        <div class="container fade-in">
            <!-- summary -->
            <div class="row gx-3 gx-lg-4">
                <!-- active cases -->
                <div class="col-12 col-sm-6 col-lg-3">
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
                                <div class="col-auto">
                                    <app-circle-progress-yellow class="avatar avatar-60 rounded-circle"></app-circle-progress-yellow>
                                </div>
                            </div>
                        </mat-card-content>
                    </mat-card>
                </div>

                <!-- fatalities  -->
                <div class="col-12 col-md-6 col-lg-3">
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
                                <div class="col-auto">
                                    <app-circle-progress-red class="avatar avatar-60 rounded-circle"></app-circle-progress-red>
                                </div>
                            </div>
                        </mat-card-content>
                    </mat-card>
                </div>

                <!-- recovered  -->
                <div class="col-12 col-md-6 col-lg-3">
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
                                <div class="col-auto">
                                    <app-circle-progress-green class="avatar avatar-60 rounded-circle"></app-circle-progress-green>
                                </div>
                            </div>
                        </mat-card-content>
                    </mat-card>
                </div>

                <!-- cases  -->
                <div class="col-12 col-md-6 col-lg-3">
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
                                <div class="col-auto">
                                    <app-circle-progress-blue class="avatar avatar-60 rounded-circle"></app-circle-progress-blue>
                                </div>
                            </div>
                        </mat-card-content>
                    </mat-card>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <div class="col-12 col-xl-6">
                    <!-- case timeline -->
                    <mat-card class="mb-3 mb-lg-4">
                        <mat-card-header>
                            <div class="w-100">
                                <div class="row gx-3 align-items-center">
                                    <div class="col-auto mb-3 mb-lg-4">
                                        <div class="avatar avatar-40 text-theme rounded">
                                            <span class="material-symbols-outlined"> globe </span>
                                        </div>
                                    </div>
                                    <div class="col mb-3 mb-lg-4">
                                        <h3 class="mb-1">Top Countries</h3>
                                        <p class="text-secondary small">Virus cases by top countries in thousand</p>
                                    </div>
                                </div>
                            </div>
                        </mat-card-header>
                        <mat-card-content>
                            <app-timeline-chart class="height-260 d-block"></app-timeline-chart>
                        </mat-card-content>
                    </mat-card>
                </div>
                <div class="col-12 col-xl-6">
                    <!-- fatality chart -->
                    <mat-card class="mb-3 mb-lg-4">
                        <mat-card-header>
                            <div class="w-100">
                                <div class="row gx-3 align-items-center">
                                    <div class="col-auto mb-3 mb-lg-4">
                                        <div class="avatar avatar-40 text-theme rounded">
                                            <span class="material-symbols-outlined"> deceased </span>
                                        </div>
                                    </div>
                                    <div class="col mb-3 mb-lg-4">
                                        <h3 class="mb-1">Fatalities by Country</h3>
                                        <p class="text-secondary small">Must follow guidelines in top countries</p>
                                    </div>
                                </div>
                            </div>
                        </mat-card-header>
                        <mat-card-content>
                            <app-fatality-chart class="height-260 w-100 d-block"></app-fatality-chart>
                        </mat-card-content>
                    </mat-card>
                </div>
            </div>

            <div class="row gx-3 gx-lg-4">
                <!-- Cases in countries -->
                <div class="col-12 ">
                    <mat-card class="mb-3 mb-lg-4">
                        <mat-card-header>
                            <div class="w-100 mb-3 mb-lg-4">
                                <div class="row gx-3 align-items-center">
                                    <div class="col-auto">
                                        <div class="avatar avatar-40 text-theme rounded">
                                            <mat-icon class="material-icons-outlined">language</mat-icon>
                                        </div>
                                    </div>
                                    <div class="col">
                                        <h3 class="mb-1">Cases around the earth</h3>
                                        <p class="text-secondary small">All the values are in thousand</p>
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

                        <mat-card-content>
                            <div class="row gx-3 align-items-center">
                                <div class="col-12 col-lg-8">
                                    <div id="jsvectormap" class="w-100 height-300"></div>
                                </div>
                                <div class="col-12 col-lg-4">
                                    <div class="height-140 w-100 position-relative text-center mb-3 mb-lg-4">
                                        <div class="position-absolute bottom-0 mx-auto start-0 w-100 mb-4">
                                            <h1 class="mb-1">45K</h1>
                                            <p class="text-secondary small mb-1">Active Cases</p>
                                        </div>
                                        <app-semi-doughnut-chartjs-180 class="d-block w-100 position-relative" id="semidoughnutchart" style="top:-50px"></app-semi-doughnut-chartjs-180>
                                    </div>
                                    <div class="row gx-4 align-items-center mb-3 mb-lg-4">
                                        <div class="col-auto">
                                            <h1 class="fw-medium mb-1">10K</h1>
                                            <p class="small text-secondary"><span class=" text-theme theme-red">+11</span> Today</p>
                                        </div>
                                        <div class="col">
                                            <h4 class="mb-1">Deceased</h4>
                                            <p class="text-secondary small">1.2% People are deceased by contracting with deadly virus spread across the earth.</p>
                                        </div>
                                    </div>
                                    <div class="row gx-4 align-items-center mb-3 mb-lg-4">
                                        <div class="col-auto">
                                            <h1 class="fw-medium mb-1">15K</h1>
                                            <p class="small text-secondary"><span class=" text-theme theme-green">+25</span> Today</p>
                                        </div>
                                        <div class="col">
                                            <h4 class="mb-1">Recovered</h4>
                                            <p class="text-secondary small">6.8% Patient are recovered and saved their life from deadly virus. Follow guidelines seriously.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <table mat-table [dataSource]="dataSource" matSort class="bg-none mb-3 responsive-table">
                                <ng-container matColumnDef="country">
                                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Country</th>
                                    <td mat-cell *matCellDef="let element" class="py-2">
                                        <p class="mat-mobile-label">Country</p>
                                        <h4 class="mb-0">{{ element.country }}</h4>
                                    </td>
                                </ng-container>
                                <ng-container matColumnDef="population">
                                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Population</th>
                                    <td mat-cell *matCellDef="let element" class="py-2">
                                        <p class="mat-mobile-label">Population</p>
                                        <p class="mb-0">{{ element.population }}</p>
                                    </td>
                                </ng-container>
                                <ng-container matColumnDef="totalCases">
                                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Total Cases</th>
                                    <td mat-cell *matCellDef="let element" class="py-2">
                                        <p class="mat-mobile-label">Total Cases</p>
                                        <p class="mb-0 text-theme theme-sky">{{ element.totalCases }}</p>
                                    </td>
                                </ng-container>
                                <ng-container matColumnDef="activeCases">
                                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Active Cases</th>
                                    <td mat-cell *matCellDef="let element" class="py-2">
                                        <p class="mat-mobile-label">Active Cases</p>
                                        <h4 class="mb-0 text-theme theme-orange">{{ element.activeCases }}</h4>
                                    </td>
                                </ng-container>
                                <ng-container matColumnDef="recovered">
                                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Recovered</th>
                                    <td mat-cell *matCellDef="let element" class="py-2">
                                        <p class="mat-mobile-label">Recovered</p>
                                        <h4 class="mb-0 text-theme theme-green">{{ element.recovered }}</h4>
                                    </td>
                                </ng-container>

                                <ng-container matColumnDef="fatalities">
                                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Fatalities</th>
                                    <td mat-cell *matCellDef="let element" class="py-2">
                                        <p class="mat-mobile-label">Fatalities</p>
                                        <h4 class="mb-0 text-theme theme-red">{{ element.fatalities }}</h4>
                                    </td>
                                </ng-container>

                                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                                <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>

                                <tr class="mat-row" *matNoDataRow>
                                    <td class="mat-cell" [attr.colspan]="displayedColumns.length">No data matching the filter "{{ searchinput.value }}"</td>
                                </tr>
                            </table>
                            <!-- Paginator -->
                            <mat-paginator [pageSizeOptions]="[5, 10, 25, 100]" aria-label="Select page of patients" class="bg-none"></mat-paginator>
                        </mat-card-content>
                    </mat-card>
                </div>
            </div>
        </div>
        <app-mobile-footer class="mobile-footer d-lg-none"></app-mobile-footer>
    `,
    styles: [``],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DashboardComponent implements OnInit {
    filterOn = true;
    currentWidth = signal(0);

    // country data jsvectormap
    dataValues: { [key: string]: number } = {
        AF: 16.63,
        AL: 11.58,
        DZ: 158.97,
        AO: 85.81,
        AG: 1.1,
        AR: 351.02,
        AM: 8.83,
        AU: 1219.72,
        AT: 366.26,
        AZ: 52.17,
        BS: 7.54,
        BH: 21.73,
        BD: 105.4,
        BB: 3.96,
        BY: 52.89,
        BE: 461.33,
        BZ: 1.43,
        BJ: 6.49,
        BT: 1.4,
        BO: 19.18,
        BA: 16.2,
        BW: 12.5,
        BR: 2023.53,
        BN: 11.96,
        BG: 44.84,
        BF: 8.67,
        BI: 1.47,
        KH: 11.36,
        CM: 21.88,
        CA: 1563.66,
        CV: 1.57,
        CF: 2.11,
        TD: 7.59,
        CL: 199.18,
        CN: 5745.13,
        CO: 283.11,
        KM: 0.56,
        CD: 12.6,
        CG: 11.88,
        CR: 35.02,
        CI: 22.38,
        HR: 59.92,
        CY: 22.75,
        CZ: 195.23,
        DK: 304.56,
        DJ: 1.14,
        DM: 0.38,
        DO: 50.87,
        EC: 61.49,
        EG: 216.83,
        SV: 21.8,
        GQ: 14.55,
        ER: 2.25,
        EE: 19.22,
        ET: 30.94,
        FJ: 3.15,
        FI: 231.98,
        FR: 2555.44,
        GA: 12.56,
        GM: 1.04,
        GE: 11.23,
        DE: 3305.9,
        GH: 18.06,
        GR: 305.01,
        GD: 0.65,
        GT: 40.77,
        GN: 4.34,
        GW: 0.83,
        GY: 2.2,
        HT: 6.5,
        HN: 15.34,
        HK: 226.49,
        HU: 132.28,
        IS: 12.77,
        IN: 1430.02,
        ID: 695.06,
        IR: 337.9,
        IQ: 84.14,
        IE: 204.14,
        IL: 201.25,
        IT: 2036.69,
        JM: 13.74,
        JP: 5390.9,
        JO: 27.13,
        KZ: 129.76,
        KE: 32.42,
        KI: 0.15,
        KR: 986.26,
        KW: 117.32,
        KG: 4.44,
        LA: 6.34,
        LV: 23.39,
        LB: 39.15,
        LS: 1.8,
        LR: 0.98,
        LY: 77.91,
        LT: 35.73,
        LU: 52.43,
        MK: 9.58,
        MG: 8.33,
        MW: 5.04,
        MY: 218.95,
        MV: 1.43,
        ML: 9.08,
        MT: 7.8,
        MR: 3.49,
        MU: 9.43,
        MX: 1004.04,
        MD: 5.36,
        MN: 5.81,
        ME: 3.88,
        MA: 91.7,
        MZ: 10.21,
        MM: 35.65,
        NA: 11.45,
        NP: 15.11,
        NL: 770.31,
        NZ: 138,
        NI: 6.38,
        NE: 5.6,
        NG: 206.66,
        NO: 413.51,
        OM: 53.78,
        PK: 174.79,
        PA: 27.2,
        PG: 8.81,
        PY: 17.17,
        PE: 153.55,
        PH: 189.06,
        PL: 438.88,
        PT: 223.7,
        QA: 126.52,
        RO: 158.39,
        RU: 1476.91,
        RW: 5.69,
        WS: 0.55,
        ST: 0.19,
        SA: 434.44,
        SN: 12.66,
        RS: 38.92,
        SC: 0.92,
        SL: 1.9,
        SG: 217.38,
        SK: 86.26,
        SI: 46.44,
        SB: 0.67,
        ZA: 354.41,
        ES: 1374.78,
        LK: 48.24,
        KN: 0.56,
        LC: 1,
        VC: 0.58,
        SD: 65.93,
        SR: 3.3,
        SZ: 3.17,
        SE: 444.59,
        CH: 422.44,
        SY: 59.63,
        TW: 426.98,
        TJ: 5.58,
        TZ: 22.43,
        TH: 312.61,
        TL: 0.62,
        TG: 3.07,
        TO: 0.3,
        TT: 21.2,
        TN: 43.86,
        TR: 729.05,
        TM: 0,
        UG: 17.12,
        UA: 136.56,
        AE: 239.65,
        GB: 2258.57,
        US: 1462.18,
        UY: 40.71,
        UZ: 37.72,
        VU: 0.72,
        VE: 285.21,
        VN: 101.99,
        YE: 30.02,
        ZM: 15.69,
        ZW: 5.57,
    };

    //table
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    // data
    originalData: CountryData[] = [
        { country: "China", population: 1425, totalCases: 99.0, activeCases: 10.5, recovered: 98.9, fatalities: 100.0 },
        { country: "India", population: 1417, totalCases: 45.0, activeCases: 5.2, recovered: 44.9, fatalities: 530.0 },
        { country: "US", population: 333, totalCases: 104.0, activeCases: 2.1, recovered: 103.9, fatalities: 1180.0 },
        { country: "Indonesia", population: 277, totalCases: 6.7, activeCases: 0.1, recovered: 6.6, fatalities: 160.0 },
        { country: "Pakistan", population: 240, totalCases: 1.5, activeCases: 0.05, recovered: 1.45, fatalities: 31.0 },
        { country: "Nigeria", population: 230, totalCases: 0.25, activeCases: 0.0, recovered: 0.24, fatalities: 3.0 },
        { country: "Brazil", population: 216, totalCases: 38.6, activeCases: 0.01, recovered: 38.5, fatalities: 710.0 },
        { country: "Bangladesh", population: 174, totalCases: 2.0, activeCases: 0.0, recovered: 1.99, fatalities: 29.0 },
        { country: "Russia", population: 144, totalCases: 24.0, activeCases: 0.01, recovered: 23.9, fatalities: 400.0 },
        { country: "Mexico", population: 128, totalCases: 7.7, activeCases: 0.01, recovered: 7.5, fatalities: 334.0 },
    ];
    dataSource = new MatTableDataSource<CountryData>(this.originalData);
    displayedColumns: string[] = ["country", "population", "totalCases", "activeCases", "recovered", "fatalities"];

    // view mode day
    viewMode = signal<ViewMode>("day");

    // width check
    @HostListener("window:resize", ["$event"])
    onResize(event: Event) {
        this.checkWidthAndSetFilter();
    }

    ngOnInit() {}
    ngAfterViewInit() {
        //table
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;

        // width check
        this.checkWidthAndSetFilter();

        //js vectormap

        const map = new jsVectorMap({
            selector: "#jsvectormap",
            regionStyle: {
                initial: {
                    fill: "rgba(0, 73, 232, 0.15)",
                    stroke: "rgba(0, 73, 232, 0.4)",
                    strokeWidth: 1,
                },
            },
            visualizeData: {
                scale: ["#f3faff", "#0049e8"],
                values: this.dataValues,
            },
            onRegionTooltipShow: (event: Event, tooltip: any, code: string) => {
                const rawValue = this.dataValues[code];
                const valueText = rawValue !== undefined ? rawValue.toFixed(2) : "N/A";
                const regionName = tooltip.text();

                tooltip.text(`${regionName}: ${valueText}`, true);
            },

            map: "world",
        });
    }

    // table search
    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();

        if (this.dataSource.paginator) {
            this.dataSource.paginator.firstPage();
        }
    }

    toggleFilter(): void {
        this.filterOn = !this.filterOn;
    }

    checkWidthAndSetFilter() {
        const width = window.innerWidth;
        this.currentWidth.set(width);

        const shouldBeOff = width < 992;

        if (this.filterOn === shouldBeOff) {
            this.filterOn = !this.filterOn;
        }
    }
}

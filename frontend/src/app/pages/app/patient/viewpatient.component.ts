import { Component, Input, signal, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { TableItem } from "./patients.component";
import { MatCard, MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from "@angular/material/toolbar";

@Component({
    selector: "app-view-patient-drawer",
    imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatToolbarModule],
    template: `
        @if (patient) {
        <mat-toolbar>
            <h2 class="fw-bold">Patient Details</h2>
            <span class="spacer"></span>
            <button matIconButton aria-label="theme close" (click)="closeDrawer.emit()">
                <mat-icon>close</mat-icon>
            </button>
        </mat-toolbar>
        <div class="text-center">
            <div class="avatar avatar-140 coverimg rounded-circle mb-3" style="background-image:url({{ patient.patientImage }})">
                <img class="d-none" [src]="patient.patientImage" alt="Patient Image" />
            </div>
            <h3 class="mb-2">{{ patient.patientName }}</h3>
            <p class=""><span class="text-secondary ">Last Login:</span> {{ patient.lastVisit }}, {{ patient.lastVisitedTime }}</p>
            <span class="badge badge-sm badge-light" [ngClass]="{'theme-orange': patient.status === 'Active', 'theme-green': patient.status === 'Recovered','theme-red': patient.status === 'Deceased',}"> {{ patient.status }}</span>
        </div>
        <mat-card class="m-3">
            <mat-card-content>
                <h4 class="mb-3">Contact Info</h4>
                <div class="row gx-3 mb-2">
                    <div class="col-4"><p class="text-secondary">Email</p></div>
                    <div class="col-8">
                        <p>{{ patient.email }}</p>
                    </div>
                </div>
                <div class="row gx-3 mb-2">
                    <div class="col-4"><p class="text-secondary">Phone</p></div>
                    <div class="col-8">
                        <p>{{ patient.phone }}</p>
                    </div>
                </div>
                <br />
                <h4 class="mb-3">Location Info</h4>
                <div class="row gx-3 mb-2">
                    <div class="col-5"><p class="text-secondary">City</p></div>
                    <div class="col-7">
                        <p>{{ patient.city }}</p>
                    </div>
                </div>
                <div class="row gx-3 mb-2">
                    <div class="col-5">
                        <p class="text-secondary">Country</p>
                    </div>
                    <div class="col-7">
                        <p>{{ patient.country }}</p>
                    </div>
                </div>
                <br />
                <h4 class="mb-3">Hospitalize Hours</h4>
                <div class="row gx-3 mb-2">
                    <div class="col-5"><p class="text-secondary">Lifetime</p></div>
                    <div class="col-7">
                        <p>{{ patient.totalAdmitTime }} hrs</p>
                    </div>
                </div>
                <div class="row gx-3 mb-2">
                    <div class="col-5">
                        <p class="text-secondary">Bill</p>
                    </div>
                    <div class="col-7">
                        <p>{{ patient.totalAmountBill }} USD</p>
                    </div>
                </div>
                <br />
                <h4 class="mb-3">Task Status</h4>
                <div class="mb-3 mb-lg-2">
                    <div class="badge badge-light theme-blue me-1 mb-2 d-inline-block">
                        <h4>{{ patient.activeTask }} Syringe</h4>
                    </div>
                    <div class="badge badge-light theme-green me-1 mb-2 d-inline-block">
                        <h4>{{ patient.completedTask }} Tablets</h4>
                    </div>
                    <div class="badge badge-light theme-yellow me-1 mb-2 d-inline-block">
                        <h4>{{ patient.cancelledTask }} Surgery</h4>
                    </div>
                </div>
            </mat-card-content>
        </mat-card>
        <div class="px-3">
            <div class="row gx-3 mb-2">
                <div class="col">
                    <button matButton="filled" (click)="editPatient.emit()"><mat-icon class="material-icons-outlined">edit</mat-icon> Edit</button>
                </div>
                <div class="col-auto">
                    <button matButton class="theme-red" (click)="closeDrawer.emit()">Cancel</button>
                </div>
            </div>
        </div>
        }
    `,
})
export class ViewPatientDrawerComponent {
    @Input() patient: TableItem | null = null;
    @Output() closeDrawer = new EventEmitter<void>();
    @Output() editPatient = new EventEmitter<void>();
}

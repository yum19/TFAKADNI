import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatDivider, MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatCardModule } from "@angular/material/card";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatTabsModule } from "@angular/material/tabs";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatDividerModule } from "@angular/material/divider";
import Swiper from "swiper";
import { register } from "swiper/element/bundle";
import { RouterLink } from "@angular/router";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { provideNativeDateAdapter } from "@angular/material/core";
import { MatExpansionModule } from "@angular/material/expansion";
import { MatProgressBarModule } from "@angular/material/progress-bar";
register();

interface UserProfile {
    firstName: string;
    lastName: string;
    designation: string;
    email: string;
    userId: string;
    dob: string;
    memberSince: string;
    status: string;
    phoneNumber: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

@Component({
    selector: "app-settings",
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, MatListModule, MatProgressBarModule, MatExpansionModule, MatTabsModule, MatDividerModule, MatDatepickerModule, MatButtonToggleModule, MatMenuModule, MatSelectModule, MatIconModule, MatInputModule, MatFormFieldModule, MatCardModule, MatToolbarModule, MatButtonModule],
    providers: [provideNativeDateAdapter()],
    template: `
        <div class="container fade-in py-3 py-lg-4">
            <div class="row gx-3 align-items-center">
                <div class="col mb-3 mb-xl-0 py-1">
                    <h3 class="mb-1">Settings</h3>
                    <p class="text-secondary small">Keep your profile updated</p>
                </div>

                <div class="col-auto mb-3 mb-xl-0">
                    <button routerLink="/app/profile" matButton="filled"><mat-icon class="material-icons-outlined">save</mat-icon> Update</button>
                </div>
            </div>
        </div>

        <div class="container">
            <mat-card class="mb-3 mb-lg-4">
                <figure mat-card-image class="coverimg height-160 w-100 z-index-0 overflow-hidden">
                    <div class="position-absolute top-0 end-0 z-index-1 m-3">
                        <button matButton="filled" onclick="this.nextElementSibling.click()"><mat-icon class="material-icons-outlined">photo_camera</mat-icon> Change Cover</button>
                        <input type="file" class="d-none" />
                    </div>
                    <img src="assets/img/background1.jpg" class="mw-100" alt="" />
                </figure>
                <mat-card-content>
                    <div class="row gx-3 gx-lg-4 justify-content-center position-relative z-index-1">
                        <div class="col-12 col-sm-auto position-relative pt-3 text-center">
                            <div class="width-160 position-relative d-block mx-auto mb-3" style="margin-top:-100px">
                                <div class="position-absolute bottom-0 end-0 z-index-1">
                                    <button matMiniFab onclick="this.nextElementSibling.click()"><mat-icon class="material-icons-outlined">photo_camera</mat-icon></button>
                                    <input type="file" class="d-none" />
                                </div>
                                <figure class="avatar avatar-160 coverimg rounded-circle shadow-md border-3 border-light position-relative">
                                    <img src="assets/img/user-6.jpg" alt="" />
                                </figure>
                            </div>
                        </div>
                        <div class="col pt-3">
                            <h2 class="mb-1">
                                <span class="align-middle">{{ profile().firstName }} {{ profile().lastName }}</span>
                            </h2>
                            <p class="opacity-75">{{ profile().designation }}</p>
                        </div>
                    </div>
                    <div class="row gx-3 gx-lg-4 mt-3 mt-lg-4">
                        <div class="col-12 col-md-6 col-lg-4 col-xxl-3">
                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>First Name</mat-label>
                                <input matInput [(ngModel)]="profile().firstName" (ngModelChange)="updateProfile('firstName', $event)" />
                            </mat-form-field>
                        </div>
                        <div class="col-12 col-md-6 col-lg-4 col-xxl-3">
                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>Last Name</mat-label>
                                <input matInput [(ngModel)]="profile().lastName" (ngModelChange)="updateProfile('lastName', $event)" />
                            </mat-form-field>
                        </div>
                        <div class="col-12 col-md-6 col-lg-4 col-xxl-3">
                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>Designation</mat-label>
                                <input matInput [(ngModel)]="profile().designation" (ngModelChange)="updateProfile('designation', $event)" />
                            </mat-form-field>
                        </div>
                        <div class="col-12 col-md-6 col-lg-4 col-xxl-3">
                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>Date of Birth</mat-label>
                                <input matInput [matDatepicker]="picker" [(ngModel)]="profile().dob" (ngModelChange)="updateProfile('dob', $event)" />
                                <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                                <mat-datepicker #picker></mat-datepicker>
                            </mat-form-field>
                        </div>
                        <div class="col-12 col-md-6 col-lg-4 col-xxl-3">
                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>Email Address</mat-label>
                                <input matInput type="email" [(ngModel)]="profile().email" (ngModelChange)="updateProfile('email', $event)" />
                            </mat-form-field>
                        </div>
                        <div class="col-12 col-md-6 col-lg-4 col-xxl-3">
                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>Phone Number</mat-label>
                                <input matInput [(ngModel)]="profile().phoneNumber" (ngModelChange)="updateProfile('phoneNumber', $event)" />
                            </mat-form-field>
                        </div>
                    </div>
                    <div class="row gx-3 align-items-center">
                        <div class="col mb-3 mb-lg-4">
                            <h4>Address</h4>
                        </div>
                    </div>
                    <div class="row gx-3 gx-lg-4">
                        <div class="col-12 col-md-6 col-lg-4 col-xxl-3">
                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>Address Line 1</mat-label>
                                <input matInput [(ngModel)]="profile().address1" (ngModelChange)="updateProfile('address1', $event)" />
                            </mat-form-field>
                        </div>
                        <div class="col-12 col-md-6 col-lg-4 col-xxl-3">
                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>Address Line 2</mat-label>
                                <input matInput [(ngModel)]="profile().address2" (ngModelChange)="updateProfile('address2', $event)" />
                            </mat-form-field>
                        </div>
                        <div class="col-12 col-md-6 col-lg-4 col-xxl-3">
                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>City</mat-label>
                                <input matInput [(ngModel)]="profile().city" (ngModelChange)="updateProfile('city', $event)" />
                            </mat-form-field>
                        </div>
                        <div class="col-12 col-md-6 col-lg-4 col-xxl-3">
                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>State / Province</mat-label>
                                <input matInput [(ngModel)]="profile().state" (ngModelChange)="updateProfile('state', $event)" />
                            </mat-form-field>
                        </div>
                        <div class="col-12 col-md-6 col-lg-4 col-xxl-3">
                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>ZIP Code</mat-label>
                                <input matInput [(ngModel)]="profile().zipCode" (ngModelChange)="updateProfile('zipCode', $event)" />
                            </mat-form-field>
                        </div>
                        <div class="col-12 col-md-6 col-lg-4 col-xxl-3">
                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>Country</mat-label>
                                <input matInput [(ngModel)]="profile().country" (ngModelChange)="updateProfile('country', $event)" />
                            </mat-form-field>
                        </div>
                        <div class="col-12 col-md-6 col-lg-4 col-xxl-3">
                            <mat-form-field appearance="outline" class="w-100">
                                <mat-label>Member Since</mat-label>
                                <input matInput [value]="profile().memberSince" disabled />
                            </mat-form-field>
                        </div>
                    </div>
                </mat-card-content>
            </mat-card>

            <!-- save button -->
            <div class="mb-3">
                <button matButton="filled" [disabled]="isSaving()" (click)="handleSave()">
                    <div>
                        @if (isSaving()) {
                        <mat-icon class="align-middle me-1">hourglass_empty</mat-icon>
                        Saving... } @else {
                        <mat-icon class="align-middle me-1">save</mat-icon>
                        Update }
                    </div>
                </button>
            </div>
            @if (isSaving()) { <mat-progress-bar mode="indeterminate" class="w-100 mb-3"></mat-progress-bar>}
        </div>
    `,
    styles: [``],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SettingsComponent {
    value = "";

    addcards = signal(false);
    addbanks = signal(false);

    isSaving = signal(false);

    profileDetails = signal<UserProfile>({
        firstName: "Admin",
        lastName: "UIUX",
        email: "adminuiux.public@invcorp.com",
        designation: "Lead UIUX designer",
        userId: "INV-12345",
        dob: "05/09/1988",
        memberSince: "2021",
        status: "Active",
        phoneNumber: "(555) 123-4567",
        address1: "143 Material Way",
        address2: "Suite 200",
        city: "San Francisco",
        state: "CA",
        zipCode: "94107",
        country: "US",
    });

    profile = signal<UserProfile>(this.profileDetails());

    updateProfile(key: keyof UserProfile, value: any): void {
        this.profile.update((currentProfile) => ({
            ...currentProfile,
            [key]: value,
        }));
    }

    handleSave(): void {
        this.isSaving.set(true);
        console.log("Saving Profile Data:", this.profile());
        setTimeout(() => {
            this.isSaving.set(false);
            // In a real application, you would use a MatDialog for messages, not alert().
            console.log("Profile saved successfully!");
        }, 1500);
    }
}

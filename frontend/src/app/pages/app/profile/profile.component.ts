import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatCardModule } from "@angular/material/card";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { RouterLink } from "@angular/router";
import { MatTabsModule } from "@angular/material/tabs";
import { MatTableModule } from "@angular/material/table";
import Swiper from "swiper";
import { register } from "swiper/element/bundle";
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
    selector: "app-profile",
    standalone: true,
    imports: [CommonModule, RouterLink, FormsModule, MatListModule, MatTableModule, MatTabsModule, MatMenuModule, MatIconModule, MatInputModule, MatFormFieldModule, MatCardModule, MatToolbarModule, MatButtonModule],
    template: `
        <div class="container fade-in py-3 py-lg-4">
            <div class="row gx-3 align-items-center">
                <div class="col mb-3 mb-xl-0 py-1">
                    <h3 class="mb-1">Profile</h3>
                    <p class="text-secondary small">Keep your profile updated</p>
                </div>

                <div class="col-auto mb-3 mb-xl-0">
                    <button matButton="filled" routerLink="../settings"><mat-icon class="material-icons-outlined">edit</mat-icon> Edit</button>
                </div>
            </div>
        </div>

        <!-- content -->
        <div class="container">
            <div class="row gx-3 gx-lg-4 justify-content-center">
                <div class="col-12 col-lg-6 col-xl-4">
                    <!-- profile details -->
                    <mat-card class="mb-3 overflow-hidden">
                        <div class="w-100 position-relative bg-theme">
                            <figure class="height-140 w-100 coverimg z-index-0">
                                <img src="assets/img/background1.jpg" class="mw-100" alt="" />
                            </figure>
                        </div>

                        <mat-card-content class="pb-0">
                            <div class="text-center mb-3">
                                <div class="position-relative z-index-0 mb-3 mb-lg-4" style="margin-top:-80px">
                                    <figure class="avatar avatar-140 coverimg rounded-circle mx-auto z-index-1">
                                        <img src="assets/img/user-6.jpg" alt="" />
                                    </figure>
                                </div>
                                <h2 class="mb-1">
                                    <span class="align-middle">{{ profile().firstName }} {{ profile().lastName }}</span>
                                </h2>
                                <p class="text-secondary">{{ profile().designation }}</p>
                            </div>

                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <mat-icon class="material-icons-outlined align-middle text-secondary">mail</mat-icon>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Email</p>
                                    <p class="">{{ profile().email }}</p>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <mat-icon class="material-icons-outlined align-middle text-secondary">call</mat-icon>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Phone</p>
                                    <p class="">{{ profile().phoneNumber }}</p>
                                </div>
                                <div class="col-auto">
                                    <a routerLink="../settings" matButton>Add Phone</a>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <mat-icon class="material-icons-outlined align-middle text-secondary">cake</mat-icon>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Date of Birth</p>
                                    <p class="">{{ profile().dob }}</p>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <mat-icon class="material-icons-outlined align-middle text-secondary">event</mat-icon>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Duration</p>
                                    <p class="">Since {{ profile().memberSince }}</p>
                                </div>
                            </div>
                            <div class="row gx-3 align-items-center mb-3">
                                <div class="col-auto">
                                    <mat-icon class="material-icons-outlined align-middle text-secondary">badge</mat-icon>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Status</p>
                                    <p class="">
                                        <span
                                            class="badge badge-light"
                                            [ngClass]="{
                                                'theme-green': profile().status === 'Active',
                                                'theme-orange': profile().status === 'Inactive',
                                                'theme-violet': profile().status === 'Leave',
                                                'theme-red': profile().status === 'Left',
                                            }">
                                            {{ profile().status | titlecase }}
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div class="row gx-3 mb-3">
                                <div class="col-auto">
                                    <mat-icon class="material-icons-outlined align-middle text-secondary">location_on</mat-icon>
                                </div>
                                <div class="col">
                                    <p class="text-secondary small mb-1">Address</p>
                                    <p class="">
                                        {{ profile().address1 }}, {{ profile().address2 }}, {{ profile().city }}<br />
                                        {{ profile().state }} - {{ profile().zipCode }}, {{ profile().country }}
                                    </p>
                                </div>
                            </div>
                        </mat-card-content>
                    </mat-card>
                </div>
            </div>
        </div>
    `,
    styles: [``],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ProfileComponent {
    profile = signal<UserProfile>({
        firstName: "Admin",
        lastName: "UIUX",
        email: "adminuiux.public@invcorp.com",
        designation: "Lead UIUX designer",
        userId: "INV-12345",
        dob: "05/15/1988",
        memberSince: "25-11-2026",
        status: "Active",
        phoneNumber: "-",
        address1: "143 Material Way",
        address2: "Suite 200",
        city: "San Francisco",
        state: "CA",
        zipCode: "94107",
        country: "US",
    });
    constructor() {}
}

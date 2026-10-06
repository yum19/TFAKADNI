import { Component, Input } from "@angular/core";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { Observable } from "rxjs";
import { map, shareReplay, take } from "rxjs/operators";
import { AsyncPipe, CommonModule } from "@angular/common";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";
import { MatAccordion, MatExpansionModule } from "@angular/material/expansion";
import { MatSidenav } from "@angular/material/sidenav";
import { MatButtonModule } from "@angular/material/button";
import { MatCard, MatCardModule } from "@angular/material/card";

interface NavItem {
    name: string;
    route?: string;
    icon: string;
    children?: NavItem[];
}

@Component({
    selector: "app-app-sidebar",
    standalone: true,
    imports: [CommonModule, MatListModule, MatIconModule, MatCardModule, RouterModule, MatExpansionModule, MatButtonModule],
    template: `
        <div class="sidebar d-flex flex-column flex-grow-1">
            <nav class="sidebar-nav">
                <mat-nav-list>
                    <mat-accordion>
                        @for (item of navItems; track item.name) { @if (item.children) {

                        <mat-expansion-panel class="">
                            <mat-expansion-panel-header class="nav-item-header p-0 h-auto">
                                <mat-panel-title class="flex items-center p-3">
                                    <mat-icon matListItemIcon class="material-icons-outlined">{{ item.icon }}</mat-icon>
                                    <span class="flex-grow">{{ item.name }}</span>
                                </mat-panel-title>
                            </mat-expansion-panel-header>
                            <mat-nav-list>
                                <mat-accordion [multi]="false">
                                    @for (child of item.children; track child.name) { @if (child.children) {
                                    <mat-expansion-panel class="">
                                        <mat-expansion-panel-header class="nav-item-header p-0 h-auto">
                                            <mat-panel-title class="flex items-center p-3">
                                                @if (child.icon){
                                                <mat-icon matListItemIcon class="material-icons-outlined">{{ child.icon }}</mat-icon>
                                                }
                                                <span class="flex-grow">{{ child.name }}</span>
                                            </mat-panel-title>
                                        </mat-expansion-panel-header>
                                        <mat-nav-list>
                                            @for (grandchild of child.children; track grandchild.name) {
                                            <a mat-list-item [routerLink]="grandchild.route" routerLinkActive="active" (click)="closeSidenavIfHandset()" class="nav-item pl-6 py-2">
                                                <mat-icon matListItemIcon class="material-icons-outlined">{{ grandchild.icon }}</mat-icon>
                                                <span matListItemTitle>{{ grandchild.name }}</span>
                                            </a>
                                            }
                                        </mat-nav-list>
                                    </mat-expansion-panel>
                                    } @else {
                                    <a mat-list-item [routerLink]="child.route" routerLinkActive="active" (click)="closeSidenavIfHandset()" class="nav-item pl-6 py-2">
                                        @if (child.icon ){
                                        <mat-icon matListItemIcon class="material-icons-outlined">{{ child.icon }}</mat-icon>
                                        }
                                        <span matListItemTitle>{{ child.name }}</span>
                                    </a>
                                    } }
                                </mat-accordion>
                            </mat-nav-list>
                        </mat-expansion-panel>
                        } @else {
                        <a mat-list-item [routerLink]="item.route" routerLinkActive="active" (click)="closeSidenavIfHandset()" class="nav-item px-3 py-3 rounded-lg">
                            @if (item.icon != ''){
                            <mat-icon matListItemIcon class="material-icons-outlined">{{ item.icon }}</mat-icon>
                            }
                            <span matListItemTitle>{{ item.name }}</span>
                        </a>
                        } }
                    </mat-accordion>
                </mat-nav-list>
            </nav>

            <div class="mt-auto w-100">
                @if(approvenotice){
                <mat-card class="bg-light-theme text-theme theme-green mb-3">
                    <mat-card-content><mat-icon class="material-icons-outlined align-middle me-2">check</mat-icon> Support will be provided </mat-card-content>
                </mat-card>
                } @if(notice){
                <mat-card class="bg-light-gradient mt-4 mb-3">
                    <mat-card-content>
                        <h4 class="mb-1">Support Requested</h4>
                        <p class="opacity-75 small">15 Aug 2025, 5:44 PM</p>

                        <div class="row gx-3 mb-3">
                            <div class="col-auto">
                                <img src="assets/img/user-4.jpg" alt="" class="avatar avatar-40 rounded-circle" />
                            </div>
                            <div class="col">
                                <p class="fw-bold mb-1">Liana Doe</p>
                                <p class="text-secondary small text-truncated">Need help for food</p>
                            </div>
                        </div>
                        <div class="row gx-2">
                            <div class="col"><button matButton="filled" (click)="approvedNotice()">Help now!</button></div>
                            <div class="col-auto"><button matButton class="theme-red" (click)="hideNotice()">Reject</button></div>
                        </div>
                    </mat-card-content>
                </mat-card>
                }
            </div>
        </div>
    `,
    styles: [``],
})
export class AppSidebarComponent {
    notice = true;
    approvenotice = false;
    @Input() drawers!: MatSidenav;

    isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
        map((result) => result.matches),
        shareReplay()
    );

    constructor(private breakpointObserver: BreakpointObserver) {}

    navItems: NavItem[] = [
        { name: "Dashboard", route: "/app/dashboard", icon: "house" },
        { name: "Patients", route: "/app/patients", icon: "badge" },

        {
            name: "Account",
            icon: "person   ",
            children: [
                { name: "Login", route: "../auth/login", icon: "" },
                { name: "Signup", route: "../auth/signup", icon: "" },
                { name: "Forgot Password", route: "../auth/forgot-password", icon: "" },
                { name: "Change Password", route: "../auth/change-password", icon: "" },
                { name: "Signup Success", route: "../auth/signup-success", icon: "" },
                { name: "Landing", route: "../auth/landing", icon: "" },
            ],
        },
        {
            name: "Supportive",
            icon: "extension",
            children: [
                { name: "Coming Soon", route: "../coming-soon", icon: "event" },
                { name: "Page Not Found", route: "../**", icon: "bug_report" },
            ],
        },
        { name: "Profile", route: "/app/profile", icon: "account_circle" },
        { name: "Settings", route: "/app/settings", icon: "settings" },
        {
            name: "Front Website",
            icon: "language",
            children: [
                { name: "Home", route: "../web/website", icon: "web" },
                { name: "About Us", route: "../web/about-us", icon: "apartment" },
                { name: "Case Study", route: "../web/case-study", icon: "border_all" },
                { name: "Blog", route: "../web/blog", icon: "newspaper" },
                { name: "Blog Details", route: "../web/blog-details", icon: "newspaper" },
                { name: "Contact Us", route: "../web/contact-us", icon: "mail" },
            ],
        },
    ];

    closeSidenavIfHandset(): void {
        this.isHandset$.pipe(take(1)).subscribe((isHandset) => {
            if (isHandset) {
                this.drawers.toggle();
            }
        });
    }
    hideNotice(): void {
        this.notice = false;
    }
    approvedNotice(): void {
        this.notice = false;
        this.approvenotice = true;
        setTimeout(() => {
            this.approvenotice = false;
        }, 1500);
    }
}

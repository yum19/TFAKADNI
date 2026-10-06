import { Component, ElementRef, Renderer2, signal, viewChild, ViewChild, WritableSignal, OnDestroy, HostListener } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { MatSidenav, MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { AppHeaderComponent } from "../../components/app-header/app-header.component";
import { AppSidebarComponent } from "../../components/app-sidebar/app-sidebar.component";
import { AppFooterComponent } from "../../components/app-footer/app-footer.component";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { Observable } from "rxjs";
import { map, shareReplay } from "rxjs/operators";
import { AsyncPipe, CommonModule } from "@angular/common";
import { ThemeComponent } from "../../components/theme/theme.component";
import { NotificationSidenavComponent } from "../../components/notification-sidenav/app-notification-sidenav.component";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

type SidenavView = "theme" | "settings" | null;

// default theme classes
const themes = [
    { name: "Red", class: "theme-red" },
    { name: "Green", class: "theme-green" },
    { name: "Blue", class: "theme-blue" },
    { name: "Yellow", class: "theme-yellow" },
    { name: "Cyan", class: "theme-cyan" },
    { name: "Magenta", class: "theme-magenta" },
    { name: "Orange", class: "theme-orange" },
    { name: "Chartreuse", class: "theme-chartreuse" },
    { name: "Teal", class: "theme-spring-green" },
    { name: "Azure", class: "theme-azure" },
    { name: "Violet", class: "theme-violet" },
    { name: "Rose", class: "theme-rose" },
    { name: "Custom", class: "theme-custom" },
];

@Component({
    selector: "app-app-layout",
    standalone: true,
    imports: [RouterOutlet, CommonModule, MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule, AppHeaderComponent, AppSidebarComponent, AppFooterComponent, AsyncPipe, ThemeComponent, NotificationSidenavComponent],
    template: `
        <div class="app-layout" [class.is-mobile]="isMobile">
            <mat-sidenav-container class="sidenav-container">
                <!-- main sidebar -->
                <mat-sidenav #drawers class="sidenav" fixedInViewport [attr.role]="(isHandset$ | async) ? 'dialog' : 'navigation'" [mode]="(isHandset$ | async) ? 'over' : 'side'" [opened]="(isHandset$ | async) === false">
                    <app-app-sidebar [drawers]="drawers"></app-app-sidebar>
                </mat-sidenav>

                <mat-sidenav-content class="main-sidenav-content">
                    <!-- header -->
                    <app-app-header [drawers]="drawers" (openSettingsMenu)="openSidenav('settings')" id="appheader"></app-app-header>

                    <!-- content -->
                    <main class="main-content" id="appmain">
                        <router-outlet></router-outlet>
                    </main>

                    <!-- footer  -->
                    <app-app-footer id="appfooter"></app-app-footer>

                    <!-- theme -->
                    <div class="position-fixed bottom-0 end-0 mx-2 my-3 z-index-9 theme-button">
                        <button matMiniFab class="theme-magenta" aria-label="theme" (click)="openSidenav('theme')">
                            <mat-icon>palette</mat-icon>
                        </button>
                    </div>
                </mat-sidenav-content>

                <mat-sidenav #sidenav position="end" fixedInViewport mode="over" class=" bg-light-gradient">
                    <mat-toolbar class="bg-none">
                        <h2 class="fw-bold">{{ currentView() === "theme" ? "Theme Selection" : "Notifications" }}</h2>
                        <span class="spacer"></span>
                        <button matIconButton aria-label="theme close" (click)="sidenav.close()">
                            <mat-icon>close</mat-icon>
                        </button>
                    </mat-toolbar>

                    @if (currentView() === 'theme') {
                    <!-- theme -->
                    <app-theme></app-theme>
                    } @else if (currentView() === 'settings') {
                    <!-- settings -->
                    <app-notification-sidenav></app-notification-sidenav>
                    }
                </mat-sidenav>
            </mat-sidenav-container>
        </div>
    `,
    styles: [``],
})
export class AppLayoutComponent {
    // theme class
    currentTheme = signal<string>(localStorage.getItem("app-theme") || "");
    currentMode = signal<string>(localStorage.getItem("app-mode") || "");

    isMobile = false;

    private destroy$ = new Subject<void>();

    sidenav = viewChild<MatSidenav>("sidenav");

    currentView: WritableSignal<SidenavView> = signal(null);

    isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
        map((result) => result.matches),
        shareReplay()
    );

    constructor(private el: ElementRef, private renderer: Renderer2, private breakpointObserver: BreakpointObserver) {}

    ngOnInit(): void {
        // mobile view detect to add is-mobile class on body
        this.breakpointObserver
            .observe([Breakpoints.HandsetPortrait, Breakpoints.HandsetLandscape])
            .pipe(takeUntil(this.destroy$))
            .subscribe((result) => {
                // 'result.matches' is true if the current screen size matches one of the observed breakpoints
                this.isMobile = result.matches;
            });

        // initial local theme apply
        if (this.currentTheme()) {
            themes.forEach((theme) => document.body.classList.remove(theme.class));
            document.body.classList.add(this.currentTheme());
        }
        if (this.currentMode() === "true") {
            document.body.classList.remove("light-mode");
            document.body.classList.add("dark-mode");
        } else {
            document.body.classList.add("light-mode");
            document.body.classList.remove("dark-mode");
        }
    }

    ngAfterViewInit(): void {
        // min height set resize
        this.calculateMainHeight();
        window.addEventListener("resize", () => this.calculateMainHeight());
    }
    ngAfterViewChecked(): void {
        // padding bottom footer mobile
        this.adjustPadding();
    }
    // min height for main cotnent
    calculateMainHeight(): void {
        this.renderer.setAttribute(this.el.nativeElement.querySelector("#appmain"), "style", `--min-height: calc(100vh - (1rem + ${this.el.nativeElement.querySelector("#appheader").offsetHeight + this.el.nativeElement.querySelector("#appfooter").offsetHeight}px)); margin-top: calc( ${this.el.nativeElement.querySelector("#appheader").offsetHeight}px) `);
    }
    // open sidebar
    openSidenav(view: SidenavView) {
        this.currentView.set(view);
        const sidenav = this.sidenav();
        if (sidenav) {
            sidenav.open();
        }
    }

    // footer mobile bottom space
    adjustPadding() {
        const footerMobileElement = this.el.nativeElement.querySelector(".mobile-footer");
        const themeButton = this.el.nativeElement.querySelector(".theme-button");

        if (footerMobileElement) {
            const footerMobileHeight = footerMobileElement.offsetHeight;
            this.renderer.setStyle(document.body, "padding-bottom", `calc(${footerMobileHeight}px + env(safe-area-inset-bottom) + 1rem )`);
            this.renderer.setStyle(themeButton, "padding-bottom", `calc(${footerMobileHeight}px + env(safe-area-inset-bottom) + 1rem )`);
        } else {
            this.renderer.setStyle(document.body, "padding-bottom", "0");
            this.renderer.setStyle(themeButton, "padding-bottom", "0");
        }
    }

    // responsive is mobile
    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}

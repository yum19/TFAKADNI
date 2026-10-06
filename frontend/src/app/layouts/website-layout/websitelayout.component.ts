import { Component, ElementRef, Renderer2 } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { Observable } from "rxjs";
import { map, shareReplay } from "rxjs/operators";
import { IndexHeaderComponent } from "../../components/index-header/index-header.component";
import { IndexFooterComponent } from "../../components/index-footer/index-footer.component";
import { MatListModule } from "@angular/material/list";

@Component({
    selector: "app-website-layout",
    standalone: true,
    imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule, IndexHeaderComponent, IndexFooterComponent, MatListModule],
    template: `
        <div class="app-layout">
            <mat-sidenav-container class="example-container">
                <mat-sidenav #drawers mode="over" class="position-fixed">
                    <nav class="websidebar-nav ">
                        <div class="sidebar-header">
                            <div class="clear"></div>
                            <span class="logo">
                                <img src="assets/img/logo.png" class="logo-img" alt="" />

                                <span class="logo-text">
                                    Pandemic<br />
                                    <small>Tracker</small>
                                </span>
                            </span>
                        </div>
                        <mat-nav-list>
                            @for (link of navLinks; track link.path) {
                            <a mat-list-item routerLink="{{ link.path }}" routerLinkActive="active" (click)="drawers.toggle()">
                                {{ link.label }}
                            </a>
                            }
                        </mat-nav-list>
                        <div class="text-center">
                            <a routerLink="/app/dashboard" routerLinkActive="active" matButton="filled" class="theme-green"> View Demo </a>
                        </div>
                    </nav>
                </mat-sidenav>
                <mat-sidenav-content>
                    <app-index-header [drawers]="drawers" id="appheader"></app-index-header>
                    <main class="web-content" id="appmain">
                        <router-outlet></router-outlet>
                    </main>
                    <app-index-footer id="appfooter"></app-index-footer>
                </mat-sidenav-content>
            </mat-sidenav-container>
        </div>
    `,
    styles: [``],
})
export class WebsiteLayoutComponent {
    navLinks = [
        { label: "Home", path: "/web/website" },
        { label: "About Us", path: "/web/about-us" },
        { label: "Case Study", path: "/web/case-study" },
        { label: "Blog", path: "/web/blog" },
        { label: "Contact Us", path: "/web/contact-us" },
    ];
    constructor(private el: ElementRef, private renderer: Renderer2, private breakpointObserver: BreakpointObserver) {}
    ngOnInit(): void {
        this.calculateMainHeight();
    }
    ngAfterViewInit(): void {
        this.calculateMainHeight();
        window.addEventListener("resize", () => this.calculateMainHeight());
    }
    calculateMainHeight(): void {
        this.renderer.setAttribute(this.el.nativeElement.querySelector("#appmain"), "style", `--min-height: calc(100vh - (1rem + ${this.el.nativeElement.querySelector("#appheader").offsetHeight + this.el.nativeElement.querySelector("#appfooter").offsetHeight}px));`);
    }
}

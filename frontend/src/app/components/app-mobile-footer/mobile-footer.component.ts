import { Component, HostListener, Inject, OnInit, AfterViewInit, OnDestroy, ElementRef, Renderer2 } from "@angular/core";
import { DOCUMENT, CommonModule } from "@angular/common";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

@Component({
    selector: "app-mobile-footer",
    standalone: true,
    imports: [RouterLink, CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, RouterLinkActive],
    template: `
        <mat-toolbar class="bg-blue-600 text-white flex justify-around rounded-t-lg md:hidden">
            <button mat-icon-button routerLink="/app/dashboard" routerLinkActive="active">
                <mat-icon>home</mat-icon>
            </button>
            <button mat-icon-button routerLink="/app/patients" routerLinkActive="active">
                <mat-icon>person</mat-icon>
            </button>
            <button mat-icon-button routerLink="/app/settings" routerLinkActive="active">
                <mat-icon>settings</mat-icon>
            </button>
            <button mat-icon-button routerLink="/app/profile" routerLinkActive="active">
                <mat-icon>account_circle</mat-icon>
            </button>
            <button mat-icon-button routerLink="/app/website" routerLinkActive="active">
                <mat-icon>globe</mat-icon>
            </button>
        </mat-toolbar>
    `,
})
export class MobileFooterComponent {
    ngOnInit() {}
}

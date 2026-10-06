(window as any).global = window;
import { Component, OnInit, ElementRef, Renderer2, enableProdMode, Injectable, signal, importProvidersFrom, APP_INITIALIZER, DOCUMENT, HostListener, Inject } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from "@angular/router";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideHttpClient, withInterceptors } from "@angular/common/http";  // ← AJOUTÉ
import { routes } from "./app/app.routes";
import { environment } from "./environments/environment";
import { filter } from "rxjs/operators";
import { RouterOutlet } from "@angular/router";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { jwtInterceptor } from "./app/core/interceptors/jwt.interceptor";  // ← AJOUTÉ
import { AccessibilityComponent } from "./app/components/accessibility/accessibility.component";
import { NotificationDisplayComponent } from "./app/components/notification-display/notification-display.component";

if (environment.production) {
    enableProdMode();
}

@Injectable({ providedIn: "root" })
export class LoadingService {
    private loading = signal(false);
    public readonly isLoading = this.loading.asReadonly();
    show() { this.loading.set(true); }
    hide() { this.loading.set(false); }
}

@Component({
    selector: "app-root",
    standalone: true,
    imports: [RouterOutlet, MatProgressBarModule, AccessibilityComponent, NotificationDisplayComponent],
    template: `@if (loadingService.isLoading()) {
        <mat-progress-bar mode="indeterminate" class="router-progress-bar w-100 z-index-9 position-fixed top-0 start-0"></mat-progress-bar>
        }
        <router-outlet></router-outlet>
        <app-accessibility></app-accessibility>
        <app-notification-display></app-notification-display>`,
    styles: [],
})
export class App implements OnInit {
    lastScrollTop: number = 0;
    pagelength: number = 0;
    constructor(private el: ElementRef, private renderer: Renderer2, public loadingService: LoadingService, @Inject(DOCUMENT) private document: Document) {}

    ngOnInit() {}

    ngAfterViewChecked(): void {
        const lastScrollTop = document.documentElement.scrollTop;
        this.pagelength = this.document.documentElement.scrollHeight - 50;
        this.processCoverImages();
    }

    private processCoverImages() {
        const coverImages = this.el.nativeElement.querySelectorAll(".coverimg");
        coverImages.forEach((coverImage: HTMLElement) => {
            const imgElement = coverImage.querySelector("img");
            if (imgElement) {
                const imgSrc = imgElement.getAttribute("src");
                if (imgSrc) {
                    this.renderer.setStyle(coverImage, "background-image", `url('${imgSrc}')`);
                    this.renderer.removeChild(coverImage, imgElement);
                }
            }
        });
    }

    @HostListener("window:scroll", [])
    onWindowScroll() {
        const st = this.document.documentElement.scrollTop;
        if (st + this.document.documentElement.clientHeight <= this.pagelength && st >= 50) {
            if (st > this.lastScrollTop) {
                this.renderer.addClass(this.document.body, "scrolldown");
                this.renderer.removeClass(this.document.body, "scrollup");
            } else if (st <= this.lastScrollTop) {
                this.renderer.addClass(this.document.body, "scrollup");
                this.renderer.removeClass(this.document.body, "scrolldown");
            }
            this.lastScrollTop = st;
        } else {
            this.renderer.addClass(this.document.body, "scrollup");
            this.renderer.removeClass(this.document.body, "scrolldown");
        }
    }
}

bootstrapApplication(App, {
    providers: [
        provideAnimationsAsync(),
        importProvidersFrom(MatProgressBarModule),
        provideRouter(routes),
        provideHttpClient(withInterceptors([jwtInterceptor])),  // ← AJOUTÉ
        LoadingService,
        {
            provide: APP_INITIALIZER,
            useFactory: (router: Router, loadingService: LoadingService) => () => {
                router.events.pipe(filter((event) => event instanceof NavigationStart || event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError)).subscribe((event) => {
                    if (event instanceof NavigationStart) {
                        loadingService.show();
                    } else if (event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
                        loadingService.hide();
                    }
                });
            },
            deps: [Router, LoadingService],
            multi: true,
        },
    ],
}).catch((err) => console.error(err));
import { Component, ElementRef, Renderer2 } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
    selector: "app-full-layout",
    standalone: true,
    imports: [RouterOutlet],
    template: `
        <div class="container vh-100">
            <router-outlet></router-outlet>
        </div>
    `,
    styles: [``],
})
export class FullLayoutComponent {
    constructor(private el: ElementRef, private renderer: Renderer2) {}

    ngAfterViewChecked(): void {
        // padding bottom footer mobile
        this.adjustPadding();
    }

    adjustPadding() {
        const footerMobileElement = this.el.nativeElement.querySelector(".mobile-footer");
        const themeButton = this.el.nativeElement.querySelector(".theme-button");

        if (footerMobileElement) {
            const footerMobileHeight = footerMobileElement.offsetHeight;
            this.renderer.setStyle(document.body, "padding-bottom", `calc(${footerMobileHeight}px + env(safe-area-inset-bottom) + 1rem )`);
        } else {
            this.renderer.setStyle(document.body, "padding-bottom", "0");
        }
    }
}

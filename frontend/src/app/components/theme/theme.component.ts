import { ChangeDetectionStrategy, Component, signal, effect, Input } from "@angular/core";
import { MatDrawer, MatSidenav, MatSidenavModule } from "@angular/material/sidenav";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule } from "@angular/common";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { ThemeRoleService } from "../../core/services/theme-role.service";

const themes = [
  { name: "Red", class: "theme-red" },
  { name: "Green", class: "theme-green" },
  { name: "Blue", class: "theme-blue" },
  { name: "Yellow", class: "theme-yellow" },
  { name: "Cyan", class: "theme-cyan" },
  { name: "Magenta", class: "theme-magenta" },
  { name: "Orange", class: "theme-orange" },
  { name: "Teal", class: "theme-spring-green" },
  { name: "Azure", class: "theme-azure" },
  { name: "Violet", class: "theme-violet"},
  { name: "Rose", class: "theme-rose" },
  { name: "Floo", class: "theme-custom" },
  { name: "Partner", class: "theme-partner-teal" },
];

@Component({
  selector: "app-theme",
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
  ],
  template: `
    <div class="theme-sidebar-container">
      <header class="sidebar-header">
        <h3 class="m-0 fw-black">Settings</h3>
        <button mat-icon-button (click)="drawer.close()" aria-label="Close Theme Settings">
          <mat-icon>close</mat-icon>
        </button>
      </header>

      <section class="sidebar-section">
        <label class="section-label">Interface Direction</label>
        <mat-button-toggle-group 
          [value]="currentDir()" 
          (change)="setDir($event.value)" 
          class="dir-toggle-group w-100">
          <mat-button-toggle value="ltr" class="w-50">
            <div class="toggle-content">
              <mat-icon>format_align_left</mat-icon> <span>LTR</span>
            </div>
          </mat-button-toggle>
          <mat-button-toggle value="rtl" class="w-50">
            <div class="toggle-content">
              <mat-icon>format_align_right</mat-icon> <span>RTL</span>
            </div>
          </mat-button-toggle>
        </mat-button-toggle-group>
      </section>

      <section class="sidebar-section">
        <label class="section-label">Brand Color</label>
        <div class="theme-grid">
          @for (theme of themes; track theme.class) {
            <button 
              class="theme-swatch-button" 
              [class.is-active]="currentTheme() === theme.class"
              (click)="setTheme(theme.class)"
              [attr.aria-label]="theme.name">
              
              <div class="swatch-circle" [ngClass]="theme.class">
                @if (currentTheme() === theme.class) {
                  <mat-icon class="active-check">check</mat-icon>
                }
              </div>
              <span class="swatch-label">{{ theme.name }}</span>
            </button>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .theme-sidebar-container {
      padding: 1.5rem;
      color: #333;
    }

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2.5rem;
    }

    .sidebar-section {
      margin-bottom: 2.5rem;
    }

    .section-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      opacity: 0.5;
      margin-bottom: 1rem;
    }

    /* Direction Toggle Styling */
    .dir-toggle-group {
      border: none !important;
      background: #f0f2f5;
      border-radius: 12px !important;
      padding: 4px;
      overflow: hidden;
    }

    .mat-button-toggle {
      border: none !important;
      border-radius: 8px !important;
      background: transparent;
    }

    .mat-button-toggle-checked {
      background: white !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .toggle-content {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-weight: 600;
      font-size: 0.85rem;
    }

    /* Theme Swatch Grid */
    .theme-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .theme-swatch-button {
      background: none;
      border: 1px solid transparent;
      padding: 12px 8px;
      border-radius: 12px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .theme-swatch-button:hover {
      background: #f8f9fa;
    }

    .theme-swatch-button.is-active {
      background: #f0f7f6; /* Subtle highlight */
      border-color: rgba(0,0,0,0.05);
    }

    .swatch-circle {
      width: 38px;
      height: 38px;
      border-radius: 12px; /* Squircle look */
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      /* The .bg-theme from your global styles will provide the color */
      background-color: var(--theme-primary, #ddd); 
    }

    .swatch-label {
      font-size: 0.7rem;
      font-weight: 600;
      color: #666;
    }

    .active-check {
      color: white;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    /* Apply colors based on theme classes - Assuming .bg-theme exists */
    .swatch-circle { background-color: #dee2e6; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ThemeComponent {
  @Input() thememenu!: MatDrawer;
  @Input() drawer!: MatSidenav;

  currentTheme = signal<string>(localStorage.getItem("app-theme") || "");
  currentDir = signal<string>(localStorage.getItem("app-dir") || "ltr");

  themes = themes;

  constructor(private themeRole: ThemeRoleService) {
    effect(() => {
      document.documentElement.setAttribute("dir", this.currentDir());
      localStorage.setItem("app-dir", this.currentDir());
    });
  }

  setTheme(themeClass: string) {
    this.currentTheme.set(themeClass);
    this.themeRole.setTheme(themeClass);
  }

  setDir(dir: string) {
    this.currentDir.set(dir);
  }
}
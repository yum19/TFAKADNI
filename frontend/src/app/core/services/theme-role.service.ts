import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeRoleService {
  private renderer: Renderer2;

  private readonly themes = [
    'theme-red',
    'theme-green',
    'theme-blue',
    'theme-yellow',
    'theme-cyan',
    'theme-magenta',
    'theme-orange',
    'theme-chartreuse',
    'theme-spring-green',
    'theme-azure',
    'theme-violet',
    'theme-rose',
    'theme-custom',
    'theme-partner-teal'
  ];

  private readonly roleDefaults: Record<string, string> = {
    USER: 'theme-custom',
    PARTNER: 'theme-partner-teal',
    ADMIN: 'theme-custom'
  };

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  private roleThemeKey(role: string): string {
    return `app-theme-${role.toLowerCase()}`;
  }

  private safeRole(role: string | null | undefined): string {
    return role ?? localStorage.getItem('app-role') ?? 'USER';
  }

  initializeTheme(role?: string | null): void {
    const effectiveRole = this.safeRole(role);

    localStorage.setItem('app-role', effectiveRole);

    if (localStorage.getItem('app-mode') === null) {
      localStorage.setItem('app-mode', 'false');
    }

    const roleKey = this.roleThemeKey(effectiveRole);
    const roleTheme =
      localStorage.getItem(roleKey) ??
      this.roleDefaults[effectiveRole] ??
      'theme-custom';

    localStorage.setItem('app-theme', roleTheme);

    this.applyStoredTheme();
    this.applyStoredMode();
    this.applyRoleClass(effectiveRole);
  }

  setRoleDefaultTheme(role: string | null | undefined): void {
    if (!role) return;

    localStorage.setItem('app-role', role);

    const roleKey = this.roleThemeKey(role);
    const savedRoleTheme = localStorage.getItem(roleKey);

    if (!savedRoleTheme) {
      localStorage.setItem(roleKey, this.roleDefaults[role] ?? 'theme-custom');
    }

    localStorage.setItem(
      'app-theme',
      localStorage.getItem(roleKey) ?? this.roleDefaults[role] ?? 'theme-custom'
    );

    this.applyStoredTheme();
    this.applyStoredMode();
    this.applyRoleClass(role);
  }

  applyStoredTheme(): void {
    this.themes.forEach(theme => this.renderer.removeClass(document.body, theme));
    const theme = localStorage.getItem('app-theme') || 'theme-custom';
    this.renderer.addClass(document.body, theme);
  }

  applyStoredMode(): void {
    const dark = localStorage.getItem('app-mode') === 'true';

    if (dark) {
      this.renderer.addClass(document.body, 'dark-mode');
      this.renderer.removeClass(document.body, 'light-mode');
    } else {
      this.renderer.addClass(document.body, 'light-mode');
      this.renderer.removeClass(document.body, 'dark-mode');
    }
  }

  private applyRoleClass(role: string): void {
    ['role-user', 'role-partner', 'role-admin'].forEach(cls =>
      this.renderer.removeClass(document.body, cls)
    );

    this.renderer.addClass(document.body, `role-${role.toLowerCase()}`);
  }

  setTheme(themeClass: string): void {
    const role = this.safeRole(localStorage.getItem('app-role'));

    localStorage.setItem('app-theme', themeClass);
    localStorage.setItem(this.roleThemeKey(role), themeClass);

    this.applyStoredTheme();
  }

  setMode(dark: boolean): void {
    localStorage.setItem('app-mode', String(dark));
    this.applyStoredMode();
  }

  toggleMode(): void {
    const current = localStorage.getItem('app-mode') === 'true';
    this.setMode(!current);
  }
}
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { SessionService } from '../../../core/services/session.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-oauth2-callback',
  standalone: true,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="d-flex justify-content-center align-items-center" style="min-height:100vh">
      <div class="text-center">
        <mat-spinner diameter="48"></mat-spinner>
        <p class="mt-3 text-secondary">Connexion en cours...</p>
      </div>
    </div>
  `,
})
export class OAuth2CallbackComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient,
    private sessionService: SessionService
  ) {}

  private getRedirectRoute(): string {
    const role = this.sessionService.role;
    switch (role) {
      case 'ADMIN':
        return '/admin/dashboard';
      case 'PARTNER':
        return '/partner/home';
      case 'USER':
      default:
        return '/mother/home';
    }
  }

  ngOnInit(): void {
    const accessToken  = this.route.snapshot.queryParamMap.get('accessToken');
    const refreshToken = this.route.snapshot.queryParamMap.get('refreshToken');

    if (accessToken && refreshToken) {
      // 1. Sauvegarder les tokens
      this.authService.saveOAuth2Session(accessToken, refreshToken);

      // 2. ✅ Recharger le vrai profil depuis la BDD (createdAt, referralCode, etc.)
      this.http.get<any>(`${environment.apiUrl}/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      }).subscribe({
        next: (res) => {
          if (res?.data) {
            this.authService.updateCurrentUser(res.data);
          }
          this.router.navigate([this.getRedirectRoute()]);
        },
        error: () => {
          this.router.navigate([this.getRedirectRoute()]);
        }
      });
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
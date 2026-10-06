import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-page-not-found',
  standalone: true,
  imports: [RouterLink, MatButtonModule],
  template: `
    <div class="container py-5 text-center">
      <h1 class="display-5 mb-3">Page not found</h1>
      <p class="text-secondary mb-4">The route you requested is not available in this Module 7 frontend package.</p>
      <a mat-flat-button color="primary" routerLink="/auth/login">Back to login</a>
    </div>
  `
})
export class PageNotFoundComponent {}

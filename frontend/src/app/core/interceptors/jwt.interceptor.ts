import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Vérifier si le token JWT est expiré
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export const jwtInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  // Si le token est expiré → rafraîchir avant d'envoyer la requête
  if (token && isTokenExpired(token) && !req.url.includes('/auth/')) {
    return auth.refreshToken().pipe(
      switchMap((res) => {
        const authReq = req.clone({
          setHeaders: { Authorization: `Bearer ${res.data.accessToken}` },
        });
        return next(authReq);
      }),
      catchError((refreshErr) => {
        auth.logoutLocal();
        return throwError(() => refreshErr);
      })
    );
  }

  // Ajouter le Bearer token si présent
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // 401 → tenter un refresh automatique
      if (err.status === 401 && !req.url.includes('/auth/')) {
        return auth.refreshToken().pipe(
          switchMap((res) => {
            const retryReq = req.clone({
              setHeaders: { Authorization: `Bearer ${res.data.accessToken}` },
            });
            return next(retryReq);
          }),
          catchError((refreshErr) => {
            auth.logoutLocal();
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => err);
    })
  );
};
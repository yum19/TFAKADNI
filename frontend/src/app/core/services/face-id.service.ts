import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const THRESHOLD = 0.5;

@Injectable({ providedIn: 'root' })
export class FaceIdService {

  private faceapi: any = null;
  private modelsLoaded = false;
  private loading = false;

  // Cache local (évite trop d'appels API)
  private _enabled: boolean | null = null;
  private _photo: string | null = null;
  private _creds: string | null = null;

  constructor(private http: HttpClient) {}

  // ── API Backend ───────────────────────────────────────────────────────────

  /** Charger les données Face ID depuis la BDD (utilisateur connecté) */
  async loadFromServer(): Promise<void> {
    try {
      const res = await firstValueFrom(
        this.http.get<any>(`${environment.apiUrl}/faceid/me`)
      );
      if (res?.data) {
        this._enabled = res.data.enabled;
        this._photo   = res.data.facePhoto || null;
        this._creds   = res.data.faceCreds || null;
      }
    } catch (err) {
      console.error('[FaceID] Erreur chargement:', err);
    }
  }

  /** Sauvegarder photo + credentials en BDD */
  async savePhoto(base64: string, email: string, password?: string): Promise<void> {
    const creds = password
      ? btoa(unescape(encodeURIComponent(JSON.stringify({ email, password }))))
      : this._creds ?? '';

    await firstValueFrom(
      this.http.post<any>(`${environment.apiUrl}/faceid/save`, {
        facePhoto: base64,
        faceCreds: creds,
        enabled: true,
      })
    );

    this._photo   = base64;
    this._creds   = creds;
    this._enabled = true;
    // Mémoriser l email localement (indice non sensible)
    localStorage.setItem('faceid_hint_email', email);
    this.preloadModels();
  }

  /** Activer / désactiver Face ID en BDD */
  async setEnabled(enabled: boolean): Promise<void> {
    await firstValueFrom(
      this.http.post<any>(`${environment.apiUrl}/faceid/toggle`, { enabled })
    );
    this._enabled = enabled;
  }

  /** Supprimer Face ID en BDD */
  async disable(): Promise<void> {
    await firstValueFrom(
      this.http.delete<any>(`${environment.apiUrl}/faceid/delete`)
    );
    this._enabled = false;
    this._photo   = null;
    this._creds   = null;
    localStorage.removeItem("faceid_hint_email");
  }

  getHintEmail(): string | null {
    return localStorage.getItem("faceid_hint_email");
  }

  /** Pour la page login — récupère par email sans authentification */
  async loadForLogin(email: string): Promise<{ hasPhoto: boolean; facePhoto: string; faceCreds: string }> {
    try {
      const res = await firstValueFrom(
        this.http.get<any>(`${environment.apiUrl}/faceid/for-login?email=${encodeURIComponent(email)}`)
      );
      return {
        hasPhoto:  res?.data?.hasPhoto  ?? false,
        facePhoto: res?.data?.facePhoto ?? '',
        faceCreds: res?.data?.faceCreds ?? '',
      };
    } catch {
      return { hasPhoto: false, facePhoto: '', faceCreds: '' };
    }
  }

  // ── Getters (depuis cache) ────────────────────────────────────────────────

  isEnabled(): boolean     { return this._enabled === true; }
  getPhoto(): string | null { return this._photo; }
  getCredentials(): { email: string; password: string } | null {
    if (!this._creds) return null;
    try { return JSON.parse(decodeURIComponent(escape(atob(this._creds)))); }
    catch { return null; }
  }

  // ── Chargement des modèles face-api.js ────────────────────────────────────

  async loadModels(): Promise<void> {
    if (this.modelsLoaded) return;
    if (this.loading) {
      while (this.loading) await new Promise(r => setTimeout(r, 100));
      return;
    }
    this.loading = true;
    try {
      const faceapi = await import('face-api.js' as any);
      this.faceapi = faceapi;
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models'),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri('/assets/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models'),
      ]);
      this.modelsLoaded = true;
      console.log('[FaceID] ✅ Modèles chargés');
    } catch (err) {
      console.error('[FaceID] ❌ Erreur modèles:', err);
      throw err;
    } finally {
      this.loading = false;
    }
  }

  preloadModels(): void {
    if (!this.modelsLoaded && !this.loading) this.loadModels().catch(() => {});
  }

  // ── Comparaison de visages ────────────────────────────────────────────────

  async compareFaces(referenceBase64: string, capturedBase64: string): Promise<boolean> {
    try {
      await this.loadModels();
      const faceapi = this.faceapi;
      const opts = new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.3 });

      const [imgRef, imgCap] = await Promise.all([
        this.toImage(referenceBase64),
        this.toImage(capturedBase64),
      ]);

      const [detRef, detCap] = await Promise.all([
        faceapi.detectSingleFace(imgRef, opts).withFaceLandmarks(true).withFaceDescriptor(),
        faceapi.detectSingleFace(imgCap, opts).withFaceLandmarks(true).withFaceDescriptor(),
      ]);

      if (!detRef) { console.warn('[FaceID] Référence: visage non détecté'); return false; }
      if (!detCap) { console.warn('[FaceID] Capture: visage non détecté');   return false; }

      const distance = faceapi.euclideanDistance(detRef.descriptor, detCap.descriptor);
      console.log(`[FaceID] Distance: ${distance.toFixed(4)} | Match: ${distance < THRESHOLD}`);
      return distance < THRESHOLD;

    } catch (err) {
      console.error('[FaceID] Erreur comparaison:', err);
      return false;
    }
  }

  private toImage(base64: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload  = () => resolve(img);
      img.onerror = reject;
      img.src = base64;
    });
  }
}
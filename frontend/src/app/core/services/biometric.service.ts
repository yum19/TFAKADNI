import { Injectable } from '@angular/core';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_CREDENTIAL_KEY = 'biometric_credential_id';
const BIOMETRIC_USER_KEY = 'biometric_user_id';

@Injectable({ providedIn: 'root' })
export class BiometricService {

  /** Vérifie si WebAuthn est disponible sur cet appareil/navigateur */
  isSupported(): boolean {
    return !!(
      window.PublicKeyCredential &&
      navigator.credentials &&
      typeof navigator.credentials.create === 'function' &&
      typeof navigator.credentials.get === 'function'
    );
  }

  /** Vérifie si le biométrique est activé pour cet utilisateur */
  isBiometricEnabled(userEmail: string): boolean {
    const storedUser = localStorage.getItem(BIOMETRIC_USER_KEY);
    return (
      localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true' &&
      storedUser === userEmail
    );
  }

  /**
   * Enregistre le biométrique après une connexion classique réussie.
   * Déclenche Face ID / empreinte pour créer la credential WebAuthn.
   */
  async register(userEmail: string): Promise<boolean> {
    try {
      // Challenge aléatoire (côté client — acceptable pour un usage local)
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const userId = crypto.getRandomValues(new Uint8Array(16));

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: {
            name: 'TFAKADNI',
            id: window.location.hostname,
          },
          user: {
            id: userId,
            name: userEmail,
            displayName: userEmail,
          },
          pubKeyCredParams: [
            { alg: -7,  type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',  // Face ID / Touch ID / Windows Hello
            userVerification: 'required',          // Force la vérification biométrique
            residentKey: 'preferred',
          },
          timeout: 60000,
          attestation: 'none',
        },
      }) as PublicKeyCredential;

      if (!credential) return false;

      // Stocker l'ID de la credential
      const credId = this.bufferToBase64(credential.rawId);
      localStorage.setItem(BIOMETRIC_CREDENTIAL_KEY, credId);
      localStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      localStorage.setItem(BIOMETRIC_USER_KEY, userEmail);

      return true;
    } catch (err: any) {
      console.warn('Biometric registration cancelled or failed:', err?.message);
      return false;
    }
  }

  /**
   * Authentification biométrique.
   * Déclenche Face ID / empreinte et retourne true si la vérification réussit.
   */
  async authenticate(): Promise<boolean> {
    try {
      const credIdBase64 = localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY);
      if (!credIdBase64) return false;

      const credId = this.base64ToBuffer(credIdBase64);
      const challenge = crypto.getRandomValues(new Uint8Array(32));

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [
            {
              id: credId,
              type: 'public-key',
              transports: ['internal'],
            },
          ],
          userVerification: 'required',   // Force Face ID / empreinte
          timeout: 60000,
        },
      }) as PublicKeyCredential;

      return !!assertion;
    } catch (err: any) {
      console.warn('Biometric authentication cancelled or failed:', err?.message);
      return false;
    }
  }

  /** Désactive le biométrique (lors du logout) */
  disable(): void {
    localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    localStorage.removeItem(BIOMETRIC_CREDENTIAL_KEY);
    localStorage.removeItem(BIOMETRIC_USER_KEY);
  }

  // ── Utilitaires base64 ────────────────────────────────────────────────────

  private bufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  private base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
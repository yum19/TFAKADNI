import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from, concatMap, toArray, delay } from 'rxjs';

interface LibreTranslateResponse {
  translatedText: string;
}

export type AppLang = 'en' | 'fr' | 'ar';

// ─── Dictionnaire de fallback pour les termes que ArgosTranslate rate ───────
const FALLBACK_DICT: Record<string, Record<AppLang, string>> = {
  'Pill': { en: 'Pill', fr: 'Pilule', ar: 'حبوب منع الحمل' },
  'IUD': { en: 'IUD', fr: 'DIU', ar: 'اللولب' },
  'Condom': { en: 'Condom', fr: 'Préservatif', ar: 'الواقي الذكري' },
  'Implant': { en: 'Implant', fr: 'Implant', ar: 'المكبس' },
  'Injection': { en: 'Injection', fr: 'Injection', ar: 'الحقن' },
  'Vaginal ring': { en: 'Vaginal ring', fr: 'Anneau vaginal', ar: 'الحلقة المهبلية' },
  'Birth control pill': { en: 'Birth control pill', fr: 'Pilule contraceptive', ar: 'حبوب منع الحمل' },
  'Daily hormonal method': { en: 'Daily hormonal method', fr: 'Méthode hormonale quotidienne', ar: 'طريقة هرمونية يومية' },
  'Long-term protection': { en: 'Long-term protection', fr: 'Protection à long terme', ar: 'حماية طويلة الأمد' },
  'Simple and accessible': { en: 'Simple and accessible', fr: 'Simple et accessible', ar: 'بسيط ومتاح' },
  'Discrete and long-lasting': { en: 'Discrete and long-lasting', fr: 'Discret et durable', ar: 'منفصل وطويل الأمد' },
  'A long-acting method placed by a healthcare professional. It can be hormonal or non-hormonal and is often chosen for convenience.': {
    en: 'A long-acting method placed by a healthcare professional. It can be hormonal or non-hormonal and is often chosen for convenience.',
    fr: 'Une méthode à action prolongée posée par un professionnel de santé. Elle peut être hormonale ou non hormonale et est souvent choisie pour sa commodité.',
    ar: 'طريقة طويلة المفعول يضعها متخصص في الرعاية الصحية. يمكن أن تكون هرمونية أو غير هرمونية وغالباً ما يتم اختيارها للراحة.'
  },
  'A small device placed under the skin that offers long-term pregnancy prevention with minimal daily effort.': {
    en: 'A small device placed under the skin that offers long-term pregnancy prevention with minimal daily effort.',
    fr: 'Un petit dispositif placé sous la peau qui offre une prévention de la grossesse à long terme avec un minimum d\'effort quotidien.',
    ar: 'جهاز صغير يوضع تحت الجلد يوفر منع الحمل على المدى الطويل بأدنى جهد يومي.'
  },
  'A non-hormonal option that also helps protect against infections. It is easy to use and widely available.': {
    en: 'A non-hormonal option that also helps protect against infections. It is easy to use and widely available.',
    fr: 'Une option non hormonale qui aide également à se protéger contre les infections. Il est facile à utiliser et largement disponible.',
    ar: 'خيار غير هرموني يساعد أيضاً على الحماية من الالتهابات. سهل الاستخدام ومتاح على نطاق واسع.'
  },
};

@Injectable({
  providedIn: 'root'
})
export class LocalTranslateService {
  private apiUrl = 'http://localhost:5001/translate';
  private readonly MAX_RETRIES = 2;
  private readonly RETRY_DELAY_MS = 400;

  // Cache en mémoire pour éviter les requêtes répétées
  private cache = new Map<string, string>();

  constructor(private http: HttpClient) {}

  translateText(text: string, source: AppLang, target: AppLang): Observable<string> {
    if (!text?.trim() || source === target) {
      return of(text);
    }

    // 1. Vérifier le dictionnaire de fallback d'abord
    const fallback = FALLBACK_DICT[text.trim()]?.[target];
    if (fallback) {
      return of(fallback);
    }

    // 2. Vérifier le cache
    const cacheKey = `${source}:${target}:${text}`;
    if (this.cache.has(cacheKey)) {
      return of(this.cache.get(cacheKey)!);
    }

    // 3. Appeler l'API avec retry
    return this.attemptTranslation(text, source, target, 0, cacheKey);
  }

  private attemptTranslation(
    text: string,
    source: AppLang,
    target: AppLang,
    attempt: number,
    cacheKey: string
  ): Observable<string> {
    return new Observable<string>(observer => {
      this.http.post<LibreTranslateResponse>(this.apiUrl, {
        q: text,
        source,
        target,
        format: 'text'
      }).subscribe({
        next: (res) => {
          const translated = res?.translatedText?.trim();

          // Succès : la traduction est différente du texte original
          if (translated && translated !== text) {
            this.cache.set(cacheKey, translated);
            observer.next(translated);
            observer.complete();
          } else if (attempt < this.MAX_RETRIES) {
            // Échec silencieux → réessayer avec délai
            setTimeout(() => {
              this.attemptTranslation(text, source, target, attempt + 1, cacheKey)
                .subscribe(observer);
            }, this.RETRY_DELAY_MS * (attempt + 1));
          } else {
            // Abandon après MAX_RETRIES → retourner texte original
            observer.next(text);
            observer.complete();
          }
        },
        error: () => {
          if (attempt < this.MAX_RETRIES) {
            setTimeout(() => {
              this.attemptTranslation(text, source, target, attempt + 1, cacheKey)
                .subscribe(observer);
            }, this.RETRY_DELAY_MS * (attempt + 1));
          } else {
            observer.next(text);
            observer.complete();
          }
        }
      });
    });
  }

  translateMany(texts: string[], source: AppLang, target: AppLang): Observable<string[]> {
    if (source === target) {
      return of(texts);
    }

    return from(texts).pipe(
      concatMap((text, index) =>
        of(text).pipe(
          delay(index === 0 ? 0 : 120),
          concatMap(t => this.translateText(t, source, target))
        )
      ),
      toArray()
    );
  }

  // Vider le cache si nécessaire (ex: changement de langue)
  clearCache(): void {
    this.cache.clear();
  }
}
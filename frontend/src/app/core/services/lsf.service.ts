import { Injectable } from '@angular/core';

export interface LsfTerm {
  term: string;
  keywords: string[];
  semId: number;
  description: string;
}

@Injectable({ providedIn: 'root' })
export class LsfService {

  // Sematos - dictionnaire LSF public avec IDs vérifiés
  readonly terms: LsfTerm[] = [
    { term: 'Bonjour',     keywords: ['bonjour', 'salut'],            semId: 2568,  description: 'Main levée, paume vers l\'avant' },
    { term: 'Médecin',     keywords: ['médecin', 'docteur'],          semId: 4231,  description: 'Index vers le coude' },
    { term: 'Douleur',     keywords: ['douleur', 'mal'],              semId: 3102,  description: 'Poings crispés, souffrance' },
    { term: 'Médicament',  keywords: ['médicament', 'pilule'],        semId: 4156,  description: 'Geste d\'avaler' },
    { term: 'Hôpital',     keywords: ['hôpital', 'clinique'],         semId: 3879,  description: 'Croix rouge dans l\'air' },
    { term: 'Bébé',        keywords: ['bébé', 'nourrisson'],         semId: 2104,  description: 'Bercer dans les bras' },
    { term: 'Grossesse',   keywords: ['grossesse', 'enceinte'],       semId: 3421,  description: 'Main sur ventre arrondi' },
    { term: 'Fatigue',     keywords: ['fatigue', 'fatiguée'],         semId: 3287,  description: 'Épaules baissées, lassitude' },
    { term: 'Allergie',    keywords: ['allergie', 'allergique'],      semId: 2089,  description: 'Geste de gratter + refus' },
    { term: 'Urgence',     keywords: ['urgence', 'aide'],             semId: 5341,  description: 'Geste rapide et expressif' },
    { term: 'Merci',       keywords: ['merci'],                       semId: 4312,  description: 'Main des lèvres vers l\'interlocuteur' },
    { term: 'Santé',       keywords: ['santé'],                       semId: 4987,  description: 'Avant-bras croisés puis ouverts' },
  ];

  getSearchUrl(term: LsfTerm): string {
    return `https://www.sematos.eu/lsf-p-${term.term.toLowerCase().replace(/\s/g, '-')}-${term.semId}.html`;
  }

  getYoutubeSearch(term: string): string {
    return `https://www.youtube.com/results?search_query=signe+LSF+${encodeURIComponent(term)}`;
  }

  findTerm(keyword: string): LsfTerm | null {
    const lower = keyword.toLowerCase();
    return this.terms.find(t => t.keywords.some(k => lower.includes(k))) ?? null;
  }
}
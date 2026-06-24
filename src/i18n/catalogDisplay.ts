import type { AppLanguage } from '../types/firestoreUser';
import exerciseNamesEs from '../data/locales/exerciseNamesEs.json';
import foodNamesEs from '../data/locales/foodNamesEs.json';
import muscleNamesEs from '../data/locales/muscleNamesEs.json';
import routineNamesEs from '../data/locales/routineNamesEs.json';

export function getExerciseDisplayName(id: string, englishName: string, lang: AppLanguage): string {
  if (lang === 'es') {
    return (exerciseNamesEs as Record<string, string>)[id] ?? englishName;
  }
  return englishName;
}

export function getFoodDisplayName(id: string, englishName: string, lang: AppLanguage): string {
  if (lang === 'es') {
    return (foodNamesEs as Record<string, string>)[id] ?? englishName;
  }
  return englishName;
}

export function getMuscleDisplayName(muscle: string, lang: AppLanguage): string {
  if (lang === 'es') {
    return (muscleNamesEs as Record<string, string>)[muscle] ?? muscle;
  }
  return muscle;
}

export function getRoutineDisplayTitle(id: string, englishTitle: string, lang: AppLanguage): string {
  if (lang === 'es') {
    const hit = (routineNamesEs as Record<string, { title: string }>)[id];
    return hit?.title ?? englishTitle;
  }
  return englishTitle;
}

export function getRoutineDisplayDescription(
  id: string,
  englishDescription: string,
  lang: AppLanguage,
): string {
  if (lang === 'es') {
    const hit = (routineNamesEs as Record<string, { description: string }>)[id];
    return hit?.description ?? englishDescription;
  }
  return englishDescription;
}

export function formatLocaleTag(lang: AppLanguage): string {
  return lang === 'es' ? 'es-ES' : 'en-US';
}

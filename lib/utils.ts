/**
 * Utilitaires généraux partagés dans toute l'application.
 *
 * CE FICHIER CONTIENT (pour débutants) :
 * -------------------------------------------
 * - cn()            : fusionner des classes CSS Tailwind intelligemment
 * - formatMAD()     : formater un montant en Dirhams marocains (ex: 1 500 000 MAD)
 * - formatDate()    : formater une date en français (ex: 15/04/2025)
 * - formatDateTime(): formater une date+heure en français (ex: 15/04/2025 14:30)
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================================================
// CSS / TAILWIND
// ============================================================================

/**
 * Fusionne des classes CSS Tailwind en gérant les conflits intelligemment.
 *
 * Problème sans cn() : "p-4 p-2" → les deux classes sont gardées (résultat imprévisible)
 * Avec cn()           : "p-4 p-2" → seul "p-2" est gardé (la dernière gagne)
 *
 * Exemple d'utilisation :
 *   cn("bg-red-500", isActive && "bg-green-500")
 *   → "bg-green-500" si isActive est true (résout le conflit)
 *
 * @param inputs - Classes CSS (chaînes, objets conditionnels, tableaux...)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ============================================================================
// FORMATAGE MONÉTAIRE
// ============================================================================

/**
 * Formate un montant numérique en Dirhams marocains.
 * Utilise le format local marocain (séparateur de milliers, symbole MAD).
 *
 * Exemples :
 *   formatMAD(1500000) → "1 500 000 MAD"
 *   formatMAD(0)       → "0 MAD"
 *
 * @param montant - Montant en MAD (nombre entier ou décimal)
 */
export function formatMAD(montant: number): string {
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(montant);
}

// ============================================================================
// FORMATAGE DES DATES
// ============================================================================

/**
 * Formate une date en format court français (JJ/MM/AAAA).
 *
 * Exemples :
 *   formatDate(new Date("2025-04-15")) → "15/04/2025"
 *
 * @param date - Objet Date JavaScript
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Formate une date avec l'heure en français (JJ/MM/AAAA HH:MM).
 * Utile pour les timestamps d'audit, de création, de modification.
 *
 * Exemples :
 *   formatDateTime(new Date("2025-04-15T14:30:00")) → "15/04/2025 14:30"
 *
 * @param date - Objet Date JavaScript
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

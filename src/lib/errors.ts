/**
 * Supabase (postgrest-js) renvoie ses erreurs sous forme d'objets simples `{ message, details,
 * hint, code }` — pas des instances d'`Error`. Un `err instanceof Error` les transformait donc
 * toutes en "Erreur inconnue", masquant la vraie cause (RLS, colonne manquante, réseau…).
 */
export function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return translate(err.message)
  if (err && typeof err === 'object') {
    const { message, details, hint, code } = err as Record<string, unknown>
    const parts = [message, details, hint].filter((part): part is string => typeof part === 'string' && part !== '')
    if (parts.length > 0) {
      const text = translate(parts.join(' — '))
      return typeof code === 'string' && code !== '' ? `${text} (code ${code})` : text
    }
  }
  if (typeof err === 'string' && err !== '') return translate(err)
  return 'Erreur inconnue'
}

function translate(message: string): string {
  if (/row-level security/i.test(message)) {
    return `Accès refusé par Supabase (policy RLS) : ${message}`
  }
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return `Impossible de joindre Supabase (réseau, ou projet Supabase en pause) : ${message}`
  }
  return message
}

/** Insensible aux accents et à la casse, pour la recherche par nom. */
export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** Concatène prénom/nom en tolérant qu'un des deux soit vide (pas d'espace superflu). */
export function formatFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim()
}

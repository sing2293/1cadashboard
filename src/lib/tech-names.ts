/**
 * Tech names as ServiceMonster and Mobile Punches write them. Both are typed by
 * people, so the same tech can be "Alexis  Léveillé" in one and "Alexis
 * Leveille" in the other. nameKey() folds case, accents, punctuation and
 * spacing so those compare equal.
 */
export function nameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** A name with its runs of spaces collapsed, for display. */
export function cleanName(name: string): string {
  return name.replace(/\s+/g, " ").trim();
}

/** The techs on one ServiceMonster job: its `techs` field is "Name, Name". */
export function splitTechs(techs: string | null | undefined): string[] {
  if (!techs) return [];
  return techs
    .split(",")
    .map(cleanName)
    .filter((n) => n.length > 0);
}

import { combineMelodyAndLyrics } from "./parser";
import { AbcMelody, AbcSubMelody, Verse } from "./basedTypes";


export const getForVerse = (melody: AbcMelody, verse: Verse): AbcSubMelody | undefined =>
  melody.subMelodies.find(it =>
    // `.includes()` won't work due to the Realm data type of `verseUuids`.
    it.verseUuids.some(it => it == verse.uuid));

/**
 * Combine an ABC melody with the lyrics of a verse into a single ABC notation string.
 *
 * @param verse
 * @param activeMelody - The active melody to use. The method returns an empty string if this is undefined.
 * @param options { trimLines?: boolean } - Whether to trim `y` spacers from start/end of lines.
 */
export const generateAbcForVerse = (
  verse: Verse,
  activeMelody?: AbcMelody,
  options: { trimLines?: boolean } = { trimLines: false },
): string => {
  if (activeMelody === undefined) {
    return "";
  }
  const melody = getForVerse(activeMelody, verse)?.melody || activeMelody.melody;
  return combineMelodyAndLyrics(melody, verse.abcLyrics || "", options)
};
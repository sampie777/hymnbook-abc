import { combineMelodyAndLyrics } from "./abc";
import { AbcMelody, AbcSubMelody, Verse } from "./basedTypes";


export const getForVerse = (melody: AbcMelody, verse: Verse): AbcSubMelody | undefined =>
  melody.subMelodies.find(it =>
    // `.includes()` won't work due to the Realm data type of `verseUuids`.
    it.verseUuids.some(it => it == verse.uuid));

export const generateAbcForVerse = (
  verse: Verse,
  activeMelody?: AbcMelody
): string => {
  if (activeMelody === undefined) {
    return "";
  }
  const melody = getForVerse(activeMelody, verse)?.melody || activeMelody.melody;
  return combineMelodyAndLyrics(melody, verse.abcLyrics || "")
};
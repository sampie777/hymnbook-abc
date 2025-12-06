export type Verse = {
  uuid: string;
  abcLyrics?: string;
}

export type AbcSubMelody = {
  melody: string;
  verseUuids: string[];
}

export type AbcMelody = {
  melody: string;
  subMelodies: AbcSubMelody[];
}
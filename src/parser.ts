import * as ABCJS from "abcjs";
import { TuneObjectArray } from "abcjs";
import {
  AbcLyric,
  AbcPitchStartSlur,
  AbcSong,
  NoteGroupInterface,
  TuneObject,
  VoiceItem,
  VoiceItemNote
} from "./types";
import { validate } from "./validation";
import { addInfoFieldsToMelody } from "./deparser";

// See also https://abcnotation.com/examples

/**
 * Generates an AbcSong object from an ABC notation string.
 * This function does some extra processing to handle slurs and lyrics properly.
 * If you do not want this, use `convertStringToAbcTune` directly.
 *
 * @param abc
 */
export const parse = (abc: string): AbcSong => {
  // Remove comments
  abc = abc
    .replace(/%.*/g, "")
    .replaceAll(/\n+/g, "\n")

  const song = new AbcSong();
  extractInfoFields(abc, song);

  const tuneObject = convertStringToAbcTune(abc);

  // Get the first staff only (thus in case of multiple instrument play, only take the first instrument)
  song.clef = tuneObject.lines!![0].staff!![0].clef || song.clef;
  song.keySignature = tuneObject.lines!![0].staff!![0].key || song.keySignature;
  song.melody = tuneObject.lines!!.map(line => line.staff!![0].voices!![0])

  processSlurs(song);

  return song;
};

const processSlurs = (song: AbcSong) => {
  song.melody.forEach(processSlursForLine)
};

const processSlursForLine = (line: VoiceItem[]) => {
  const emptyLyric = (): AbcLyric[] => [{ divider: " ", syllable: "" }];

  const shiftLyrics = (notes: VoiceItemNote[], fromIndex: number) => {
    let shiftedLyric: AbcLyric[] | undefined = undefined;
    notes.forEach((note, index) => {
      if (index < fromIndex) return;
      if (shiftedLyric === undefined) {
        shiftedLyric = note.lyric;
        note.lyric = emptyLyric();
        return;
      }

      const nextShiftedLyric = note.lyric;
      note.lyric = shiftedLyric;
      shiftedLyric = nextShiftedLyric;
    });
  };

  const notes = line
    .filter(it => it.el_type == "note")
    .map(it => it as VoiceItemNote)
    .filter(it => it.pitches);

  let slurLyric: AbcLyric[] | undefined = undefined;
  notes.forEach((note, index) => {
    const endSlurPitches = note.pitches!!.filter(it => it.endSlur);
    const startSlurPitches = note.pitches!!.filter(it => it.startSlur);

    // Search for an increased startSlur identifier (101 -> 102, not 101 -> 201)
    // to identify ABC melodies as '(D)' which ends and starts a slur with itself.
    // Due to buggy ABC parser behavior, the slur doesn't first start and end with
    // itself (having the same identifier), but ends first and start a new slur (with increased identifier).
    // Of course, it is possible that the note is in an actual slur (like '(a (b) c)'),
    // but then the `slurLyric` would be set.
    if (slurLyric === undefined && endSlurPitches.length && startSlurPitches.length) {
      const endSlurIds = endSlurPitches
        .filter(it => it.endSlur)
        .flatMap(it => it.endSlur!!);

      const startSlurIds = startSlurPitches
        .filter(it => it.startSlur)
        .flatMap(it => it.startSlur as AbcPitchStartSlur[])
        .map(it => it.label);

      const hasUpFollowingId = startSlurIds.some(it => endSlurIds.includes(it - 1));

      if (hasUpFollowingId) {
        return;
      }
    }

    // When inside a slur
    if (slurLyric) {
      // Check if lyric is a spacer ('*'). These are shown as lyrics with zero length syllables.
      // If it's a spacer, ignore the shift, as the spacer already does this job for us.
      const lyricIsSpacer = note.lyric
        && note.lyric.every(it => it.syllable == "" && it.divider == " ");

      if (!lyricIsSpacer) {
        shiftLyrics(notes, index);
      }
    }

    // When slur ends
    if (endSlurPitches.length && !startSlurPitches.length) {
      slurLyric = undefined;
    }

    // When slur starts
    if (startSlurPitches.length && !endSlurPitches.length) {
      slurLyric = note.lyric;
    }
  });
};

/**
 * Get an info/header field from an ABC notation string.
 * @param abc
 * @param field
 * @param _default
 */
export const getField = (abc: string, field: string, _default?: string): (string | undefined) => {
  const result = abc.match(new RegExp("(^|\n) *\t*" + field + ":(.*)?"));
  if (result == null || result.length !== 3 || result[2] == null) {
    return _default;
  }
  return result[2].trim();
};

/**
 * Extract info/header fields from an ABC notation string into an AbcSong object and return the remaining melody string.
 * @param abc
 * @param song
 */
export const extractInfoFields = (abc: string, song: AbcSong): string => {
  song.area = getField(abc, "A");
  song.book = getField(abc, "B");
  song.composer = getField(abc, "C");
  song.discography = getField(abc, "D");
  song.fileUrl = getField(abc, "F");
  song.group = getField(abc, "G");
  song.history = getField(abc, "H");
  song.instruction = getField(abc, "I");
  song.key = getField(abc, "K");
  song.unitNoteLength = getField(abc, "L");
  song.meter = getField(abc, "M");
  song.macro = getField(abc, "m");
  song.notes = getField(abc, "N");
  song.origin = getField(abc, "O");
  song.parts = getField(abc, "P");
  song.tempo = getField(abc, "Q");
  song.rhythm = getField(abc, "R");
  song.remark = getField(abc, "r");
  song.source = getField(abc, "S");
  song.symbolLine = getField(abc, "s");
  song.title = getField(abc, "T");
  song.userDefined = getField(abc, "U");
  song.voice = getField(abc, "V");
  song.referenceNumber = getField(abc, "X", "1");
  song.transcription = getField(abc, "Z");

  return abc
    .replace(/%.*\n/g, "")
    .replace(/(^|\n) *\t*[ABCDFGHIKLMmNOPQRrSsTUVXZ]:.*/g, "")
    .replace(/\n+/g, "\n")
    .replace(/^\n*/g, "")
    .replace(/\n*$/g, "");
};

/**
 * Extract notes and lyrics from an ABC notation string as a single line for each.
 * Note that you must first remove info/header fields before using this function.
 * @param abc
 */
export const squashNotesAndLyrics = (abc: string): NoteGroupInterface => {
  const notes: string[] = [];
  const lyrics: string[] = [];
  abc.split("\n")
    .map(it => it.trim())
    .forEach(it => {
      if (it.startsWith("w:") || it.startsWith("W:")) {
        lyrics.push(it.substring(2).trim());
      } else {
        notes.push(it);
      }
    });

  return {
    notes: notes.join(" "),
    lyrics: lyrics.join(" ")
  };
};

/**
 * Converts and validates an ABC notation string into a TuneObject.
 * @param abc
 */
export const convertStringToAbcTune = (abc: string): TuneObject => {
  const objectArray: TuneObjectArray = ABCJS.parseOnly(abc);
  // Convert types
  const object: TuneObject[] = objectArray as unknown as TuneObject[];

  validate(object != null, "Tune object may not be null");
  validate(object.length > 0, "Tune object may not be empty");
  validate(object[0].lines != null, "Tune object lines may not be null");

  object[0].lines = object[0].lines.filter(it => it.staff); // Remove empty lines without staff

  validate(object[0].lines.length > 0, "Tune object lines are empty");
  validate(object[0].lines[0].staff != null, "Staffs may not be null");
  validate(object[0].lines[0].staff!!.length > 0, "Staffs are empty");
  validate(object[0].lines[0].staff!![0].voices != null, "Voices may not be null");
  validate(object[0].lines[0].staff!![0].voices!!.length > 0, "Voices may not be empty");
  validate(object[0].lines[0].staff!![0].voices!!.some(it => it.length > 0), "Voices are all empty");

  processAbcLyrics(object);

  return object[0];
};

const processAbcLyrics = (object: Array<TuneObject>) => {
  object[0].lines!!.forEach(line =>
    line.staff!!.forEach(staff =>
      staff.voices!!.forEach(element =>
        element.filter(voice => voice.el_type === "note")
          .map(voice => voice as VoiceItemNote)
          .forEach(voice => {
            voice.lyric?.forEach(lyric =>
              lyric.syllable = lyric.syllable.replace(" ", " ")
            );
          })
      )
    )
  );
};

/**
 * Combine multi line lyrics line with a multi line melody into a single ABC notation string.
 * @param melody
 * @param lyrics
 */
export const combineMelodyAndLyrics = (melody: string, lyrics: string): string => {
  const song = new AbcSong();
  const rawMelody = extractInfoFields(melody, song);

  const melodyLines = rawMelody
    .replaceAll(/\n+/g, "\n")
    .trim()
    .split("\n")
  const lyricLines = lyrics
    .replaceAll(/\n+/g, "\n")
    .trim()
    .split("\n")

  const mixedMelody: string[] = [];
  for (let i = 0; i < Math.max(melodyLines.length, lyricLines.length); i++) {
    // When the lines are not of equal length, we allow to show empty lines for missing lines.
    mixedMelody.push(melodyLines[i] ?? "C ".repeat(10));
    mixedMelody.push(lyricLines[i] ? "w: " + lyricLines[i] : "");
  }

  return addInfoFieldsToMelody(song, mixedMelody.join("\n")).trim();
}

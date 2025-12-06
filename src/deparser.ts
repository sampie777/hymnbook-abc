import { AbcSong, VoiceItemBar, VoiceItemNote } from "./types";

/**
 * Converts an AbcSong object's info fields to ABC notation and merges them with the given melody string.
 * @param song
 * @param abc
 */
export const addInfoFieldsToMelody = (song: AbcSong, abc: string): string => {
  let result = "";
  // See for following order of fields: https://abcnotation.com/wiki/abc:standard:v2.1#description_of_information_fields
  result += song.referenceNumber === undefined ? "" : "X:" + song.referenceNumber + "\n";
  result += song.title === undefined ? "" : "T:" + song.title + "\n";
  result += song.area === undefined ? "" : "A:" + song.area + "\n";
  result += song.book === undefined ? "" : "B:" + song.book + "\n";
  result += song.composer === undefined ? "" : "C:" + song.composer + "\n";
  result += song.discography === undefined ? "" : "D:" + song.discography + "\n";
  result += song.fileUrl === undefined ? "" : "F:" + song.fileUrl + "\n";
  result += song.group === undefined ? "" : "G:" + song.group + "\n";
  result += song.history === undefined ? "" : "H:" + song.history + "\n";
  result += song.instruction === undefined ? "" : "I:" + song.instruction + "\n";
  result += song.key === undefined ? "" : "K:" + song.key + "\n";
  result += song.unitNoteLength === undefined ? "" : "L:" + song.unitNoteLength + "\n";
  result += song.meter === undefined ? "" : "M:" + song.meter + "\n";
  result += song.macro === undefined ? "" : "m:" + song.macro + "\n";
  result += song.notes === undefined ? "" : "N:" + song.notes + "\n";
  result += song.origin === undefined ? "" : "O:" + song.origin + "\n";
  result += song.parts === undefined ? "" : "P:" + song.parts + "\n";
  result += song.tempo === undefined ? "" : "Q:" + song.tempo + "\n";
  result += song.rhythm === undefined ? "" : "R:" + song.rhythm + "\n";
  result += song.remark === undefined ? "" : "r:" + song.remark + "\n";
  result += song.source === undefined ? "" : "S:" + song.source + "\n";
  result += song.symbolLine === undefined ? "" : "s:" + song.symbolLine + "\n";
  result += song.userDefined === undefined ? "" : "U:" + song.userDefined + "\n";
  result += song.voice === undefined ? "" : "V:" + song.voice + "\n";
  result += song.transcription === undefined ? "" : "Z:" + song.transcription + "\n";
  return result + abc;
};

const durationToString = (duration: number): string => {
  duration /= 4;
  if (duration > 3 / 8) return (duration * 4).toString();
  if (duration == 1 / 4) return "";
  if (duration == 3 / 8) return "3/2";
  if (duration == 1 / 8) return "/2";
  if (duration == 3 / 16) return "3/4";
  if (duration == 1 / 16) return "/4";
  if (duration == 3 / 32) return "3/8";
  if (duration == 1 / 32) return "/8";
  if (duration == 3 / 64) return "3/16";

  return ""
}

const voiceBarToString = (voice: VoiceItemBar): string => {
  let result = "";

  switch (voice.type) {
    case "bar_thin":
      result += "|"
      break;
    case "bar_thin_thick":
      result += "|]"
      break;
    case "bar_thin_thin":
      result += "||"
      break;
    case "bar_thick_thin":
      result += "[|"
      break;
    case "bar_right_repeat":
      result += ":|"
      break;
    case "bar_left_repeat":
      result += "|:"
      break;
    case "bar_dbl_repeat":
      result += "::"
      break;
  }

  if (voice.startEnding) result += voice.startEnding

  return result + " ";
};

const voiceNoteToString = (voice: VoiceItemNote, durationMultiplier: number, isBeam: boolean) => {
  let notes = "";
  let lyrics = "";

  const duration = durationToString(voice.duration / durationMultiplier);

  if (voice.startBeam) isBeam = true;
  if (voice.endBeam) isBeam = false;

  /* Process chords */
  voice.chord?.forEach(chord => {
    const parsedChordName = chord.name
      .replaceAll(/♭/g, "b")
      .replaceAll(/♯/g, "#")
    notes += `"${parsedChordName}"`;
  })

  /* Process notes */
  if (voice.pitches && voice.pitches?.length > 1) notes += "["
  voice.pitches?.forEach(pitch => {
    let note = pitch.name + duration;

    if (pitch.startSlur) note = "(".repeat(pitch.startSlur.length) + note;
    if (pitch.endSlur) note += ")".repeat(pitch.endSlur.length)

    if (pitch.startTie) note += "-";

    notes += note;
  })
  if (voice.pitches && voice.pitches?.length > 1) notes += "]"

  /* Process rests */
  if (voice.rest) {
    if (voice.rest.type == "spacer") {
      notes += "y";
    } else if (voice.rest.type == "multimeasure") {
      notes += "Z" + durationToString(voice.duration / 4)
    } else {
      notes += "z" + duration;
    }
  }

  /* Process lyrics */
  if (voice.pitches) {
    voice.lyric?.forEach(lyric => {
      let text = lyric.syllable.replace(/ /g, "~");
      if (text == "") text = "*";
      lyrics += text + lyric.divider
    })
  }

  if (!isBeam) notes += " ";

  return {
    notes: notes,
    lyrics: lyrics,
    isBeam: isBeam,
  }
};

/**
 * Convert an AbcSong object to an ABC notation string.
 * @param song
 */
export const stringify = (song: AbcSong) => {
  const durationParts = (song.unitNoteLength || "1/8").split("/");
  const durationMultiplier = durationParts.length > 1
    ? +durationParts[0] / +durationParts[1]
    : +durationParts[0];

  const melody = song.melody.flatMap(line => {
    const notes: string[] = [];
    const lyrics: string[] = [];
    let isBeam = false;

    line.forEach(voice => {
      switch (voice.el_type) {
        case "bar":
          notes.push(voiceBarToString(voice))
          break;
        case "note":
          const result = voiceNoteToString(voice, durationMultiplier, isBeam)
          notes.push(result.notes)
          lyrics.push(result.lyrics)
          isBeam = result.isBeam
          break;
      }
    })

    const result: string[] = [notes.join("").trim()]
    const mergedLyrics = lyrics.join("").trim()
    if (mergedLyrics.length > 0) {
      result.push("w: " + mergedLyrics)
    }

    return result;
  })
    .join("\n")

  return addInfoFieldsToMelody(song, melody);
};

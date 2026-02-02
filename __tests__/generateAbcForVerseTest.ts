import { describe, expect, it } from '@jest/globals';
import { AbcMelody, AbcSubMelody, generateAbcForVerse, Verse } from "../src";

describe("abc generates abc for verse", () => {
  it("returns empty string if there is no melody", () => {
    const verse: Verse = { uuid: "", abcLyrics: "abc\ndef" };

    expect(generateAbcForVerse(verse, undefined)).toBe("")
  });

  it("returns default melody with lyrics", () => {
    const abcMelody: AbcMelody = { melody: "123\n456 |]", subMelodies: [] };
    const verse: Verse = { uuid: "", abcLyrics: "abc\ndef" };

    expect(generateAbcForVerse(verse, abcMelody)).toBe("X:1\n123\nw: abc\n456 |]\nw: def")
  });

  it("returns sub melody if available with lyrics", () => {
    const subMelody: AbcSubMelody = { melody: "111\n222", verseUuids: ["verse"] };
    const abcMelody: AbcMelody = { melody: "123\n456", subMelodies: [subMelody] };
    const verse: Verse = { uuid: "verse", abcLyrics: "abc\ndef" };

    expect(generateAbcForVerse(verse, abcMelody)).toBe("X:1\n111\nw: abc\n222\nw: def")
  });

  it("returns melody with lyrics and extra notes if there are more lyrics than notes", () => {
    const abcMelody: AbcMelody = { melody: "123\n456", subMelodies: [] };
    const verse: Verse = { uuid: "", abcLyrics: "abc\ndef\nghi" };

    expect(generateAbcForVerse(verse, abcMelody)).toBe("X:1\n123\nw: abc\n456\nw: def\nC C C C C C C C C C \nw: ghi")
  });

  it("returns melody with lyrics and extra notes without their lyrics", () => {
    const abcMelody: AbcMelody = { melody: "123\n456\n789", subMelodies: [] };
    const verse: Verse = { uuid: "", abcLyrics: "abc\ndef" };

    expect(generateAbcForVerse(verse, abcMelody)).toBe("X:1\n123\nw: abc\n456\nw: def\n789")
  });

  it("trims spaces from line start/ends", () => {
    const abcMelody: AbcMelody = { melody: "yy 123 y\nyy456y", subMelodies: [] };
    const verse: Verse = { uuid: "", abcLyrics: "abc\ndef" };

    expect(generateAbcForVerse(verse, abcMelody, { trimLines: true })).toBe("X:1\n123\nw: abc\n456\nw: def")
  });

  it("trims spaces from bars", () => {
    const abcMelody: AbcMelody = { melody: "123 yy | yy 345 yy|yy 123 yy|] 345 yy  |] 123 y ||y 345", subMelodies: [] };
    const verse: Verse = { uuid: "", abcLyrics: "abc" };

    expect(generateAbcForVerse(verse, abcMelody, { trimLines: true })).toBe("X:1\n123 | 345 | 123 |] 345 |] 123 || 345\nw: abc")
  });
});

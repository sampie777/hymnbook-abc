import { describe, expect, it } from "@jest/globals";
import * as ABC from "../src";

describe("using stringify", () => {
  it("returns the same string after parsing and stringifying", () => {
    const input = "X:1\n" +
      "T:this is the title\n" +
      "C2 DF E2 F2 | FG G4 A B | G8 |]\n" +
      "w: ik ben * ge-test of niet waar~ik dan ook end_";

    const song = ABC.parse(input);
    const output = ABC.stringify(song);

    expect(output).toBe(input)
  })

  it("works for the whole note scale", () => {
    const input = "X:1\n" +
      "T:Notes / pitches\n" +
      "K:C\n" +
      "L:1/4\n" +
      "M:C\n" +
      "C, D, E, F, | G, A, B, C | D E F G | A B c d | e f g a | b c' d' e' | f' g' a' b' |]";

    const song = ABC.parse(input);
    const output = ABC.stringify(song);

    expect(output).toBe(input)
  })

  it("works for all note lengths", () => {
    const input = "X:1\n" +
      "T:Note lengths\n" +
      "K:C\n" +
      "A3/8 A3/4 A/4 A/2 A/2 A A2 A3 A4 A6 A7 A8 A12 A16 |]";

    const song = ABC.parse(input);
    const output = ABC.stringify(song);

    expect(output).toBe(input)
  })

  it("works with beams", () => {
    const input = "X:1\n" +
      "T:Beams\n" +
      "K:C\n" +
      "M:C\n" +
      "A B c d AB cd | ABcd AB c2 | ABcdABcd |]";

    const song = ABC.parse(input);
    const output = ABC.stringify(song);

    expect(output).toBe(input)
  })

  it("works with all bar lines", () => {
    const input = "X:1\n" +
      "T:Bar lines\n" +
      "K:C\n" +
      "M:C\n" +
      "[| A4 A4 | A4 A4 || A4 A4 | A4 A4 |]\n" +
      "|: A4 A4 | A4 A4 :: A4 A4 | A4 A4 ::\n" +
      "A4 A4 | A4 A4 |1 A4 A4 :|2 A4 A4 | A4 A4 |]";

    const song = ABC.parse(input);
    const output = ABC.stringify(song);

    expect(output).toBe(input)
  })

  /**
   * Not supported
   */
  // it("works with broken rithms", () => {
  //   const input = "X:1\n" +
  //     "T:Broken rhythm markers\n" +
  //     "K:C\n" +
  //     "M:3/4\n" +
  //     "A>A A2>A2 | A<A A2<A2 | A>>A A2>>>A2 | A<<A A2<<<A2 |]";
  //
  //   const song = ABC.parse(input);
  //   const output = ABC.stringify(song);
  //
  //   expect(output).toBe(input)
  // })

  it("works with ties and slurs", () => {
    const input = "X:1\n" +
      "T:Ties and slurs\n" +
      "K:C\n" +
      "M:C\n" +
      "(AA) (A(A)A) ((AA)A) (A | A) A-A A-A-A A2- | A4 |]";

    const song = ABC.parse(input);
    const output = ABC.stringify(song);

    expect(output).toBe(input)
  })

  it("works with all accidentals", () => {
    const input = "X:1\n" +
      "T:Accidentals\n" +
      "K:C\n" +
      "M:C\n" +
      "__A _A =A ^A ^^A |]";

    const song = ABC.parse(input);
    const output = ABC.stringify(song);

    expect(output).toBe(input)
  })

  it("works with chords", () => {
    const input = "X:1\n" +
      "T:Chord symbols\n" +
      "K:C\n" +
      "M:C\n" +
      "\"A\"A \"Gm7\"D \"Bb\"F \"F#\"A |]";

    const song = ABC.parse(input);
    const output = ABC.stringify(song);

    expect(output).toBe(input)
  })
})
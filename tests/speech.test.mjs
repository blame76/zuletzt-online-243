import test from "node:test";
import assert from "node:assert/strict";
import { SpeechReader } from "../web/speech.mjs";

function withSpeechApi(run) {
  const originalSynthesis = Object.getOwnPropertyDescriptor(globalThis, "speechSynthesis");
  const originalUtterance = Object.getOwnPropertyDescriptor(globalThis, "SpeechSynthesisUtterance");
  const utterances = [];
  const synthesis = {
    getVoices: () => [{ lang: "de-DE", localService: true }],
    speak: utterance => utterances.push(utterance),
    cancel: () => {}
  };
  class Utterance {
    constructor(text) { this.text = text; }
  }
  Object.defineProperty(globalThis, "speechSynthesis", { configurable: true, value: synthesis });
  Object.defineProperty(globalThis, "SpeechSynthesisUtterance", { configurable: true, value: Utterance });
  try { run(utterances); }
  finally {
    if (originalSynthesis) Object.defineProperty(globalThis, "speechSynthesis", originalSynthesis);
    else delete globalThis.speechSynthesis;
    if (originalUtterance) Object.defineProperty(globalThis, "SpeechSynthesisUtterance", originalUtterance);
    else delete globalThis.SpeechSynthesisUtterance;
  }
}

const article = text => ({
  querySelectorAll: () => text.split("|").map(sentence => ({
    textContent: sentence,
    classList: { add() {}, remove() {} }
  }))
});

test("speech resumes the saved sentence, advances, and completes the section", () => {
  withSpeechApi(utterances => {
    const states = [];
    let completed = 0;
    const reader = new SpeechReader(state => states.push(state));
    reader.begin(article("Erster Satz.|Zweiter Satz.|Dritter Satz."), () => completed++, 1, 0.8);
    assert.equal(reader.supported(), true);
    assert.equal(utterances[0].text, "Zweiter Satz.");
    assert.equal(utterances[0].rate, 0.8);
    assert.equal(reader.position, 1);
    reader.pause();
    assert.equal(reader.active, false);
    assert.equal(reader.position, 1);
    reader.resume();
    assert.equal(utterances[1].text, "Zweiter Satz.");
    utterances[1].onend();
    assert.equal(utterances[2].text, "Dritter Satz.");
    utterances[2].onend();
    assert.equal(completed, 1);
    assert.ok(states.some(state => state.state === "paused" && state.position === 1));
    assert.ok(states.some(state => state.state === "completed"));
  });
});

test("speech API errors stop playback and publish an error state", () => {
  withSpeechApi(utterances => {
    const states = [];
    const reader = new SpeechReader(state => states.push(state));
    reader.begin(article("Ein Satz."), () => {}, 0, 1.25);
    assert.equal(utterances[0].rate, 1.25);
    utterances[0].onerror({ error: "network" });
    assert.equal(reader.active, false);
    assert.equal(states.at(-1).state, "error");
    assert.match(states.at(-1).message, /network/);
  });
});

test("speech reports unsupported when the browser API is absent", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "SpeechSynthesisUtterance");
  try {
    delete globalThis.SpeechSynthesisUtterance;
    assert.equal(new SpeechReader().supported(), false);
  } finally {
    if (original) Object.defineProperty(globalThis, "SpeechSynthesisUtterance", original);
  }
});

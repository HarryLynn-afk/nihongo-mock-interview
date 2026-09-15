import { describe, expect, it } from "vitest";
import { questions } from "@/lib/content/questions";
import { buildSidebarView } from "./buildSidebarView";

describe("buildSidebarView", () => {
  it("shows Q1 of 3 and the sensei Question while Q1 sensei is speaking", () => {
    const view = buildSidebarView({
      phase: "senseiSpeaking",
      answers: [],
    });

    expect(view.questionNumber).toBe(1);
    expect(view.questionCount).toBe(3);
    expect(view.status).toBe("senseiSpeaking");
    expect(view.entries).toEqual([
      { speaker: "sensei", text: questions[0].japanese },
    ]);
  });

  it("keeps only the sensei Question while the student is answering Q1", () => {
    const view = buildSidebarView({
      phase: "studentAnswering",
      answers: [],
    });

    expect(view.questionNumber).toBe(1);
    expect(view.status).toBe("studentAnswering");
    expect(view.entries).toEqual([
      { speaker: "sensei", text: questions[0].japanese },
    ]);
  });

  it("after Q1 is submitted, shows Q2 of 3 with the Q1 pair and the Q2 sensei Question", () => {
    const view = buildSidebarView({
      phase: "senseiSpeaking",
      answers: [
        {
          questionIndex: 0,
          status: "answered",
          transcript: "はじめまして。アウンミンハントです。",
        },
      ],
    });

    expect(view.questionNumber).toBe(2);
    expect(view.status).toBe("senseiSpeaking");
    expect(view.entries).toEqual([
      { speaker: "sensei", text: questions[0].japanese },
      { speaker: "student", text: "はじめまして。アウンミンハントです。" },
      { speaker: "sensei", text: questions[1].japanese },
    ]);
  });

  it("after Q3, shows 3 of 3 and every submitted turn with no extra sensei line", () => {
    const view = buildSidebarView({
      phase: "done",
      answers: [
        { questionIndex: 0, status: "answered", transcript: "a" },
        { questionIndex: 1, status: "answered", transcript: "b" },
        { questionIndex: 2, status: "answered", transcript: "c" },
      ],
    });

    expect(view.questionNumber).toBe(3);
    expect(view.questionCount).toBe(3);
    expect(view.status).toBe("done");
    expect(view.entries).toEqual([
      { speaker: "sensei", text: questions[0].japanese },
      { speaker: "student", text: "a" },
      { speaker: "sensei", text: questions[1].japanese },
      { speaker: "student", text: "b" },
      { speaker: "sensei", text: questions[2].japanese },
      { speaker: "student", text: "c" },
    ]);
  });

  it("shows a no-answer placeholder for a skipped turn", () => {
    const view = buildSidebarView({
      phase: "senseiSpeaking",
      answers: [{ questionIndex: 0, status: "skipped" }],
    });

    expect(view.entries).toEqual([
      { speaker: "sensei", text: questions[0].japanese },
      { speaker: "student", text: "(No answer captured)" },
      { speaker: "sensei", text: questions[1].japanese },
    ]);
  });
});

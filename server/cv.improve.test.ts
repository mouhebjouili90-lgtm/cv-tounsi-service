import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { invokeLLM } from "./_core/llm";

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    model: "gpt-5-mini",
    choices: [{ message: { content: JSON.stringify({
      summary: "Spécialiste marketing structurée, orientée contenu et coordination de campagnes.",
      experienceBullets: ["Coordonné des campagnes de contenu digital.", "Suivi les indicateurs de performance et partagé les résultats."],
      keywords: ["Contenu digital", "Coordination", "Performance"],
    }) } }],
  }),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("cv.improveCopy", () => {
  it("rejects an experience description that is too short before calling the model", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    await expect(
      caller.cv.improveCopy({
        language: "fr",
        template: "professional",
        targetRole: "Marketing Specialist",
        experienceRole: "Chargée de communication",
        company: "Studio 216",
        experienceText: "court",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("falls back to deterministic copy when the model returns malformed JSON", async () => {
    vi.mocked(invokeLLM).mockResolvedValueOnce({
      model: "gpt-5-mini",
      choices: [{ message: { content: '{"summary":"broken' } }],
    } as never);

    const caller = appRouter.createCaller(createPublicContext());
    const result = await caller.cv.improveCopy({
      language: "fr",
      template: "professional",
      targetRole: "Marketing Specialist",
      experienceRole: "Chargée de communication",
      company: "Studio 216",
      experienceText: "Gestion du contenu digital, coordination des campagnes et suivi des indicateurs de performance.",
    });

    expect(result.model).toBe("local-fallback");
    expect(result.usedFallback).toBe(true);
    expect(result.experienceBullets.length).toBeGreaterThanOrEqual(2);
  });

  it("returns structured copy and the selected model metadata", async () => {
    const caller = appRouter.createCaller(createPublicContext());

    const result = await caller.cv.improveCopy({
      language: "fr",
      template: "professional",
      targetRole: "Marketing Specialist",
      experienceRole: "Chargée de communication",
      company: "Studio 216",
      experienceText: "Gestion du contenu digital, coordination des campagnes et suivi des indicateurs de performance.",
    });

    expect(result.model).toBe("gpt-5-mini");
    expect(result.summary).toContain("Spécialiste marketing");
    expect(result.experienceBullets).toHaveLength(2);
    expect(result.keywords).toContain("Performance");
  });
});

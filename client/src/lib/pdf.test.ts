import { describe, expect, it } from "vitest";
import { removeExtraPdfPages } from "./pdf";

describe("removeExtraPdfPages", () => {
  it("keeps the first A4 page and removes trailing blank pages", () => {
    let pages = 3;
    const deleted: number[] = [];
    const pdf = {
      getNumberOfPages: () => pages,
      deletePage: (pageNumber: number) => {
        deleted.push(pageNumber);
        pages -= 1;
      },
    };

    const result = removeExtraPdfPages(pdf);

    expect(result).toBe(pdf);
    expect(deleted).toEqual([3, 2]);
    expect(pages).toBe(1);
  });

  it("does not modify a valid single-page document", () => {
    let deleted = 0;
    const pdf = {
      getNumberOfPages: () => 1,
      deletePage: () => {
        deleted += 1;
      },
    };

    removeExtraPdfPages(pdf);

    expect(deleted).toBe(0);
  });
});

it("creates an application/pdf Blob through the worker pipeline and trims trailing pages", async () => {
  const deleted: number[] = [];
  let pages = 2;
  const output = new Blob(["%PDF-1.3"], { type: "application/pdf" });
  const pdf = {
    getNumberOfPages: () => pages,
    deletePage: (pageNumber: number) => {
      deleted.push(pageNumber);
      pages -= 1;
    },
    output: () => output,
  };
  const options = { filename: "cv-tounsi.pdf", jsPDF: { format: "a4" } };
  const element = {} as HTMLElement;
  const worker = {
    set: (received: unknown) => {
      expect(received).toEqual(options);
      return worker;
    },
    from: (received: HTMLElement) => {
      expect(received).toBe(element);
      return worker;
    },
    toPdf: () => worker,
    get: async () => pdf,
  };

  const { createPdfBlob } = await import("./pdf");
  const blob = await createPdfBlob(worker, element, options);

  expect(blob).toBe(output);
  expect(blob.type).toBe("application/pdf");
  expect(blob.size).toBeGreaterThan(0);
  expect(deleted).toEqual([2]);
  expect(pages).toBe(1);
});

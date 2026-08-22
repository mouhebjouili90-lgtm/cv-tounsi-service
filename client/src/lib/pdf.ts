export type PdfDocumentLike = {
  getNumberOfPages: () => number;
  deletePage: (pageNumber: number) => unknown;
  output: (type: "blob") => Blob;
};

export type PdfWorkerLike = {
  set: (options: unknown) => PdfWorkerLike;
  from: (element: HTMLElement) => PdfWorkerLike;
  toPdf: () => PdfWorkerLike;
  get: (key: "pdf") => Promise<PdfDocumentLike>;
};

export function removeExtraPdfPages<T extends PdfDocumentLike>(pdf: T): T {
  for (let page = pdf.getNumberOfPages(); page > 1; page -= 1) {
    pdf.deletePage(page);
  }
  return pdf;
}

export async function createPdfBlob(
  worker: PdfWorkerLike,
  element: HTMLElement,
  options: unknown,
): Promise<Blob> {
  const pdf = await worker.set(options).from(element).toPdf().get("pdf");
  removeExtraPdfPages(pdf);
  return pdf.output("blob");
}

declare module "html2pdf.js" {
  type Html2PdfOptions = {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: { scale?: number; useCORS?: boolean; backgroundColor?: string; windowWidth?: number; windowHeight?: number; scrollX?: number; scrollY?: number };
    jsPDF?: { unit?: string; format?: string; orientation?: string };
    pagebreak?: { mode?: string[]; avoid?: string[] };
  };

  type JsPdfDocument = {
    getNumberOfPages(): number;
    deletePage(pageNumber: number): JsPdfDocument;
    output(type: "blob"): Blob;
  };

  type Html2PdfWorker = {
    set(options: Html2PdfOptions): Html2PdfWorker;
    from(element: HTMLElement): Html2PdfWorker;
    toPdf(): Html2PdfWorker;
    get(key: "pdf"): Promise<JsPdfDocument>;
    outputPdf(type?: "blob"): Promise<Blob>;
    save(): Promise<void>;
  };

  const html2pdf: () => Html2PdfWorker;
  export default html2pdf;
}

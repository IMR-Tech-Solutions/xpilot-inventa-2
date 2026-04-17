import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface DownloadColumn {
  label: string;
  key: string;
}

export interface PDFOptions {
  title?: string;
  subtitle?: string;
  dateRange?: string;
}

export const downloadCSV = (
  data: Record<string, any>[],
  columns: DownloadColumn[],
  filename: string
) => {
  const header = columns.map((col) => col.label).join(",");
  const rows = data.map((row, index) =>
    columns
      .map((col) => {
        if (col.key === "__srno") return index + 1;
        const val = row[col.key] ?? "";
        const str = String(val);
        return str.includes(",") || str.includes('"') || str.includes("\n")
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadPDF = (
  data: Record<string, any>[],
  columns: DownloadColumn[],
  filename: string,
  options?: PDFOptions
) => {
  const orientation = columns.length > 6 ? "landscape" : "portrait";
  const doc = new jsPDF({ orientation });
  const pageWidth = doc.internal.pageSize.getWidth();

  let y = 16;

  if (options?.title) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(options.title, pageWidth / 2, y, { align: "center" });
    y += 8;
  }

  if (options?.subtitle) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(options.subtitle, pageWidth / 2, y, { align: "center" });
    y += 6;
  }

  if (options?.dateRange) {
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(options.dateRange, pageWidth / 2, y, { align: "center" });
    y += 6;
  }

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.line(14, y, pageWidth - 14, y);
  y += 5;

  const head = [columns.map((col) => col.label)];
  const body = data.map((row, index) =>
    columns.map((col) => {
      if (col.key === "__srno") return index + 1;
      return row[col.key] ?? "";
    })
  );

  autoTable(doc, {
    head,
    body,
    startY: y,
    styles: {
      fontSize: 8,
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      lineColor: [180, 180, 180],
      lineWidth: 0.1,
      textColor: [0, 0, 0],
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [30, 30, 30],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
      halign: "center",
      cellPadding: { top: 4, right: 4, bottom: 4, left: 4 },
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    tableLineColor: [0, 0, 0],
    tableLineWidth: 0.2,
    margin: { left: 14, right: 14 },
    didDrawPage: (hookData) => {
      const totalPages = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Page ${hookData.pageNumber} of ${totalPages}`,
        pageWidth - 14,
        doc.internal.pageSize.getHeight() - 8,
        { align: "right" }
      );
    },
  });

  doc.save(`${filename}.pdf`);
};

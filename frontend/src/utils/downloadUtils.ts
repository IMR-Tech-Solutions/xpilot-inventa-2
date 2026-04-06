import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface DownloadColumn {
  label: string;
  key: string;
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
  filename: string
) => {
  const doc = new jsPDF();
  const head = [columns.map((col) => col.label)];
  const body = data.map((row, index) =>
    columns.map((col) => {
      if (col.key === "__srno") return index + 1;
      return row[col.key] ?? "";
    })
  );
  autoTable(doc, { head, body, startY: 16, styles: { fontSize: 9 } });
  doc.save(`${filename}.pdf`);
};

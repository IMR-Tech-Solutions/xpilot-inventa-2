import * as XLSX from "xlsx";

interface ExportToExcelOptions {
  data: any[];
  filename: string;
  sheetName?: string;
}

export const exportToExcel = ({
  data,
  filename,
  sheetName = "Sheet1",
}: ExportToExcelOptions) => {

  const wb = XLSX.utils.book_new();

  const ws = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  XLSX.writeFile(wb, `${filename}.xlsx`);
};

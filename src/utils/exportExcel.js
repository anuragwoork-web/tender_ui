import ExcelJS from "exceljs";

export async function exportTendersToExcel(tenders, filename = "tenders.xlsx") {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Tenders");

  sheet.columns = [
    { header: "ID",             key: "id",                width: 8 },
    { header: "Portal",         key: "portal_code",       width: 12 },
    { header: "Title",          key: "title",             width: 60 },
    { header: "Reference",      key: "tender_reference",  width: 30 },
    { header: "Organisation",   key: "organisation_name", width: 30 },
    { header: "Published",      key: "published_date",    width: 18 },
    { header: "Closing",        key: "closing_date",      width: 18 },
    { header: "Opening",        key: "opening_date",      width: 18 },
    { header: "Tender Fee",     key: "tender_fee",        width: 14 },
    { header: "EMD",            key: "emd_amount",        width: 14 },
    { header: "Detail URL",     key: "detail_url",        width: 50 },
  ];

  // Header styling
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = {
    type: "pattern", pattern: "solid",
    fgColor: { argb: "FF2563EB" },
  };
  sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  tenders.forEach((t) => sheet.addRow(t));

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

import ExcelJS from "exceljs";

export async function exportTendersToExcel(tenders, filename = "tenders.xlsx") {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Tenders");

  sheet.columns = [
    { header: "Portal",          key: "portal",          width: 12 },
    { header: "Tender ID",       key: "tender_id",       width: 28 },
    { header: "Reference",       key: "ref_no",          width: 30 },
    { header: "Title",           key: "title",           width: 60 },
    { header: "Organisation",    key: "org",             width: 40 },
    { header: "State",           key: "state",           width: 18 },
    { header: "Location",        key: "location",        width: 24 },
    { header: "Tender Type",     key: "tender_type",     width: 14 },
    { header: "Published (IST)", key: "published_at",    width: 22 },
    { header: "Closing (IST)",   key: "closing_at",      width: 22 },
    { header: "Opening (IST)",   key: "opening_at",      width: 22 },
    { header: "Estimated Value", key: "estimated_value", width: 16 },
    { header: "EMD",             key: "emd_amount",      width: 14 },
    { header: "Tender Fee",      key: "tender_fee",      width: 12 },
    { header: "Status",          key: "lifecycle",       width: 12 },
    { header: "Detail URL",      key: "detail_url",      width: 50 },
  ];

  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
  sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };

  const num = (v) => (v === null || v === undefined || v === "" ? null : Number(v));
  tenders.forEach((t) =>
    sheet.addRow({
      ...t,
      org: t.org_name || (t.org_chain || "").split("||").join(" › "),
      estimated_value: num(t.estimated_value),
      emd_amount: num(t.emd_amount),
      tender_fee: num(t.tender_fee),
    })
  );

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

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';

interface ExportConfig {
  title: string;
  filename: string;
  columns: { header: string; dataKey: string }[];
  data: any[];
}

const FOOTER_TEXT = "Generado automáticamente por MarketIA";

const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return 'Usuario desconocido';
    const { data: profile } = await supabase.from('usuarios').select('nombre_completo, email').eq('id_usuario', user.id).single();
    if (profile) return profile.nombre_completo || profile.email || 'Usuario';
    return user.email || 'Usuario';
  } catch (err) {
    console.error("Error al obtener usuario:", err);
    return 'Usuario desconocido';
  }
};

export const exportToPDF = async (config: ExportConfig) => {
  const doc = new jsPDF();
  const userName = await getCurrentUser();
  const dateStr = new Date().toLocaleString();

  // Header
  doc.setFontSize(22);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text('MarketIA', 14, 20);
  
  doc.setFontSize(16);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text(config.title, 14, 30);

  // Metadata
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`Fecha de generación: ${dateStr}`, 14, 40);
  doc.text(`Generado por: ${userName}`, 14, 45);

  // Table
  autoTable(doc, {
    startY: 55,
    head: [config.columns.map(c => c.header)],
    body: config.data.map(row => config.columns.map(c => row[c.dataKey] || 'N/A')),
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: 'bold', lineColor: [226, 232, 240] },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { top: 50 },
    didDrawPage: (data: any) => {
      // Footer
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); // slate-400
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.text(FOOTER_TEXT, data.settings.margin.left, pageHeight - 10);
    }
  });

  doc.save(`${config.filename}.pdf`);
};

export const exportToExcel = (config: ExportConfig) => {
  // Map data to use headers as keys
  const exportData = config.data.map(row => {
    const newRow: any = {};
    config.columns.forEach(col => {
      newRow[col.header] = row[col.dataKey] || 'N/A';
    });
    return newRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");
  XLSX.writeFile(workbook, `${config.filename}.xlsx`);
};

package tn.esprit.backend.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.esprit.backend.entity.Subscription;
import tn.esprit.backend.repository.PromoCodeRepository;
import tn.esprit.backend.repository.SubscriptionRepository;
import tn.esprit.backend.repository.UserRepository;

import com.itextpdf.text.BaseColor;
import com.itextpdf.text.Chunk;
import com.itextpdf.text.Document;
import com.itextpdf.text.Element;
import com.itextpdf.text.PageSize;
import com.itextpdf.text.Paragraph;
import com.itextpdf.text.Phrase;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;

import tn.esprit.backend.repository.PlanConfigRepository;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final UserRepository userRepository;
    private final PromoCodeRepository promoCodeRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PlanConfigRepository planConfigRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final java.text.DecimalFormatSymbols SYMBOLS;
    static {
        SYMBOLS = new java.text.DecimalFormatSymbols();
        SYMBOLS.setDecimalSeparator(',');
        SYMBOLS.setGroupingSeparator(' ');
    }
    private static final java.text.DecimalFormat PRICE_FMT =
            new java.text.DecimalFormat("#,##0.00", SYMBOLS);

    private String formatPrice(Number amount) {
        if (amount == null) return "0,00 TND";
        return PRICE_FMT.format(amount.doubleValue()) + " TND";
    }

    /** Charge les prix depuis plan_config en BD */
    private Map<String, Double> getPlanPrices() {
        Map<String, Double> prices = new HashMap<>();
        planConfigRepository.findAll().forEach(p -> {
            if (p.getPrice() != null) {
                java.util.regex.Matcher m = java.util.regex.Pattern.compile("([\\d.]+)").matcher(p.getPrice());
                if (m.find()) prices.put(p.getPlanKey(), Double.parseDouble(m.group(1)));
            }
        });
        prices.putIfAbsent("FREE", 0.0);
        prices.putIfAbsent("PREMIUM", 30.0);
        prices.putIfAbsent("PRO", 59.0);
        return prices;
    }

    // ── Excel helper ────────────────────────────────────────────────────────
    private CellStyle headerStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        Font f = wb.createFont();
        f.setBold(true);
        f.setColor(IndexedColors.WHITE.getIndex());
        s.setFont(f);
        s.setFillForegroundColor(IndexedColors.ROSE.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        s.setAlignment(HorizontalAlignment.CENTER);
        s.setBorderBottom(BorderStyle.THIN);
        return s;
    }

    private void cell(Row row, int col, String val, CellStyle style) {
        Cell c = row.createCell(col);
        c.setCellValue(val != null ? val : "—");
        if (style != null) c.setCellStyle(style);
    }

    // ── iText PDF helper ────────────────────────────────────────────────────
    private static final BaseColor PINK = new BaseColor(232, 67, 108);

    private com.itextpdf.text.Font pdfFont(int size, int style) {
        return new com.itextpdf.text.Font(com.itextpdf.text.Font.FontFamily.HELVETICA, size, style);
    }

    private com.itextpdf.text.Font pdfFont(int size, int style, BaseColor color) {
        return new com.itextpdf.text.Font(com.itextpdf.text.Font.FontFamily.HELVETICA, size, style, color);
    }

    private PdfPCell headerCell(String text) {
        PdfPCell c = new PdfPCell(new Phrase(text, pdfFont(10, com.itextpdf.text.Font.BOLD, BaseColor.WHITE)));
        c.setBackgroundColor(PINK);
        c.setHorizontalAlignment(Element.ALIGN_CENTER);
        c.setPadding(6);
        return c;
    }

    private PdfPCell dataCell(String text) {
        PdfPCell c = new PdfPCell(new Phrase(text != null ? text : "—", pdfFont(9, com.itextpdf.text.Font.NORMAL)));
        c.setPadding(5);
        return c;
    }

    private void addPdfTitle(Document doc, String title) throws Exception {
        doc.add(new Paragraph(title, pdfFont(18, com.itextpdf.text.Font.BOLD, PINK)));
        doc.add(new Paragraph("Généré le " + java.time.LocalDate.now().format(DATE_FMT),
                pdfFont(10, com.itextpdf.text.Font.ITALIC)));
        doc.add(Chunk.NEWLINE);
    }

    // ════════════════════════════════════════════════════════
    // UTILISATEURS — Excel
    // ════════════════════════════════════════════════════════
    @GetMapping("/users/excel")
    public ResponseEntity<byte[]> usersExcel() throws Exception {
        var users = userRepository.findAll();
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Utilisateurs");
            CellStyle hs = headerStyle(wb);
            String[] cols = {"ID", "Prénom", "Nom", "Email", "Rôle", "Statut", "Inscrit le"};
            Row header = sheet.createRow(0);
            for (int i = 0; i < cols.length; i++) cell(header, i, cols[i], hs);

            int rn = 1;
            for (var u : users) {
                Row row = sheet.createRow(rn++);
                cell(row, 0, String.valueOf(u.getId()), null);
                cell(row, 1, u.getFirstName(), null);
                cell(row, 2, u.getLastName(), null);
                cell(row, 3, u.getEmail(), null);
                cell(row, 4, u.getRole().name(), null);
                cell(row, 5, u.getIsActive() ? "Actif" : "Inactif", null);
                cell(row, 6, u.getCreatedAt() != null ? u.getCreatedAt().format(DATE_FMT) : "—", null);
            }
            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=utilisateurs.xlsx")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(out.toByteArray());
        }
    }

    // ════════════════════════════════════════════════════════
    // UTILISATEURS — PDF
    // ════════════════════════════════════════════════════════
    @GetMapping("/users/pdf")
    public ResponseEntity<byte[]> usersPdf() throws Exception {
        var users = userRepository.findAll();
        Document doc = new Document(PageSize.A4.rotate());
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(doc, out);
        doc.open();
        addPdfTitle(doc, "Rapport Utilisateurs — MAMAAI");

        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{0.5f, 1.5f, 1.5f, 2.5f, 1f, 1f});
        for (String h : new String[]{"ID", "Prénom", "Nom", "Email", "Rôle", "Statut"})
            table.addCell(headerCell(h));

        for (var u : users) {
            table.addCell(dataCell(String.valueOf(u.getId())));
            table.addCell(dataCell(u.getFirstName()));
            table.addCell(dataCell(u.getLastName()));
            table.addCell(dataCell(u.getEmail()));
            table.addCell(dataCell(u.getRole().name()));
            table.addCell(dataCell(u.getIsActive() ? "Actif" : "Inactif"));
        }
        doc.add(table);
        doc.close();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=utilisateurs.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(out.toByteArray());
    }

    // ════════════════════════════════════════════════════════
    // CODES PROMO — Excel
    // ════════════════════════════════════════════════════════
    @GetMapping("/promos/excel")
    public ResponseEntity<byte[]> promosExcel() throws Exception {
        var promos = promoCodeRepository.findAll();
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Codes Promo");
            CellStyle hs = headerStyle(wb);
            String[] cols = {"Code", "Réduction (%)", "Utilisations", "Max", "Expire le", "Statut"};
            Row header = sheet.createRow(0);
            for (int i = 0; i < cols.length; i++) cell(header, i, cols[i], hs);

            int rn = 1;
            for (var p : promos) {
                Row row = sheet.createRow(rn++);
                cell(row, 0, p.getCode(), null);
                cell(row, 1, p.getDiscountPct() + "%", null);
                cell(row, 2, String.valueOf(p.getUsedCount()), null);
                cell(row, 3, p.getMaxUses() != null ? String.valueOf(p.getMaxUses()) : "∞", null);
                cell(row, 4, p.getExpiresAt() != null ? p.getExpiresAt().format(DATE_FMT) : "Jamais", null);
                cell(row, 5, p.getActive() ? "Actif" : "Désactivé", null);
            }
            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=codes-promo.xlsx")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(out.toByteArray());
        }
    }

    // ════════════════════════════════════════════════════════
    // CODES PROMO — PDF
    // ════════════════════════════════════════════════════════
    @GetMapping("/promos/pdf")
    public ResponseEntity<byte[]> promosPdf() throws Exception {
        var promos = promoCodeRepository.findAll();
        Document doc = new Document(PageSize.A4);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(doc, out);
        doc.open();
        addPdfTitle(doc, "Rapport Codes Promotionnels — MAMAAI");

        PdfPTable table = new PdfPTable(5);
        table.setWidthPercentage(100);
        for (String h : new String[]{"Code", "Réduction", "Utilisations", "Expire le", "Statut"})
            table.addCell(headerCell(h));

        for (var p : promos) {
            table.addCell(dataCell(p.getCode()));
            table.addCell(dataCell(p.getDiscountPct() + "%"));
            table.addCell(dataCell(p.getUsedCount() + " / " + (p.getMaxUses() != null ? p.getMaxUses() : "∞")));
            table.addCell(dataCell(p.getExpiresAt() != null ? p.getExpiresAt().format(DATE_FMT) : "Jamais"));
            table.addCell(dataCell(p.getActive() ? "Actif" : "Désactivé"));
        }
        doc.add(table);
        doc.close();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=codes-promo.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(out.toByteArray());
    }

    // ════════════════════════════════════════════════════════
    // REVENUS — Excel
    // ════════════════════════════════════════════════════════
    @GetMapping("/revenue/excel")
    public ResponseEntity<byte[]> revenueExcel() throws Exception {
        // Exclure FREE et garder uniquement les plans payants
        var subs = subscriptionRepository.findAll().stream()
                .filter(s -> s.getPlan() != Subscription.Plan.FREE)
                .toList();
        try (Workbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("Revenus");
            CellStyle hs = headerStyle(wb);
            String[] cols = {"Utilisateur", "Plan", "Statut", "Prix plan (TND)", "Payé (TND)", "Début", "Fin"};
            Row header = sheet.createRow(0);
            for (int i = 0; i < cols.length; i++) cell(header, i, cols[i], hs);

            int rn = 1;
            double totalEncaisse = 0.0;
            double totalActif = 0.0;
            for (var s : subs) {
                double planPrice = getPlanPrices().getOrDefault(s.getPlan().name(), 0.0);
                double paidAmount = s.getAmountPaid() != null ? s.getAmountPaid().doubleValue() : planPrice;
                totalEncaisse += paidAmount;
                if (s.getStatus() == Subscription.Status.ACTIVE) totalActif += planPrice;
                Row row = sheet.createRow(rn++);
                cell(row, 0, s.getUser().getEmail(), null);
                cell(row, 1, s.getPlan().name(), null);
                cell(row, 2, s.getStatus().name(), null);
                cell(row, 3, formatPrice(planPrice), null);
                cell(row, 4, formatPrice(paidAmount), null);
                cell(row, 5, s.getStartDate() != null ? s.getStartDate().format(DATE_FMT) : "—", null);
                cell(row, 6, s.getEndDate() != null ? s.getEndDate().format(DATE_FMT) : "Sans limite", null);
            }

            CellStyle ts = wb.createCellStyle();
            Font tf = wb.createFont();
            tf.setBold(true);
            ts.setFont(tf);
            Row totalRow1 = sheet.createRow(rn + 1);
            cell(totalRow1, 2, "TOTAL ENCAISSÉ :", ts);
            cell(totalRow1, 3, formatPrice(totalEncaisse), ts);
            Row totalRow2 = sheet.createRow(rn + 2);
            cell(totalRow2, 2, "REVENU MENSUEL ACTUEL :", ts);
            cell(totalRow2, 3, formatPrice(totalActif), ts);

            for (int i = 0; i < cols.length; i++) sheet.autoSizeColumn(i);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            wb.write(out);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=revenus.xlsx")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(out.toByteArray());
        }
    }

    // ════════════════════════════════════════════════════════
    // REVENUS — PDF
    // ════════════════════════════════════════════════════════
    @GetMapping("/revenue/pdf")
    public ResponseEntity<byte[]> revenuePdf() throws Exception {
        var subs = subscriptionRepository.findAll().stream()
                .filter(s -> s.getPlan() != Subscription.Plan.FREE)
                .toList();
        Document doc = new Document(PageSize.A4.rotate());
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(doc, out);
        doc.open();
        addPdfTitle(doc, "Rapport Revenus — MAMAAI");

        PdfPTable table = new PdfPTable(7);
        table.setWidthPercentage(100);
        for (String h : new String[]{"Utilisateur", "Plan", "Statut", "Prix plan", "Payé", "Début", "Fin"})
            table.addCell(headerCell(h));

        double totalEncaisse = 0.0;
        double totalActif = 0.0;
        for (var s : subs) {
            double planPrice = getPlanPrices().getOrDefault(s.getPlan().name(), 0.0);
            double paidAmount = s.getAmountPaid() != null ? s.getAmountPaid().doubleValue() : planPrice;
            totalEncaisse += paidAmount;
            if (s.getStatus() == Subscription.Status.ACTIVE) totalActif += planPrice;
            table.addCell(dataCell(s.getUser().getEmail()));
            table.addCell(dataCell(s.getPlan().name()));
            table.addCell(dataCell(s.getStatus().name()));
            table.addCell(dataCell(formatPrice(planPrice)));
            table.addCell(dataCell(formatPrice(paidAmount)));
            table.addCell(dataCell(s.getStartDate() != null ? s.getStartDate().format(DATE_FMT) : "—"));
            table.addCell(dataCell(s.getEndDate() != null ? s.getEndDate().format(DATE_FMT) : "Sans limite"));
        }
        doc.add(table);
        doc.add(Chunk.NEWLINE);
        doc.add(new Paragraph("Total encaissé : " + formatPrice(totalEncaisse),
                pdfFont(11, com.itextpdf.text.Font.BOLD, new BaseColor(50, 50, 50))));
        doc.add(new Paragraph("Revenu mensuel actuel : " + formatPrice(totalActif),
                pdfFont(12, com.itextpdf.text.Font.BOLD, PINK)));
        doc.close();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=revenus.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(out.toByteArray());
    }
}
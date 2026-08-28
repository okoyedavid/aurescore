"use client";

import {
  Document,
  Page,
  PDFDownloadLink,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { Download } from "lucide-react";
import type {
  PublicCalculationResponse,
  PublicCalculatorDetail,
} from "../types";
import { byCourseOrder, byDimensionOrder } from "../hierarchy";

const styles = StyleSheet.create({
  page: {
    padding: 36,
    color: "#111827",
    fontFamily: "Helvetica",
    fontSize: 8.5,
  },
  brand: {
    color: "#1d4ed8",
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.2,
  },
  title: { marginTop: 10, fontSize: 21, fontFamily: "Helvetica-Bold" },
  subtitle: { marginTop: 4, color: "#4b5563", fontSize: 9.5 },
  rule: {
    marginVertical: 15,
    borderBottomWidth: 1.5,
    borderBottomColor: "#111827",
  },
  session: {
    marginTop: 10,
    paddingVertical: 7,
    paddingHorizontal: 9,
    backgroundColor: "#eff6ff",
    color: "#1e3a8a",
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  level: { marginTop: 11, fontSize: 10.5, fontFamily: "Helvetica-Bold" },
  termRow: {
    marginTop: 9,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  term: { fontSize: 9, fontFamily: "Helvetica-Bold" },
  gpa: { color: "#1d4ed8", fontFamily: "Helvetica-Bold" },
  table: { marginTop: 5, borderWidth: 0.5, borderColor: "#cbd5e1" },
  row: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    minHeight: 20,
    alignItems: "center",
  },
  head: { backgroundColor: "#f1f5f9", fontFamily: "Helvetica-Bold" },
  course: { width: "35%", padding: 4 },
  score: { width: "11%", padding: 4 },
  grade: { width: "10%", padding: 4 },
  point: { width: "12%", padding: 4 },
  units: { width: "12%", padding: 4 },
  quality: { width: "20%", padding: 4 },
  sessionTotal: {
    marginTop: 7,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
  },
  summary: {
    marginTop: 18,
    padding: 13,
    backgroundColor: "#111827",
    color: "#ffffff",
  },
  summaryTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
  },
  summaryGrid: { marginTop: 8, flexDirection: "row", gap: 20 },
  summaryValue: { marginTop: 2, fontSize: 16, fontFamily: "Helvetica-Bold" },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 0.5,
    borderTopColor: "#cbd5e1",
    paddingTop: 7,
    color: "#64748b",
    fontSize: 7,
  },
  url: { marginTop: 3, color: "#1d4ed8" },
});

function Report({
  response,
  calculator,
  url,
}: {
  response: PublicCalculationResponse;
  calculator: PublicCalculatorDetail;
  url: string;
}) {
  const sessions = calculator.sessions
    .slice()
    .sort(byDimensionOrder)
    .map((session) => ({
      session,
      levels: calculator.levels
        .slice()
        .sort(byDimensionOrder)
        .map((level) => ({
          level,
          terms: calculator.terms
            .slice()
            .sort(byDimensionOrder)
            .map((term) => ({
              term,
              entries: response.entries
                .filter(
                  (entry) =>
                    entry.session?.id === session.id &&
                    entry.level?.id === level.id &&
                    entry.term?.id === term.id,
                )
                .sort((a, b) =>
                  byCourseOrder(
                    {
                      ...a.course,
                      levelId: level.id,
                      termId: term.id,
                      creditUnits: a.creditUnits,
                      order:
                        calculator.courses.find(
                          (course) => course.id === a.course.id,
                        )?.order ?? null,
                    },
                    {
                      ...b.course,
                      levelId: level.id,
                      termId: term.id,
                      creditUnits: b.creditUnits,
                      order:
                        calculator.courses.find(
                          (course) => course.id === b.course.id,
                        )?.order ?? null,
                    },
                  ),
                ),
              total: response.groups.find(
                (group) =>
                  group.session?.id === session.id &&
                  group.level?.id === level.id &&
                  group.term?.id === term.id,
              ),
            }))
            .filter((group) => group.entries.length),
        }))
        .filter((group) => group.terms.length),
      total: response.sessions.find((item) => item.session?.id === session.id),
    }))
    .filter((group) => group.levels.length);
  return (
    <Document
      title={`${calculator.title} GPA report`}
      author="AureScore"
      subject="Unofficial GPA calculation report"
    >
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.brand}>AURESCORE</Text>
        <Text style={styles.title}>GPA CALCULATION REPORT</Text>
        <Text style={styles.subtitle}>{calculator.title}</Text>
        <Text style={styles.subtitle}>
          {[calculator.institutionName, calculator.departmentName]
            .filter(Boolean)
            .join(" · ") || "Public academic calculator"}
        </Text>
        <View style={styles.rule} />
        {sessions.map(({ session, levels, total }) => (
          <View key={session.id}>
            <Text style={styles.session}>{session.name}</Text>
            {levels.map(({ level, terms }) => (
              <View key={level.id}>
                <Text style={styles.level}>{level.name.toUpperCase()}</Text>
                {terms.map(({ term, entries, total: termTotal }) => (
                  <View key={term.id}>
                    <View style={styles.termRow}>
                      <Text style={styles.term}>{term.name.toUpperCase()}</Text>
                      <Text style={styles.gpa}>
                        GPA {termTotal?.gpa ?? "—"}
                      </Text>
                    </View>
                    <View style={styles.table}>
                      <View style={[styles.row, styles.head]}>
                        <Text style={styles.course}>Course</Text>
                        <Text style={styles.score}>Score</Text>
                        <Text style={styles.grade}>Grade</Text>
                        <Text style={styles.point}>GP</Text>
                        <Text style={styles.units}>Units</Text>
                        <Text style={styles.quality}>Quality points</Text>
                      </View>
                      {entries.map((entry) => (
                        <View key={entry.course.id} style={styles.row}>
                          <Text style={styles.course}>
                            {entry.course.code ? `${entry.course.code} — ` : ""}
                            {entry.course.name}
                            {entry.attemptType === "CARRYOVER"
                              ? " (CARRYOVER)"
                              : ""}
                          </Text>
                          <Text style={styles.score}>{entry.score ?? "—"}</Text>
                          <Text style={styles.grade}>{entry.grade}</Text>
                          <Text style={styles.point}>{entry.gradePoint}</Text>
                          <Text style={styles.units}>{entry.creditUnits}</Text>
                          <Text style={styles.quality}>
                            {entry.qualityPoints}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ))}
            <Text style={styles.sessionTotal}>
              SESSION GPA: {total?.gpa ?? "—"}
            </Text>
          </View>
        ))}
        <View style={styles.summary} wrap={false}>
          <Text style={styles.summaryTitle}>CUMULATIVE SUMMARY</Text>
          <View style={styles.summaryGrid}>
            <View>
              <Text>Total credit units</Text>
              <Text style={styles.summaryValue}>
                {response.totalCreditUnits}
              </Text>
            </View>
            <View>
              <Text>Total quality points</Text>
              <Text style={styles.summaryValue}>
                {response.totalQualityPoints}
              </Text>
            </View>
            <View>
              <Text>CGPA</Text>
              <Text style={styles.summaryValue}>
                {response.cgpa ?? response.gpa ?? "—"}
              </Text>
            </View>
          </View>
        </View>
        <View fixed style={styles.footer}>
          <Text>
            Calculated with AureScore · Unofficial calculation based on
            user-entered academic data.
          </Text>
          <Text style={styles.url}>{url}</Text>
        </View>
      </Page>
    </Document>
  );
}

export default function PdfReportButton({
  response,
  calculator,
}: {
  response: PublicCalculationResponse;
  calculator: PublicCalculatorDetail;
}) {
  const url =
    typeof window === "undefined"
      ? calculator.publicPath
      : new URL(calculator.publicPath, window.location.origin).href;
  const filename = `${
    calculator.title
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "aurescore"
  }-gpa-report.pdf`;
  return (
    <PDFDownloadLink
      document={
        <Report
          response={response}
          calculator={calculator}
          url={url}
        />
      }
      fileName={filename}
      className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-sm border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-cream"
    >
      {({ loading }) => (
        <>
          <Download size={15} aria-hidden="true" />
          {loading ? "Preparing PDF…" : "Download PDF report"}
        </>
      )}
    </PDFDownloadLink>
  );
}

"use client";

import React, { useState } from "react";

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportId, setReportId] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/create-report", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to create report");

      const data = await res.json();
      setReportId(data.reportId); // Save the generated report ID
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1>Generate a Report</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Generating..." : "Generate Report"}
        </button>
      </form>

      {reportId && (
        <div>
          <p>Report created successfully! View it here:</p>
          <a href={`/reports/${reportId}`}>View Report</a>
        </div>
      )}
    </div>
  );
}

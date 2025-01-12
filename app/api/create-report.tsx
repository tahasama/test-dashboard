import { NextApiRequest, NextApiResponse } from "next";
import { Client } from "pg";
import xlsx from "xlsx";
import formidable from "formidable";

// Vercel doesn't support custom middleware, so we need to parse the form manually.
export const config = {
  api: {
    bodyParser: false, // Disable the default body parser to handle the file upload manually
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: "File upload failed" });
    }

    const file = files.file[0];
    const filePath = file.filepath;

    try {
      // Step 1: Read the Excel file using xlsx library
      const workbook = xlsx.readFile(filePath);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]]; // Get the first sheet
      const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 }); // Convert to JSON

      // Step 2: Connect to Vercel Postgres
      const client = new Client({
        connectionString: process.env.DATABASE_URL, // You will set this in your Vercel environment variables
      });

      await client.connect();

      // Step 3: Insert the data into the database
      const insertQuery = `
        INSERT INTO reports (data)
        VALUES ($1)
        RETURNING id;
      `;
      const result = await client.query(insertQuery, [JSON.stringify(data)]);

      const reportId = result.rows[0].id;

      // Step 4: Close the database connection
      await client.end();

      // Return the generated report ID to the client
      res.status(200).json({ reportId });
    } catch (error) {
      console.error("Error processing file:", error);
      res.status(500).json({ error: "Failed to process file" });
    }
  });
};

export default handler;

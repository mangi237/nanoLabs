import type { NextApiRequest, NextApiResponse } from "next";
import formidable from "formidable";
import fs from "fs";
import FormData from "form-data";
import axios from "axios";

export const config = {
  api: {
    bodyParser: false, // disable Next.js body parser for file uploads
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ✅ CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*"); // You can restrict to your frontend domain in production
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("📥 Upload request received");

    // Parse form data
    const form = formidable({ maxFileSize: 10 * 1024 * 1024, keepExtensions: true });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ error: "No file provided" });
    }

    console.log("📄 File received:", {
      name: file.originalFilename,
      size: file.size,
      type: file.mimetype,
    });

    // ✅ Prepare Pinata upload
    const formData = new FormData();
    formData.append("file", fs.createReadStream(file.filepath), {
      filename: file.originalFilename || "document.pdf",
      contentType: file.mimetype || "application/pdf",
    });

    // Optional metadata
    formData.append(
      "pinataMetadata",
      JSON.stringify({
        name: file.originalFilename || "Lab Document",
        keyvalues: { uploadedAt: new Date().toISOString() },
      })
    );

    console.log("🚀 Uploading to Pinata...");

    // ✅ Upload to Pinata
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          pinata_api_key: process.env.PINATA_API_KEY as string,
          pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY as string,
        },
        maxBodyLength: Infinity,
        timeout: 30000,
      }
    );

    const ipfsHash = response.data.IpfsHash;
    const fileUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

    console.log("✅ Upload successful:", fileUrl);

    // Clean temp file
    try {
      fs.unlinkSync(file.filepath);
    } catch (err) {
      console.warn("⚠️ Could not delete temp file:", err);
    }

    return res.status(200).json({ fileUrl });
  } catch (err: any) {
    console.error("❌ Upload error:", err);

    if (axios.isAxiosError(err)) {
      return res.status(500).json({
        error: "Pinata upload failed",
        details: err.response?.data || err.message,
      });
    }

    return res.status(500).json({
      error: "Upload failed",
      details: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Convert Blob/File to Buffer to send via form-data
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get filename and content type from file object
    const filename = (file as any).name || "upload.png";
    const contentType = file.type || "image/png";

    // Build form data for Pinata API
    const pinataForm = new FormData();
    pinataForm.append("file", buffer, {
      filename,
      contentType,
    });

    const pinataApiKey = process.env.PINATA_API_KEY;
    const pinataApiSecret = process.env.PINATA_API_SECRET;

    if (!pinataApiKey || !pinataApiSecret) {
      return NextResponse.json(
        { error: "Pinata credentials (PINATA_API_KEY or PINATA_API_SECRET) are not configured" },
        { status: 500 }
      );
    }

    // Upload to Pinata Cloud
    const response = await axios.post(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      pinataForm,
      {
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        headers: {
          ...pinataForm.getHeaders(),
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataApiSecret,
        },
      }
    );

    return NextResponse.json({
      IpfsHash: response.data.IpfsHash,
      PinSize: response.data.PinSize,
      Timestamp: response.data.Timestamp,
    });
  } catch (error: any) {
    console.error("Error uploading to IPFS via Pinata:", error?.response?.data || error.message);
    return NextResponse.json(
      {
        error: "Failed to upload file to IPFS",
        details: error?.response?.data || error.message,
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Unsubscribe endpoint for email/SMS notifications
 * URL format: /api/unsubscribe?clientId={id}&type={email|sms}
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get("clientId");
    const type = searchParams.get("type");

    if (!clientId || !type) {
      return new NextResponse("Missing required parameters", { status: 400 });
    }

    if (type !== "email" && type !== "sms") {
      return new NextResponse("Invalid type parameter", { status: 400 });
    }

    // Find client
    const client = await db.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return new NextResponse("Client not found", { status: 404 });
    }

    // Update notification preferences
    await db.client.update({
      where: { id: clientId },
      data: {
        emailNotificationsEnabled: type === "email" ? false : client.emailNotificationsEnabled,
        smsNotificationsEnabled: type === "sms" ? false : client.smsNotificationsEnabled,
      },
    });

    // Return success page
    return new NextResponse(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Unsubscribed</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              max-width: 600px;
              margin: 50px auto;
              padding: 20px;
              text-align: center;
            }
            h1 {
              color: #22c55e;
            }
            p {
              color: #666;
              line-height: 1.6;
            }
          </style>
        </head>
        <body>
          <h1>✓ Successfully Unsubscribed</h1>
          <p>
            You have been unsubscribed from ${type === "email" ? "email" : "SMS"} notifications.
          </p>
          <p>
            You will no longer receive ${type === "email" ? "email" : "SMS"} notifications about your appointments.
          </p>
          <p style="margin-top: 40px; font-size: 14px; color: #999;">
            To resubscribe, please contact the salon directly.
          </p>
        </body>
      </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      }
    );
  } catch (error) {
    console.error("Error unsubscribing:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

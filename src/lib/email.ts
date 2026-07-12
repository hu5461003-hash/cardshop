import { Resend } from "resend";

let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not set");
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export async function sendCardEmail(to: string, orderData: {
  orderId: string;
  productName: string;
  cardContent: string;
}) {
  const resend = getResend();
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "CardShop";
  const domain = process.env.RESEND_DOMAIN || "cardshop.com";
  const fromEmail = `${siteName} <noreply@${domain}>`;

  await resend.emails.send({
    from: fromEmail,
    to,
    subject: `Your ${orderData.productName} — Order #${orderData.orderId}`,
    html: `
      <div style="background:#0a0a0a;color:#f5f5f7;padding:40px;font-family:system-ui,sans-serif;border-radius:8px;">
        <h2 style="margin:0 0 20px;font-size:20px;">Order Confirmation</h2>
        <p style="color:#888;margin:0 0 16px;">Order ID: <strong style="color:#fff;">${orderData.orderId}</strong></p>
        <p style="color:#888;margin:0 0 16px;">Product: <strong style="color:#fff;">${orderData.productName}</strong></p>
        <div style="background:#1a1a1a;border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:16px;margin:20px 0;">
          <p style="color:#888;margin:0 0 8px;font-size:13px;">Your Account Details:</p>
          <pre style="color:#fff;margin:0;white-space:pre-wrap;font-size:14px;">${orderData.cardContent}</pre>
        </div>
        <p style="color:#555;font-size:12px;margin:20px 0 0;">This is an automated message from ${siteName}. Please keep this information secure.</p>
      </div>
    `,
  });
}

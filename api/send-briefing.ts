import type { VercelRequest, VercelResponse } from "@vercel/node";

const MAX_TOTAL_BYTES = 8 * 1024 * 1024;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function cleanName(value: unknown) {
  return String(value ?? "").trim().replace(/[\r\n]/g, " ").slice(0, 120) || "Cliente";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Método não permitido." });
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    return res.status(500).json({ error: "O envio de e-mail ainda não foi configurado no ambiente." });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const answers = body?.answers ?? {};
    const summary = String(body?.summary ?? "").slice(0, 30000);
    const attachments = Array.isArray(body?.attachments) ? body.attachments : [];
    const userName = cleanName(answers.name);

    if (!summary || !userName || !String(answers.phone ?? "").trim() || !String(answers.source ?? "").trim()) {
      return res.status(400).json({ error: "Preencha os dados obrigatórios antes de enviar." });
    }

    let totalBytes = 0;
    const normalizedAttachments = attachments.map((item: any) => {
      const filename = cleanName(item?.filename).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "imagem";
      const content = String(item?.content ?? "");
      const contentType = String(item?.contentType ?? "application/octet-stream");
      const bytes = Math.ceil(content.length * 0.75);
      totalBytes += bytes;
      if (!ALLOWED_TYPES.has(contentType) || bytes > MAX_FILE_BYTES) throw new Error("Cada anexo deve ser uma imagem JPG, PNG, WEBP ou GIF de até 5 MB.");
      return { filename, content, contentType };
    });
    if (totalBytes > MAX_TOTAL_BYTES) return res.status(413).json({ error: "O tamanho total dos anexos ultrapassa 8 MB." });

    const replyTo = String(answers.email ?? "").trim();
    const email = {
      from: process.env.RESEND_FROM_EMAIL,
      to: ["renatartistico@gmail.com"],
      subject: `BRIEFING ${userName}`,
      reply_to: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo) ? replyTo : undefined,
      text: summary,
      attachments: normalizedAttachments,
    };

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(email),
    });
    if (!response.ok) return res.status(502).json({ error: "O provedor de e-mail recusou o envio. Tente novamente." });
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(400).json({ error: error instanceof Error ? error.message : "Não foi possível processar o briefing." });
  }
}

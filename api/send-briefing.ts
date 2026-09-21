import type { VercelRequest, VercelResponse } from "@vercel/node";

// O corpo JSON contém anexos em base64, então mantemos margem para o limite de request da Vercel.
const MAX_TOTAL_BYTES = 3 * 1024 * 1024;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function cleanName(value: unknown) {
  return String(value ?? "").trim().replace(/[\r\n]/g, " ").slice(0, 120) || "Cliente";
}

function hasValue(value: unknown) {
  return String(value ?? "").trim().length > 0;
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

    const desiredColors = Array.isArray(answers.desired) ? answers.desired : [];
    const desiredCustomColors = Array.isArray(answers.desiredCustom) ? answers.desiredCustom : [];
    const unwantedColors = Array.isArray(answers.unwanted) ? answers.unwanted : [];
    const unwantedCustomColors = Array.isArray(answers.unwantedCustom) ? answers.unwantedCustom : [];
    const links = Array.isArray(answers.links) ? answers.links : [];
    const files = Array.isArray(answers.files) ? answers.files : [];
    const missing: string[] = [];
    if (!hasValue(answers.name) || !hasValue(answers.phone) || !hasValue(answers.source)) missing.push("dados de contato");
    if (!hasValue(answers.size)) missing.push("tamanho");
    if (!desiredColors.length && !desiredCustomColors.length) missing.push("cores desejadas");
    if (!unwantedColors.length && !unwantedCustomColors.length) missing.push("cores indesejadas");
    if (!links.some(hasValue) && !files.length) missing.push("referências ou imagens");
    if (!hasValue(answers.hasDeadline) || (answers.hasDeadline === "Sim" && !hasValue(answers.deadlineDate))) missing.push("prazo");
    if (!summary || missing.length) {
      return res.status(400).json({ error: `Complete todas as respostas antes de enviar: ${missing.join(", ") || "resumo"}.` });
    }

    let totalBytes = 0;
    const normalizedAttachments = attachments.map((item: any) => {
      const filename = cleanName(item?.filename).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "imagem";
      const content = String(item?.content ?? "");
      const contentType = String(item?.contentType ?? "application/octet-stream");
      const bytes = Math.ceil(content.length * 0.75);
      totalBytes += bytes;
      if (!ALLOWED_TYPES.has(contentType) || bytes > MAX_FILE_BYTES) throw new Error("Cada anexo deve ser uma imagem JPG, PNG, WEBP ou GIF de até 2 MB.");
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

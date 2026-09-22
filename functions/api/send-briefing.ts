interface Env {
  RESEND_API_KEY: string;
  RESEND_FROM_EMAIL: string;
}

type PagesContext = {
  request: Request;
  env: Env;
};

const MAX_TOTAL_BYTES = 3 * 1024 * 1024;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const ALLOWED_SOURCES = new Set(["Indicação", "Instagram", "TikTok", "Site", "Outro"]);

function cleanName(value: unknown) {
  return String(value ?? "").trim().replace(/[\r\n]/g, " ").slice(0, 120) || "Cliente";
}

function hasValue(value: unknown) {
  return String(value ?? "").trim().length > 0;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export const onRequestPost = async ({ request, env }: PagesContext) => {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    return json({ error: "O envio de e-mail ainda não foi configurado no ambiente." }, 500);
  }

  try {
    const body = await request.json() as any;
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

    if (!hasValue(answers.name) || String(answers.phone ?? "").replace(/\D/g, "").length !== 11 || !ALLOWED_SOURCES.has(String(answers.source ?? ""))) missing.push("dados de contato válidos");
    if (!hasValue(answers.size)) missing.push("tamanho");
    if (!desiredColors.length && !desiredCustomColors.length) missing.push("cores desejadas");
    if (!unwantedColors.length && !unwantedCustomColors.length) missing.push("cores indesejadas");
    if (!links.some(hasValue) && !files.length) missing.push("referências ou imagens");
    if (!hasValue(answers.hasDeadline) || (answers.hasDeadline === "Sim" && !hasValue(answers.deadlineDate))) missing.push("prazo");
    if (!summary || missing.length) return json({ error: `Complete todas as respostas antes de enviar: ${missing.join(", ") || "resumo"}.` }, 400);

    let totalBytes = 0;
    const normalizedAttachments = attachments.map((item: any) => {
      const filename = cleanName(item?.filename).replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "imagem";
      const content = String(item?.content ?? "");
      const contentType = String(item?.contentType ?? "application/octet-stream");
      const bytes = Math.ceil(content.length * 0.75);
      totalBytes += bytes;
      if (!ALLOWED_TYPES.has(contentType) || bytes > MAX_FILE_BYTES) throw new Error("Cada anexo deve ser uma imagem JPG, PNG, WEBP ou GIF de até 2 MB.");
      return { filename, content, content_type: contentType };
    });
    if (totalBytes > MAX_TOTAL_BYTES) return json({ error: "O tamanho total dos anexos ultrapassa 3 MB." }, 413);

    const replyTo = String(answers.email ?? "").trim();
    const email: Record<string, unknown> = {
      from: env.RESEND_FROM_EMAIL,
      to: ["renatartistico@gmail.com"],
      subject: `BRIEFING ${userName}`,
      text: summary,
      attachments: normalizedAttachments,
    };
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo)) email.reply_to = replyTo;

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(email),
    });
    if (!response.ok) return json({ error: "O provedor de e-mail recusou o envio. Tente novamente." }, 502);
    return json({ ok: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Não foi possível processar o briefing." }, 400);
  }
};

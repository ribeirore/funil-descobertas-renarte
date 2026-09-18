import { useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  Clipboard,
  ImagePlus,
  Instagram,
  Link2,
  Mail,
  Palette,
  Plus,
  Send,
  Sparkles,
  User,
} from "lucide-react";

const WHATSAPP_NUMBER = "SEUNUMERO";
const LOGO_SRC = "/Logo-Renarte-SemFundo.png";

const palette = [
  { name: "Amarelo", hex: "#F5D44A" },
  { name: "Azul", hex: "#2364AA" },
  { name: "Verde", hex: "#4A8B68" },
  { name: "Vermelho", hex: "#C94C4C" },
  { name: "Laranja", hex: "#E7833D" },
  { name: "Roxo", hex: "#7653A6" },
  { name: "Rosa", hex: "#DB7FA3" },
  { name: "Branco", hex: "#F4F3EE" },
  { name: "Preto", hex: "#11161D" },
];

const sizeOptions = [
  { title: "Pequeno", dimensions: "Até 30 X 40 cm", detail: "Um detalhe especial para um canto íntimo." },
  { title: "Médio", dimensions: "De 80 X 100 cm até 120 X 160 cm", detail: "Presença equilibrada para ambientes acolhedores." },
  { title: "Grande", dimensions: "Acima de 120 X 160 cm", detail: "Uma peça protagonista, feita para marcar." },
  { title: "Ainda não sei", dimensions: "Podemos definir juntos", detail: "A Renarte ajuda a encontrar a proporção ideal." },
];

const initialAnswers = {
  name: "",
  phone: "",
  source: "",
  instagram: "",
  email: "",
  size: "",
  desiredColors: [] as string[],
  desiredCustomColors: [] as string[],
  desiredNotes: "",
  unwantedColors: [] as string[],
  unwantedCustomColors: [] as string[],
  unwantedNotes: "",
  referenceFiles: [] as string[],
  links: [""],
  hasDeadline: "",
  deadlineDate: "",
};

type Answers = typeof initialAnswers;
type ColorGroup = "desired" | "unwanted";

type OptionCardProps = {
  title: string;
  subtitle: string;
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
};

const OptionCard = ({ title, subtitle, selected, onClick, children }: OptionCardProps) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onClick}
    className={`relative flex min-h-[150px] w-full flex-col justify-between rounded-3xl border p-5 text-left transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F5D44A]/40 ${selected ? "border-[#F5D44A] bg-[#F5D44A]/10 shadow-[0_0_0_1px_rgba(245,212,74,0.18)]" : "border-white/10 bg-white/[0.035] hover:border-[#F5D44A]/60 hover:bg-white/[0.06]"}`}
  >
    <span className={`mb-5 flex h-10 w-10 items-center justify-center rounded-2xl ${selected ? "bg-[#F5D44A] text-[#10151C]" : "bg-white/10 text-[#F5D44A]"}`}>{children}</span>
    <span>
      <span className="block pr-8 text-base font-semibold text-white">{title}</span>
      <span className="mt-1 block text-sm leading-relaxed text-white/50">{subtitle}</span>
    </span>
    {selected && <span className="absolute right-4 top-4 rounded-full bg-[#F5D44A] p-1 text-[#10151C]"><Check size={15} strokeWidth={3} /></span>}
  </button>
);

const Field = ({ label, optional, children }: { label: string; optional?: boolean; children: ReactNode }) => (
  <label className="block"><span className="mb-2 block text-sm font-semibold text-white">{label} {optional && <span className="font-normal text-white/35">(opcional)</span>}</span>{children}</label>
);

const inputClass = "min-h-14 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 text-base text-white outline-none transition placeholder:text-white/25 focus:border-[#F5D44A] focus:ring-4 focus:ring-[#F5D44A]/10";

const App = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");

  const totalSteps = 8;
  const progress = step === 0 ? 8 : Math.round((step / (totalSteps - 1)) * 100);

  const update = <K extends keyof Answers>(key: K, value: Answers[K]) => setAnswers((current) => ({ ...current, [key]: value }));
  const go = (nextStep: number) => { setDirection(nextStep > step ? "forward" : "back"); setStep(Math.max(0, Math.min(nextStep, totalSteps - 1))); setCopyStatus("idle"); };

  const requiredComplete = useMemo(() => {
    if (step === 1) return Boolean(answers.name.trim() && answers.phone.trim() && answers.source);
    if (step === 2) return Boolean(answers.size);
    if (step === 4) return Boolean(answers.hasDeadline && (answers.hasDeadline === "Não" || answers.deadlineDate));
    return true;
  }, [answers, step]);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : "";
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const toggleColor = (group: ColorGroup, color: string) => {
    const key = group === "desired" ? "desiredColors" : "unwantedColors";
    const colors = answers[key];
    update(key, colors.includes(color) ? colors.filter((item) => item !== color) : [...colors, color]);
  };

  const addCustomColor = (group: ColorGroup, event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (!value) return;
    const key = group === "desired" ? "desiredCustomColors" : "unwantedCustomColors";
    update(key, [...answers[key], value]);
    event.target.value = "";
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).map((file) => file.name);
    update("referenceFiles", [...answers.referenceFiles, ...files]);
  };

  const buildSummary = () => {
    const show = (value: string) => value.trim() || "Não informado";
    const colors = (standard: string[], custom: string[]) => [...standard, ...custom].join(", ") || "Não informado";
    return [
      "Olá! Gostaria de conversar sobre uma encomenda de pintura Renarte.",
      "",
      "RESUMO DO BRIEFING",
      `Nome: ${show(answers.name)}`,
      `Celular: ${show(answers.phone)}`,
      `Como conheceu: ${show(answers.source)}`,
      `Instagram: ${show(answers.instagram)}`,
      `E-mail: ${show(answers.email)}`,
      `Tamanho: ${show(answers.size)}`,
      `Cores desejadas: ${colors(answers.desiredColors, answers.desiredCustomColors)}`,
      `Observações sobre cores desejadas: ${show(answers.desiredNotes)}`,
      `Cores indesejadas: ${colors(answers.unwantedColors, answers.unwantedCustomColors)}`,
      `Observações sobre cores indesejadas: ${show(answers.unwantedNotes)}`,
      `Links de referência: ${answers.links.filter(Boolean).join(", ") || "Não informado"}`,
      `Imagens anexadas: ${answers.referenceFiles.join(", ") || "Nenhuma"}`,
      `Possui prazo específico: ${show(answers.hasDeadline)}`,
      ...(answers.hasDeadline === "Sim" ? [`Data desejada: ${show(answers.deadlineDate)}`] : []),
    ].join("\n");
  };

  const copySummary = async () => {
    try { await navigator.clipboard.writeText(buildSummary()); setCopyStatus("success"); } catch { setCopyStatus("error"); }
    window.setTimeout(() => setCopyStatus("idle"), 2800);
  };

  const sendWhatsApp = () => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildSummary())}`, "_blank", "noopener,noreferrer");
  const handleSubmit = () => { sendWhatsApp(); go(7); };
  const addLink = () => update("links", [...answers.links, ""]);
  const removeLink = (index: number) => update("links", answers.links.filter((_, itemIndex) => itemIndex !== index));

  const renderColorPicker = (group: ColorGroup, title: string, notesKey: "desiredNotes" | "unwantedNotes") => {
    const standardKey = group === "desired" ? "desiredColors" : "unwantedColors";
    const customKey = group === "desired" ? "desiredCustomColors" : "unwantedCustomColors";
    return <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-6"><div className="mb-5 flex items-center gap-3"><span className="rounded-xl bg-[#F5D44A]/15 p-2 text-[#F5D44A]"><Palette size={19} /></span><h3 className="text-lg font-semibold text-white">{title}</h3></div><div className="flex flex-wrap gap-3">{palette.map((color) => <button key={color.name} type="button" title={color.name} aria-label={color.name} aria-pressed={answers[standardKey].includes(color.name)} onClick={() => toggleColor(group, color.name)} className={`h-10 w-10 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F5D44A]/40 ${answers[standardKey].includes(color.name) ? "border-[#F5D44A] scale-110 shadow-[0_0_0_4px_rgba(245,212,74,0.22)]" : "border-white/25"}`} style={{ backgroundColor: color.hex }} />)}<label title="Escolher outra cor" className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-dashed border-[#F5D44A]/70 text-[#F5D44A] transition hover:bg-[#F5D44A]/10"><Plus size={19} /><input type="color" className="sr-only" onChange={(event) => addCustomColor(group, event)} /></label></div>{answers[customKey].length > 0 && <div className="mt-4 flex flex-wrap gap-2">{answers[customKey].map((color, index) => <span key={`${color}-${index}`} className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/70"><span className="h-3 w-3 rounded-full border border-white/20" style={{ backgroundColor: color }} />Tom personalizado</span>)}</div>}<div className="mt-5"><Field label="Observações" optional><textarea value={answers[notesKey]} onChange={(event) => update(notesKey, event.target.value)} placeholder="Ex.: quero uma atmosfera quente e luminosa" className="min-h-24 w-full resize-y rounded-2xl border border-white/10 bg-white/[0.06] p-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#F5D44A] focus:ring-4 focus:ring-[#F5D44A]/10" /></Field></div></div>;
  };

  const renderStep = () => {
    if (step === 1) return <div className="mx-auto max-w-2xl"><StepHeading eyebrow="01 / 05" title="Vamos começar pelo essencial." subtitle="Esses dados ajudam a Renarte a personalizar a conversa desde o primeiro contato." /><div className="grid gap-5 sm:grid-cols-2"><Field label="Nome"><div className="relative"><User className="pointer-events-none absolute left-4 top-4 text-white/30" size={19} /><input value={answers.name} onChange={(event) => update("name", event.target.value)} placeholder="Seu nome completo" className={`${inputClass} pl-12`} /></div></Field><Field label="Celular"><input inputMode="numeric" value={answers.phone} onChange={(event) => update("phone", formatPhone(event.target.value))} placeholder="+55 21 995182554" className={inputClass} /></Field><Field label="Como conheceu?"><select value={answers.source} onChange={(event) => update("source", event.target.value)} className={`${inputClass} appearance-none`}><option value="" className="bg-[#10151C]">Selecione uma opção</option><option className="bg-[#10151C]">Indicação</option><option className="bg-[#10151C]">Redes Sociais</option><option className="bg-[#10151C]">Site</option><option className="bg-[#10151C]">Outro</option></select></Field><Field label="Instagram" optional><div className="relative"><Instagram className="pointer-events-none absolute left-4 top-4 text-white/30" size={19} /><input value={answers.instagram} onChange={(event) => update("instagram", event.target.value)} placeholder="@seuusuario" className={`${inputClass} pl-12`} /></div></Field><Field label="E-mail" optional><div className="relative"><Mail className="pointer-events-none absolute left-4 top-4 text-white/30" size={19} /><input type="email" value={answers.email} onChange={(event) => update("email", event.target.value)} placeholder="voce@email.com" className={`${inputClass} pl-12`} /></div></Field></div></div>;
    if (step === 2) return <div><StepHeading eyebrow="02 / 05" title="Qual tamanho combina com seu espaço?" subtitle="As medidas são referências iniciais. A proporção final será definida em conjunto." /><div className="grid gap-4 sm:grid-cols-2">{sizeOptions.map((option) => <OptionCard key={option.title} title={option.title} subtitle={`${option.dimensions}. ${option.detail}`} selected={answers.size === option.title} onClick={() => update("size", option.title)}><ImagePlus size={20} /></OptionCard>)}</div></div>;
    if (step === 3) return <div><StepHeading eyebrow="03 / 05" title="Que cores você quer sentir na pintura?" subtitle="Selecione quantas cores quiser. O círculo com mais indica que a cor está selecionada." /><div className="space-y-5">{renderColorPicker("desired", "Cores desejadas", "desiredNotes")}{renderColorPicker("unwanted", "Cores indesejadas", "unwantedNotes")}</div></div>;
    if (step === 4) return <div><StepHeading eyebrow="04 / 05" title="Vamos reunir referências visuais." subtitle="Envie imagens do seu celular ou adicione links do Pinterest, Instagram e outros sites." /><div className="space-y-6"><label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-[#F5D44A]/60 bg-[#F5D44A]/[0.04] text-center transition hover:bg-[#F5D44A]/[0.08]"><input type="file" accept="image/*" capture="environment" multiple className="sr-only" onChange={handleFiles} /><Camera className="mb-3 text-[#F5D44A]" size={28} /><span className="text-sm font-semibold text-white">Abrir câmera ou escolher fotos</span><span className="mt-1 text-xs text-white/40">JPG, PNG ou imagens do rolo de câmera</span></label>{answers.referenceFiles.length > 0 && <div className="flex flex-wrap gap-2">{answers.referenceFiles.map((file) => <span key={file} className="rounded-full bg-white/10 px-3 py-2 text-xs text-white/70">{file}</span>)}</div>}<div className="space-y-3">{answers.links.map((link, index) => <div key={index} className="flex gap-2"><div className="relative flex-1"><Link2 className="pointer-events-none absolute left-4 top-4 text-white/30" size={18} /><input type="url" value={link} onChange={(event) => update("links", answers.links.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder="https://..." className={`${inputClass} pl-12`} /></div>{answers.links.length > 1 && <button type="button" onClick={() => removeLink(index)} className="rounded-2xl border border-white/10 px-4 text-white/45 transition hover:border-red-400 hover:text-red-300" aria-label="Remover link"><Trash2 size={18} /></button>}</div>)}<button type="button" onClick={addLink} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#F5D44A]/50 px-4 text-sm font-semibold text-[#F5D44A] transition hover:bg-[#F5D44A]/10"><Plus size={17} />Adicionar outro link</button></div></div></div>;
    if (step === 5) return <div className="mx-auto max-w-2xl"><StepHeading eyebrow="05 / 05" title="Você possui um prazo específico?" subtitle="Se houver uma data importante, vamos considerar isso desde o planejamento da obra." /><div className="grid gap-4 sm:grid-cols-2"><OptionCard title="Sim, tenho uma data" subtitle="Quero marcar o dia em que preciso receber." selected={answers.hasDeadline === "Sim"} onClick={() => update("hasDeadline", "Sim")}><CheckCircle2 size={20} /></OptionCard><OptionCard title="Não tenho prazo" subtitle="Prefiro viver o processo com calma." selected={answers.hasDeadline === "Não"} onClick={() => { update("hasDeadline", "Não"); update("deadlineDate", ""); }}><Sparkles size={20} /></OptionCard></div>{answers.hasDeadline === "Sim" && <div className="mt-6 rounded-3xl border border-[#F5D44A]/40 bg-[#F5D44A]/[0.05] p-5"><Field label="Escolha a data desejada"><input type="date" value={answers.deadlineDate} onChange={(event) => update("deadlineDate", event.target.value)} className={inputClass} /></Field></div>}</div>;
    if (step === 7) return <div className="mx-auto max-w-2xl py-10 text-center sm:py-16"><div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-[#F5D44A] text-[#10151C]"><CheckCircle2 size={38} /></div><p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#F5D44A]">Briefing enviado</p><h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">Obrigada por confiar na Renarte.</h2><p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/60 sm:text-lg">Recebemos suas informações e vamos analisar cada detalhe com carinho.</p><div className="mx-auto mt-8 max-w-md rounded-3xl border border-[#F5D44A]/30 bg-[#F5D44A]/[0.08] p-5 text-sm leading-relaxed text-white/80 backdrop-blur-xl">O prazo para retorno com a proposta é de <strong className="text-[#F5D44A]">2 dias</strong>.</div><button type="button" onClick={() => go(0)} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 px-5 text-sm font-semibold text-white transition hover:border-[#F5D44A] hover:text-[#F5D44A]">Voltar ao início</button></div>;
    const rows = [["Nome", answers.name], ["Celular", answers.phone], ["Como conheceu", answers.source], ["Instagram", answers.instagram], ["E-mail", answers.email], ["Tamanho", answers.size], ["Cores desejadas", [...answers.desiredColors, ...answers.desiredCustomColors].join(", ")], ["Observações desejadas", answers.desiredNotes], ["Cores indesejadas", [...answers.unwantedColors, ...answers.unwantedCustomColors].join(", ")], ["Observações indesejadas", answers.unwantedNotes], ["Links", answers.links.filter(Boolean).join(", ")], ["Imagens", answers.referenceFiles.join(", ")], ["Prazo específico", answers.hasDeadline], ["Data desejada", answers.deadlineDate]];
    return <div><div className="mb-8 text-center"><div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#F5D44A] text-[#10151C]"><CheckCircle2 size={32} /></div><p className="mb-3 text-xs font-bold uppercase tracking-[0.25em] text-[#F5D44A]">Revisão final</p><h2 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">Resumo do Briefing</h2><p className="mx-auto mt-4 max-w-lg text-white/55">Revise suas informações antes de enviar para a Renarte.</p></div><div className="divide-y divide-white/10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035] backdrop-blur-xl">{rows.filter(([, value]) => value).map(([label, value]) => <div key={label} className="grid gap-1 px-5 py-4 sm:grid-cols-[190px_1fr] sm:gap-5"><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#F5D44A]">{label}</span><span className="break-words text-sm leading-relaxed text-white/80">{value}</span></div>)}</div><div className="mt-7 grid gap-3 sm:grid-cols-2"><button type="button" onClick={copySummary} className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-white/25 px-5 text-sm font-semibold text-white transition hover:border-[#F5D44A] hover:text-[#F5D44A]"><Clipboard size={18} />{copyStatus === "success" ? "Resumo copiado" : "Copiar resumo"}</button><button type="button" onClick={handleSubmit} className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#F5D44A] px-5 text-sm font-semibold text-[#10151C] transition hover:bg-white"><Send size={18} />Enviar briefing</button></div><button type="button" onClick={() => go(4)} className="mx-auto mt-6 flex items-center gap-2 text-sm font-semibold text-white/50 transition hover:text-[#F5D44A]"><ArrowLeft size={16} />Voltar e editar</button>{copyStatus === "error" && <p className="mt-4 text-center text-sm text-[#F5D44A]">Não foi possível copiar automaticamente. Verifique a permissão do navegador.</p>}</div>;
  };

  return <main className="min-h-screen bg-[#10151C] px-4 py-5 text-white sm:px-6 sm:py-8"><div className="mx-auto max-w-5xl"><header className="mb-8 flex items-center justify-between"><img src={LOGO_SRC} alt="Renarte" className="h-12 w-auto object-contain brightness-0 invert sm:h-16" /><span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Briefing de arte</span></header><section className="overflow-hidden rounded-[32px] border border-white/10 bg-[#151C25]/80 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-2xl"><div className="h-1 bg-white/10"><div className="h-full bg-[#F5D44A] transition-all duration-500 ease-out" style={{ width: `${progress}%` }} /></div><div className="px-5 py-8 sm:px-12 sm:py-12">{step > 0 && step < totalSteps - 1 && <div className="mb-9 flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-white/35"><span>Briefing guiado</span><span>{step} de 5</span></div>}<div key={step} className={direction === "forward" ? "animate-[fadeSlideIn_400ms_ease-out]" : "animate-[fadeSlideBack_400ms_ease-out]"}>{step === 0 ? <div className="mx-auto max-w-2xl py-8 text-center sm:py-12"><div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-[28px] bg-[#F5D44A] text-[#10151C]"><Sparkles size={35} /></div><p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-[#F5D44A]">Sua obra começa aqui</p><h1 className="text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-6xl">Conte sua ideia para a Renarte.</h1><p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-white/55 sm:text-lg">Um briefing rápido para transformar referências, cores e desejos em uma pintura feita para você.</p><button type="button" onClick={() => go(1)} className="mt-9 inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#F5D44A] px-8 text-base font-semibold text-[#10151C] transition hover:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F5D44A]/40">Começar <ArrowRight size={19} /></button></div> : renderStep()}</div>{step > 0 && step < 6 && <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-5"><button type="button" onClick={() => go(step - 1)} className="inline-flex min-h-12 items-center gap-2 rounded-full px-3 text-sm font-semibold text-white/50 transition hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F5D44A]/30"><ArrowLeft size={18} />Voltar</button><button type="button" disabled={!requiredComplete} onClick={() => requiredComplete && go(step + 1)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#F5D44A] px-6 text-sm font-semibold text-[#10151C] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F5D44A]/40">{step === 5 ? "Ver resumo" : "Continuar"}<ArrowRight size={18} /></button></div>}</div></section><p className="mt-5 text-center text-xs text-white/30">Renarte, pintura com intenção.</p></div><style>{`@keyframes fadeSlideIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } } @keyframes fadeSlideBack { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }`}</style></main>;
};

const StepHeading = ({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) => <div className="mb-8"><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#F5D44A]">{eyebrow}</p><h2 className="text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-4xl">{title}</h2><p className="mt-3 max-w-xl text-base leading-relaxed text-white/55">{subtitle}</p></div>;

export default App;

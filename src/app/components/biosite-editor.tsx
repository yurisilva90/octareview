"use client";

import { useState, type CSSProperties, type FormEvent, type PointerEvent, type ReactNode } from "react";
import {
  BriefcaseBusiness, CalendarDays, Camera, Check, Copy, ExternalLink, FileDown,
  Gift, Globe2, GripVertical, ImageIcon, Link2, MapPin, Play, Users,
  Mail, MessageCircle, Music2, Palette, Plus, Save, ShoppingBag, Star, Trash2, Upload, UserRound,
  UtensilsCrossed, Video,
} from "lucide-react";
import { withBasePath } from "@/lib/site";
import BrandIcon from "./brand-icon";

export type CaptureField = { key: string; label: string; required: boolean };
export type CaptureConfig = {
  title?: string;
  description?: string;
  button_text?: string;
  success_message?: string;
  consent_required?: boolean;
  consent_text?: string;
  fields?: CaptureField[];
};

export type SmartPage = {
  id: number;
  slug: string;
  status: "draft" | "published";
  page_type: "biosite" | "campaign" | "menu" | "event" | "custom";
  is_primary: boolean;
  name: string;
  short_description: string | null;
  presentation_text: string | null;
  primary_color: string;
  logo_url: string | null;
  cover_url: string | null;
  cover_type: "image" | "video" | "animation";
  background_mode: "solid" | "preset";
  background_value: string;
  button_color: string;
  highlight_color: string;
  form_button_color: string;
  button_shape: "square" | "soft" | "round";
  button_variant: "filled" | "outline";
  button_border_width: 1 | 2 | 3;
  button_effect: "none" | "shadow" | "lift" | "glow";
  form_background_color: string;
  form_border_color: string;
  form_border_width: 0 | 1 | 2 | 3;
  form_effect: "none" | "shadow" | "glass" | "glow";
  cover_shape: "straight" | "curve" | "wave";
  profile_border_enabled: boolean;
  profile_border_color: string;
  footer_text: string | null;
  capture_enabled: boolean;
  capture_config: CaptureConfig;
  draft_version: number;
  published_version: number | null;
  published_at: string | null;
};

export type PageLink = {
  id: number;
  link_type: string;
  title: string;
  subtitle: string | null;
  url: string;
  sort_order: number;
  active: boolean;
  highlighted: boolean;
  button_color: string | null;
};

export type PageDraft = Pick<SmartPage,
  "name" | "short_description" | "presentation_text" | "primary_color" | "logo_url" |
  "cover_url" | "cover_type" | "background_mode" | "background_value" | "button_color" |
  "highlight_color" | "form_button_color" | "button_shape" | "button_variant" |
  "button_border_width" | "button_effect" | "form_background_color" | "form_border_color" |
  "form_border_width" | "form_effect" | "cover_shape" | "profile_border_enabled" |
  "profile_border_color" | "footer_text" | "capture_enabled" | "capture_config"
>;

type EditorSection = "identity" | "cover" | "background" | "buttons" | "socials" | "form";
type UploadKind = "logo" | "cover";

type Props = {
  pages: SmartPage[];
  page?: SmartPage;
  draft?: PageDraft;
  links: PageLink[];
  pageLimit: number;
  busy: boolean;
  setDraft: (draft: PageDraft) => void;
  onSelectPage: (id: number) => void;
  onCreatePage: () => void;
  onDuplicatePage: () => void;
  onSave: () => void;
  onPublish: () => void;
  onUpload: (kind: UploadKind, file: File) => void;
  onAddLink: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateLink: (link: PageLink, patch: Partial<PageLink>) => void;
  onDeleteLink: (link: PageLink) => void;
  onReorderLinks: (orderedIds: number[]) => void;
  onSaveSocial: (type: string, url: string) => void;
};

const inputClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";
const socialTypes = ["instagram", "facebook", "tiktok", "youtube", "linkedin"];
const buttonTypes = ["whatsapp", "google_review", "menu", "map", "website", "booking", "payment", "instagram", "facebook", "tiktok", "youtube", "linkedin", "download", "benefit", "custom"];

export const backgroundPresets: Array<{ id: string; name: string; style: CSSProperties }> = [
  { id: "navy-gradient", name: "Azul executivo", style: { background: "linear-gradient(145deg,#061b35,#173f67)" } },
  { id: "charcoal-lines", name: "Grafite geométrico", style: { backgroundColor: "#252a31", backgroundImage: "linear-gradient(135deg,rgba(255,255,255,.08) 25%,transparent 25%),linear-gradient(315deg,rgba(255,255,255,.05) 25%,transparent 25%)", backgroundSize: "24px 24px" } },
  { id: "teal-mesh", name: "Malha petróleo", style: { background: "radial-gradient(circle at 20% 20%,#3f8e8c 0,transparent 34%),radial-gradient(circle at 80% 70%,#0d4854 0,transparent 42%),#082d3b" } },
  { id: "ivory-paper", name: "Papel marfim", style: { backgroundColor: "#f3ede2", backgroundImage: "repeating-linear-gradient(0deg,rgba(91,71,45,.035) 0 1px,transparent 1px 4px)" } },
  { id: "slate-waves", name: "Ondas ardósia", style: { background: "radial-gradient(ellipse at 20% 120%,#8aa0b5 0 36%,transparent 37%),radial-gradient(ellipse at 85% 115%,#526b84 0 42%,transparent 43%),#dce4eb" } },
  { id: "black-grain", name: "Preto texturizado", style: { backgroundColor: "#151719", backgroundImage: "radial-gradient(rgba(255,255,255,.1) .7px,transparent .7px)", backgroundSize: "5px 5px" } },
  { id: "burgundy-gradient", name: "Vinho premium", style: { background: "linear-gradient(145deg,#441421,#872d45)" } },
  { id: "executive-grid", name: "Grade executiva", style: { backgroundColor: "#69737e", backgroundImage: "linear-gradient(rgba(255,255,255,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.09) 1px,transparent 1px)", backgroundSize: "18px 18px" } },
  { id: "green-organic", name: "Verde institucional", style: { background: "radial-gradient(circle at 10% 20%,#466b5c 0 25%,transparent 26%),radial-gradient(circle at 85% 80%,#1f4438 0 32%,transparent 33%),#16352d" } },
  { id: "architectural-white", name: "Branco arquitetônico", style: { background: "linear-gradient(135deg,#ffffff 0 46%,#e7ebee 47% 53%,#f7f8f9 54%)" } },
];

export function backgroundStyle(mode: PageDraft["background_mode"], value: string): CSSProperties {
  if (mode === "solid") return { backgroundColor: /^#[0-9a-f]{6}$/i.test(value) ? value : "#f6f8fa" };
  return backgroundPresets.find((preset) => preset.id === value)?.style ?? backgroundPresets[0].style;
}

export function pageToDraft(page: SmartPage): PageDraft {
  return {
    name: page.name,
    short_description: page.short_description,
    presentation_text: page.presentation_text,
    primary_color: page.primary_color,
    logo_url: page.logo_url,
    cover_url: page.cover_url,
    cover_type: page.cover_type,
    background_mode: page.background_mode,
    background_value: page.background_value,
    button_color: page.button_color,
    highlight_color: page.highlight_color,
    form_button_color: page.form_button_color,
    button_shape: page.button_shape,
    button_variant: page.button_variant,
    button_border_width: page.button_border_width,
    button_effect: page.button_effect,
    form_background_color: page.form_background_color,
    form_border_color: page.form_border_color,
    form_border_width: page.form_border_width,
    form_effect: page.form_effect,
    cover_shape: page.cover_shape,
    profile_border_enabled: page.profile_border_enabled,
    profile_border_color: page.profile_border_color,
    footer_text: page.footer_text,
    capture_enabled: page.capture_enabled,
    capture_config: page.capture_config ?? {},
  };
}

function IconFor({ type, className = "size-4" }: { type: string; className?: string }) {
  if (socialTypes.includes(type)) return <BrandIcon type={type} className={className} />;
  const icons: Record<string, typeof Link2> = {
    whatsapp: MessageCircle, google_review: Star, menu: UtensilsCrossed, map: MapPin,
    website: Globe2, booking: CalendarDays, reservation: CalendarDays, payment: ShoppingBag,
    pix: ShoppingBag, instagram: Camera, facebook: Users, tiktok: Music2, youtube: Play,
    linkedin: BriefcaseBusiness, download: FileDown, benefit: Gift, custom: Link2,
  };
  const Icon = icons[type] ?? Link2;
  return <Icon className={className} />;
}

function buttonEffectClass(effect: PageDraft["button_effect"]) {
  return effect === "shadow" ? "shadow-[0_7px_16px_rgba(15,23,42,.18)]" : effect === "lift" ? "-translate-y-0.5 shadow-[0_10px_20px_rgba(15,23,42,.22)]" : effect === "glow" ? "shadow-[0_0_18px_currentColor]" : "";
}

function formEffectClass(effect: PageDraft["form_effect"]) {
  return effect === "shadow" ? "shadow-[0_10px_28px_rgba(15,23,42,.14)]" : effect === "glass" ? "backdrop-blur-md" : effect === "glow" ? "shadow-[0_0_24px_rgba(13,148,136,.28)]" : "";
}

function coverShapeStyle(shape: PageDraft["cover_shape"]): CSSProperties {
  if (shape === "curve") return { borderBottomLeftRadius: "50% 12%", borderBottomRightRadius: "50% 12%" };
  if (shape === "wave") return { clipPath: "polygon(0 0,100% 0,100% 86%,82% 93%,64% 88%,45% 98%,24% 90%,0 96%)" };
  return {};
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="block text-xs font-semibold text-slate-700">{label}<div className="mt-2">{children}</div>{hint && <span className="mt-1.5 block text-[10px] leading-4 text-slate-400">{hint}</span>}</label>;
}

function SectionCard({ title, detail, children }: { title: string; detail?: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,.04)]"><h2 className="font-bold text-slate-900">{title}</h2>{detail && <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>}<div className="mt-5">{children}</div></section>;
}

export default function BioSiteEditor(props: Props) {
  const { pages, page, draft, links, pageLimit, busy } = props;
  const [section, setSection] = useState<EditorSection>("identity");
  const [draggingLinkId, setDraggingLinkId] = useState<number>();
  const publicPath = page ? withBasePath(`/pagina/?p=${page.slug}`) : "";
  const nonSocialLinks = links.filter((link) => !socialTypes.includes(link.link_type));
  const patch = <K extends keyof PageDraft>(key: K, value: PageDraft[K]) => draft && props.setDraft({ ...draft, [key]: value });
  const captureFields = draft?.capture_config.fields?.length ? draft.capture_config.fields : [
    { key: "full_name", label: "Nome", required: true },
    { key: "whatsapp", label: "WhatsApp", required: true },
  ];
  const patchCapture = (values: Partial<CaptureConfig>) => draft && patch("capture_config", { ...draft.capture_config, ...values });
  const dropLink = (targetId: number) => {
    if (!draggingLinkId || draggingLinkId === targetId) return;
    const orderedIds = nonSocialLinks.map((link) => link.id);
    const from = orderedIds.indexOf(draggingLinkId);
    const to = orderedIds.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const [moved] = orderedIds.splice(from, 1);
    orderedIds.splice(to, 0, moved);
    setDraggingLinkId(undefined);
    props.onReorderLinks(orderedIds);
  };
  const finishPointerDrag = (event: PointerEvent<HTMLButtonElement>) => {
    const target = event.currentTarget.ownerDocument.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-link-id]");
    const targetId = Number(target?.dataset.linkId);
    if (targetId) dropLink(targetId);
    else setDraggingLinkId(undefined);
  };

  if (!page || !draft) return <section className="rounded-2xl bg-white p-8 text-center shadow-sm"><Link2 className="mx-auto size-8 text-teal-700" /><h2 className="mt-4 text-xl font-bold">Crie seu primeiro BioSite</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">Capa, logo, botões, redes sociais e formulário opcional em uma página simples para divulgar o negócio.</p><button disabled={busy} onClick={props.onCreatePage} className="mt-6 rounded-xl bg-teal-700 px-5 py-3 text-sm font-bold text-white">Criar BioSite</button></section>;

  return <div className="space-y-5">
    <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:flex-row xl:items-center">
      <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Minhas páginas</p><select value={page.id} onChange={(event) => props.onSelectPage(Number(event.target.value))} className="mt-1 h-10 max-w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none sm:min-w-[320px]">{pages.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.status === "published" ? "Publicada" : "Rascunho"}</option>)}</select><p className="mt-1 text-[10px] text-slate-400">Seu plano permite até {pageLimit} {pageLimit === 1 ? "página" : "páginas"}. Cada página tem link e configurações próprios.</p></div>
      <div className="flex flex-wrap gap-2"><button disabled={busy || pages.length >= pageLimit} onClick={props.onCreatePage} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold disabled:opacity-40"><Plus className="size-4" /> Nova página</button><button disabled={busy || pages.length >= pageLimit} onClick={props.onDuplicatePage} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold disabled:opacity-40"><Copy className="size-4" /> Duplicar</button><button disabled={busy} onClick={props.onSave} className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-bold"><Save className="size-4" /> Salvar</button><button disabled={busy} onClick={props.onPublish} className="flex h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 text-xs font-bold text-white"><Check className="size-4" /> Publicar</button></div>
    </section>

    <div className="grid gap-5 xl:grid-cols-[190px_minmax(0,1fr)_360px]">
      <nav className="h-fit rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">{([
        ["identity", "Identidade", ImageIcon], ["cover", "Capa", Video], ["background", "Fundo", Palette],
        ["buttons", "Botões", Link2], ["socials", "Redes sociais", Camera], ["form", "Formulário", FileDown],
      ] as Array<[EditorSection, string, typeof Link2]>).map(([id, label, Icon]) => <button key={id} onClick={() => setSection(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold ${section === id ? "bg-teal-50 text-teal-800" : "text-slate-500 hover:bg-slate-50"}`}><Icon className="size-4" />{label}</button>)}</nav>

      <div className="min-w-0 space-y-5">
        {section === "identity" && <SectionCard title="Identidade" detail="Defina as informações principais desta página."><div className="grid gap-4 sm:grid-cols-[150px_1fr]"><div><div className="grid aspect-square place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 bg-contain bg-center bg-no-repeat" style={draft.logo_url ? { backgroundImage: `url(${draft.logo_url})` } : undefined}>{!draft.logo_url && <ImageIcon className="size-7 text-slate-400" />}</div><label className="mt-2 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 text-xs font-bold"><Upload className="size-4" /> Trocar logo<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => event.target.files?.[0] && props.onUpload("logo", event.target.files[0])} /></label><p className="mt-2 text-[10px] leading-4 text-slate-400">512 × 512 px · JPG, PNG ou WebP · até 2 MB</p></div><div className="space-y-4"><Field label="Nome da página"><input value={draft.name} maxLength={120} onChange={(event) => patch("name", event.target.value)} className={inputClass} /></Field><Field label="Subtítulo"><input value={draft.short_description ?? ""} maxLength={240} onChange={(event) => patch("short_description", event.target.value)} className={inputClass} /></Field><Field label="Rodapé"><input value={draft.footer_text ?? ""} maxLength={240} onChange={(event) => patch("footer_text", event.target.value)} className={inputClass} /></Field></div></div></SectionCard>}

        {section === "cover" && <SectionCard title="Capa" detail="Use foto, vídeo ou animação. A prévia é atualizada assim que o arquivo termina de enviar."><div className="grid grid-cols-3 gap-2">{(["image", "video", "animation"] as const).map((type) => <button key={type} onClick={() => patch("cover_type", type)} className={`h-10 rounded-xl border text-xs font-bold ${draft.cover_type === type ? "border-teal-600 bg-teal-600 text-white" : "border-slate-200"}`}>{type === "image" ? "Imagem" : type === "video" ? "Vídeo" : "Animação"}</button>)}</div><label className="mt-5 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center"><Upload className="size-6 text-teal-700" /><strong className="mt-3 text-sm">Enviar arquivo de capa</strong><span className="mt-2 max-w-md text-xs leading-5 text-slate-500">{draft.cover_type === "video" ? "Vídeo: 1080 × 608 px · MP4 ou WebM · até 20 MB" : draft.cover_type === "animation" ? "Animação: 1600 × 900 px · GIF ou WebP · até 10 MB" : "Imagem: 1600 × 900 px · JPG, PNG ou WebP · até 5 MB"}</span><input type="file" accept={draft.cover_type === "video" ? "video/mp4,video/webm" : draft.cover_type === "animation" ? "image/gif,image/webp" : "image/jpeg,image/png,image/webp"} className="hidden" onChange={(event) => event.target.files?.[0] && props.onUpload("cover", event.target.files[0])} /></label><div className="mt-5 grid gap-4 sm:grid-cols-2"><Choice label="Recorte inferior da capa" value={draft.cover_shape} options={[["straight", "Reto"], ["curve", "Curvo"], ["wave", "Onda"]]} onChange={(value) => patch("cover_shape", value as PageDraft["cover_shape"])} /><div><label className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-700">Contorno na foto de perfil<input type="checkbox" checked={draft.profile_border_enabled} onChange={(event) => patch("profile_border_enabled", event.target.checked)} className="size-4 accent-teal-700" /></label>{draft.profile_border_enabled && <div className="mt-3"><ColorControl label="Cor do contorno" value={draft.profile_border_color} onChange={(value) => patch("profile_border_color", value)} /></div>}</div></div></SectionCard>}

        {section === "background" && <SectionCard title="Fundo" detail="Escolha uma cor da marca ou um fundo profissional com efeito discreto."><div className="flex gap-2"><button onClick={() => patch("background_mode", "solid")} className={`rounded-xl px-4 py-2 text-xs font-bold ${draft.background_mode === "solid" ? "bg-teal-600 text-white" : "border border-slate-200"}`}>Cor sólida</button><button onClick={() => patch("background_mode", "preset")} className={`rounded-xl px-4 py-2 text-xs font-bold ${draft.background_mode === "preset" ? "bg-teal-600 text-white" : "border border-slate-200"}`}>Fundos prontos</button></div>{draft.background_mode === "solid" ? <div className="mt-5 grid gap-3 sm:grid-cols-[70px_1fr]"><input type="color" value={/^#[0-9a-f]{6}$/i.test(draft.background_value) ? draft.background_value : "#f6f8fa"} onChange={(event) => patch("background_value", event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white p-1" /><Field label="Código da cor"><input value={draft.background_value} maxLength={7} onChange={(event) => patch("background_value", event.target.value)} className={inputClass} placeholder="#F6F8FA" /></Field></div> : <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">{backgroundPresets.map((preset) => <button key={preset.id} title={preset.name} onClick={() => patch("background_value", preset.id)} className={`group overflow-hidden rounded-xl border-2 text-left ${draft.background_value === preset.id ? "border-teal-500" : "border-transparent"}`}><span className="block h-16" style={preset.style} /><span className="block truncate bg-white px-2 py-1.5 text-[9px] font-semibold text-slate-600">{preset.name}</span></button>)}</div>}</SectionCard>}

        {section === "buttons" && <>
          <SectionCard title="Estilo dos botões" detail="Os ícones são definidos automaticamente conforme o tipo do botão.">
            <div className="grid gap-4 sm:grid-cols-2"><ColorControl label="Cor dos botões" value={draft.button_color} onChange={(value) => patch("button_color", value)} /><ColorControl label="Cor de destaque" value={draft.highlight_color} onChange={(value) => patch("highlight_color", value)} /></div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Choice label="Formato" value={draft.button_shape} options={[["square", "Reto"], ["soft", "Leve"], ["round", "Redondo"]]} onChange={(value) => patch("button_shape", value as PageDraft["button_shape"])} /><Choice label="Aparência" value={draft.button_variant} options={[["filled", "Preenchido"], ["outline", "Contorno"]]} onChange={(value) => patch("button_variant", value as PageDraft["button_variant"])} /><Choice label="Espessura" value={String(draft.button_border_width)} options={[["1", "1 px"], ["2", "2 px"], ["3", "3 px"]]} onChange={(value) => patch("button_border_width", Number(value) as 1 | 2 | 3)} /><Choice label="Efeito" value={draft.button_effect} options={[["none", "Sem efeito"], ["shadow", "Sombra"], ["lift", "Elevado"], ["glow", "Brilho"]]} onChange={(value) => patch("button_effect", value as PageDraft["button_effect"])} /></div>
          </SectionCard>
          <SectionCard title="Botões" detail="Para mudar a ordem, arraste o símbolo no canto esquerdo e solte na posição desejada.">
            <form onSubmit={props.onAddLink} className="grid gap-2 sm:grid-cols-[150px_1fr_1.4fr_auto]"><select name="type" className={inputClass}>{buttonTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select><input required name="title" placeholder="Texto do botão" className={inputClass} /><input required name="url" type="url" placeholder="https://" className={inputClass} /><button disabled={busy} className="grid size-11 place-items-center rounded-xl bg-slate-950 text-white"><Plus className="size-4" /></button></form>
            <div className="mt-4 space-y-2">{nonSocialLinks.map((link) => <div key={link.id} data-link-id={link.id} onDragOver={(event) => event.preventDefault()} onDrop={() => dropLink(link.id)} className={`flex items-center gap-2 rounded-xl border p-2 transition ${draggingLinkId === link.id ? "opacity-40" : ""} ${link.highlighted ? "border-teal-200 bg-teal-50" : "border-slate-100"}`}><button type="button" draggable onDragStart={() => setDraggingLinkId(link.id)} onDragEnd={() => setDraggingLinkId(undefined)} onPointerDown={(event) => { setDraggingLinkId(link.id); event.currentTarget.setPointerCapture(event.pointerId); }} onPointerUp={finishPointerDrag} title="Arraste para ordenar" className="cursor-grab touch-none rounded-lg p-1 text-slate-400 active:cursor-grabbing"><GripVertical className="size-5" /></button><span className="grid size-8 place-items-center rounded-lg bg-slate-100 text-slate-600"><IconFor type={link.link_type} /></span><strong className="min-w-0 flex-1 truncate text-xs">{link.title}</strong><button title="Visibilidade" onClick={() => props.onUpdateLink(link, { active: !link.active })} className={`h-5 w-9 rounded-full p-0.5 ${link.active ? "bg-teal-600" : "bg-slate-300"}`}><span className={`block size-4 rounded-full bg-white transition ${link.active ? "translate-x-4" : ""}`} /></button><button title="Destaque" onClick={() => props.onUpdateLink(link, { highlighted: !link.highlighted })} className={link.highlighted ? "text-teal-600" : "text-slate-300"}><Star className="size-4" fill={link.highlighted ? "currentColor" : "none"} /></button><button onClick={() => props.onDeleteLink(link)} className="text-slate-400 hover:text-rose-600"><Trash2 className="size-4" /></button></div>)}</div>
          </SectionCard>
        </>}

        {section === "socials" && <SectionCard title="Redes sociais" detail="Informe apenas os endereços. Os ícones aparecem automaticamente."><div className="space-y-3">{socialTypes.map((type) => <SocialRow key={`${page.id}-${type}`} type={type} link={links.find((item) => item.link_type === type)} busy={busy} onSave={props.onSaveSocial} onToggle={(link) => props.onUpdateLink(link, { active: !link.active })} />)}</div></SectionCard>}

        {section === "form" && <SectionCard title="Formulário de captação" detail="Os contatos recebidos ficam disponíveis no painel OctaReview."><label className="flex items-center justify-between rounded-xl bg-slate-50 p-4 text-sm font-bold">Ativar formulário<input type="checkbox" checked={draft.capture_enabled} onChange={(event) => patch("capture_enabled", event.target.checked)} className="size-5 accent-teal-700" /></label><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="Título do formulário"><input value={draft.capture_config.title ?? ""} onChange={(event) => patchCapture({ title: event.target.value })} className={inputClass} /></Field><Field label="Texto do botão"><input value={draft.capture_config.button_text ?? ""} onChange={(event) => patchCapture({ button_text: event.target.value })} className={inputClass} /></Field></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><ColorControl label="Fundo do formulário" value={draft.form_background_color} onChange={(value) => patch("form_background_color", value)} /><ColorControl label="Contorno do formulário" value={draft.form_border_color} onChange={(value) => patch("form_border_color", value)} /><Choice label="Espessura do contorno" value={String(draft.form_border_width)} options={[["0", "Sem contorno"], ["1", "1 px"], ["2", "2 px"], ["3", "3 px"]]} onChange={(value) => patch("form_border_width", Number(value) as 0 | 1 | 2 | 3)} /><Choice label="Efeito" value={draft.form_effect} options={[["none", "Sem efeito"], ["shadow", "Sombra"], ["glass", "Vidro"], ["glow", "Brilho"]]} onChange={(value) => patch("form_effect", value as PageDraft["form_effect"])} /></div><div className="mt-5"><p className="text-xs font-bold text-slate-700">Dados solicitados</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{[
          ["full_name", "Nome"], ["whatsapp", "WhatsApp"], ["email", "E-mail"], ["birth_date", "Data de nascimento"],
        ].map(([key, label]) => { const current = captureFields.find((field) => field.key === key); return <div key={key} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><input type="checkbox" checked={Boolean(current)} onChange={(event) => patchCapture({ fields: event.target.checked ? [...captureFields, { key, label, required: key === "full_name" || key === "whatsapp" }] : captureFields.filter((field) => field.key !== key) })} className="size-4 accent-teal-700" /><span className="flex-1 text-xs font-semibold">{label}</span>{current && <label className="flex items-center gap-1 text-[10px] text-slate-500"><input type="checkbox" checked={current.required} onChange={(event) => patchCapture({ fields: captureFields.map((field) => field.key === key ? { ...field, required: event.target.checked } : field) })} />Obrigatório</label>}</div>; })}</div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><ColorControl label="Cor do botão" value={draft.form_button_color} onChange={(value) => patch("form_button_color", value)} /><Field label="Texto de consentimento"><textarea value={draft.capture_config.consent_text ?? ""} onChange={(event) => patchCapture({ consent_text: event.target.value, consent_required: true })} className="min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-teal-500" /></Field></div></SectionCard>}
      </div>

      <PhonePreview page={page} draft={draft} links={links} publicPath={publicPath} />
    </div>
  </div>;
}

function ColorControl({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <Field label={label}><div className="grid grid-cols-[52px_1fr] gap-2"><input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white p-1" /><input value={value} maxLength={7} onChange={(event) => onChange(event.target.value)} className={inputClass} /></div></Field>;
}

function Choice({ label, value, options, onChange }: { label: string; value: string; options: string[][]; onChange: (value: string) => void }) {
  return <div><p className="text-xs font-semibold text-slate-700">{label}</p><div className="mt-2 flex flex-wrap gap-1">{options.map(([id, text]) => <button key={id} onClick={() => onChange(id)} className={`rounded-lg px-2.5 py-2 text-[10px] font-bold ${value === id ? "bg-teal-600 text-white" : "border border-slate-200"}`}>{text}</button>)}</div></div>;
}

function SocialRow({ type, link, busy, onSave, onToggle }: { type: string; link?: PageLink; busy: boolean; onSave: (type: string, url: string) => void; onToggle: (link: PageLink) => void }) {
  const [value, setValue] = useState(link?.url ?? "");
  return <form onSubmit={(event) => { event.preventDefault(); onSave(type, value); }} className="flex flex-col gap-2 rounded-xl border border-slate-100 p-3 sm:flex-row sm:items-center"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-700"><IconFor type={type} /></span><span className="w-20 text-xs font-bold capitalize">{type}</span><input value={value} onChange={(event) => setValue(event.target.value)} type="url" placeholder="https://" className={`${inputClass} flex-1`} />{link && <button type="button" onClick={() => onToggle(link)} className={`h-6 w-10 rounded-full p-1 ${link.active ? "bg-teal-600" : "bg-slate-300"}`}><span className={`block size-4 rounded-full bg-white transition ${link.active ? "translate-x-4" : ""}`} /></button>}<button disabled={busy || !value.trim()} className="h-10 rounded-xl border border-slate-200 px-3 text-xs font-bold">Salvar</button></form>;
}

function FormFieldIcon({ fieldKey }: { fieldKey: string }) {
  if (fieldKey === "whatsapp") return <MessageCircle className="size-3.5 text-emerald-600" />;
  if (fieldKey === "email") return <Mail className="size-3.5 text-slate-500" />;
  if (fieldKey === "birth_date") return <CalendarDays className="size-3.5 text-slate-500" />;
  return <UserRound className="size-3.5 text-slate-500" />;
}

function PhonePreview({ page, draft, links, publicPath }: { page: SmartPage; draft: PageDraft; links: PageLink[]; publicPath: string }) {
  const radius = draft.button_shape === "square" ? "rounded-none" : draft.button_shape === "round" ? "rounded-full" : "rounded-xl";
  const formFields = draft.capture_config.fields?.length ? draft.capture_config.fields : [{ key: "full_name", label: "Nome", required: true }, { key: "whatsapp", label: "WhatsApp", required: true }];
  const copy = async () => { if (typeof window !== "undefined") await navigator.clipboard.writeText(`${window.location.origin}${publicPath}`); };
  return <aside className="h-fit xl:sticky xl:top-24"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Pré-visualização</p><p className="mt-1 text-[10px] text-slate-400">/{page.slug}</p></div><div className="flex gap-1"><button onClick={() => void copy()} className="rounded-lg border border-slate-200 p-2 text-slate-500" title="Copiar link"><Copy className="size-4" /></button>{page.status === "published" && <a href={publicPath} target="_blank" rel="noreferrer" className="rounded-lg border border-slate-200 p-2 text-slate-500" title="Abrir página"><ExternalLink className="size-4" /></a>}</div></div><div className="mx-auto max-w-[350px] overflow-hidden rounded-[36px] border-[8px] border-slate-950 shadow-2xl" style={backgroundStyle(draft.background_mode, draft.background_value)}><div className="relative h-40 overflow-hidden" style={{ ...(!draft.cover_url ? backgroundStyle(draft.background_mode, draft.background_value) : {}), ...coverShapeStyle(draft.cover_shape) }}>{draft.cover_url && draft.cover_type === "video" ? <video src={draft.cover_url} className="size-full object-cover" muted autoPlay loop playsInline /> : draft.cover_url ? <div className="size-full bg-cover bg-center" style={{ backgroundImage: `url(${draft.cover_url})` }} /> : null}</div><div className="px-5 pb-6"><div className="flex flex-col items-center text-center"><div className="-mt-10 size-20 rounded-full bg-slate-900 bg-contain bg-center bg-no-repeat shadow-md" style={{ ...(draft.logo_url ? { backgroundImage: `url(${draft.logo_url})` } : {}), borderColor: draft.profile_border_color, borderWidth: draft.profile_border_enabled ? 4 : 0 }}>{!draft.logo_url && <span className="grid size-full place-items-center text-lg font-bold text-white">{draft.name.slice(0, 2).toUpperCase()}</span>}</div><h3 className="mt-3 text-xl font-bold text-slate-950">{draft.name}</h3><p className="mt-1 text-xs text-slate-600">{draft.short_description || "Subtítulo da página"}</p></div><div className="mt-5 space-y-2">{links.filter((link) => link.active && !socialTypes.includes(link.link_type)).map((link) => { const color = link.button_color || (link.highlighted ? draft.highlight_color : draft.button_color); const filled = link.highlighted || draft.button_variant === "filled"; return <div key={link.id} className={`flex min-h-11 items-center justify-center gap-2 px-4 text-center text-xs font-bold transition ${radius} ${buttonEffectClass(draft.button_effect)}`} style={filled ? { backgroundColor: color, color: "white" } : { borderColor: color, borderWidth: draft.button_border_width, color }}><IconFor type={link.link_type} />{link.title}</div>; })}</div><div className="mt-4 flex justify-center gap-3">{links.filter((link) => link.active && socialTypes.includes(link.link_type)).map((link) => <IconFor key={link.id} type={link.link_type} className="size-5" />)}</div>{draft.capture_enabled && <div className={`mt-5 rounded-2xl p-4 ${formEffectClass(draft.form_effect)}`} style={{ backgroundColor: draft.form_background_color, borderColor: draft.form_border_color, borderWidth: draft.form_border_width }}><strong className="text-sm">{draft.capture_config.title || "Quero receber novidades"}</strong><div className="mt-3 space-y-2">{formFields.map((field) => <div key={field.key} className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[10px] text-slate-400"><FormFieldIcon fieldKey={field.key} />{field.label}{field.required ? " *" : ""}</div>)}</div><div className="mt-3 rounded-lg py-2.5 text-center text-[10px] font-bold text-white" style={{ backgroundColor: draft.form_button_color }}>{draft.capture_config.button_text || "Quero me cadastrar"}</div></div>}<p className="mt-5 text-center text-[9px] text-slate-500">{draft.footer_text || "Powered by OctaReview"}</p></div></div></aside>;
}

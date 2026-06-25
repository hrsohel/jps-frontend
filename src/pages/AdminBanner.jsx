import React, { useEffect, useRef, useState } from "react";
import { Upload, Eye, EyeOff, Save } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { apiGet, apiUpload } from "../lib/api";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const DEFAULT = {
  title: "Everything Your Business Needs to Grow",
  subtitle: "Professional solutions for websites, marketing, branding, and IT — all in one place.",
  imageUrl: "",
  cta1Text: "Request Service",
  cta1Page: "Request Service",
  cta2Text: "Explore Services",
  cta2Page: "Services",
  isActive: true,
};

export default function AdminBanner() {
  const [form, setForm] = useState(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    apiGet("/site-banner")
      .then((data) => {
        if (data) {
          setForm({
            title: data.title || DEFAULT.title,
            subtitle: data.subtitle || DEFAULT.subtitle,
            imageUrl: data.imageUrl || "",
            cta1Text: data.cta1Text || DEFAULT.cta1Text,
            cta1Page: data.cta1Page || DEFAULT.cta1Page,
            cta2Text: data.cta2Text || DEFAULT.cta2Text,
            cta2Page: data.cta2Page || DEFAULT.cta2Page,
            isActive: data.isActive !== false,
          });
        }
      })
      .catch(() => {});
  }, []);

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })); }

  async function uploadBg(file) {
    try {
      setImgUploading(true);
      const fd = new FormData();
      fd.append("image", file);
      const result = await apiUpload("/upload/image", fd);
      set("imageUrl", result.url);
    } catch (e) {
      alert(e.message || "Image upload failed");
    } finally {
      setImgUploading(false);
    }
  }

  async function saveBanner() {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/site-banner`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert(e.message || "Unable to save banner");
    } finally {
      setSaving(false);
    }
  }

  // Preview
  const bannerStyle = {
    background: form.imageUrl
      ? `linear-gradient(135deg, rgba(6,23,74,0.82) 0%, rgba(7,73,179,0.70) 55%, rgba(34,169,224,0.60) 100%), url(${form.imageUrl}) center/cover no-repeat`
      : "linear-gradient(135deg, #06174a 0%, #0749B3 55%, #22A9E0 100%)",
    borderRadius: 14, padding: "28px 32px",
    display: "flex", alignItems: "center", gap: 24, marginBottom: 24, position: "relative", overflow: "hidden",
  };

  return (
    <div>
      <PageHeader
        title="Banner Editor"
        description="Edit the hero banner shown to all users on the Dashboard."
      />

      {/* Live preview */}
      <div style={bannerStyle}>
        <div style={{ flex: 1, position: "relative", zIndex: 2 }}>
          <img src="/assets/JPS%20Core-2.png" alt="JPS" style={{ height: 36, filter: "brightness(0) invert(1)", opacity: .9, marginBottom: 12, display: "block" }} />
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 8, lineHeight: 1.25 }}>{form.title || "Banner Title"}</h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.75)", marginBottom: 16, maxWidth: 360, lineHeight: 1.6 }}>{form.subtitle || "Subtitle text here..."}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {form.cta1Text && <span style={{ background: "#0E9F6E", color: "#fff", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>{form.cta1Text}</span>}
            {form.cta2Text && <span style={{ background: "rgba(255,255,255,.15)", color: "#fff", padding: "8px 18px", borderRadius: 8, fontSize: 13, fontWeight: 700, border: "1px solid rgba(255,255,255,.3)" }}>{form.cta2Text}</span>}
          </div>
        </div>
        <div style={{ position: "absolute", top: 8, right: 12, zIndex: 3 }}>
          {form.isActive
            ? <span style={{ background: "#0E9F6E", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>LIVE</span>
            : <span style={{ background: "#64748b", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>HIDDEN</span>}
        </div>
      </div>

      {/* Editor form */}
      <section className="panel">
        <h2 style={{ marginTop: 0 }}>Edit Banner</h2>

        <div className="invoice-grid">
          <label style={{ gridColumn: "1/-1" }}>
            Banner Title
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Everything Your Business Needs to Grow" />
          </label>

          <label style={{ gridColumn: "1/-1" }}>
            Subtitle / Description
            <textarea rows="2" value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} style={{ width: "100%", marginTop: 4 }} placeholder="Professional solutions for..." />
          </label>

          <label style={{ gridColumn: "1/-1" }}>
            Background Image
            <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
              <input
                value={form.imageUrl}
                onChange={(e) => set("imageUrl", e.target.value)}
                placeholder="https://... or upload below"
                style={{ flex: 1 }}
              />
              <label style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "8px 16px", background: imgUploading ? "#94a3b8" : "var(--deep)",
                color: "#fff", borderRadius: 8, cursor: imgUploading ? "not-allowed" : "pointer",
                fontSize: 13, fontWeight: 700, whiteSpace: "nowrap",
              }}>
                <Upload size={14} />
                {imgUploading ? "Uploading…" : "Upload Image"}
                <input
                  ref={imgRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  disabled={imgUploading}
                  onChange={(e) => {
                    const f = e.target.files[0];
                    if (f) uploadBg(f);
                    e.target.value = "";
                  }}
                />
              </label>
              {form.imageUrl && (
                <button
                  style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 13, color: "#64748b" }}
                  onClick={() => set("imageUrl", "")}
                >
                  Clear
                </button>
              )}
            </div>
            {form.imageUrl && (
              <div style={{ marginTop: 8, borderRadius: 8, overflow: "hidden", maxHeight: 80 }}>
                <img src={form.imageUrl} alt="preview" style={{ width: "100%", objectFit: "cover", maxHeight: 80 }} />
              </div>
            )}
          </label>

          <label>
            Button 1 — Label
            <input value={form.cta1Text} onChange={(e) => set("cta1Text", e.target.value)} placeholder="Request Service" />
          </label>
          <label>
            Button 1 — Links to Page
            <input value={form.cta1Page} onChange={(e) => set("cta1Page", e.target.value)} placeholder="Request Service" />
          </label>

          <label>
            Button 2 — Label
            <input value={form.cta2Text} onChange={(e) => set("cta2Text", e.target.value)} placeholder="Explore Services" />
          </label>
          <label>
            Button 2 — Links to Page
            <input value={form.cta2Page} onChange={(e) => set("cta2Page", e.target.value)} placeholder="Services" />
          </label>
        </div>

        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <label className="check-label" style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
            />
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {form.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
              {form.isActive ? "Banner is visible to users" : "Banner is hidden"}
            </span>
          </label>

          <button className="green-btn" onClick={saveBanner} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Save size={15} />
            {saving ? "Saving…" : saved ? "Saved!" : "Save Banner"}
          </button>
        </div>

        {saved && (
          <p style={{ marginTop: 10, color: "#0E9F6E", fontSize: 13, fontWeight: 600 }}>
            Banner updated — users will see the new version immediately.
          </p>
        )}
      </section>

      <section className="panel" style={{ marginTop: 0 }}>
        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Page Name Reference</h3>
        <p style={{ color: "#64748b", fontSize: 13, margin: "0 0 8px" }}>Use these exact names in the "Links to Page" fields:</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["Dashboard", "Request Service", "Services", "Projects", "Invoices", "Files & Documents", "Appointments", "Messages", "Settings", "Support Tickets"].map((p) => (
            <code key={p} style={{ background: "#f1f5f9", padding: "3px 8px", borderRadius: 6, fontSize: 12 }}>{p}</code>
          ))}
        </div>
      </section>
    </div>
  );
}

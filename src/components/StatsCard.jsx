import { ArrowUpRight } from "lucide-react";

export default function StatsCard({ title, value, description, icon, color, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      className={`stat-card${onClick ? " stat-card-link" : ""}`}
      style={{ "--sc": color || "var(--deep)" }}
      onClick={onClick}
      type={onClick ? "button" : undefined}
    >
      <div className="stat-card-top">
        {icon && (
          <div className="stat-card-icon" style={{ background: color || "var(--deep)" }}>
            {icon}
          </div>
        )}
        {onClick && <ArrowUpRight size={16} className="sc-arrow" />}
      </div>
      <div className="stat-card-value">{value ?? "—"}</div>
      <div className="stat-card-label">{title}</div>
      {description && <div className="stat-card-desc">{description}</div>}
    </Tag>
  );
}

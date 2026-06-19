export default function StatsCard({ title, value, description, icon, color }) {
  return (
    <div className="stat-card">
      {icon && <div className="stat-card-icon" style={{ background: color || "var(--deep)" }}>{icon}</div>}
      <div className="stat-card-label">{title}</div>
      <div className="stat-card-value">{value ?? "—"}</div>
      {description && <div className="stat-card-desc">{description}</div>}
    </div>
  );
}

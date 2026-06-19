export default function QuickActionCard({ title, description, buttonText }) {
  return (
    <div className="panel">
      <h3>{title}</h3>
      <p>{description}</p>
      <div className="card-actions">
        <button className="green-btn">{buttonText}</button>
      </div>
    </div>
  );
}
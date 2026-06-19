export default function ProjectCard({ title, description, progress }) {
  return (
    <div className="panel">
      <h3>{title}</h3>
      <p>{description}</p>

      <div className="progress-bar">
        <div style={{ width: `${progress}%` }}></div>
      </div>

      <small>{progress}% Complete</small>
    </div>
  );
}
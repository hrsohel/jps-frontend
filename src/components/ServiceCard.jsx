export default function ServiceCard({
  title,
  description,
  image,
  quickServices = [],
}) {
  return (
    <div className="service-card">
      {image && (
        <img
          src={image}
          alt={title}
          className="service-card-image"
        />
      )}

      <div className="service-body">
        <h3>{title}</h3>
        <p>{description}</p>

        <div className="card-actions">
          <button>Request Service</button>
          <button className="green-outline">Schedule</button>
        </div>
      </div>
    </div>
  );
}
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page-shell center-page">
      <h1>Route not found</h1>
      <Link className="primary-button" to="/">
        Return to Eco AI
      </Link>
    </div>
  );
}

import { Link } from "react-router-dom";
import '../css/landingPage.css'

export default function LandingPage() {
  return (
    <div className="landing-page-box">
      <h1>Welcome</h1>
      <p>Choose your opponent</p>
      <div className="link-container">
        <Link to="/ai" className="ai-link">
          AI
        </Link>
        <Link to="/multiplayer" className="multiplayer-link" >
          Multiplayer
        </Link>
      </div>
    </div>
  );
}

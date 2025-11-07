import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landingPage.jsx";
import AiGame from "./pages/AIGame.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/ai" element={<AiGame />} />
      {/* Placeholder for multiplayer route */}
      <Route path="/multiplayer" element={<h1>Multiplayer Coming Soon!</h1>} />
    </Routes>
  );
}

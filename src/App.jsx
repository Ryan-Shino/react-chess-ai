import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/landingPage.jsx";
import AiGame from "./pages/AIGame.jsx";
import Multiplayer from "./pages/Multiplayer.jsx";
import OnlineMultiplayer from "./pages/OnlineMultiplayer.jsx"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/ai" element={<AiGame />} />
      <Route path="/multiplayer" element={<Multiplayer />} />
      <Route path="/online-multiplayer" element={<OnlineMultiplayer />} />
    </Routes>
  );
}

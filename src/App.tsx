import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./pages/Home";
import Discover from "./pages/Discover";
import ProjectDetail from "./pages/ProjectDetail";
import Create from "./pages/Create";
import Profile from "./pages/Profile.tsx";
import { AuthProvider } from "./lib/AuthContext";
import Auth from "./pages/Auth";
import MessagesRoute from "./routes/messages";
import Requests from "./pages/Requests";
import Workspace from "./pages/Workspace";

export default function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/create" element={<Create />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/messages" element={<MessagesRoute />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/workspace" element={<Workspace />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}

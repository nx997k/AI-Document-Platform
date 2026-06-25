import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AIChat from "./pages/AIChat";
import UploadDocument from "./pages/UploadDocument";
import MyDocuments from "./pages/MyDocuments";
import GenerateDocument from "./pages/GenerateDocument";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/upload" element={<UploadDocument />} />

        <Route path="/documents" element={<MyDocuments />} />

        <Route path="/aichat" element={<AIChat />} />

        <Route path="/generate" element={<GenerateDocument />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
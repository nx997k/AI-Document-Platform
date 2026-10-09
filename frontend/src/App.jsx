import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AIChat from "./pages/AIChat";
import UploadDocument from "./pages/UploadDocument";
import MyDocuments from "./pages/MyDocuments";
import GenerateDocument from "./pages/GenerateDocument";

function ProtectedRoute({ children }) {
  return localStorage.getItem("token") ? children : <Navigate to="/" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

        <Route path="/upload" element={<ProtectedRoute><UploadDocument /></ProtectedRoute>} />

        <Route path="/documents" element={<ProtectedRoute><MyDocuments /></ProtectedRoute>} />

        <Route path="/aichat" element={<ProtectedRoute><AIChat /></ProtectedRoute>} />

        <Route path="/generate" element={<ProtectedRoute><GenerateDocument /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

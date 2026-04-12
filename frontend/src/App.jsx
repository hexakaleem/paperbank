import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import ResourceDetail from './pages/ResourceDetail';
import McqBrowse from './pages/McqBrowse';
import CreateMcq from './pages/CreateMcq';
import AttemptMcq from './pages/AttemptMcq';
import QuizResult from './pages/QuizResult';
import MyUploads from './pages/MyUploads';

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/resources/:id" element={<ResourceDetail />} />
        <Route path="/mcqs" element={<McqBrowse />} />
        <Route path="/mcqs/create" element={<CreateMcq />} />
        <Route path="/mcqs/:id/attempt" element={<AttemptMcq />} />
        <Route path="/mcqs/:id/result" element={<QuizResult />} />
        <Route path="/my-uploads" element={<MyUploads />} />
      </Routes>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

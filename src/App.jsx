import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Toastify styles
import './App.css';

import Layout from './components/Layouts/Layout'; 
import Home from './pages/unauthenticated/Home';
import Login from './pages/unauthenticated/Login';
import Register from './pages/unauthenticated/Register';
import LiveMeasurement from './pages/authenticated/LiveMeasurement';
import PrivateRoute from './routes/PrivateRoute';
import PrivateLayout from './components/Layouts/PrivateLayout';
import Dashboard from './pages/authenticated/Dashboard';
import HealthProfile from './pages/authenticated/HealthProfile';
import HealthAnalysisPage from './pages/authenticated/HealthAnalysisPage';
import DynamicHealthAnalysisPage from './pages/authenticated/HealthAnalysisPage';

function App() {
  return (
    <>
      {/* ✅ Global ToastContainer */}
      <ToastContainer position="top-right" autoClose={3000} pauseOnHover theme="dark" />

      <BrowserRouter>
        <Routes>
          {/* Public Routes (Unauthenticated Layout) */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>

          {/* Protected Routes (Authenticated Layout) */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <PrivateLayout />
              </PrivateRoute>
            }
          >
            <Route path="livemeasurment" element={<LiveMeasurement />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="healthProfile" element={<HealthProfile />} />
               <Route path="healthAnalsyisPage/:id" element={<DynamicHealthAnalysisPage />} />
            {/* Add more authenticated routes here */}
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;

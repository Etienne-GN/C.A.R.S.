import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import CarDetailPage from './pages/CarDetailPage';
import CarFormPage from './pages/CarFormPage';
import DashboardPage from './pages/DashboardPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import ServiceFormPage from './pages/ServiceFormPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="cars/new" element={<CarFormPage />} />
          <Route path="cars/:carId" element={<CarDetailPage />} />
          <Route path="cars/:carId/edit" element={<CarFormPage />} />
          <Route path="cars/:carId/services/new" element={<ServiceFormPage />} />
          <Route path="cars/:carId/services/:serviceId" element={<ServiceDetailPage />} />
          <Route path="cars/:carId/services/:serviceId/edit" element={<ServiceFormPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

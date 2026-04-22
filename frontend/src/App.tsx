import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { ModulesProvider } from './context/ModulesContext';
import CarDetailPage from './pages/CarDetailPage';
import CarFormPage from './pages/CarFormPage';
import DashboardPage from './pages/DashboardPage';
import FuelLogPage from './pages/FuelLogPage';
import FusePanelDetailPage from './pages/FusePanelDetailPage';
import FusesListPage from './pages/FusesListPage';
import ModulesPage from './pages/ModulesPage';
import OBDPage from './pages/OBDPage';
import RecallsPage from './pages/RecallsPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import ServiceFormPage from './pages/ServiceFormPage';
import TirePage from './pages/TirePage';

export default function App() {
  return (
    <BrowserRouter>
      <ModulesProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="cars/new" element={<CarFormPage />} />
            <Route path="cars/:carId" element={<CarDetailPage />} />
            <Route path="cars/:carId/edit" element={<CarFormPage />} />
            <Route path="cars/:carId/services/new" element={<ServiceFormPage />} />
            <Route path="cars/:carId/services/:serviceId" element={<ServiceDetailPage />} />
            <Route path="cars/:carId/services/:serviceId/edit" element={<ServiceFormPage />} />
            <Route path="modules" element={<ModulesPage />} />
            <Route path="modules/fuses" element={<FusesListPage />} />
            <Route path="modules/fuses/:panelKey" element={<FusePanelDetailPage />} />
            <Route path="modules/fuel" element={<FuelLogPage />} />
            <Route path="modules/recalls" element={<RecallsPage />} />
            <Route path="modules/tires" element={<TirePage />} />
            <Route path="modules/obd" element={<OBDPage />} />
          </Route>
        </Routes>
      </ModulesProvider>
    </BrowserRouter>
  );
}

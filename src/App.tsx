import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Employer from './pages/Employer';
import Employee from './pages/Employee';
import Verify from './pages/Verify';
import Ledger from './pages/Ledger';
import Auth from './pages/Auth';

export default function App() {
  return (
    <Routes>
      <Route path="/sign-in" element={<Auth mode="sign-in" />} />
      <Route path="/sign-up" element={<Auth mode="sign-up" />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/employer" element={<Employer />} />
        <Route path="/employee" element={<Employee />} />
        <Route path="/verify" element={<Verify />} />
        <Route path="/verify/:requestId" element={<Verify />} />
        <Route path="/ledger" element={<Ledger />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

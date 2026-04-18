/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from '../store/AppContext';
import Layout from './layout/Layout';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import AddStudent from '../pages/AddStudent';
import VerifyDocuments from '../pages/VerifyDocuments';
import Receipt from '../pages/Receipt';
import Reports from '../pages/Reports';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Protected Routes (using Layout) */}
          <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
          <Route path="/add-student" element={<Layout><AddStudent /></Layout>} />
          <Route path="/verify" element={<Layout><VerifyDocuments /></Layout>} />
          <Route path="/reports" element={<Layout><Reports /></Layout>} />
          
          {/* Receipt Route (no standard sidebar layout, handles its own A4 layout) */}
          <Route path="/receipt" element={<Layout><Receipt /></Layout>} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

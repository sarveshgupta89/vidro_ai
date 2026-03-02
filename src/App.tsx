import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/DashboardLayout';
import { Login } from './pages/Login';
import { Upgrade } from './pages/Upgrade';
import { VideoCreator } from './pages/VideoCreator';
import { Templates5s } from './pages/Templates5s';
import { Profile } from './pages/Profile';
import { Billing } from './pages/Billing';
import { TemplatesGallery } from './pages/TemplatesGallery';
import { Assets } from './pages/Assets';
import { Help } from './pages/Help';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsAndConditions } from './pages/TermsAndConditions';
import { initPostHog } from './lib/posthog';

export default function App() {
  useEffect(() => {
    initPostHog();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<DashboardLayout />}>
          <Route path="/" element={<VideoCreator />} />
          <Route path="/assets" element={<Assets />} />
          <Route path="/templates-5s" element={<Templates5s />} />
          <Route path="/templates" element={<TemplatesGallery />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/help" element={<Help />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

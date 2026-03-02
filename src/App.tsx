import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/DashboardLayout';
import { Login } from './pages/Login';
import { Upgrade } from './pages/Upgrade';
import { VideoCreator } from './pages/VideoCreator';
import { Templates5s } from './pages/Templates5s';
import { Profile } from './pages/Profile';
import { DummyPage } from './pages/DummyPage';
import { Billing } from './pages/Billing';
import { TemplatesGallery } from './pages/TemplatesGallery';
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
          <Route path="/assets" element={<DummyPage title="Assets" description="Manage your uploaded images, videos, and audio files here." />} />
          <Route path="/templates-5s" element={<Templates5s />} />
          <Route path="/templates" element={<TemplatesGallery />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/help" element={<DummyPage title="Help & FAQ" description="Find answers to common questions and learn how to use Vidro AI." />} />
          <Route path="/terms-and-conditions" element={<DummyPage title="Terms & Conditions" description="Read our terms of service and usage policies." />} />
          <Route path="/privacy-policy" element={<DummyPage title="Privacy Policy" description="Learn how we collect, use, and protect your data." />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

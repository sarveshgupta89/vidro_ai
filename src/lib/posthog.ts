import posthog from 'posthog-js';

const isPostHogConfigured = () => {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  // PostHog keys typically start with 'phc_' and are quite long.
  return key && typeof key === 'string' && key.startsWith('phc_');
};

export const initPostHog = () => {
  if (typeof window !== 'undefined' && isPostHogConfigured()) {
    posthog.init(
      import.meta.env.VITE_POSTHOG_KEY,
      {
        api_host: (import.meta.env.VITE_POSTHOG_HOST && import.meta.env.VITE_POSTHOG_HOST.startsWith('http')) 
          ? import.meta.env.VITE_POSTHOG_HOST 
          : 'https://app.posthog.com',
        loaded: (posthog) => {
          if (import.meta.env.DEV) posthog.debug();
        }
      }
    );
  } else {
    console.warn('PostHog not initialized: VITE_POSTHOG_KEY is missing or dummy.');
  }
};

export const identifyUser = (uid: string, email: string) => {
  if (isPostHogConfigured()) {
    posthog.identify(uid, { email });
  }
};

export const captureEvent = (eventName: string, properties?: any) => {
  if (isPostHogConfigured()) {
    posthog.capture(eventName, properties);
  }
};

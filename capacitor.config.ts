import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.apitaja',
  appName: 'ApitaJá',
  webDir: 'dist',
  server: {
    url: 'https://8691e05e-4969-4815-a42a-4644ffce4c96.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;

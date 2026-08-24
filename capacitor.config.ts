import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ca.msre.roofingcrm",
  appName: "MSRE Roofing CRM",
  webDir: "dist/public",
  server: {
    androidScheme: "https",
    cleartext: false,
    allowNavigation: ["roofcrm-lzqinayu.manus.space"],
  },
};

export default config;

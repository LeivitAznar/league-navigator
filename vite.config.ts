import { tanstackConfig } from "@lovable.dev/vite-tanstack-config";
import { defineConfig } from "vite";

export default defineConfig({
  ...tanstackConfig,
  server: {
    ...(tanstackConfig.server ?? {}),
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    allowedHosts: true,
  },
  preview: {
    ...(tanstackConfig.preview ?? {}),
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    allowedHosts: true,
  },
});

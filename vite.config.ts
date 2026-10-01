import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env from parent directory
  const env = loadEnv(mode, path.resolve(__dirname, ".."), "");
  const devPort = new URL(env.DEV_FRONTEND_URL || "http://localhost:3001").port;

  return {
    plugins: [react()],
    resolve: {
      // Keep the app and intents SDK on one commons-SDK instance so newly
      // added testnet chain configuration is not shadowed by a nested copy.
      dedupe: ["@epoch-protocol/epoch-commons-sdk"],
    },
    server: {
      port: parseInt(devPort),
      strictPort: false, // Try next available port if port is in use
      // Proxy removed - using absolute URLs via VITE_API_BASE_URL env variable
    },
  };
});

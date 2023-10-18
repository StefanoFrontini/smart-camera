import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const manifestForPlugin = {
  name: "Smart Camera",
  short_name: "Smart Camera",
  description: "Smart Camera",
  display: "standalone",
  scope: "/",
  permissions: {
    "video-capture": {
      description: "Required to capture video using getUserMedia()",
    },
  },
  // theme_color: '#ffffff',
  // icons: [
  //   {
  //     src: '/android-chrome-192x192.png',
  //     sizes: '192x192',
  //     type: 'image/png',
  //   },
  //   {
  //     src: '/android-chrome-512x512.png',
  //     sizes: '512x512',
  //     type: 'image/png',
  //   },
  // ],
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA({ manifest: manifestForPlugin })],
});

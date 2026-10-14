import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
import { componentTagger } from "lovable-tagger";

function extensionCleanPlugin(): Plugin {
  return {
    name: "extension-clean-plugin",
    closeBundle() {
      // Remove website-specific files from extension build
      const robotsPath = path.resolve(__dirname, "dist/extension/robots.txt");
      if (fs.existsSync(robotsPath)) {
        try {
          fs.unlinkSync(robotsPath);
        } catch {
          // ignore
        }
      }
    },
  };
}

function webCleanPlugin(): Plugin {
  return {
    name: "web-clean-plugin",
    closeBundle() {
      // Remove Chrome Extension manifest from web portal build
      const manifestPath = path.resolve(__dirname, "dist/web/manifest.json");
      if (fs.existsSync(manifestPath)) {
        try {
          fs.unlinkSync(manifestPath);
        } catch {
          // ignore
        }
      }
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isExtension = mode === "extension";
  const isWeb = mode === "web";

  const outDir = isExtension ? "dist/extension" : isWeb ? "dist/web" : "dist";

  const extensionInputs = {
    popup: path.resolve(__dirname, "popup.html"),
    app: path.resolve(__dirname, "app.html"),
    sidepanel: path.resolve(__dirname, "sidepanel.html"),
    options: path.resolve(__dirname, "options.html"),
    background: path.resolve(__dirname, "src/extension/background/serviceWorker.ts"),
  };

  const webInputs = {
    main: path.resolve(__dirname, "index.html"),
  };

  const rollupInputs = isExtension
    ? extensionInputs
    : isWeb
      ? webInputs
      : { ...webInputs, ...extensionInputs };

  return {
    server: {
      host: "::",
      port: 5173,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      isExtension && extensionCleanPlugin(),
      isWeb && webCleanPlugin(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: {
        input: rollupInputs,
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === "background") {
              return "background.js";
            }
            return "assets/[name]-[hash].js";
          },
        },
      },
    },
  };
});

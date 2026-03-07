import { defineConfig } from "vite";
import path from "path";
import fs from "fs";

export default defineConfig({
  server: {
    proxy: {
      "/api": "http://localhost:3000"
    }
  },
  plugins: [
    {
      name: "serve-maps",
      configureServer(server) {
        server.middlewares.use("/maps", (req, res, next) => {
          const file = path.join(process.cwd(), "maps", req.url ?? "");
          if (fs.existsSync(file) && fs.statSync(file).isFile()) {
            res.setHeader("Content-Type", "image/jpeg");
            fs.createReadStream(file).pipe(res);
          } else {
            next();
          }
        });
      }
    }
  ]
});
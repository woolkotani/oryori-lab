import "dotenv/config";
import { defineConfig } from "prisma/config";

function buildDbUrl(): string | undefined {
  const url = process.env["DATABASE_URL"];
  if (!url) return undefined;
  const token = process.env["DATABASE_AUTH_TOKEN"];
  // Turso libsql URLs can carry authToken via query string
  if (token && (url.startsWith("libsql://") || url.startsWith("https://")) && !url.includes("authToken=")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}authToken=${token}`;
  }
  return url;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: buildDbUrl(),
  },
});

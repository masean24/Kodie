import type { MetadataRoute } from "next";

const SITUS = (process.env.NEXT_PUBLIC_SITE_URL || "https://kodie.xevora.me").replace(/\/$/, "");

/** Halaman publik boleh diindeks; area login, tautan persetujuan, dan API tidak. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/orang-tua", "/siswa", "/mengajar", "/persetujuan", "/atur-ulang-password", "/auth", "/api"],
    },
    sitemap: `${SITUS}/sitemap.xml`,
  };
}

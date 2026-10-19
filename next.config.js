/**
 * Hébergement mutualisé (Hostinger) : le nombre de processus et de threads est plafonné.
 * La compilation lançait un processus par cœur pour « Collecting page data », chacun
 * chargeant le moteur Prisma, qui ouvre lui-même un thread par cœur : au-delà du plafond,
 * « OS can't spawn worker thread (os error 11) » et échec de la compilation. On borne les
 * deux (valeurs ajustables par variables d'environnement).
 */
process.env.TOKIO_WORKER_THREADS = process.env.TOKIO_WORKER_THREADS || "2";
const PROCESSUS_COMPILATION = Number(process.env.NEXT_BUILD_CPUS || 2);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ancienne adresse de l'éditeur de grille (portait le nom de version du modèle).
  async redirects() {
    return [{ source: "/admin/scoring-grid-v7pp", destination: "/admin/grille-scoring", permanent: true }];
  },
  output: "standalone",

  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Image optimization
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Compression
  compress: true,
  poweredByHeader: false,

  // Code splitting
  experimental: {
    optimizePackageImports: ["lucide-react", "@tanstack/react-query"],
    cpus: PROCESSUS_COMPILATION,
    workerThreads: false,
  },

  // Headers for caching
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, max-age=300",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

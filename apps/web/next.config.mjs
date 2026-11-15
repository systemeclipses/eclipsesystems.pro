/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/alternatives", destination: "/vs", permanent: true },
      { source: "/plans", destination: "/pricing", permanent: true },
      { source: "/pay-invouce", destination: "/pay-invoice", permanent: false },
      { source: "/pay-inovice", destination: "/pay-invoice", permanent: false },
      { source: "/payinvoice", destination: "/pay-invoice", permanent: false },
      { source: "/invoice-payment", destination: "/pay-invoice", permanent: false }
    ];
  }
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    // The dev-only "N" badge sits on top of the phone tab bar.
    devIndicators: false,
};

export default nextConfig;

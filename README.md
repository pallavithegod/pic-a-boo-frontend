# 📸 Pic-a-boo (Frontend)

Welcome to the frontend of **Pic-a-boo**, a premium, beautifully stylized full-stack image gallery. Designed with a meticulous focus on typography, spacing, and micro-interactions, Pic-a-boo takes inspiration from the calm, minimalist aesthetics of Nothing OS and native Apple software.

## ✨ Features

- **Premium UI/UX:** A stunning dark-slate design system (`zinc-900` palette) with a distinct `#B82F2B` accent color. Features native-feeling liquid glass overlays and buttery-smooth spring animations.
- **Client-Side Compression:** Images are heavily compressed and optimized directly in the browser using `browser-image-compression` before they ever hit the network, ensuring lightning-fast uploads.
- **Drag & Drop Uploads:** A seamless, full-screen dropzone with a beautifully animated floating upload status bar that supports batch uploads and visual progress tracking.
- **Intelligent Gallery Grid:** Features sticky date headers, responsive masonry-style grid alignments, and high-performance blur-up placeholders.
- **Integrated Search:** A sleek search experience built directly into the sticky navigation bar, allowing you to filter your gallery instantly.
- **Selection & Management:** Native-feeling multi-select mode with a dynamic slide-down action bar for deleting multiple photos at once.

## 🛠️ Tech Stack

- **Framework:** React + Vite (JSX)
- **Styling:** Tailwind CSS (Customized for absolute precision)
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **Image Processing:** browser-image-compression

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Ensure your backend is running. If your backend is running on a different port than `3000`, create a `.env` file in the root of the frontend directory:
   ```env
   VITE_API_BASE_URL=http://localhost:3000
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## 🎨 Design Philosophy
This project was built from first principles, rejecting the generic "SaaS dashboard" look. It relies on subtle 1px borders, carefully crafted text contrast, and intentional use of accent colors to guide the user's eye, resulting in a cohesive, consumer-grade product.

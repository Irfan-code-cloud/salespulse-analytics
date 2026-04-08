# SalesPulse Analytics Dashboard

An interactive and professional dashboard for visualizing sales performance, product trends, and payment distributions. Built with React, Firebase, and Tailwind CSS.

![SalesPulse Dashboard Overview](./image_14d5a2.png)

## 🚀 Features

- **Real-time Analytics**: Live updates of sales data and performance metrics.
- **Interactive Visualizations**: Beautiful charts powered by Recharts for tracking trends and distributions.
- **User Authentication**: Secure login and sign-up using Firebase Authentication (Email/Password & Google).
- **Profile Management**: 
  - Custom display names and unique usernames.
  - Profile picture upload and management.
  - Personalized dashboard experience.
- **Advanced Filtering**: Filter sales data by product category, payment method, and custom date ranges.
- **Responsive Design**: Fully optimized for desktop and mobile devices using Tailwind CSS.
- **Smooth Interactions**: Elegant animations and transitions powered by Framer Motion.

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend/Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Animations**: [Motion](https://motion.dev/)

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Firebase project

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/salespulse-dashboard.git
   cd salespulse-dashboard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   Copy the `.env.example` file to a new file named `.env`:
     ```bash
     cp .env.example .env
     ```
   Open `.env` and fill in your Firebase project credentials from the [Firebase Console](https://console.firebase.google.com/).

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`.

## 🔒 Security

This project uses **Firestore Security Rules** to ensure that:
- Only authenticated users can access the database.
- Users can only read and write their own profile data.
- Data integrity is maintained through strict schema validation.

Make sure to deploy the `firestore.rules` file to your Firebase project.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙌 Acknowledgments

- Icons by [Lucide](https://lucide.dev/)
- UI inspiration from modern SaaS dashboards.

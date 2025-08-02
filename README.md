# Child Health Data Collection PWA

A Progressive Web Application for collecting and managing child health data offline.

## 🚀 Features

- **Simple Authentication** - Username/password login system
- **Offline-First Design** - Works completely offline with IndexedDB storage
- **Progressive Web App** - Install on any device
- **Child Health Forms** - Comprehensive data collection
- **Local Data Storage** - All data stored locally with encryption
- **Responsive Design** - Works on mobile, tablet, and desktop
- **Material-UI Interface** - Modern and intuitive design

## 🔧 Technology Stack

- **Frontend**: React 18.2.0
- **UI Library**: Material-UI 5.11.0
- **Storage**: IndexedDB for offline data
- **Encryption**: CryptoJS for data security
- **PWA**: Service Worker + Workbox
- **Routing**: React Router 6.8.1

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aritraroy02/Hackathon-Web.git
   cd Hackathon-Web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   - Navigate to `http://localhost:3000`
   - The app will automatically open in your default browser

## 🔐 Demo Authentication

The application includes demo accounts for testing:

| Username | Password | Role |
|----------|----------|------|
| `admin` | `password123` | Dr. Sarah Wilson (Field Worker) |
| `user` | `user123` | John Smith (Health Assistant) |
| `demo` | `demo123` | Demo User (Health Worker) |

Use any of these credentials to login and explore the application.

## 📱 PWA Installation

The app can be installed as a Progressive Web App:

1. **On Desktop**: Look for the install prompt in your browser's address bar
2. **On Mobile**: Use your browser's "Add to Home Screen" option
3. **Manual**: Click the install button when prompted

## 💾 Data Storage

- **Local Storage**: All data is stored locally using IndexedDB
- **Encryption**: Sensitive data is encrypted using CryptoJS
- **Offline Mode**: Complete functionality without internet connection
- **Data Persistence**: Data remains available across browser sessions

## 🔧 Available Scripts

- `npm start` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm run eject` - Ejects from Create React App (irreversible)

## 📂 Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── forms/          # Data collection forms
│   ├── layout/         # Layout components
│   ├── records/        # Records management
│   ├── settings/       # App settings
│   └── common/         # Shared components
├── contexts/           # React contexts
├── utils/              # Utility functions
│   ├── database.js     # IndexedDB operations
│   ├── simpleAuth.js   # Authentication service
│   └── encryption.js   # Data encryption
└── public/             # Static assets
```

## 🎯 Main Features

### Authentication
- Simple username/password login
- Demo accounts available
- Session management
- Secure logout

### Data Collection
- Child health information forms
- Offline data storage
- Data validation
- Form state persistence

### Records Management
- View all collected records
- Search and filter functionality
- Export capabilities
- Data encryption

### Settings
- Application preferences
- User profile management
- Data export/import options

## 🌐 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For support, please contact the development team or create an issue in the repository.

---

**Note**: This is a demo application designed for offline child health data collection. All authentication is simulated and data is stored locally for privacy and security.

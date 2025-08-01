# Child Health Data Collection PWA

A Progressive Web Application (PWA) for collecting child health data with offline functionality, built with React and Material-UI.

## 🚀 Features

### Core Functionality
- **Comprehensive Data Collection Form**: Child's name, photo, age, weight, height, guardian information, malnutrition signs, and medical history
- **Offline-First Architecture**: Works completely offline with local data storage
- **Automatic Data Synchronization**: Syncs data when internet connection is available
- **Photo Capture/Upload**: Camera integration for child photos with preview
- **Draft Management**: Auto-save functionality to prevent data loss
- **Secure Data Storage**: Client-side encryption for sensitive information

### PWA Features
- **Installable**: Can be installed as a native app on mobile and desktop
- **Service Worker**: Caching strategies for offline functionality
- **Responsive Design**: Mobile-first approach with touch-friendly interface
- **Background Sync**: Automatic data synchronization when connection is restored
- **Push Notifications**: Ready for sync reminders and updates

### Technical Features
- **IndexedDB Integration**: Robust offline data persistence
- **Encrypted Storage**: AES encryption for sensitive data
- **Mock eSignet Authentication**: Simulated authentication flow
- **Health ID Generation**: Unique identifier generation for each child
- **Network Status Detection**: Real-time online/offline indicators
- **Error Handling**: Comprehensive error management and user feedback

## 🛠️ Technology Stack

- **Frontend**: React 18+ with Hooks and Context API
- **UI Framework**: Material-UI (MUI) v5
- **Routing**: React Router DOM v6
- **State Management**: React Context + useReducer
- **Offline Storage**: IndexedDB (via idb library)
- **Encryption**: CryptoJS for data security
- **PWA**: Service Worker with Workbox
- **Build Tool**: Create React App
- **Package Manager**: npm

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- Modern web browser with service worker support

## 🔧 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/child-health-pwa.git
cd child-health-pwa
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm start
```

The app will open at `http://localhost:3000`

### 4. Build for Production
```bash
npm run build
```

## 📱 Usage Guide

### Getting Started
1. **Home Dashboard**: Overview of records and sync status
2. **Add Child Record**: Fill out the comprehensive health form
3. **View Records**: Browse pending and synced records
4. **Sync Data**: Upload offline records to server
5. **Settings**: Manage app data and preferences

### Form Fields
- **Child's Name** (Required): Full name of the child
- **Face Photo**: Camera capture or file upload
- **Age** (Required): Child's age in years
- **ID/Unique Identifier**: Auto-generated or manual entry
- **Weight**: Child's weight in kilograms (decimal support)
- **Height**: Child's height in centimeters (decimal support)
- **Guardian's Name** (Required): Parent/guardian information
- **Malnutrition Signs**: Dropdown selection or N/A
- **Recent Illnesses**: Text area for medical history
- **Parental Consent** (Required): Mandatory checkbox

### Offline Functionality
- All data is stored locally using IndexedDB
- Form drafts are automatically saved
- Network status is continuously monitored
- Data syncs automatically when connection is restored
- Visual indicators show sync status

## 🔐 Security Features

- **Client-side Encryption**: Sensitive data encrypted before storage
- **Photo Security**: Images encrypted in local storage
- **HTTPS Enforcement**: Secure data transmission
- **Input Sanitization**: Protection against malicious input
- **Mock Authentication**: eSignet integration simulation

## 🌐 PWA Installation

### Mobile Devices
1. Open the app in your mobile browser
2. Look for "Add to Home Screen" prompt
3. Follow browser-specific installation steps

### Desktop
1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. Follow the installation prompt

## 🔄 Data Synchronization

### Mock Authentication Flow
1. Enter National ID (any format for demo)
2. Receive mock OTP (any 6-digit number)
3. System generates JWT token
4. Data sync is authorized

### Sync Process
1. Pending records are queued for upload
2. Network connectivity is verified
3. Authentication token is validated
4. Records are sent to mock server endpoint
5. Successful uploads move to synced records
6. Failed uploads remain in pending queue

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout/         # App layout and navigation
├── contexts/           # React Context providers
│   └── AppContext.js   # Global state management
├── pages/              # Page components
│   ├── Home/           # Dashboard
│   ├── ChildForm/      # Data collection form
│   ├── Records/        # Records management
│   ├── Sync/           # Data synchronization
│   └── Settings/       # App settings
├── services/           # Business logic services
│   ├── dbService.js    # IndexedDB operations
│   └── networkService.js # API communications
└── utils/              # Utility functions
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Manual Testing Checklist
- [ ] Form validation works correctly
- [ ] Offline data storage functions
- [ ] Photo upload and preview works
- [ ] Draft auto-save functionality
- [ ] Network status detection
- [ ] Data synchronization
- [ ] PWA installation
- [ ] Responsive design on different devices

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Static Hosting
The `build` folder can be deployed to any static hosting service:
- Netlify
- Vercel
- GitHub Pages
- Firebase Hosting
- AWS S3

### HTTPS Requirement
PWAs require HTTPS for service worker functionality. Most hosting platforms provide SSL certificates automatically.

## 🔧 Configuration

### Environment Variables
Create a `.env` file for configuration:
```
REACT_APP_API_ENDPOINT=https://your-api-endpoint.com
REACT_APP_ENCRYPTION_KEY=your-encryption-key
```

### Service Worker Customization
Modify `public/sw.js` for custom caching strategies:
- Cache-first for static assets
- Network-first for API calls
- Stale-while-revalidate for dynamic content

## 📊 Performance Optimization

- **Code Splitting**: Lazy loading for routes
- **Image Optimization**: Compressed photos before storage
- **Caching Strategy**: Service worker with intelligent caching
- **Bundle Analysis**: Use webpack-bundle-analyzer
- **Lighthouse Audits**: Regular performance monitoring

## 🐛 Troubleshooting

### Common Issues

1. **Service Worker Not Registering**
   - Ensure HTTPS is enabled
   - Check browser console for errors
   - Clear browser cache and reload

2. **IndexedDB Errors**
   - Check browser storage quota
   - Clear application data in dev tools
   - Verify browser compatibility

3. **Photos Not Uploading**
   - Check file size limits
   - Verify image format support
   - Ensure camera permissions

### Debug Mode
Enable debug logging in development:
```javascript
localStorage.setItem('debug', 'true');
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Email: support@childhealthpwa.com
- Documentation: [Wiki](https://github.com/your-username/child-health-pwa/wiki)

## 🗺️ Roadmap

- [ ] Real backend integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Biometric authentication
- [ ] Advanced search and filtering
- [ ] Data export functionality
- [ ] Integration with health systems
- [ ] Advanced offline capabilities

---

Built with ❤️ for child health data collection

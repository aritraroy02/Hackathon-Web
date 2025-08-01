# Child Health Data Collection PWA

<<<<<<< HEAD
A comprehensive Progressive Web Application (PWA) for collecting and managing child health data with offline-first functionality and secure authentication.

## 🌟 Features

### Core Functionality
- **Offline-First Architecture**: Full functionality without internet connection
- **Child Health Form**: Comprehensive data collection with 30+ fields
- **Photo Capture**: Camera integration for child photos
- **Data Encryption**: Secure local storage with AES encryption
- **Background Sync**: Automatic data synchronization when online
- **Push Notifications**: Health reminders and alerts

### PWA Features
- **Installable**: Can be installed as a native app
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Offline Support**: Service worker with intelligent caching
- **App Shell**: Fast loading with cached resources

### Authentication
- **eSignet Integration**: Mock National ID authentication
- **OTP Verification**: Secure two-factor authentication
- **Session Management**: Secure token handling

### UI/UX
- **Material Design**: Modern, accessible interface
- **Multi-language Support**: Hindi, English, Bengali, Tamil
- **Dark/Light Theme**: User preference support
- **Accessibility**: WCAG compliant design

## 🛠 Tech Stack

- **Frontend**: React 18.2.0, Material-UI 5.11.0
- **PWA**: Workbox 6.5.4, Service Worker API
- **Storage**: IndexedDB with encryption (CryptoJS)
- **Authentication**: Mock eSignet integration
- **Utilities**: UUID, React Router, date-fns

## 📋 Prerequisites

- **Node.js**: Version 16.0 or higher
- **npm**: Version 7.0 or higher
- **Modern Browser**: Chrome 88+, Firefox 85+, Safari 14+

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
=======
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
>>>>>>> 7397ad6439f1851f54f58043de4d0bfea6848d07
cd child-health-pwa
```

### 2. Install Dependencies
<<<<<<< HEAD
```powershell
=======
```bash
>>>>>>> 7397ad6439f1851f54f58043de4d0bfea6848d07
npm install
```

### 3. Start Development Server
<<<<<<< HEAD
```powershell
npm start
```

The application will be available at `http://localhost:3000`

### 4. Build for Production
```powershell
npm run build
```

## 📱 PWA Installation

### On Mobile (Android/iOS)
1. Open the app in browser
2. Tap the "Add to Home Screen" prompt
3. Or use browser menu → "Install App"

### On Desktop
1. Open the app in Chrome/Edge
2. Click the install icon in the address bar
3. Or use browser menu → "Install Child Health App"

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=https://your-api-url.com
REACT_APP_ESIGNET_URL=https://esignet-api-url.com
REACT_APP_ENCRYPTION_KEY=your-32-character-encryption-key
```

### Customization
- **Theme**: Edit `src/theme.js` for colors and typography
- **Languages**: Add translations in `src/contexts/AppContext.js`
- **Form Fields**: Modify `src/components/ChildForm.js`

## 📊 Usage Guide

### 1. Authentication
- Enter National ID (demo: any 12-digit number)
- Verify OTP (demo: any 6-digit number)
- System stores secure session token

### 2. Adding Child Records
- Navigate to "Add Record" page
- Fill comprehensive health form
- Capture child photo (optional)
- Save locally with encryption

### 3. Offline Usage
- All features work offline
- Data stored in IndexedDB
- Automatic sync when connection restored

### 4. Sync Management
- View sync status in Sync page
- Manual sync trigger available
- Conflict resolution for data consistency

### 5. Settings
- Language preferences
- Notification settings
- Data export/import
- Privacy controls

## 🗂 Project Structure

```
src/
├── components/           # React components
│   ├── AuthPage.js      # Authentication flow
│   ├── ChildForm.js     # Main data collection form
│   ├── RecordsList.js   # Records management
│   ├── SyncPage.js      # Data synchronization
│   ├── SettingsPage.js  # App configuration
│   └── HelpPage.js      # User documentation
├── contexts/            # React context providers
│   └── AppContext.js    # Global state management
├── utils/               # Utility functions
│   ├── database.js      # IndexedDB operations
│   ├── mockAuth.js      # Authentication simulation
│   ├── network.js       # Network utilities
│   └── serviceWorker.js # SW registration
├── public/              # Static assets
│   ├── manifest.json    # PWA manifest
│   ├── sw.js           # Service worker
│   └── icons/          # App icons
└── App.js              # Main application component
=======
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
>>>>>>> 7397ad6439f1851f54f58043de4d0bfea6848d07
```

## 🧪 Testing

<<<<<<< HEAD
### Running Tests
```powershell
npm test
```

### Test Coverage
```powershell
npm run test:coverage
```

### Available Tests
- Unit tests for components
- Integration tests for data flow
- PWA functionality tests
- Authentication flow tests

## 🔄 Data Flow

1. **Data Collection**: Form submission with validation
2. **Local Storage**: Encrypted IndexedDB storage
3. **Background Sync**: Queue for offline submissions
4. **API Sync**: Upload to server when online
5. **Conflict Resolution**: Merge strategies for data consistency

## 🔒 Security Features

- **Data Encryption**: AES-256 encryption for sensitive data
- **Secure Authentication**: Token-based session management
- **HTTPS Only**: Service worker enforces secure connections
- **Input Validation**: Client and server-side validation
- **Privacy Controls**: User-controlled data sharing

## 🌐 API Integration

### Mock Authentication
The app includes a mock eSignet authentication system:

```javascript
// Example API integration
const authResponse = await mockAuth.authenticate({
  nationalId: '123456789012',
  otp: '123456'
});
```

### Backend Integration
For production, replace mock services with actual API endpoints:

1. Update `src/utils/mockAuth.js` with real eSignet integration
2. Configure API endpoints in environment variables
3. Implement server-side validation and storage

## 📦 Deployment

### Static Hosting (Netlify, Vercel)
```powershell
npm run build
# Upload dist/ folder to hosting service
```

### Docker Deployment
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Service Worker Updates
The app automatically updates the service worker and notifies users of new versions.
=======
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
>>>>>>> 7397ad6439f1851f54f58043de4d0bfea6848d07

## 🐛 Troubleshooting

### Common Issues

<<<<<<< HEAD
1. **Installation fails**
   - Check Node.js version: `node --version`
   - Clear npm cache: `npm cache clean --force`

2. **PWA not installing**
   - Ensure HTTPS connection
   - Check manifest.json validity
   - Verify service worker registration

3. **Offline functionality not working**
   - Check service worker status in DevTools
   - Verify IndexedDB permissions
   - Clear browser cache and reload

4. **Sync issues**
   - Check network connectivity
   - Verify API endpoints
   - Review background sync registration

### Debug Tools
- **Chrome DevTools**: Application tab for PWA debugging
- **React DevTools**: Component state inspection
- **Network Tab**: Service worker cache analysis
=======
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
>>>>>>> 7397ad6439f1851f54f58043de4d0bfea6848d07

## 🤝 Contributing

1. Fork the repository
<<<<<<< HEAD
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit Pull Request

### Code Standards
- Follow React best practices
- Use Material-UI components
- Implement proper error handling
- Add comprehensive tests
- Document complex functions

## 📞 Support

### Technical Support
- **Documentation**: Check this README and help page
- **Issues**: GitHub Issues for bug reports
- **Discussions**: GitHub Discussions for questions

### Health Data Privacy
This application handles sensitive health information. Ensure compliance with:
- Local health data protection laws
- GDPR (if applicable)
- HIPAA (if applicable)
- Institutional review board requirements

## 📄 License

MIT License - see LICENSE file for details

## 🏥 Health Data Compliance

This PWA is designed for health data collection and includes:
- **Data Encryption**: All sensitive data encrypted at rest
- **Privacy Controls**: User consent and data control features
- **Audit Logging**: Track data access and modifications
- **Secure Transmission**: HTTPS and certificate pinning
- **Data Retention**: Configurable retention policies

## 🔮 Roadmap

- [ ] Real-time data validation
- [ ] Advanced analytics dashboard
- [ ] Integration with health systems
- [ ] Machine learning insights
- [ ] Multi-tenant support
- [ ] Advanced reporting features

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Maintainer**: Development Team
=======
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
>>>>>>> 7397ad6439f1851f54f58043de4d0bfea6848d07

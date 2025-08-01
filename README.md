# Child Health Data Collection PWA

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
cd child-health-pwa
```

### 2. Install Dependencies
```powershell
npm install
```

### 3. Start Development Server
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
```

## 🧪 Testing

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

## 🐛 Troubleshooting

### Common Issues

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

## 🤝 Contributing

1. Fork the repository
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

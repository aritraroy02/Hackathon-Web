import React from 'react';

function About() {
  return (
    <div className="about" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>About Child Health Dashboard</h1>
      <p>This Progressive Web Application (PWA) provides a comprehensive visualization and management system for child health records.</p>
      
      <h2>Features</h2>
      <ul>
        <li>📊 Real-time data visualization with interactive charts</li>
        <li>📱 Progressive Web App with offline functionality</li>
        <li>💾 Local data storage using IndexedDB</li>
        <li>🔄 Automatic data synchronization when online</li>
        <li>📈 Statistical analysis of health records</li>
        <li>🌍 Geographic distribution mapping</li>
        <li>👥 Gender and age distribution analytics</li>
      </ul>
      
      <h2>Technology Stack</h2>
      <ul>
        <li>Frontend: React.js with Vite</li>
        <li>Charts: Recharts library</li>
        <li>PWA: Workbox for service workers</li>
        <li>Storage: IndexedDB with IDB wrapper</li>
        <li>Backend: Node.js with Express</li>
        <li>Database: MongoDB Atlas</li>
      </ul>
      
      <h2>Offline Capability</h2>
      <p>This application works offline by caching data locally. When you're offline, you can still view previously loaded health records and statistics.</p>
      
      <h2>Data Privacy</h2>
      <p>All child health data is handled with strict privacy measures and stored securely.</p>
    </div>
  );
}

export default About;

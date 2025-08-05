import React, { useState } from 'react';
import { Settings, User, Bell, Shield, Database, Download } from 'lucide-react';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    notifications: {
      emailAlerts: true,
      smsAlerts: false,
      pushNotifications: true
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: '30',
      passwordExpiry: '90'
    },
    data: {
      autoBackup: true,
      backupFrequency: 'daily',
      dataRetention: '365'
    },
    display: {
      theme: 'light',
      language: 'en',
      timezone: 'Asia/Kolkata'
    }
  });

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };

  const handleSaveSettings = () => {
    // Here you would save settings to backend
    console.log('Settings saved:', settings);
    alert('Settings saved successfully!');
  };

  const handleExportData = () => {
    // Mock export functionality
    alert('Data export initiated. You will receive an email when ready.');
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1>
              <Settings size={32} />
              Settings & Configuration
            </h1>
            <p>Manage your application preferences and system settings</p>
          </div>
        </div>
      </div>

      <div className="settings-container">
        <div className="settings-sidebar">
          <div className="settings-nav">
            <div className="nav-item active">
              <User size={20} />
              <span>General</span>
            </div>
            <div className="nav-item">
              <Bell size={20} />
              <span>Notifications</span>
            </div>
            <div className="nav-item">
              <Shield size={20} />
              <span>Security</span>
            </div>
            <div className="nav-item">
              <Database size={20} />
              <span>Data Management</span>
            </div>
          </div>
        </div>

        <div className="settings-content">
          {/* Notifications Settings */}
          <div className="settings-section">
            <h2>
              <Bell size={24} />
              Notification Preferences
            </h2>
            <div className="setting-group">
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailAlerts}
                    onChange={(e) => handleSettingChange('notifications', 'emailAlerts', e.target.checked)}
                  />
                  <span>Email Alerts</span>
                </label>
                <p>Receive email notifications for important updates</p>
              </div>
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.notifications.smsAlerts}
                    onChange={(e) => handleSettingChange('notifications', 'smsAlerts', e.target.checked)}
                  />
                  <span>SMS Alerts</span>
                </label>
                <p>Receive SMS notifications for critical alerts</p>
              </div>
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.notifications.pushNotifications}
                    onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                  />
                  <span>Push Notifications</span>
                </label>
                <p>Receive browser push notifications</p>
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="settings-section">
            <h2>
              <Shield size={24} />
              Security Settings
            </h2>
            <div className="setting-group">
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.security.twoFactorAuth}
                    onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                  />
                  <span>Two-Factor Authentication</span>
                </label>
                <p>Add an extra layer of security to your account</p>
              </div>
              <div className="setting-item">
                <label>
                  <span>Session Timeout (minutes)</span>
                  <select
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', e.target.value)}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                  </select>
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <span>Password Expiry (days)</span>
                  <select
                    value={settings.security.passwordExpiry}
                    onChange={(e) => handleSettingChange('security', 'passwordExpiry', e.target.value)}
                  >
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                    <option value="180">180 days</option>
                  </select>
                </label>
              </div>
            </div>
          </div>

          {/* Data Management Settings */}
          <div className="settings-section">
            <h2>
              <Database size={24} />
              Data Management
            </h2>
            <div className="setting-group">
              <div className="setting-item">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.data.autoBackup}
                    onChange={(e) => handleSettingChange('data', 'autoBackup', e.target.checked)}
                  />
                  <span>Automatic Backup</span>
                </label>
                <p>Automatically backup your data</p>
              </div>
              <div className="setting-item">
                <label>
                  <span>Backup Frequency</span>
                  <select
                    value={settings.data.backupFrequency}
                    onChange={(e) => handleSettingChange('data', 'backupFrequency', e.target.value)}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
              </div>
              <div className="setting-item">
                <label>
                  <span>Data Retention (days)</span>
                  <select
                    value={settings.data.dataRetention}
                    onChange={(e) => handleSettingChange('data', 'dataRetention', e.target.value)}
                  >
                    <option value="90">90 days</option>
                    <option value="180">180 days</option>
                    <option value="365">1 year</option>
                    <option value="730">2 years</option>
                  </select>
                </label>
              </div>
              <div className="setting-item">
                <button onClick={handleExportData} className="export-data-btn">
                  <Download size={16} />
                  Export All Data
                </button>
                <p>Download a complete backup of your data</p>
              </div>
            </div>
          </div>

          <div className="settings-actions">
            <button onClick={handleSaveSettings} className="save-btn">
              Save Settings
            </button>
            <button className="cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

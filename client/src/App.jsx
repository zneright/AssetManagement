import React, { useState } from 'react';
import { Card, Typography, Button, Space, Tag } from 'antd';
import Login from './components/Login';

const { Title, Text } = Typography;

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  // kapag hindi pa logged in, pakita login form
  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  // temporary view kapag successful login
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5', padding: '16px' }}>
      <Card style={{ width: 420, textAlign: 'center', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          <Tag color="success">Authenticated</Tag>
          <div>
            <Title level={3} style={{ marginBottom: 4 }}>Welcome, {currentUser.fullName}!</Title>
            <Text type="secondary">Logged in as @{currentUser.username}</Text>
          </div>
          <Button onClick={handleLogout} danger block>
            Log out
          </Button>
        </Space>
      </Card>
    </div>
  );
}

export default App;

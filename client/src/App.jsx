import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Space, Card, Tag } from 'antd';
import Login from './components/Login';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('token');
      return savedUser && savedToken ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  // makinig sa auth:logout event pag na-expire token
  useEffect(() => {
    const handleAuthExpired = () => {
      setCurrentUser(null);
    };
    window.addEventListener('auth:logout', handleAuthExpired);
    return () => window.removeEventListener('auth:logout', handleAuthExpired);
  }, []);

  // kung walang user o token, pakita login page
  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#001529',
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            Asset Tracker
          </Title>
          <Tag color="blue">Dashboard</Tag>
        </div>

        <Space size="middle">
          <Text style={{ color: '#d9d9d9' }}>
            {currentUser.fullName} (@{currentUser.username})
          </Text>
          <Button type="primary" danger size="small" onClick={handleLogout}>
            Log out
          </Button>
        </Space>
      </Header>

      <Content style={{ padding: '24px 32px', maxWidth: 1200, width: '100%', margin: '0 auto' }}>
        <Card
          style={{
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <Title level={4} style={{ marginBottom: 8 }}>Assets</Title>
          <Text type="secondary">
            Authenticated shell ready. Next phase will attach the live Ant Design asset table.
          </Text>
        </Card>
      </Content>

      <Footer style={{ textAlign: 'center', color: '#8c8c8c', background: 'transparent' }}>
        Asset Tracker © {new Date().getFullYear()} — Internal Company Assessment
      </Footer>
    </Layout>
  );
}

export default App;

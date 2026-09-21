import React, { useState, useEffect } from 'react';
import { Card, Typography, Tag, Button, Space, Spin, Alert } from 'antd';
import api from './api';

const { Title, Text } = Typography;

function App() {
  const [serverStatus, setServerStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // chek connection sa backend
  const checkBackend = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/health');
      setServerStatus(res.data);
    } catch (err) {
      setError(err.message || 'Cannot connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '24px' }}>
      <Card style={{ width: 480, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: 8 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Title level={3} style={{ marginBottom: 4 }}>Asset Tracker</Title>
            <Text type="secondary">Frontend bootstrap foundation check</Text>
          </div>

          <div>
            <Text strong>Stack Verification:</Text>
            <div style={{ marginTop: 8 }}>
              <Space wrap>
                <Tag color="cyan">React 19</Tag>
                <Tag color="purple">Vite 8</Tag>
                <Tag color="blue">Ant Design</Tag>
                <Tag color="geekblue">Axios</Tag>
              </Space>
            </div>
          </div>

          <div>
            <Text strong>Backend API Status:</Text>
            <div style={{ marginTop: 8 }}>
              {loading && <Spin size="small" />}
              {serverStatus && (
                <Tag color="success">Backend Online ({serverStatus.status})</Tag>
              )}
              {error && (
                <Alert message={error} type="error" showIcon style={{ marginTop: 8 }} />
              )}
            </div>
          </div>

          <Button type="primary" onClick={checkBackend} loading={loading} block>
            Re-test Backend Connection
          </Button>
        </Space>
      </Card>
    </div>
  );
}

export default App;

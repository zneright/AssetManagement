import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert } from 'antd';
import api from '../api';

const { Title, Text } = Typography;

function Login({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // submit login form
  const onFinish = async (values) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await api.post('/login', {
        username: values.username,
        password: values.password
      });

      // save token tsaka user details
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      if (onLoginSuccess) {
        onLoginSuccess(res.data.user, res.data.token);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5', padding: '16px' }}>
      <Card style={{ width: 380, boxShadow: '0 4px 16px rgba(0,0,0,0.08)', borderRadius: 8 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ marginBottom: 4 }}>Asset Tracker</Title>
          <Text type="secondary">Sign in to manage company assets</Text>
        </div>

        {errorMessage && (
          <Alert
            title={errorMessage}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          name="login_form"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Please enter your username' }]}
          >
            <Input placeholder="Enter username" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please enter your password' }]}
          >
            <Input.Password placeholder="Enter password" />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Log in
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default Login;

import React, { useState, useEffect } from 'react';
import { Table, Tag, Typography, Button, Space, message } from 'antd';
import api from '../api';

const { Text } = Typography;

function AssetTable({ onEdit, onDelete, refreshTrigger }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.get('/assets')
      .then((res) => {
        if (isMounted) {
          setAssets(res.data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          message.error(err.response?.data?.message || 'Failed to load assets');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  // kulay ng status tag
  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') return 'green';
    if (s.includes('maintenance') || s.includes('repair')) return 'orange';
    return 'default';
  };

  const columns = [
    {
      title: 'Asset Name',
      dataIndex: 'AssetName',
      key: 'AssetName',
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Category',
      dataIndex: 'Category',
      key: 'Category',
      render: (cat) => <Tag color="blue">{cat}</Tag>,
    },
    {
      title: 'Serial Number',
      dataIndex: 'SerialNumber',
      key: 'SerialNumber',
      render: (sn) => <Text code>{sn}</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'Status',
      key: 'Status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Estimated Value',
      dataIndex: 'EstimatedValue',
      key: 'EstimatedValue',
      render: (val) => `$${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button size="small" onClick={() => onEdit && onEdit(record)}>
            Edit
          </Button>
          <Button size="small" danger onClick={() => onDelete && onDelete(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Table
      dataSource={assets}
      columns={columns}
      rowKey="Id"
      loading={loading}
      pagination={{ pageSize: 8 }}
    />
  );
}

export default AssetTable;

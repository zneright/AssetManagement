import React, { useState, useEffect } from 'react';
import { Table, Tag, Typography, Button, Space, Input, Select, message } from 'antd';
import api from '../api';

const { Text } = Typography;
const { Search } = Input;

function AssetTable({ onEdit, onDelete, refreshTrigger }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  // filering ng assets client side
  const filteredAssets = assets.filter((item) => {
    const query = searchText.toLowerCase().trim();
    const matchesSearch =
      !query ||
      item.AssetName?.toLowerCase().includes(query) ||
      item.SerialNumber?.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'ALL' ||
      item.Status?.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

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
      render: (val) => `₱${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
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
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Space wrap>
          <Search
            placeholder="Search name or serial..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260 }}
          />
          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            style={{ width: 140 }}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'Active', label: 'Active' },
              { value: 'In Repair', label: 'In Repair' },
              { value: 'Retired', label: 'Retired' },
            ]}
          />
        </Space>

        <Text type="secondary" style={{ fontSize: 13 }}>
          Showing {filteredAssets.length} of {assets.length} assets
        </Text>
      </div>

      <Table
        dataSource={filteredAssets}
        columns={columns}
        rowKey="Id"
        loading={loading}
        pagination={{ pageSize: 8 }}
      />
    </div>
  );
}

export default AssetTable;

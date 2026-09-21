import React, { useState, useEffect } from 'react';
import { Table, Tag, Typography, Button, Space, Input, Select, Popconfirm, Row, Col, Card, Statistic, message } from 'antd';
import api from '../api';
import AssetModal from './AssetModal';

const { Text } = Typography;
const { Search } = Input;

function AssetTable({ onEdit, onDelete, refreshTrigger }) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

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
  }, [refreshTrigger, reloadKey]);

  // buksan modal para sa new asset
  const handleOpenCreate = () => {
    setSelectedAsset(null);
    setModalOpen(true);
  };

  // para sa edit naman
  const handleOpenEdit = (record) => {
    setSelectedAsset({ ...record });
    setModalOpen(true);
    if (onEdit) onEdit(record);
  };

  // delee handler ng asset
  const handleDelete = async (record) => {
    try {
      await api.delete(`/assets/${record.Id}`);
      message.success(`Asset "${record.AssetName}" deleted successfully`);
      setReloadKey((k) => k + 1);
      if (onDelete) onDelete(record);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to delete asset');
    }
  };

  // kulay ng status tag
  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') return 'green';
    if (s.includes('maintenance') || s.includes('repair')) return 'orange';
    return 'default';
  };

  // kalkula ng summary stats para sa cards
  const totalCount = assets.length;
  const totalValue = assets.reduce((sum, item) => sum + (Number(item.EstimatedValue) || 0), 0);
  const activeCount = assets.filter((item) => (item.Status || '').toLowerCase() === 'active').length;
  const inRepairCount = assets.filter((item) => {
    const s = (item.Status || '').toLowerCase();
    return s.includes('repair') || s.includes('maintenance');
  }).length;

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

  // export to csv helper para ma download file
  const handleExportCSV = () => {
    if (!assets || assets.length === 0) {
      message.warning('No assets available to export');
      return;
    }

    const headers = ['ID', 'Asset Name', 'Category', 'Serial Number', 'Status', 'Estimated Value (PHP)', 'Created At'];

    // i-format bawat row
    const rows = filteredAssets.map((item) => [
      item.Id,
      `"${(item.AssetName || '').replace(/"/g, '""')}"`,
      `"${(item.Category || '').replace(/"/g, '""')}"`,
      `"${(item.SerialNumber || '').replace(/"/g, '""')}"`,
      `"${(item.Status || '').replace(/"/g, '""')}"`,
      Number(item.EstimatedValue || 0).toFixed(2),
      `"${item.CreatedAt ? new Date(item.CreatedAt).toISOString().split('T')[0] : ''}"`,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `company_assets_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    message.success(`Exported ${filteredAssets.length} assets to CSV`);
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
      render: (val) => `₱${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button size="small" onClick={() => handleOpenEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this asset?"
            description={`Are you sure you want to delete ${record.AssetName}?`}
            onConfirm={() => handleDelete(record)}
            okText="Yes, delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* stats cards sa taas */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 6, background: '#fafafa' }}>
            <Statistic title="Total Assets" value={totalCount} />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 6, background: '#fafafa' }}>
            <Statistic
              title="Total Value"
              value={totalValue}
              precision={2}
              prefix="₱"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 6, background: '#fafafa' }}>
            <Statistic
              title="Active Assets"
              value={activeCount}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" style={{ borderRadius: 6, background: '#fafafa' }}>
            <Statistic
              title="In Repair"
              value={inRepairCount}
              valueStyle={{ color: '#d46b08' }}
            />
          </Card>
        </Col>
      </Row>

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
            style={{ width: 240 }}
          />
          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            style={{ width: 130 }}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'Active', label: 'Active' },
              { value: 'In Repair', label: 'In Repair' },
              { value: 'Retired', label: 'Retired' },
            ]}
          />
          <Button type="primary" onClick={handleOpenCreate}>
            + Add Asset
          </Button>
          <Button onClick={handleExportCSV}>
            Export CSV
          </Button>
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
        locale={{
          emptyText: assets.length === 0 ? 'No assets registered yet' : 'No matching assets found',
        }}
      />

      <AssetModal
        open={modalOpen}
        initialValues={selectedAsset}
        onClose={() => setModalOpen(false)}
        onSuccess={() => setReloadKey((k) => k + 1)}
      />
    </div>
  );
}

export default AssetTable;

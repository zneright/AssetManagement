import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, InputNumber, message } from 'antd';
import api from '../api';

function AssetModal({ open, onClose, onSuccess, initialValues }) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(initialValues && initialValues.Id);

  // pag nagbago initialValues or nagbukas modal i-set fields
  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
        form.setFieldsValue({
          Status: 'Active',
          Category: 'Electronics',
        });
      }
    }
  }, [open, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (isEdit) {
        await api.put(`/assets/${initialValues.Id}`, values);
        message.success('Asset updated successfully');
      } else {
        await api.post('/assets', values);
        message.success('Asset created successfully');
      }

      setSubmitting(false);
      onSuccess();
      onClose();
    } catch (err) {
      setSubmitting(false);
      // skip kung validation error lng ng form
      if (err.errorFields) return;
      message.error(err.response?.data?.message || 'Error saving asset');
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit Asset' : 'Add New Asset'}
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={submitting}
      destroyOnHidden
      okText={isEdit ? 'Update' : 'Create'}
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item
          label="Asset Name"
          name="AssetName"
          rules={[
            { required: true, message: 'Please enter asset name' },
            { max: 100, message: 'Max 100 characters' },
          ]}
        >
          <Input placeholder="e.g. MacBook Pro 16" />
        </Form.Item>

        <Form.Item
          label="Category"
          name="Category"
          rules={[{ required: true, message: 'Please select category' }]}
        >
          <Select
            options={[
              { value: 'Electronics', label: 'Electronics' },
              { value: 'Furniture', label: 'Furniture' },
              { value: 'Vehicles', label: 'Vehicles' },
              { value: 'Office Equipment', label: 'Office Equipment' },
              { value: 'Other', label: 'Other' },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Serial Number"
          name="SerialNumber"
          rules={[
            { required: true, message: 'Please enter serial number' },
            { max: 50, message: 'Max 50 characters' },
          ]}
        >
          <Input placeholder="e.g. SN-MBP-2026-009" />
        </Form.Item>

        <Form.Item
          label="Status"
          name="Status"
          rules={[{ required: true, message: 'Please select status' }]}
        >
          <Select
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'In Repair', label: 'In Repair' },
              { value: 'Retired', label: 'Retired' },
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Estimated Value"
          name="EstimatedValue"
          rules={[
            { required: true, message: 'Please enter estimated value' },
            {
              type: 'number',
              min: 0,
              message: 'Value must be at least 0',
            },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            prefix="₱"
            placeholder="0.00"
            precision={2}
            min={0}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default AssetModal;

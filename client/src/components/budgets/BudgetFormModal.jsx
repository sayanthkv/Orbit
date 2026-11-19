import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { Target, Check } from 'lucide-react';

export const BudgetFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  categories = [],
  month,
  year,
  initialData = null,
  isLoading = false,
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    category: '',
    monthlyLimit: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        category: initialData.category?._id || initialData.category || '',
        monthlyLimit: initialData.monthlyLimit || '',
      });
    } else {
      const expenseCats = categories.filter((c) => c.type === 'expense');
      setFormData({
        category: expenseCats[0]?._id || '',
        monthlyLimit: '',
      });
    }
    setErrors({});
  }, [initialData, isOpen, categories]);

  const validate = () => {
    const errs = {};
    if (!formData.category) {
      errs.category = 'Please select an expense category';
    }
    if (!formData.monthlyLimit || Number(formData.monthlyLimit) <= 0) {
      errs.monthlyLimit = 'Please enter a budget limit greater than 0';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      category: formData.category,
      monthlyLimit: Number(formData.monthlyLimit),
      month,
      year,
    });
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Category Monthly Budget"
      description="Define spending limits to receive warning alerts before overspending"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Expense Category"
          required
          error={errors.category}
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          options={[
            { value: '', label: 'Select Category' },
            ...expenseCategories.map((c) => ({
              value: c._id,
              label: c.name,
            })),
          ]}
        />

        <Input
          label={`Monthly Budget Limit (${user?.currency || 'INR'})`}
          type="number"
          step="1"
          min="1"
          placeholder="e.g. 15000"
          required
          error={errors.monthlyLimit}
          value={formData.monthlyLimit}
          onChange={(e) => setFormData({ ...formData, monthlyLimit: e.target.value })}
        />

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="md" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" size="md" isLoading={isLoading} icon={Check}>
            Save Budget
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default BudgetFormModal;

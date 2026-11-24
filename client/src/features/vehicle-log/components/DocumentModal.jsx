import React, { useState } from 'react';
import Modal from '../../../components/Modal';
import Input from '../../../components/Input';
import Button from '../../../components/Button';
import { FileText, Shield } from 'lucide-react';

export const DocumentModal = ({ isOpen, onClose, onSave, activeVehicle }) => {
  const [formData, setFormData] = useState({
    documentType: 'insurance',
    customName: '',
    policyNumber: '',
    issuer: '',
    expiryDate: '',
    premiumAmount: '',
    insuredDeclaredValue: '',
    isUserLevel: false,
    alsoRecordExpense: true,
    expenseSource: 'cash',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.expiryDate) return;
    setIsLoading(true);
    const success = await onSave(formData);
    setIsLoading(false);
    if (success) onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Vehicle Document" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5 font-display">
              Document Type
            </label>
            <select
              value={formData.documentType}
              onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#141418] text-sm text-zinc-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="insurance">Insurance Policy</option>
              <option value="puc">Pollution Certificate (PUC)</option>
              <option value="rc">Registration Certificate (RC)</option>
              <option value="road_tax">Road Tax</option>
              <option value="fitness">Fitness Certificate</option>
              <option value="driving_license">Driving License (User-Level)</option>
              <option value="other">Other Custom Document</option>
            </select>
          </div>

          <Input
            label="Expiry Date"
            type="date"
            required
            value={formData.expiryDate}
            onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Policy / Certificate Number"
            placeholder="e.g. POL-84920492"
            value={formData.policyNumber}
            onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
          />
          <Input
            label="Issuer / Provider"
            placeholder="e.g. HDFC ERGO, ICICI Lombard, RTO"
            value={formData.issuer}
            onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
          />
        </div>

        {formData.documentType === 'insurance' && (
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Premium Amount (₹)"
              type="number"
              placeholder="e.g. 8500"
              value={formData.premiumAmount}
              onChange={(e) => setFormData({ ...formData, premiumAmount: e.target.value })}
            />
            <Input
              label="Insured Value / IDV (₹)"
              type="number"
              placeholder="e.g. 520000"
              value={formData.insuredDeclaredValue}
              onChange={(e) => setFormData({ ...formData, insuredDeclaredValue: e.target.value })}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} icon={Shield}>
            Save Document
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DocumentModal;

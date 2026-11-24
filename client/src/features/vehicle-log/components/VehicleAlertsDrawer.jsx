import React from 'react';
import Modal from '../../../components/Modal';
import Button from '../../../components/Button';
import { AlertTriangle, Clock, Check } from 'lucide-react';

export const VehicleAlertsDrawer = ({ isOpen, onClose, alerts = [], onDismiss }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vehicle Reminders & Alerts" size="md">
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="p-8 text-center text-zinc-400 text-xs">
            No active vehicle alerts. All services and document expiries are up to date!
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/5 space-y-2"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className={`w-4 h-4 ${
                      alert.severity === 'critical' ? 'text-rose-500' : 'text-amber-500'
                    }`}
                  />
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                    {alert.title}
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-zinc-400">{alert.vehicleName}</span>
              </div>

              <p className="text-xs text-zinc-500">{alert.message}</p>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  size="xs"
                  variant="ghost"
                  icon={Clock}
                  onClick={() => onDismiss(alert.id, 7)}
                >
                  Snooze 7 Days
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  icon={Check}
                  onClick={() => onDismiss(alert.id, 30)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
};

export default VehicleAlertsDrawer;

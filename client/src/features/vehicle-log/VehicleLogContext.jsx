import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';

const VehicleLogContext = createContext(null);

export const VehicleLogProvider = ({ children }) => {
  const [vehicles, setVehicles] = useState([]);
  const [activeVehicleId, setActiveVehicleId] = useState(null);
  const [vehicleDetails, setVehicleDetails] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [todayFuelPrice, setTodayFuelPrice] = useState(null);
  const toast = useToast();

  // Fetch all vehicles
  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/vehicles');
      if (res.success && res.data) {
        const list = res.data.vehicles || [];
        setVehicles(list);

        // Restore saved vehicle from localStorage or default to first
        const savedId = localStorage.getItem('orbit_active_vehicle_id');
        const match = list.find((v) => v._id === savedId && !v.isArchived);
        const fallback = list.find((v) => !v.isArchived) || list[0];
        const targetId = match ? match._id : fallback ? fallback._id : null;

        if (targetId) {
          setActiveVehicleId(targetId);
          localStorage.setItem('orbit_active_vehicle_id', targetId);
        }
      }
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch active vehicle full stats
  const fetchActiveVehicleDetails = useCallback(async (id) => {
    if (!id) return;
    try {
      const res = await api.get(`/vehicles/${id}`);
      if (res.success && res.data) {
        setVehicleDetails(res.data);
      }
    } catch (err) {
      console.error('Failed to load vehicle details:', err);
    }
  }, []);

  // Fetch alerts across all vehicles
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.get('/vehicles/alerts');
      if (res.success && res.data) {
        setAlerts(res.data);
      }
    } catch {}
  }, []);

  // Fetch today's fuel rate for active vehicle fuel type
  const fetchFuelRate = useCallback(async (fuelType = 'petrol') => {
    try {
      const res = await api.get(`/vehicles/fuel-prices?fuelType=${fuelType}`);
      if (res.success && res.data) {
        setTodayFuelPrice(res.data.latestPrice || (fuelType === 'diesel' ? 88 : 102));
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchVehicles();
    fetchAlerts();
  }, [fetchVehicles, fetchAlerts]);

  useEffect(() => {
    if (activeVehicleId) {
      fetchActiveVehicleDetails(activeVehicleId);
      const activeV = vehicles.find((v) => v._id === activeVehicleId);
      if (activeV) {
        fetchFuelRate(activeV.fuelType);
      }
    }
  }, [activeVehicleId, vehicles, fetchActiveVehicleDetails, fetchFuelRate]);

  const selectVehicle = (id) => {
    setActiveVehicleId(id);
    localStorage.setItem('orbit_active_vehicle_id', id);
  };

  const createVehicle = async (data) => {
    try {
      const res = await api.post('/vehicles', data);
      if (res.success && res.data) {
        toast.success(res.message || 'Vehicle added!');
        await fetchVehicles();
        selectVehicle(res.data._id);
        return { success: true, data: res.data };
      }
    } catch (err) {
      toast.error(err.message || 'Failed to add vehicle');
      return { success: false, message: err.message };
    }
  };

  const updateVehicle = async (id, data) => {
    try {
      const res = await api.put(`/vehicles/${id}`, data);
      if (res.success && res.data) {
        toast.success(res.message || 'Vehicle updated!');
        await fetchVehicles();
        await fetchActiveVehicleDetails(id);
        return { success: true };
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update vehicle');
      return { success: false };
    }
  };

  const deleteVehicle = async (id) => {
    try {
      const res = await api.delete(`/vehicles/${id}`);
      if (res.success) {
        toast.success(res.message || 'Vehicle deleted.');
        localStorage.removeItem('orbit_active_vehicle_id');
        await fetchVehicles();
        return { success: true };
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete vehicle');
      return { success: false };
    }
  };

  const dismissAlert = async (alertId, snoozeDays = 7) => {
    try {
      await api.post('/vehicles/alerts/dismiss', { alertId, snoozeDays });
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast.info(`Alert snoozed for ${snoozeDays} days.`);
    } catch (err) {
      toast.error('Failed to dismiss alert');
    }
  };

  const activeVehicle = vehicles.find((v) => v._id === activeVehicleId) || null;

  return (
    <VehicleLogContext.Provider
      value={{
        vehicles,
        activeVehicle,
        activeVehicleId,
        vehicleDetails,
        alerts,
        loading,
        todayFuelPrice,
        selectVehicle,
        createVehicle,
        updateVehicle,
        deleteVehicle,
        dismissAlert,
        refreshDetails: () => fetchActiveVehicleDetails(activeVehicleId),
        refreshVehicles: fetchVehicles,
        refreshAlerts: fetchAlerts,
        refreshFuelRate: fetchFuelRate,
      }}
    >
      {children}
    </VehicleLogContext.Provider>
  );
};

export const useVehicleLog = () => {
  const context = useContext(VehicleLogContext);
  if (!context) {
    throw new Error('useVehicleLog must be used within a VehicleLogProvider');
  }
  return context;
};

export default VehicleLogContext;

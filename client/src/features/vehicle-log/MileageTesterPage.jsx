import React, { useState, useEffect } from 'react';
import { useVehicleLog } from './VehicleLogContext';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Card from '../../components/Card';
import ParallaxCard from '../../components/parallax/ParallaxCard';
import ParallaxSection from '../../components/parallax/ParallaxSection';
import api from '../../lib/api';
import { useToast } from '../../components/Toast';
import {
  Gauge,
  Fuel,
  TrendingUp,
  TrendingDown,
  Navigation,
  Users,
  Save,
  Sparkles,
  Calculator,
  ArrowRight,
  Info,
} from 'lucide-react';

export const MileageTesterPage = () => {
  const { activeVehicle, vehicleDetails, todayFuelPrice, refreshFuelRate, refreshDetails } = useVehicleLog();
  const toast = useToast();

  // Fuel price state
  const [currentRate, setCurrentRate] = useState(todayFuelPrice || 102);
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);

  // Active sub-tool tab: 'full_tank' | 'mileage_test' | 'trip_estimator'
  const [activeTool, setActiveTool] = useState('mileage_test');

  // Tool A: Full Tank Calculator State
  const [fuelSliderPct, setFuelSliderPct] = useState(25); // 25% full
  const [manualRemainingLitres, setManualRemainingLitres] = useState('');

  // Tool B: Mileage Tester State
  const [mileageMode, setMileageMode] = useState('full_to_full'); // 'full_to_full' | 'partial'
  const [lastOdo, setLastOdo] = useState('');
  const [currOdo, setCurrOdo] = useState('');
  const [litresFilled, setLitresFilled] = useState('');
  const [partialDistance, setPartialDistance] = useState('');
  const [isSavingFuelLog, setIsSavingFuelLog] = useState(false);

  // Tool C: Trip Cost Estimator State
  const [tripDistance, setTripDistance] = useState('240');
  const [tripCustomMileage, setTripCustomMileage] = useState('');
  const [passengerCount, setPassengerCount] = useState(1);

  // Sync active vehicle odometer and average mileage
  const tankCap = activeVehicle?.tankCapacity || 45;
  const avgMileage = vehicleDetails?.stats?.averageMileage || (activeVehicle?.type === 'bike' ? 45 : 16);

  useEffect(() => {
    if (todayFuelPrice) {
      setCurrentRate(todayFuelPrice);
    }
  }, [todayFuelPrice]);

  useEffect(() => {
    if (activeVehicle?.currentOdometer) {
      setLastOdo(Math.max(0, activeVehicle.currentOdometer - 320));
      setCurrOdo(activeVehicle.currentOdometer);
    }
    if (avgMileage) {
      setTripCustomMileage(avgMileage);
    }
  }, [activeVehicle, avgMileage]);

  // Handle saving today's fuel rate
  const handleSaveRate = async () => {
    if (!currentRate || Number(currentRate) <= 0) return;
    setIsUpdatingRate(true);
    try {
      const res = await api.post('/vehicles/fuel-prices', {
        fuelType: activeVehicle?.fuelType || 'petrol',
        pricePerLitre: Number(currentRate),
      });
      if (res.success) {
        toast.success(`Fuel rate updated to ₹${currentRate}/L`);
        refreshFuelRate(activeVehicle?.fuelType);
      }
    } catch {
      toast.error('Failed to update rate');
    } finally {
      setIsUpdatingRate(false);
    }
  };

  // ---------------- TOOL A CALCULATIONS ----------------
  const remainingLitresFromPct = (tankCap * (fuelSliderPct / 100));
  const effectiveRemaining = manualRemainingLitres !== '' ? Number(manualRemainingLitres) : remainingLitresFromPct;
  const litresNeededToFull = Math.max(0, tankCap - effectiveRemaining);
  const costToFillToBrim = litresNeededToFull * Number(currentRate);
  const estimatedFullRange = tankCap * avgMileage;
  const remainingCurrentRange = effectiveRemaining * avgMileage;
  const costPerKmGeneral = avgMileage > 0 ? Number(currentRate) / avgMileage : 0;

  // ---------------- TOOL B CALCULATIONS ----------------
  const travelKm =
    mileageMode === 'full_to_full'
      ? Math.max(0, (Number(currOdo) || 0) - (Number(lastOdo) || 0))
      : Number(partialDistance) || 0;

  const numLitres = Number(litresFilled) || 0;
  const calculatedMileage = numLitres > 0 && travelKm > 0 ? travelKm / numLitres : 0;
  const calculatedCostPerKm = travelKm > 0 ? (numLitres * Number(currentRate)) / travelKm : 0;
  const mileageDelta = avgMileage > 0 && calculatedMileage > 0 ? calculatedMileage - avgMileage : 0;
  const mileageDeltaPct = avgMileage > 0 ? Math.round((mileageDelta / avgMileage) * 100) : 0;
  const isBetterMileage = mileageDelta >= 0;

  const handleSaveToFuelLog = async () => {
    if (!activeVehicle || !currOdo || !numLitres) {
      toast.error('Enter valid odometer and litres filled to save to fuel log.');
      return;
    }
    setIsSavingFuelLog(true);
    try {
      const res = await api.post(`/vehicles/${activeVehicle._id}/fuel`, {
        odometer: Number(currOdo),
        litres: numLitres,
        pricePerLitre: Number(currentRate),
        totalAmount: Math.round(numLitres * Number(currentRate) * 100) / 100,
        isFullTank: mileageMode === 'full_to_full',
        isPartial: mileageMode !== 'full_to_full',
        note: `Logged via Mileage Tester (${calculatedMileage.toFixed(1)} km/l)`,
        alsoRecordExpense: true,
        expenseSource: 'cash',
      });
      if (res.success) {
        toast.success(`Fuel entry saved! Mileage: ${calculatedMileage.toFixed(1)} km/l`);
        refreshDetails();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save to fuel log');
    } finally {
      setIsSavingFuelLog(false);
    }
  };

  // ---------------- TOOL C CALCULATIONS ----------------
  const tripKm = Number(tripDistance) || 0;
  const tripM = Number(tripCustomMileage) || avgMileage || 15;
  const tripFuelLitres = tripM > 0 ? tripKm / tripM : 0;
  const tripTotalCost = tripFuelLitres * Number(currentRate);
  const tankFillsNeeded = tankCap > 0 ? tripFuelLitres / tankCap : 0;
  const costPerPassenger = passengerCount > 0 ? tripTotalCost / passengerCount : tripTotalCost;

  if (!activeVehicle) {
    return (
      <div className="p-8 text-center bg-white/50 dark:bg-white/5 rounded-3xl border border-zinc-200 dark:border-white/10">
        <p className="text-zinc-500 font-medium">Please add or select a vehicle first to use the Mileage Tester.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Today's Fuel Rate Bar */}
      <ParallaxSection offset={15} speed={0.08}>
        <div className="p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-[#121217]/90 border border-zinc-200/80 dark:border-white/10 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Fuel className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-zinc-500 font-display">
                Today's {activeVehicle.fuelType.toUpperCase()} Rate
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums font-display">
                  ₹{Number(currentRate).toFixed(2)}
                </span>
                <span className="text-xs text-zinc-500 font-medium">/ litre</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="number"
              step="0.05"
              value={currentRate}
              onChange={(e) => setCurrentRate(e.target.value)}
              className="w-28 px-3 py-2 text-sm font-bold rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 tabular-nums"
              placeholder="102.50"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isUpdatingRate}
              onClick={handleSaveRate}
              className="text-xs font-bold"
            >
              Update Rate
            </Button>
          </div>
        </div>
      </ParallaxSection>

      {/* Tool Navigation Switcher */}
      <div className="flex p-1.5 rounded-2xl bg-zinc-200/60 dark:bg-white/5 border border-zinc-200/60 dark:border-white/8 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => setActiveTool('mileage_test')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all font-display ${
            activeTool === 'mileage_test'
              ? 'bg-white dark:bg-[#18181f] text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          Mileage Tester
        </button>
        <button
          type="button"
          onClick={() => setActiveTool('full_tank')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all font-display ${
            activeTool === 'full_tank'
              ? 'bg-white dark:bg-[#18181f] text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          Full Tank Calc
        </button>
        <button
          type="button"
          onClick={() => setActiveTool('trip_estimator')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all font-display ${
            activeTool === 'trip_estimator'
              ? 'bg-white dark:bg-[#18181f] text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10'
              : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
          }`}
        >
          Trip Estimator
        </button>
      </div>

      {/* ---------------- TOOL B: MILEAGE TESTER (CORE FEATURE) ---------------- */}
      {activeTool === 'mileage_test' && (
        <ParallaxSection offset={25} speed={0.1}>
          <div className="space-y-6">
            <ParallaxCard depth={12} className="p-6 sm:p-8 bg-white/90 dark:bg-[#121217]/90 border border-zinc-200/90 dark:border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-zinc-900 dark:text-white font-display flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-emerald-500" />
                    <span>Real-world Mileage Tester</span>
                  </h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Calculate actual fuel efficiency from consecutive odometer readings.
                  </p>
                </div>

                {/* Full-to-Full vs Partial Toggle */}
                <div className="flex p-1 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setMileageMode('full_to_full')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      mileageMode === 'full_to_full'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Full-to-Full (Accurate)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMileageMode('partial')}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      mileageMode === 'partial'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Partial Fill
                  </button>
                </div>
              </div>

              {/* Input Form */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {mileageMode === 'full_to_full' ? (
                  <>
                    <Input
                      label="Previous Odometer (km)"
                      type="number"
                      placeholder="e.g. 18200"
                      value={lastOdo}
                      onChange={(e) => setLastOdo(e.target.value)}
                    />
                    <Input
                      label="Current Odometer (km)"
                      type="number"
                      placeholder="e.g. 18620"
                      value={currOdo}
                      onChange={(e) => setCurrOdo(e.target.value)}
                    />
                  </>
                ) : (
                  <Input
                    label="Distance Driven (km)"
                    type="number"
                    placeholder="e.g. 250"
                    value={partialDistance}
                    onChange={(e) => setPartialDistance(e.target.value)}
                  />
                )}

                <Input
                  label="Fuel Filled (Litres)"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 22.5"
                  value={litresFilled}
                  onChange={(e) => setLitresFilled(e.target.value)}
                />
              </div>

              {/* Distance Traveled Pill */}
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-500">
                <span>Distance covered:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black tabular-nums">
                  {travelKm} km
                </span>
                {mileageMode === 'partial' && (
                  <span className="text-[11px] text-zinc-400 italic">
                    (Note: Full-to-full fill provides exact vehicle economy)
                  </span>
                )}
              </div>

              {/* Computed Live Result Display */}
              <div className="p-6 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/50 dark:border-white/5">
                    <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Calculated Mileage</p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 font-display">
                      {calculatedMileage > 0 ? calculatedMileage.toFixed(2) : '--'}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-medium">km / litre</p>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/50 dark:border-white/5">
                    <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Cost Per Km</p>
                    <p className="text-3xl font-black text-zinc-900 dark:text-white tabular-nums mt-1 font-display">
                      ₹{calculatedCostPerKm > 0 ? calculatedCostPerKm.toFixed(2) : '--'}
                    </p>
                    <p className="text-[11px] text-zinc-400 font-medium">at ₹{currentRate}/L</p>
                  </div>

                  <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-zinc-200/50 dark:border-white/5">
                    <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Historical Comparison</p>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      {isBetterMileage ? (
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-rose-500" />
                      )}
                      <span
                        className={`text-xl font-black tabular-nums font-display ${
                          isBetterMileage ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {mileageDelta > 0 ? `+${mileageDelta.toFixed(1)}` : mileageDelta.toFixed(1)} km/l
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-medium">
                      {mileageDeltaPct >= 0 ? `+${mileageDeltaPct}% better` : `${mileageDeltaPct}% below avg`}
                    </p>
                  </div>
                </div>

                {/* 1-Tap Save to Fuel Log Action */}
                <div className="flex items-center justify-end pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    isLoading={isSavingFuelLog}
                    onClick={handleSaveToFuelLog}
                    icon={Save}
                    iconPosition="left"
                    className="w-full sm:w-auto font-bold shadow-md shadow-emerald-600/20"
                  >
                    Save to Fuel Log
                  </Button>
                </div>
              </div>
            </ParallaxCard>
          </div>
        </ParallaxSection>
      )}

      {/* ---------------- TOOL A: FULL TANK CALCULATOR ---------------- */}
      {activeTool === 'full_tank' && (
        <ParallaxSection offset={25} speed={0.1}>
          <ParallaxCard depth={12} className="p-6 sm:p-8 bg-white/90 dark:bg-[#121217]/90 border border-zinc-200/90 dark:border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6">
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white font-display flex items-center gap-2">
                <Fuel className="w-5 h-5 text-emerald-500" />
                <span>Full-Tank Calculator</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Check how much it costs to top-up to full and your vehicle's theoretical cruising range.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-zinc-500">Current Fuel Level in Tank:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-black tabular-nums">
                  {fuelSliderPct}% ({remainingLitresFromPct.toFixed(1)} / {tankCap} L)
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={fuelSliderPct}
                onChange={(e) => {
                  setFuelSliderPct(Number(e.target.value));
                  setManualRemainingLitres('');
                }}
                className="w-full h-2.5 bg-zinc-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />

              <div className="flex justify-between text-[11px] text-zinc-400 font-bold">
                <span>Empty (Reserve)</span>
                <span>1/4</span>
                <span>Half Tank</span>
                <span>3/4</span>
                <span>Full Tank</span>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
              <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10">
                <p className="text-xs font-black uppercase tracking-wider text-zinc-500 font-display">Litres to Top-Up</p>
                <p className="text-3xl font-black text-zinc-900 dark:text-white tabular-nums mt-1 font-display">
                  {litresNeededToFull.toFixed(1)} L
                </p>
                <p className="text-[11px] text-zinc-400 font-medium">to reach full tank</p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10">
                <p className="text-xs font-black uppercase tracking-wider text-zinc-500 font-display">Cost to Fill Tank</p>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 font-display">
                  ₹{Math.round(costToFillToBrim)}
                </p>
                <p className="text-[11px] text-zinc-400 font-medium">at ₹{currentRate}/L</p>
              </div>

              <div className="p-5 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10">
                <p className="text-xs font-black uppercase tracking-wider text-zinc-500 font-display">Estimated Full Range</p>
                <p className="text-3xl font-black text-cyan-600 dark:text-cyan-400 tabular-nums mt-1 font-display">
                  {Math.round(estimatedFullRange)} km
                </p>
                <p className="text-[11px] text-zinc-400 font-medium">~{Math.round(remainingCurrentRange)} km remaining now</p>
              </div>
            </div>
          </ParallaxCard>
        </ParallaxSection>
      )}

      {/* ---------------- TOOL C: TRIP COST ESTIMATOR ---------------- */}
      {activeTool === 'trip_estimator' && (
        <ParallaxSection offset={25} speed={0.1}>
          <ParallaxCard depth={12} className="p-6 sm:p-8 bg-white/90 dark:bg-[#121217]/90 border border-zinc-200/90 dark:border-white/10 rounded-3xl backdrop-blur-xl shadow-2xl space-y-6">
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white font-display flex items-center gap-2">
                <Navigation className="w-5 h-5 text-emerald-500" />
                <span>Trip Cost Estimator</span>
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Calculate total fuel needed for a planned drive and split costs with co-passengers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="One-way or Round Trip Distance (km)"
                type="number"
                placeholder="250"
                value={tripDistance}
                onChange={(e) => setTripDistance(e.target.value)}
              />

              <Input
                label="Expected Mileage (km/l)"
                type="number"
                step="0.1"
                placeholder="16.5"
                value={tripCustomMileage}
                onChange={(e) => setTripCustomMileage(e.target.value)}
              />

              <Input
                label="Fuel Rate (₹/L)"
                type="number"
                step="0.01"
                value={currentRate}
                onChange={(e) => setCurrentRate(e.target.value)}
              />
            </div>

            {/* Passenger Split Slider */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-zinc-500 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-500" />
                  Split Cost Among Passengers:
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black">
                  {passengerCount} {passengerCount === 1 ? 'Person (Solo)' : 'People'}
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="6"
                step="1"
                value={passengerCount}
                onChange={(e) => setPassengerCount(Number(e.target.value))}
                className="w-full h-2.5 bg-zinc-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />

              <div className="flex justify-between text-[11px] text-zinc-400 font-bold">
                <span>Solo (1)</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6 People</span>
              </div>
            </div>

            {/* Trip Estimates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-3">
              <div className="p-4 rounded-xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10">
                <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Fuel Required</p>
                <p className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums mt-1 font-display">
                  {tripFuelLitres.toFixed(1)} L
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10">
                <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Tank Fills</p>
                <p className="text-2xl font-black text-zinc-900 dark:text-white tabular-nums mt-1 font-display">
                  ~{tankFillsNeeded.toFixed(1)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10">
                <p className="text-[11px] font-black uppercase tracking-wider text-zinc-500">Total Fuel Cost</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 font-display">
                  ₹{Math.round(tripTotalCost)}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20">
                <p className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-display">
                  Cost Per Person
                </p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1 font-display">
                  ₹{Math.round(costPerPassenger)}
                </p>
              </div>
            </div>
          </ParallaxCard>
        </ParallaxSection>
      )}
    </div>
  );
};

export default MileageTesterPage;

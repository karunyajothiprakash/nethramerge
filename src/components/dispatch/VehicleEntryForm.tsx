import React, { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

type Vehicle = {
  id: string;
  vehicle_number: string;
  vehicle_type: string;
};

type Props = {
  onSelect: (vehicleId: string) => void;
};

const VehicleEntryForm: React.FC<Props> = ({ onSelect }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('vehicles')
        .select('id, vehicle_number, vehicle_type')
        .eq('is_active', true)
        .order('vehicle_number', { ascending: true });
      if (!error && data) setVehicles(data as Vehicle[]);
      setIsLoading(false);
    };
    fetchVehicles();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelected(id);
    onSelect(id);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Vehicle</label>
      <select
        value={selected}
        onChange={handleChange}
        className="w-full rounded-md border bg-sidebar p-2 text-sidebar-foreground"
        disabled={isLoading || vehicles.length === 0}
      >
        <option value="" disabled>
          {isLoading ? 'Loading vehicles...' : vehicles.length === 0 ? 'No vehicles available' : 'Select a vehicle'}
        </option>
        {vehicles.map(v => (
          <option key={v.id} value={v.id}>
            {v.vehicle_number} - {v.vehicle_type}
          </option>
        ))}
      </select>
    </div>
  );
};

export default VehicleEntryForm;

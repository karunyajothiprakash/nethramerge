import React, { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

type Driver = {
  id: string;
  name: string;
  license_number: string;
};

type Props = {
  onSelect: (driverId: string) => void;
};

const DriverSelect: React.FC<Props> = ({ onSelect }) => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDrivers = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('drivers')
        .select('id, name, license_number')
        .eq('is_active', true)
        .order('name', { ascending: true });
      if (!error && data) setDrivers(data as Driver[]);
      setIsLoading(false);
    };
    fetchDrivers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelected(id);
    onSelect(id);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Driver</label>
      <select
        value={selected}
        onChange={handleChange}
        className="w-full rounded-md border bg-sidebar p-2 text-sidebar-foreground"
        disabled={isLoading || drivers.length === 0}
      >
        <option value="" disabled>
          {isLoading ? 'Loading drivers...' : drivers.length === 0 ? 'No drivers available' : 'Select a driver'}
        </option>
        {drivers.map(d => (
          <option key={d.id} value={d.id}>
            {d.name} - {d.license_number}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DriverSelect;

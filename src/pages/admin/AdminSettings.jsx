import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { Save, Bell, Shield, Palette } from 'lucide-react';
import api from '../../api/axios';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    hotel_name: 'Michu MeowStay',
    email: 'admin@michumeowstay.com',
    phone: '081234567890',
    address: 'Jl. Kucing Manis No. 42, Jakarta Selatan',
    open_time: '08:00',
    close_time: '20:00',
    max_capacity: 30,
    admin_fee: 5000,
    notify_booking: true,
    notify_checkout: true,
    notify_new_user: false,
    gps_checkin_radius: 500,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/settings');
        // Convert string booleans to actual booleans
        const formatted = { ...res.data };
        ['notify_booking', 'notify_checkout', 'notify_new_user'].forEach(key => {
          if (formatted[key] !== undefined) {
            formatted[key] = formatted[key] === '1' || formatted[key] === true;
          }
        });
        setSettings(prev => ({ ...prev, ...formatted }));
      } catch (err) {
        console.error('Failed to fetch settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert booleans back to 1/0 string for database
      const payload = { ...settings };
      ['notify_booking', 'notify_checkout', 'notify_new_user'].forEach(key => {
        payload[key] = payload[key] ? '1' : '0';
      });

      await api.put('/admin/settings', { settings: payload });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-2 uppercase">Settings</h1>
        <p className="text-gray-600 font-medium">Configure your MeowStay hotel preferences.</p>
      </div>

      {saved && (
        <div className="bg-[#4ADE80] border-4 border-neo-dark rounded-xl p-4 mb-6 font-black flex items-center gap-2 shadow-[4px_4px_0_0_#1E1E1E]">
          ✅ Settings saved successfully!
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-neo-dark"></div>
        </div>
      ) : (
      <>
      <div className="grid md:grid-cols-2 gap-8">
        {/* General Settings */}
        <div className="bg-white border-4 border-neo-dark rounded-xl p-6 shadow-[4px_4px_0_0_#1E1E1E]">
          <div className="flex items-center gap-3 mb-6 border-b-4 border-neo-dark pb-4">
            <Shield size={24} />
            <h2 className="text-2xl font-black">General</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1">Hotel Name</label>
              <input type="text" value={settings.hotel_name} onChange={e => setSettings({...settings, hotel_name: e.target.value})} className="w-full bg-neo-bg border-4 border-neo-dark rounded-lg p-3 font-bold" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Contact Email</label>
              <input type="email" value={settings.email} onChange={e => setSettings({...settings, email: e.target.value})} className="w-full bg-neo-bg border-4 border-neo-dark rounded-lg p-3 font-bold" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Phone</label>
              <input type="text" value={settings.phone} onChange={e => setSettings({...settings, phone: e.target.value})} className="w-full bg-neo-bg border-4 border-neo-dark rounded-lg p-3 font-bold" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Address</label>
              <textarea rows="2" value={settings.address} onChange={e => setSettings({...settings, address: e.target.value})} className="w-full bg-neo-bg border-4 border-neo-dark rounded-lg p-3 font-bold" />
            </div>
          </div>
        </div>

        {/* Operation Settings */}
        <div className="bg-white border-4 border-neo-dark rounded-xl p-6 shadow-[4px_4px_0_0_#1E1E1E]">
          <div className="flex items-center gap-3 mb-6 border-b-4 border-neo-dark pb-4">
            <Palette size={24} />
            <h2 className="text-2xl font-black">Operations</h2>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase mb-1">Opening Time</label>
                <input type="time" value={settings.open_time} onChange={e => setSettings({...settings, open_time: e.target.value})} className="w-full bg-neo-bg border-4 border-neo-dark rounded-lg p-3 font-bold" />
              </div>
              <div>
                <label className="block text-xs font-black uppercase mb-1">Closing Time</label>
                <input type="time" value={settings.close_time} onChange={e => setSettings({...settings, close_time: e.target.value})} className="w-full bg-neo-bg border-4 border-neo-dark rounded-lg p-3 font-bold" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Max Capacity (cats)</label>
              <input type="number" value={settings.max_capacity} onChange={e => setSettings({...settings, max_capacity: e.target.value})} className="w-full bg-neo-bg border-4 border-neo-dark rounded-lg p-3 font-bold" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Admin Fee (Rp)</label>
              <input type="number" value={settings.admin_fee} onChange={e => setSettings({...settings, admin_fee: e.target.value})} className="w-full bg-neo-bg border-4 border-neo-dark rounded-lg p-3 font-bold" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">GPS Check-in Radius (meters)</label>
              <input type="number" value={settings.gps_checkin_radius} onChange={e => setSettings({...settings, gps_checkin_radius: e.target.value})} className="w-full bg-neo-bg border-4 border-neo-dark rounded-lg p-3 font-bold" />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white border-4 border-neo-dark rounded-xl p-6 shadow-[4px_4px_0_0_#1E1E1E] md:col-span-2">
          <div className="flex items-center gap-3 mb-6 border-b-4 border-neo-dark pb-4">
            <Bell size={24} />
            <h2 className="text-2xl font-black">Notifications</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border-4 border-neo-dark rounded-xl bg-neo-bg">
              <div>
                <p className="font-black">Booking Confirmation</p>
                <p className="text-xs font-bold text-gray-500">Send WA/Email on new booking</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.notify_booking} onChange={e => setSettings({...settings, notify_booking: e.target.checked})} />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-neo-pink rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#4ADE80]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 border-4 border-neo-dark rounded-xl bg-neo-bg">
              <div>
                <p className="font-black">Checkout Reminder</p>
                <p className="text-xs font-bold text-gray-500">Notify 1 day before checkout</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.notify_checkout} onChange={e => setSettings({...settings, notify_checkout: e.target.checked})} />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-neo-pink rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#4ADE80]"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 border-4 border-neo-dark rounded-xl bg-neo-bg">
              <div>
                <p className="font-black">New User Welcome</p>
                <p className="text-xs font-bold text-gray-500">Send welcome message on register</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.notify_new_user} onChange={e => setSettings({...settings, notify_new_user: e.target.checked})} />
                <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-neo-pink rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#4ADE80]"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button onClick={handleSave} disabled={saving} className="bg-[#4ADE80] border-4 border-neo-dark rounded-lg px-8 py-3 font-black shadow-[4px_4px_0_0_#1E1E1E] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2 disabled:opacity-50">
          {saving ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-neo-dark"></div> : <Save size={20} />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
      </>
      )}
    </DashboardLayout>
  );
};

export default AdminSettings;

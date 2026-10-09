import { useState } from 'react';
import { User, Mail, Phone, MapPin, Briefcase, Wallet, CreditCard, Pencil, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { Field, TextInput, SelectInput } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { employmentTypes, loanCategories } from '@/data/demoData';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    employmentType: user?.employmentType || 'Salaried',
    monthlyIncome: user?.monthlyIncome || 0,
    loanPreference: user?.loanPreference || 'Personal Loan',
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name) {
      showToast('Please enter your name.', 'error');
      return;
    }
    setSaving(true);
    await updateUser(form);
    setSaving(false);
    setEditing(false);
    showToast('Profile updated successfully.', 'success');
  };

  const handleCancel = () => {
    setForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || '',
      employmentType: user?.employmentType || 'Salaried',
      monthlyIncome: user?.monthlyIncome || 0,
      loanPreference: user?.loanPreference || 'Personal Loan',
    });
    setEditing(false);
  };

  const fields = [
    { label: 'Name', value: form.name, icon: User, key: 'name' },
    { label: 'Email', value: form.email, icon: Mail, key: 'email' },
    { label: 'Phone', value: form.phone || 'Not set', icon: Phone, key: 'phone' },
    { label: 'Location', value: form.location || 'Not set', icon: MapPin, key: 'location' },
    { label: 'Employment Type', value: form.employmentType, icon: Briefcase, key: 'employmentType' },
    { label: 'Monthly Income', value: form.monthlyIncome ? `₹${form.monthlyIncome.toLocaleString('en-IN')}` : 'Not set', icon: Wallet, key: 'monthlyIncome' },
    { label: 'Loan Preference', value: form.loanPreference, icon: CreditCard, key: 'loanPreference' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">My Profile</h2>
        <p className="text-sm text-navy-300">View and manage your personal information</p>
      </div>

      {/* Profile header */}
      <Card>
        <CardBody className="pt-5">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-accent-400 to-accent-700 flex items-center justify-center text-3xl font-bold text-white shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white">{user?.name || 'User'}</h3>
              <p className="text-sm text-navy-300 truncate">{user?.email}</p>
              <div className="flex gap-2 mt-2">
                <span className="text-xs rounded-full bg-accent-500/15 text-accent-400 border border-accent-500/30 px-2.5 py-0.5">
                  {form.employmentType}
                </span>
                {form.location && (
                  <span className="text-xs rounded-full bg-navy-600/50 text-navy-200 border border-navy-500/30 px-2.5 py-0.5">
                    {form.location}
                  </span>
                )}
              </div>
            </div>
            {!editing && (
              <Button variant="secondary" onClick={() => setEditing(true)}>
                <Pencil className="h-4 w-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Profile details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Profile Information</CardTitle>
            {editing && (
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={handleCancel}>
                  <X className="h-3.5 w-3.5" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name" required>
                <TextInput type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Email">
                <TextInput type="email" value={form.email} disabled className="opacity-60" />
              </Field>
              <Field label="Phone">
                <TextInput type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
              </Field>
              <Field label="Location">
                <TextInput type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Chennai" />
              </Field>
              <Field label="Employment Type">
                <SelectInput value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
                  {employmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </SelectInput>
              </Field>
              <Field label="Monthly Income (₹)">
                <TextInput type="number" value={form.monthlyIncome || ''} onChange={(e) => setForm({ ...form, monthlyIncome: parseInt(e.target.value) || 0 })} placeholder="50000" />
              </Field>
              <Field label="Loan Preference">
                <SelectInput value={form.loanPreference} onChange={(e) => setForm({ ...form, loanPreference: e.target.value })}>
                  {loanCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </SelectInput>
              </Field>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((field) => {
                const Icon = field.icon;
                return (
                  <div key={field.key} className="flex items-center gap-3 rounded-lg bg-navy-800/50 p-3.5">
                    <div className="p-2 rounded-lg bg-navy-600/50 text-accent-400 shrink-0">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-navy-300">{field.label}</p>
                      <p className="text-sm font-medium text-white truncate">{field.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

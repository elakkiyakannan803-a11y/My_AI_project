import { useState, useMemo } from 'react';
import { MapPin, Search, Navigation, Phone, Clock, Building2, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { TextInput, SelectInput, Field } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/lib/toast';
import { demoBanks, cities } from '@/data/demoData';
import type { BankBranch } from '@/types';

export default function Banks() {
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('All');
  const [category, setCategory] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const filteredBanks = useMemo(() => {
    return demoBanks.filter((b) => {
      const matchSearch = !search ||
        b.bankName.toLowerCase().includes(search.toLowerCase()) ||
        b.branchName.toLowerCase().includes(search.toLowerCase()) ||
        b.address.toLowerCase().includes(search.toLowerCase());
      const matchCity = city === 'All' || b.city === city;
      const matchCategory = category === 'All' || b.category === category;
      return matchSearch && matchCity && matchCategory;
    });
  }, [search, city, category]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      showToast('Geolocation is not supported by your browser. Please enter a location manually.', 'error');
      return;
    }
    setLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
    () => {
        setLoadingLocation(false);
        setCity('All');
        setSearch('');
        showToast('Location detected. Showing all demo bank listings nearby.', 'info');
      },
    () => {
        setLoadingLocation(false);
        showToast('Unable to access your location. Please enter a city manually.', 'error');
      },
      { timeout: 8000 }
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Find Nearby Banks</h2>
          <p className="text-sm text-navy-300">Search for banks, NBFCs and financial institutions near you</p>
        </div>
        <Button variant="secondary" onClick={useMyLocation} disabled={loadingLocation}>
          <Navigation className="h-4 w-4" />
          {loadingLocation ? 'Detecting...' : 'Use My Location'}
        </Button>
      </div>

      {/* Search filters */}
      <Card>
        <CardBody className="pt-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Search">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-300" />
                <TextInput
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Bank name, branch, address..."
                  className="pl-10"
                />
              </div>
            </Field>
            <Field label="City">
              <SelectInput value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="All">All Cities</option>
                {cities.map((c) => <option key={c} value={c}>{c}</option>)}
              </SelectInput>
            </Field>
            <Field label="Category">
              <SelectInput value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="All">All Categories</option>
                <option value="Banks">Banks</option>
                <option value="NBFCs">NBFCs</option>
                <option value="Financial Institutions">Financial Institutions</option>
              </SelectInput>
            </Field>
          </div>
        </CardBody>
      </Card>

      {/* Disclaimer */}
      <div className="rounded-xl bg-navy-700/40 border border-navy-500/20 px-4 py-3 flex gap-3">
        <Info className="h-4 w-4 text-navy-300 shrink-0 mt-0.5" />
        <p className="text-xs text-navy-300">
          Bank listings shown are demo data for illustration purposes. Distances are approximate and not real-time. Please verify details with the actual bank.
        </p>
      </div>

      {/* Results count */}
      <p className="text-sm text-navy-300">
        Showing <span className="text-white font-medium">{filteredBanks.length}</span> {filteredBanks.length === 1 ? 'result' : 'results'}
      </p>

      {/* Bank cards */}
      {filteredBanks.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-navy-600/50">
            <Building2 className="h-7 w-7 text-navy-300" />
          </div>
          <h3 className="text-base font-semibold text-white mb-1">No Banks Found</h3>
          <p className="text-sm text-navy-300 text-center">Try adjusting your search or filters.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBanks.map((bank) => (
            <BankCard
              key={bank.id}
              bank={bank}
              expanded={expandedId === bank.id}
              onToggle={() => setExpandedId(expandedId === bank.id ? null : bank.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BankCard({ bank, expanded, onToggle }: { bank: BankBranch; expanded: boolean; onToggle: () => void }) {
  return (
    <Card className="hover:border-accent-400/30 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-accent-500/15 text-accent-400 shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{bank.bankName}</h3>
              <p className="text-xs text-navy-300">{bank.branchName}</p>
            </div>
          </div>
          <Badge variant={bank.category === 'Banks' ? 'info' : bank.category === 'NBFCs' ? 'warning' : 'neutral'}>
            {bank.category}
          </Badge>
        </div>
      </CardHeader>
      <CardBody className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-navy-300">
          <MapPin className="h-3.5 w-3.5 text-accent-400" />
          <span>{bank.address}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-navy-300">
            <Navigation className="h-3.5 w-3.5" /> {bank.distance} km away
          </span>
          <span className="flex items-center gap-1 text-navy-300">
            <Clock className="h-3.5 w-3.5" /> {bank.openingHours}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {bank.loanTypes.map((type) => (
            <span key={type} className="text-[10px] rounded-full bg-navy-600/50 border border-navy-500/30 px-2 py-0.5 text-navy-200">
              {type}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-lg bg-navy-800/50 p-2.5">
            <p className="text-[10px] text-navy-300">Interest Rate</p>
            <p className="text-sm font-semibold text-white">{bank.interestRateMin}% – {bank.interestRateMax}%</p>
          </div>
          <div className="rounded-lg bg-navy-800/50 p-2.5">
            <p className="text-[10px] text-navy-300">Eligibility</p>
            <p className="text-xs font-medium text-white leading-tight">{bank.eligibilitySummary}</p>
          </div>
        </div>

        {expanded && (
          <div className="space-y-2 pt-2 border-t border-navy-600/30 animate-fade-in">
            <div className="flex items-center gap-2 text-xs">
              <Phone className="h-3.5 w-3.5 text-accent-400" />
              <span className="text-white">{bank.phone}</span>
            </div>
            <p className="text-xs text-navy-300">{bank.address}</p>
          </div>
        )}

        <button
          onClick={onToggle}
          className="flex items-center gap-1 text-xs text-accent-400 hover:text-accent-300 font-medium"
        >
          {expanded ? (
            <><ChevronUp className="h-3.5 w-3.5" /> View Less</>
          ) : (
            <><ChevronDown className="h-3.5 w-3.5" /> View Details</>
          )}
        </button>
      </CardBody>
    </Card>
  );
}

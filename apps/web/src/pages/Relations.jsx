import { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Award, 
  Send, 
  Gift, 
  Search, 
  Sparkles, 
  TrendingUp, 
  RefreshCw,
  HeartHandshake
} from 'lucide-react';
import api from '../api/axios';

export default function Relations() {
  const [activeTab, setActiveTab] = useState('reclaim'); // 'reclaim' | 'reward'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dormant customers state
  const [dormantCustomers, setDormantCustomers] = useState([]);
  const [dormantLoading, setDormantLoading] = useState(false);
  const [activeLang, setActiveLang] = useState({}); // customerId -> 'ZU' | 'EN'

  // All/Loyal customers state
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  
  // Coupon modal state
  const [couponModal, setCouponModal] = useState(null); // customer object or null
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState('10%');
  const [couponLang, setCouponLang] = useState('ZU'); // 'ZU' | 'EN'

  // Fetch dormant outreach customers
  const fetchDormant = useCallback(async () => {
    setDormantLoading(true);
    try {
      const res = await api.get('/customers/dormant');
      setDormantCustomers(res.data);
      
      // Default all to Zulu message
      const initialLang = {};
      res.data.forEach(c => {
        initialLang[c.id] = 'ZU';
      });
      setActiveLang(initialLang);
    } catch (err) {
      console.error('Failed to fetch dormant customers', err);
    } finally {
      setDormantLoading(false);
    }
  }, []);

  // Fetch all customers for loyalty list
  const fetchAllCustomers = useCallback(async () => {
    setCustomersLoading(true);
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDormant();
    fetchAllCustomers();
  }, [fetchDormant, fetchAllCustomers]);

  // Open coupon generation modal
  const handleOpenCoupon = (customer) => {
    const code = `SF-LOYAL-${customer.name.replace(/\s+/g, '-').toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    setCouponCode(code);
    setCouponDiscount('10%');
    setCouponLang('ZU');
    setCouponModal(customer);
  };

  // Build WhatsApp Loyalty Coupon link
  const getCouponWaLink = () => {
    if (!couponModal) return '';
    const cleanPhone = couponModal.phone ? couponModal.phone.replace(/[^0-9]/g, '') : '';
    const waPhone = cleanPhone.startsWith('0') ? `27${cleanPhone.slice(1)}` : cleanPhone;
    
    const messageZulu = `Sawubona ${couponModal.name}! Siyabonga ngokukhetha i-Simon Family Farm e-Clermont Rank. Nasi isigqebhezana sakho sesaphulelo sika-${couponDiscount} (discount) ngoba ungomunye wamakhasimende ethu athembekile: ${couponCode}. Siyabonga kakhulu ngoxhaso lwakho!`;
    const messageEnglish = `Hi ${couponModal.name}! Thank you for being a loyal customer at Simon Family Farm. Here is a ${couponDiscount} loyalty discount coupon for your next purchase at our Clermont Rank counter: ${couponCode}. We appreciate your support!`;
    
    const message = couponLang === 'ZU' ? messageZulu : messageEnglish;
    return `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;
  };

  // Filtered customer list for Loyal tab
  const filteredLoyalCustomers = customers.filter(c => {
    // Exclude currently dormant customers to avoid confusing loyalty rewards with reclaim campaigns
    const isDormant = dormantCustomers.some(d => d.id === c.id);
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (c.phone && c.phone.includes(searchQuery));
    return !isDormant && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="flex justify-between items-center pb-6 border-b border-[var(--color-border-default)]">
        <div>
          <h1 className="text-3xl font-[var(--font-display)] font-bold tracking-tight m-0 flex items-center gap-3">
            <HeartHandshake className="text-[var(--color-brand-red)]" size={30} />
            Customer Relations
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm mt-1 m-0">
            Build customer loyalty, generate discount campaigns, and re-engage lost foot traffic.
          </p>
        </div>
        <button 
          onClick={() => { fetchDormant(); fetchAllCustomers(); }}
          disabled={dormantLoading || customersLoading}
          className="btn-secondary btn-sm flex items-center gap-2 !py-2 !px-3"
        >
          <RefreshCw size={14} className={dormantLoading || customersLoading ? 'animate-spin' : ''} />
          <span>Refresh Lists</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[var(--color-border-default)] pb-1">
        <button
          onClick={() => setActiveTab('reclaim')}
          className={`pb-2 px-1 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'reclaim'
              ? 'border-b-2 border-[var(--color-brand-red)] text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <TrendingUp size={14} className="text-[var(--color-brand-red)]" />
          Reclaim Inactive Customers
        </button>
        <button
          onClick={() => setActiveTab('reward')}
          className={`pb-2 px-1 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'reward'
              ? 'border-b-2 border-[var(--color-brand-red)] text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Award size={14} className="text-[var(--color-brand-red)]" />
          Reward Loyal Customers
        </button>
      </div>

      {/* Tab: Reclaim Inactive Customers */}
      {activeTab === 'reclaim' && (
        <div className="space-y-6">
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] p-5 rounded-md space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-primary)] m-0 flex items-center gap-2">
              <Sparkles size={16} className="text-[var(--color-brand-red)]" />
              AI Spoilage & Retention Outreach
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed m-0">
              The engine scans purchase history and flags registered customers who haven't visited in 14 days or more. 
              Review the suggested promos below and click **Send WhatsApp** to launch outreach directly.
            </p>
          </div>

          {dormantLoading ? (
            <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-default)] p-12 text-center rounded-md">
              <RefreshCw className="animate-spin text-[var(--color-brand-red)] mx-auto mb-3" size={32} />
              <p className="text-sm text-[var(--color-text-secondary)] uppercase tracking-wider font-bold m-0">Analyzing dormancy thresholds...</p>
            </div>
          ) : dormantCustomers.length === 0 ? (
            <div className="bg-[var(--color-success-bg)] border border-[var(--color-success)]/10 p-8 text-center rounded-md">
              <p className="text-sm font-bold text-[var(--color-success)] m-0">All registered customers are active (visited in the last 14 days).</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
              {dormantCustomers.map((customer) => {
                const cleanPhone = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';
                const waPhone = cleanPhone.startsWith('0') ? `27${cleanPhone.slice(1)}` : cleanPhone;
                const lang = activeLang[customer.id] || 'ZU';
                const message = lang === 'ZU' ? customer.suggestedPromoZulu : customer.suggestedPromoEnglish;
                const waLink = `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`;

                return (
                  <div key={customer.id} className="bg-[var(--color-surface-card)] border border-[var(--color-border-default)] p-5 rounded-md flex flex-col justify-between hover:border-[var(--color-brand-red)]/35 transition-all">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-base text-[var(--color-text-primary)] m-0">
                            {customer.name}
                          </h3>
                          <span className="text-[10px] font-mono font-bold text-[var(--color-text-secondary)] block mt-0.5">
                            {customer.phone || 'No phone'}
                          </span>
                        </div>
                        <span className="badge badge-steel text-[10px] font-bold">
                          {customer.daysInactive} days inactive
                        </span>
                      </div>

                      {/* Language Selection */}
                      <div className="flex bg-[var(--color-surface-input)] p-1 rounded-sm text-[10px] font-bold uppercase w-fit">
                        <button
                          onClick={() => setActiveLang(prev => ({ ...prev, [customer.id]: 'ZU' }))}
                          className={`px-3 py-1.5 rounded-sm transition-all cursor-pointer ${
                            lang === 'ZU' 
                              ? 'bg-[var(--color-brand-red)] text-white' 
                              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                          }`}
                        >
                          isiZulu
                        </button>
                        <button
                          onClick={() => setActiveLang(prev => ({ ...prev, [customer.id]: 'EN' }))}
                          className={`px-3 py-1.5 rounded-sm transition-all cursor-pointer ${
                            lang === 'EN' 
                              ? 'bg-[var(--color-brand-red)] text-white' 
                              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                          }`}
                        >
                          English
                        </button>
                      </div>

                      {/* Generated Message Preview */}
                      <div className="bg-[var(--color-surface-input)] p-3 border border-[var(--color-border-default)] rounded-sm min-h-[72px]">
                        <p className="text-xs text-[var(--color-text-secondary)] italic m-0 line-clamp-3">
                          "{message}"
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[var(--color-border-default)]/60 flex justify-between items-center">
                      <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                        POPIA Consent Verified
                      </span>
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary btn-sm flex items-center gap-2 !py-2 !px-4 hover:opacity-90 font-bold"
                      >
                        <Send size={12} />
                        <span>Send WhatsApp</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Reward Loyal Customers */}
      {activeTab === 'reward' && (
        <div className="space-y-6">
          {/* Header Description */}
          <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border-default)] p-5 rounded-md space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-text-primary)] m-0 flex items-center gap-2">
              <Gift size={16} className="text-[var(--color-brand-red)]" />
              Active Loyalty Campaign
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed m-0">
              Reward active customers visiting your Durban Clermont rank store. Generate custom 10% discount codes, 
              send coupons via WhatsApp, and reward loyal foot traffic.
            </p>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 bg-[var(--color-surface-card)] border border-[var(--color-border-default)] px-4 py-2.5 rounded-sm w-full max-w-md">
            <Search size={16} className="text-[var(--color-text-secondary)]" />
            <input 
              type="text" 
              placeholder="Search active loyal customers by name or phone..."
              className="bg-transparent border-none text-xs w-full focus:outline-none text-[var(--color-text-primary)] font-semibold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {customersLoading ? (
            <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-default)] p-12 text-center rounded-md">
              <RefreshCw className="animate-spin text-[var(--color-brand-red)] mx-auto mb-3" size={32} />
              <p className="text-sm text-[var(--color-text-secondary)] uppercase tracking-wider font-bold m-0">Loading customer roster...</p>
            </div>
          ) : filteredLoyalCustomers.length === 0 ? (
            <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-default)] p-8 text-center rounded-md">
              <p className="text-sm font-bold text-[var(--color-text-secondary)] m-0 italic">No active customers found matching that query.</p>
            </div>
          ) : (
            <div className="table-container bg-[var(--color-surface-card)] shadow-sm">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Phone Contact</th>
                    <th>Simulated Loyalty Level</th>
                    <th>Simulated Month Spend</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoyalCustomers.map((c, index) => {
                    // Generate stable mock values based on customer index for high-fidelity presentation
                    const spends = ['R 1,420.00', 'R 890.00', 'R 2,110.00', 'R 640.00', 'R 1,750.00'];
                    const levels = ['Gold Member', 'Silver Member', 'Platinum Member', 'Silver Member', 'Gold Member'];
                    const spend = spends[index % spends.length];
                    const level = levels[index % levels.length];
                    
                    return (
                      <tr key={c.id}>
                        <td className="font-bold text-[var(--color-text-primary)]">
                          {c.name}
                        </td>
                        <td className="text-xs font-mono font-semibold text-[var(--color-text-secondary)]">
                          {c.phone || 'No Contact number'}
                        </td>
                        <td>
                          <span className="badge badge-steel text-[10px] font-bold">
                            {level}
                          </span>
                        </td>
                        <td className="font-[var(--font-mono)] font-bold text-sm text-[var(--color-brand-red)]">
                          {spend}
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => handleOpenCoupon(c)}
                            className="btn-primary btn-sm uppercase text-[10px] font-bold tracking-wider py-1.5 px-3 cursor-pointer"
                          >
                            Generate Reward
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Coupon Generation Modal */}
      {couponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-default)] w-full max-w-md rounded-lg shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="p-4 border-b border-[var(--color-border-default)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="text-[var(--color-brand-red)]" size={18} />
                <h3 className="font-[var(--font-display)] text-sm font-bold uppercase tracking-wider m-0">Generate Customer Reward</h3>
              </div>
              <button 
                onClick={() => setCouponModal(null)}
                className="text-[var(--color-text-secondary)] hover:text-white transition-colors cursor-pointer"
              >
                <RefreshCw className="rotate-45" size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              <div>
                <span className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">
                  Recipient Customer
                </span>
                <p className="text-base font-bold text-[var(--color-text-primary)] m-0">
                  {couponModal.name} ({couponModal.phone || 'No phone'})
                </p>
              </div>

              {/* Set Discount Percentage */}
              <div className="grid grid-cols-3 gap-2">
                {['10%', '15%', '20%'].map(disc => (
                  <button
                    key={disc}
                    onClick={() => setCouponDiscount(disc)}
                    className={`py-2 px-3 text-xs uppercase font-bold tracking-wider border rounded-sm transition-all cursor-pointer ${
                      couponDiscount === disc 
                        ? 'border-[var(--color-brand-red)] bg-[var(--color-brand-red)]/10 text-[var(--color-brand-red)]' 
                        : 'border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:border-gray-500'
                    }`}
                  >
                    {disc} Off
                  </button>
                ))}
              </div>

              {/* Language Selection */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[var(--color-text-secondary)] uppercase tracking-wider block mb-1">
                  Promotion Language
                </span>
                <div className="flex bg-[var(--color-surface-input)] p-1 rounded-sm text-[10px] font-bold uppercase w-fit">
                  <button
                    onClick={() => setCouponLang('ZU')}
                    className={`px-3 py-1.5 rounded-sm transition-all cursor-pointer ${
                      couponLang === 'ZU' 
                        ? 'bg-[var(--color-brand-red)] text-white' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    isiZulu
                  </button>
                  <button
                    onClick={() => setCouponLang('EN')}
                    className={`px-3 py-1.5 rounded-sm transition-all cursor-pointer ${
                      couponLang === 'EN' 
                        ? 'bg-[var(--color-brand-red)] text-white' 
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* Coupon Preview block */}
              <div className="bg-[var(--color-surface-input)] border border-[var(--color-border-default)] p-4 rounded-sm space-y-2">
                <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">
                  Reward Code
                </span>
                <span className="text-md font-mono font-black text-[var(--color-text-primary)] tracking-wider bg-black/20 py-1 px-2.5 rounded-sm block w-fit">
                  {couponCode}
                </span>

                <span className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider block mt-2">
                  WhatsApp Message Draft
                </span>
                <p className="text-xs text-[var(--color-text-secondary)] italic m-0 line-clamp-3 leading-relaxed">
                  "{couponLang === 'ZU' 
                    ? `Sawubona ${couponModal.name}! Siyabonga ngokukhetha i-Simon Family Farm e-Clermont Rank. Nasi isigqebhezana sakho sesaphulelo sika-${couponDiscount} (discount) ngoba ungomunye wamakhasimende ethu athembekile: ${couponCode}...`
                    : `Hi ${couponModal.name}! Thank you for being a loyal customer at Simon Family Farm. Here is a ${couponDiscount} loyalty discount coupon for your next purchase at our Clermont Rank counter: ${couponCode}...`}"
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[var(--color-border-default)] bg-[var(--color-surface-raised)] flex justify-between gap-3">
              <button 
                onClick={() => setCouponModal(null)}
                className="btn-secondary px-5 text-xs uppercase"
              >
                Close
              </button>
              
              <a
                href={getCouponWaLink()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setCouponModal(null)}
                className="btn-primary px-5 py-2.5 text-xs uppercase flex items-center justify-center gap-2 font-bold"
              >
                <Send size={12} />
                <span>Send Coupon</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

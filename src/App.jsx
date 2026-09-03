import React, { useState } from "react";
import {
  // Action
  Button,
  // Form
  Input,
  TextArea,
  Select,
  Switch,
  Slider,
  DatePicker,
  // Content
  Typography,
  Table,
  Card,
  Avatar,
  Badge,
  Icon,
  // Feedback
  Alert,
  ToastProvider,
  useToast,
  Modal,
  ProgressBar,
  // Layout
  Stack,
  Grid,
  Divider,
} from "./components";
import { envConfig, ENVIRONMENTS } from "./config";
import { apiClient } from "./api";

// Sample Society Data
const SOCIETIES = [
  { id: "soc-1", name: "Grand Palms Co-op Society", location: "Andheri West, Mumbai", units: 140 },
  { id: "soc-2", name: "Royal Heights Enclave", location: "Whitefield, Bengaluru", units: 220 },
  { id: "soc-3", name: "Skyline Towers Residency", location: "Gachibowli, Hyderabad", units: 180 },
];

const UPCOMING_EVENTS = [
  {
    id: "EVT-101",
    title: "Grand Diwali Gala & Cultural Night 2026",
    category: "Festival",
    date: "Oct 24, 2026",
    time: "6:30 PM - 10:30 PM",
    venue: "Main Clubhouse & Lawn",
    targetCollection: 500000,
    currentCollection: 425000,
    attendees: 320,
    capacity: 400,
    status: "Selling Fast",
    badgeVariant: "primary",
  },
  {
    id: "EVT-102",
    title: "Annual Society Sports Carnival & Marathon",
    category: "Sports",
    date: "Nov 14, 2026",
    time: "7:00 AM - 1:00 PM",
    venue: "Central Garden & Track",
    targetCollection: 250000,
    currentCollection: 195000,
    attendees: 185,
    capacity: 250,
    status: "Open",
    badgeVariant: "success",
  },
  {
    id: "EVT-103",
    title: "Annual General Body Meeting (AGM 2026)",
    category: "Administrative",
    date: "Dec 06, 2026",
    time: "10:00 AM - 2:00 PM",
    venue: "Auditorium Wing B",
    targetCollection: 50000,
    currentCollection: 50000,
    attendees: 140,
    capacity: 150,
    status: "Confirmed",
    badgeVariant: "info",
  },
];

const RECENT_PAYMENTS = [
  {
    id: "TXN-88491",
    resident: "Aarav Sharma",
    unit: "Flat A-402",
    event: "Diwali Gala Pass (Family)",
    amount: "₹3,500",
    date: "Today, 10:24 AM",
    mode: "UPI (GooglePay)",
    status: "Completed",
  },
  {
    id: "TXN-88490",
    resident: "Priya Patel",
    unit: "Flat B-1104",
    event: "Sports Carnival Registration",
    amount: "₹1,200",
    date: "Today, 09:15 AM",
    mode: "Net Banking (HDFC)",
    status: "Completed",
  },
  {
    id: "TXN-88489",
    resident: "Vikram Malhotra",
    unit: "Flat C-201",
    event: "Diwali Gala Pass (Individual)",
    amount: "₹1,500",
    date: "Yesterday, 06:40 PM",
    mode: "Debit Card",
    status: "Completed",
  },
  {
    id: "TXN-88488",
    resident: "Meera Sen",
    unit: "Flat A-903",
    event: "Clubhouse Stage Sponsor Token",
    amount: "₹25,000",
    date: "Yesterday, 03:10 PM",
    mode: "Bank Transfer (NEFT)",
    status: "Completed",
  },
  {
    id: "TXN-88487",
    resident: "Rajesh Kulkarni",
    unit: "Flat B-305",
    event: "Diwali Gala Pass (Family)",
    amount: "₹3,500",
    date: "02 Sep 2026",
    mode: "UPI (PhonePe)",
    status: "Pending",
  },
];

const SPONSORSHIPS = [
  { brand: "HDFC Home Loans", tier: "Platinum Sponsor", amount: "₹1,50,000", event: "Diwali Gala", status: "Active" },
  { brand: "Tata Power EV Care", tier: "Gold Sponsor", amount: "₹85,000", event: "Sports Carnival", status: "Active" },
  { brand: "Decathlon Sports", tier: "Gold Sponsor", amount: "₹60,000", event: "Sports Carnival", status: "Active" },
  { brand: "Amul Organic Dairy", tier: "Silver Sponsor", amount: "₹35,000", event: "Diwali Gala", status: "Confirmed" },
];

function SocietyAppContent() {
  const toast = useToast();

  // Navigation & View State
  const [activeNav, setActiveNav] = useState("dashboard"); // 'dashboard' | 'events' | 'collections' | 'sponsorships' | 'residents' | 'components'
  const [selectedSociety, setSelectedSociety] = useState(SOCIETIES[0].id);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modals & Interactive States
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedPaymentRows, setSelectedPaymentRows] = useState(["TXN-88491"]);
  const [componentSubTab, setComponentSubTab] = useState("actions");
  
  // Interactive Component Explorer States
  const [demoSlider, setDemoSlider] = useState(65);
  const [demoSwitch, setDemoSwitch] = useState(true);
  const [demoDate, setDemoDate] = useState("2026-10-24");
  const [apiTesting, setApiTesting] = useState(false);
  const [apiResult, setApiResult] = useState(null);

  const currentSocietyObj = SOCIETIES.find((s) => s.id === selectedSociety) || SOCIETIES[0];

  const handleTestApi = async () => {
    setApiTesting(true);
    setApiResult(null);
    try {
      const res = await apiClient.get("health", { timeout: 3000 });
      setApiResult(res);
      if (res.success) {
        toast.success("API client connected successfully!");
      } else {
        toast.warning(`API response status: ${res.message || res.status}`);
      }
    } catch (err) {
      setApiResult({ error: err.message });
      toast.error("API client ping failed");
    } finally {
      setApiTesting(false);
    }
  };

  const paymentColumns = [
    { key: "id", header: "Receipt ID", width: "120px" },
    {
      key: "resident",
      header: "Resident & Unit",
      render: (val, row) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={val} size="sm" />
          <div>
            <div className="font-bold text-navy-900 text-sm">{val}</div>
            <div className="text-xs text-navy-500 font-medium">{row.unit}</div>
          </div>
        </div>
      ),
    },
    { key: "event", header: "Event / Head", render: (val) => <span className="font-medium text-navy-700">{val}</span> },
    {
      key: "amount",
      header: "Amount",
      align: "right",
      render: (val) => <span className="font-bold text-emerald-600 text-sm">{val}</span>,
    },
    { key: "mode", header: "Mode", render: (val) => <span className="text-xs text-navy-600 font-medium bg-slate-100 px-2 py-1 rounded-md">{val}</span> },
    { key: "date", header: "Date / Time" },
    {
      key: "status",
      header: "Status",
      align: "center",
      render: (val) => (
        <Badge
          variant={val === "Completed" ? "success" : "warning"}
          dot
          size="sm"
        >
          {val}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Action",
      align: "right",
      render: (_, row) => (
        <Button
          size="xs"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            toast.info(`Receipt for ${row.id} sent to ${row.resident}`);
          }}
        >
          Receipt
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F8FD] text-navy-900 flex flex-col font-sans">
      {/* =========================================================
          TOP HEADER
      ========================================================= */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-40 shadow-soft">
        <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Left: Brand / Sidebar toggle / Society Selector */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-card-sm text-navy-600 hover:bg-slate-100 hover:text-navy-900 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500"
              title="Toggle Sidebar"
            >
              <Icon name="Menu" size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-card bg-gradient-brand flex items-center justify-center text-white font-black text-xl shadow-glow">
                S
              </div>
              <div className="hidden sm:block">
                <div className="text-base font-extrabold text-navy-900 leading-none flex items-center gap-1.5">
                  SocietyOS
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-brand-50 text-brand-700 rounded-md border border-brand-200">
                    Pro
                  </span>
                </div>
                <div className="text-xs text-navy-500 font-medium mt-0.5">
                  Smart Society & Event Management
                </div>
              </div>
            </div>

            {/* Society Selector Dropdown */}
            <div className="hidden md:flex items-center ml-4 pl-4 border-l border-slate-200">
              <div className="relative">
                <select
                  value={selectedSociety}
                  onChange={(e) => {
                    setSelectedSociety(e.target.value);
                    toast.info(`Switched active society to ${SOCIETIES.find(s => s.id === e.target.value)?.name}`);
                  }}
                  className="bg-slate-50 border border-slate-200 text-navy-800 text-xs font-bold rounded-card-sm py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 cursor-pointer shadow-sm appearance-none"
                >
                  {SOCIETIES.map((soc) => (
                    <option key={soc.id} value={soc.id}>
                      🏛️ {soc.name} ({soc.units} Units)
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-navy-500">
                  <Icon name="ChevronDown" size={14} />
                </div>
              </div>
            </div>
          </div>

          {/* Center: Global Search */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search events, resident receipts, units, sponsors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-card-sm text-xs font-medium text-navy-900 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
              />
              <div className="absolute left-3 top-2.5 text-navy-400">
                <Icon name="Search" size={15} />
              </div>
              <span className="absolute right-2.5 top-2 text-[10px] font-mono text-navy-400 bg-slate-200/60 px-1.5 py-0.5 rounded">
                ⌘K
              </span>
            </div>
          </div>

          {/* Right: Quick actions, Env badge, Notifications, Profile */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Icon name="Plus" size={14} />}
              onClick={() => setBookingModalOpen(true)}
              className="hidden sm:inline-flex"
            >
              Create Event
            </Button>

            <Badge
              variant={
                envConfig.env === ENVIRONMENTS.LIVE
                  ? "danger"
                  : envConfig.env === ENVIRONMENTS.STAGE
                  ? "warning"
                  : "info"
              }
              size="sm"
              dot
            >
              {envConfig.env.toUpperCase()}
            </Badge>

            <button
              onClick={() => toast.info("You have 3 unread committee notifications")}
              className="relative p-2 rounded-card-sm text-navy-600 hover:bg-slate-100 hover:text-navy-900 transition-colors"
              title="Notifications"
            >
              <Icon name="Bell" size={19} />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-brand-600 rounded-full ring-2 ring-white"></span>
            </button>

            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <Avatar name="Rajan Patel" size="md" status="online" />
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-navy-900 leading-tight">Rajan Patel</div>
                <div className="text-[11px] text-navy-500 font-medium">President & Admin</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================
          MAIN CONTAINER WITH SIDEBAR & BODY
      ========================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR NAVIGATION */}
        <aside
          className={`bg-white border-r border-slate-200/80 transition-all duration-300 flex flex-col justify-between shrink-0 ${
            sidebarCollapsed ? "w-16" : "w-64"
          }`}
        >
          {/* Nav Items */}
          <div className="p-3 space-y-1.5">
            {[
              { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", count: null },
              { id: "events", label: "Events & Bookings", icon: "Calendar", count: "3" },
              { id: "collections", label: "Collections & Dues", icon: "CreditCard", count: "₹14.8L" },
              { id: "sponsorships", label: "Sponsorships", icon: "Award", count: "8" },
              { id: "residents", label: "Residents & Units", icon: "Users", count: "140" },
              { id: "components", label: "UI System Explorer", icon: "Component", count: "30+" },
            ].map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-card-sm font-semibold text-xs transition-all ${
                    isActive
                      ? "bg-brand-600 text-white shadow-soft"
                      : "text-navy-600 hover:bg-slate-100 hover:text-navy-900"
                  }`}
                >
                  <Icon name={item.icon} size={18} className={isActive ? "text-white" : "text-brand-600"} />
                  {!sidebarCollapsed && (
                    <div className="flex-1 flex items-center justify-between">
                      <span>{item.label}</span>
                      {item.count && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                            isActive ? "bg-brand-800 text-white" : "bg-brand-50 text-brand-700 border border-brand-200/60"
                          }`}
                        >
                          {item.count}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer Box */}
          {!sidebarCollapsed && (
            <div className="p-4 m-3 bg-gradient-brand-subtle rounded-card border border-brand-200/80 text-navy-800">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-bold text-brand-900 uppercase tracking-wide">
                  Active Society License
                </span>
              </div>
              <div className="text-xs font-bold text-navy-900">{currentSocietyObj.name}</div>
              <div className="text-[11px] text-navy-600 mt-0.5">{currentSocietyObj.location}</div>
              <div className="mt-3 pt-2.5 border-t border-brand-200/60 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-brand-700">140 Units Onboarded</span>
                <button
                  onClick={() => toast.info("Society Settings: Manage members & permissions")}
                  className="text-[10px] font-bold text-brand-700 hover:underline"
                >
                  Settings →
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* MAIN BODY AREA */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* =========================================================
              VIEW 1: MAIN DASHBOARD OVERVIEW
          ========================================================= */}
          {activeNav === "dashboard" && (
            <Stack direction="vertical" gap={6}>
              {/* Hero Banner with Society Context */}
              <div className="rounded-card bg-gradient-brand p-6 text-white shadow-card relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative z-10 space-y-1">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
                    <span>✨ Active Society Overview</span>
                    <span className="w-1 h-1 bg-white rounded-full"></span>
                    <span>{new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                    {currentSocietyObj.name}
                  </h1>
                  <p className="text-sm text-blue-100 font-medium">
                    Manage upcoming festivals, track resident contributions, and monitor corporate sponsorships.
                  </p>
                </div>

                <div className="relative z-10 flex flex-wrap items-center gap-3">
                  <Button
                    variant="sky"
                    size="sm"
                    leftIcon={<Icon name="Calendar" size={15} />}
                    onClick={() => setBookingModalOpen(true)}
                  >
                    Book Venue / Event
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/10 text-white border-white/30 hover:bg-white/20"
                    leftIcon={<Icon name="Download" size={15} />}
                    onClick={() => toast.success("Summary report exported (PDF)")}
                  >
                    Export Monthly Sheet
                  </Button>
                </div>

                {/* Decorative background glow circles */}
                <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-sky-400/20 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute left-1/2 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
              </div>

              {/* Large KPI Stat Cards */}
              <Grid cols={{ default: 1, sm: 2, lg: 4 }} gap={4}>
                <Card padding="md" hoverable className="border-l-4 border-l-brand-600">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-500 uppercase tracking-wider">
                      Total Collections
                    </span>
                    <div className="p-2 rounded-card-sm bg-brand-50 text-brand-600">
                      <Icon name="CreditCard" size={20} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-navy-900">₹14,85,000</span>
                    <span className="text-xs font-bold text-emerald-600 flex items-center">
                      ↑ 18.4%
                    </span>
                  </div>
                  <div className="text-[11px] text-navy-500 mt-1 font-medium">
                    Target: ₹18.0L (82.5% Achieved)
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={82.5} size="sm" variant="primary" />
                  </div>
                </Card>

                <Card padding="md" hoverable className="border-l-4 border-l-sky-500">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-500 uppercase tracking-wider">
                      Active Events
                    </span>
                    <div className="p-2 rounded-card-sm bg-sky-50 text-sky-600">
                      <Icon name="Calendar" size={20} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-navy-900">3 Upcoming</span>
                    <Badge variant="primary" size="sm">Active Season</Badge>
                  </div>
                  <div className="text-[11px] text-navy-500 mt-1 font-medium">
                    645 total residents registered
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-brand-700">
                    <span>Next: Diwali Gala (Oct 24)</span>
                  </div>
                </Card>

                <Card padding="md" hoverable className="border-l-4 border-l-emerald-500">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-500 uppercase tracking-wider">
                      Sponsorships
                    </span>
                    <div className="p-2 rounded-card-sm bg-emerald-50 text-emerald-600">
                      <Icon name="Award" size={20} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-navy-900">₹4,20,000</span>
                    <span className="text-xs font-bold text-emerald-600">4 Brands</span>
                  </div>
                  <div className="text-[11px] text-navy-500 mt-1 font-medium">
                    100% contracts signed & vetted
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={100} size="sm" variant="success" />
                  </div>
                </Card>

                <Card padding="md" hoverable className="border-l-4 border-l-navy-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy-500 uppercase tracking-wider">
                      Unit Occupancy
                    </span>
                    <div className="p-2 rounded-card-sm bg-slate-100 text-navy-800">
                      <Icon name="Users" size={20} />
                    </div>
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-navy-900">132 / 140</span>
                    <span className="text-xs font-bold text-emerald-600">94.2%</span>
                  </div>
                  <div className="text-[11px] text-navy-500 mt-1 font-medium">
                    118 Owners • 14 Tenants • 8 Vacant
                  </div>
                  <div className="mt-3">
                    <ProgressBar value={94.2} size="sm" variant="info" />
                  </div>
                </Card>
              </Grid>

              {/* Middle Section: Upcoming Events Summary & Financial Progress */}
              <Grid cols={{ default: 1, lg: 3 }} gap={6}>
                {/* Left 2 Cols: Upcoming Events Showcase */}
                <div className="lg:col-span-2 space-y-4">
                  <Card
                    title="Upcoming Community Events"
                    subtitle="Major events planned, registrations and collection status"
                    headerAction={
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setActiveNav("events")}
                      >
                        View All (3) →
                      </Button>
                    }
                  >
                    <Stack direction="vertical" gap={4}>
                      {UPCOMING_EVENTS.map((evt) => (
                        <div
                          key={evt.id}
                          className="p-4 rounded-card bg-slate-50/70 border border-slate-200/80 hover:border-brand-300 transition-all space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-card bg-brand-50 border border-brand-200 flex flex-col items-center justify-center text-brand-700 shrink-0">
                                <span className="text-[10px] uppercase font-bold tracking-wider leading-none">
                                  {evt.date.split(" ")[0]}
                                </span>
                                <span className="text-lg font-black leading-none mt-0.5">
                                  {evt.date.split(" ")[1].replace(",", "")}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-navy-900 hover:text-brand-600 cursor-pointer">
                                  {evt.title}
                                </h4>
                                <div className="text-xs text-navy-500 flex flex-wrap items-center gap-2 mt-0.5">
                                  <span className="flex items-center gap-1 font-medium">
                                    <Icon name="MapPin" size={12} /> {evt.venue}
                                  </span>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 font-medium">
                                    <Icon name="Clock" size={12} /> {evt.time}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              <Badge variant={evt.badgeVariant} size="sm" dot>
                                {evt.status}
                              </Badge>
                              <Button
                                size="xs"
                                variant="outline"
                                onClick={() => toast.success(`Viewing attendee list for ${evt.title}`)}
                              >
                                Attendees ({evt.attendees})
                              </Button>
                            </div>
                          </div>

                          {/* Progress bar for collection vs target */}
                          <div className="pt-2 border-t border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            <div className="flex-1 mr-4">
                              <div className="flex justify-between text-[11px] font-semibold text-navy-600 mb-1">
                                <span>Collected: ₹{evt.currentCollection.toLocaleString()}</span>
                                <span>Target: ₹{evt.targetCollection.toLocaleString()}</span>
                              </div>
                              <ProgressBar
                                value={(evt.currentCollection / evt.targetCollection) * 100}
                                size="xs"
                                variant="primary"
                              />
                            </div>
                            <div className="text-[11px] font-medium text-navy-500 whitespace-nowrap">
                              <strong>{evt.attendees}</strong> / {evt.capacity} Passes Booked
                            </div>
                          </div>
                        </div>
                      ))}
                    </Stack>
                  </Card>
                </div>

                {/* Right 1 Col: Collection Channels & Sponsorship Tiers */}
                <div className="space-y-6">
                  {/* Financial Targets Progress */}
                  <Card title="Fund Collection Health" subtitle="Current collection campaigns">
                    <Stack direction="vertical" gap={4}>
                      <div>
                        <div className="flex justify-between text-xs font-bold text-navy-800 mb-1">
                          <span>Diwali Gala Fund 2026</span>
                          <span className="text-brand-600">85%</span>
                        </div>
                        <ProgressBar value={85} size="sm" variant="primary" />
                        <span className="text-[10px] text-navy-500 mt-1 block">₹4.25L of ₹5.00L target</span>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-navy-800 mb-1">
                          <span>Sports Carnival Fund</span>
                          <span className="text-emerald-600">78%</span>
                        </div>
                        <ProgressBar value={78} size="sm" variant="success" />
                        <span className="text-[10px] text-navy-500 mt-1 block">₹1.95L of ₹2.50L target</span>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-bold text-navy-800 mb-1">
                          <span>Clubhouse Reserve</span>
                          <span className="text-sky-600">92%</span>
                        </div>
                        <ProgressBar value={92} size="sm" variant="sky" />
                        <span className="text-[10px] text-navy-500 mt-1 block">₹8.65L of ₹9.40L target</span>
                      </div>
                    </Stack>
                  </Card>

                  {/* Confirmed Sponsors */}
                  <Card
                    title="Active Sponsors"
                    subtitle="Corporate brand partnerships"
                    headerAction={
                      <Badge variant="primary" size="sm">
                        4 Brands
                      </Badge>
                    }
                  >
                    <div className="space-y-3">
                      {SPONSORSHIPS.map((sp, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-card-sm bg-slate-50 border border-slate-200/80"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-xs font-black text-brand-700">
                              {sp.brand.charAt(0)}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-navy-900">{sp.brand}</div>
                              <div className="text-[10px] text-navy-500 font-medium">{sp.tier}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-bold text-emerald-600">{sp.amount}</div>
                            <div className="text-[10px] text-navy-400">{sp.event}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </Grid>

              {/* Bottom Section: Recent Resident Payments Table */}
              <Card
                title="Recent Resident Payments & Passes"
                subtitle="Live stream of event ticket purchases, sponsorships, and fee payments"
                headerAction={
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Icon name="FileText" size={14} />}
                      onClick={() => toast.info("Downloading payment ledger...")}
                    >
                      Export CSV
                    </Button>
                  </div>
                }
              >
                <Table
                  columns={paymentColumns}
                  data={RECENT_PAYMENTS}
                  selectable
                  selectedRows={selectedPaymentRows}
                  onSelectRow={(id) => {
                    setSelectedPaymentRows((prev) =>
                      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                    );
                  }}
                  onSelectAll={(checked) => {
                    setSelectedPaymentRows(checked ? RECENT_PAYMENTS.map((p) => p.id) : []);
                  }}
                />
              </Card>
            </Stack>
          )}

          {/* =========================================================
              VIEW 2: EVENTS & BOOKINGS VIEW
          ========================================================= */}
          {activeNav === "events" && (
            <Stack direction="vertical" gap={6}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <Typography variant="h4" className="font-extrabold text-navy-900">
                    Community Events & Venues
                  </Typography>
                  <Typography variant="bodySmall" className="text-navy-500">
                    Create, manage and publish events for {currentSocietyObj.name}
                  </Typography>
                </div>
                <Button
                  variant="primary"
                  leftIcon={<Icon name="Plus" size={16} />}
                  onClick={() => setBookingModalOpen(true)}
                >
                  Create New Event
                </Button>
              </div>

              <Grid cols={{ default: 1, md: 3 }} gap={6}>
                {UPCOMING_EVENTS.map((evt) => (
                  <Card key={evt.id} padding="none" hoverable className="flex flex-col justify-between">
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <Badge variant={evt.badgeVariant} size="sm" dot>
                          {evt.category}
                        </Badge>
                        <span className="text-xs font-bold text-navy-500">{evt.date}</span>
                      </div>

                      <h3 className="text-base font-bold text-navy-900 leading-snug">{evt.title}</h3>
                      <p className="text-xs text-navy-500 flex items-center gap-1 font-medium">
                        <Icon name="MapPin" size={14} /> {evt.venue}
                      </p>

                      <div className="p-3 bg-slate-50 rounded-card-sm border border-slate-200/80 space-y-2">
                        <div className="flex justify-between text-xs font-semibold text-navy-700">
                          <span>Target Budget</span>
                          <span className="font-bold text-brand-700">₹{evt.targetCollection.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs font-semibold text-navy-700">
                          <span>Attendees</span>
                          <span className="font-bold text-emerald-600">{evt.attendees} Registered</span>
                        </div>
                        <ProgressBar value={(evt.attendees / evt.capacity) * 100} size="xs" variant="primary" />
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-600">{evt.status}</span>
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => toast.success(`Managing tickets for ${evt.title}`)}
                      >
                        Manage Event
                      </Button>
                    </div>
                  </Card>
                ))}
              </Grid>
            </Stack>
          )}

          {/* =========================================================
              VIEW 3: COLLECTIONS & DUES
          ========================================================= */}
          {activeNav === "collections" && (
            <Stack direction="vertical" gap={6}>
              <div>
                <Typography variant="h4" className="font-extrabold text-navy-900">
                  Collections & Financial Ledgers
                </Typography>
                <Typography variant="bodySmall" className="text-navy-500">
                  Track resident payment transactions, collection campaigns, and pending dues
                </Typography>
              </div>

              <Grid cols={{ default: 1, sm: 3 }} gap={4}>
                <Card padding="md">
                  <span className="text-xs font-bold text-navy-500 uppercase">Total Received (YTD)</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">₹14,85,000</div>
                  <span className="text-xs text-navy-500">From 132 units & 4 corporate sponsors</span>
                </Card>
                <Card padding="md">
                  <span className="text-xs font-bold text-navy-500 uppercase">Pending Invoices</span>
                  <div className="text-2xl font-black text-amber-600 mt-1">₹42,500</div>
                  <span className="text-xs text-navy-500">8 units with pending payments</span>
                </Card>
                <Card padding="md">
                  <span className="text-xs font-bold text-navy-500 uppercase">Bank Account Balance</span>
                  <div className="text-2xl font-black text-brand-700 mt-1">₹38,20,400</div>
                  <span className="text-xs text-navy-500">HDFC Society Escrow Account</span>
                </Card>
              </Grid>

              <Card title="All Transactions" subtitle="Detailed audit logs">
                <Table columns={paymentColumns} data={RECENT_PAYMENTS} />
              </Card>
            </Stack>
          )}

          {/* =========================================================
              VIEW 4: SPONSORSHIPS
          ========================================================= */}
          {activeNav === "sponsorships" && (
            <Stack direction="vertical" gap={6}>
              <div className="flex items-center justify-between">
                <div>
                  <Typography variant="h4" className="font-extrabold text-navy-900">
                    Corporate Sponsorships & Partnerships
                  </Typography>
                  <Typography variant="bodySmall" className="text-navy-500">
                    Manage sponsor packages, contracts and revenue allocation
                  </Typography>
                </div>
                <Button
                  variant="primary"
                  leftIcon={<Icon name="Plus" size={15} />}
                  onClick={() => toast.info("Create new sponsorship package modal")}
                >
                  Add Sponsor
                </Button>
              </div>

              <Grid cols={{ default: 1, md: 2 }} gap={6}>
                {SPONSORSHIPS.map((sp, idx) => (
                  <Card key={idx} padding="md" hoverable className="border-l-4 border-l-brand-600">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="primary" size="sm">
                          {sp.tier}
                        </Badge>
                        <h3 className="text-lg font-bold text-navy-900 mt-2">{sp.brand}</h3>
                        <p className="text-xs text-navy-500 font-medium">Assigned Event: {sp.event}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-emerald-600">{sp.amount}</span>
                        <div className="text-[11px] text-navy-400 mt-0.5">Contract Verified</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </Grid>
            </Stack>
          )}

          {/* =========================================================
              VIEW 5: RESIDENTS & UNITS
          ========================================================= */}
          {activeNav === "residents" && (
            <Stack direction="vertical" gap={6}>
              <div>
                <Typography variant="h4" className="font-extrabold text-navy-900">
                  Society Directory: Units & Residents
                </Typography>
                <Typography variant="bodySmall" className="text-navy-500">
                  140 Total Units in {currentSocietyObj.name}
                </Typography>
              </div>

              <Grid cols={{ default: 2, sm: 4 }} gap={4}>
                <Card padding="sm" className="text-center">
                  <div className="text-2xl font-black text-navy-900">140</div>
                  <div className="text-xs text-navy-500 font-bold uppercase mt-0.5">Total Flats</div>
                </Card>
                <Card padding="sm" className="text-center">
                  <div className="text-2xl font-black text-emerald-600">118</div>
                  <div className="text-xs text-navy-500 font-bold uppercase mt-0.5">Owner Occupied</div>
                </Card>
                <Card padding="sm" className="text-center">
                  <div className="text-2xl font-black text-sky-600">14</div>
                  <div className="text-xs text-navy-500 font-bold uppercase mt-0.5">Tenant Occupied</div>
                </Card>
                <Card padding="sm" className="text-center">
                  <div className="text-2xl font-black text-amber-600">8</div>
                  <div className="text-xs text-navy-500 font-bold uppercase mt-0.5">Vacant / Renovation</div>
                </Card>
              </Grid>
            </Stack>
          )}

          {/* =========================================================
              VIEW 6: UI COMPONENT SYSTEM EXPLORER
          ========================================================= */}
          {activeNav === "components" && (
            <Stack direction="vertical" gap={6}>
              <Card
                title="Design System & Component Library Explorer"
                subtitle="Live sandbox showcasing all Modern Community Blue common UI primitives"
                headerAction={
                  <Badge variant="navy" size="md">
                    THEME OPTION 1: MODERN COMMUNITY BLUE
                  </Badge>
                }
              >
                {/* Component Subtabs */}
                <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-200">
                  {[
                    { id: "actions", label: "Buttons & Actions" },
                    { id: "forms", label: "Form Controls" },
                    { id: "content", label: "Cards, Badges & Tables" },
                    { id: "feedback", label: "Alerts, Modals & Toast" },
                    { id: "api", label: "Centralized API Client" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setComponentSubTab(tab.id)}
                      className={`px-3 py-1.5 rounded-card-sm text-xs font-bold transition-all ${
                        componentSubTab === tab.id
                          ? "bg-brand-600 text-white shadow-soft"
                          : "bg-slate-100 text-navy-700 hover:bg-slate-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* SubTab 1: Buttons */}
                {componentSubTab === "actions" && (
                  <div className="pt-4 space-y-6">
                    <div>
                      <Typography variant="h6" className="font-bold mb-3">Button Color Variants</Typography>
                      <div className="flex flex-wrap gap-3 items-center">
                        <Button variant="primary">Primary Royal Blue</Button>
                        <Button variant="secondary">Secondary Slate</Button>
                        <Button variant="sky">Sky Blue Accent</Button>
                        <Button variant="success">Emerald Success</Button>
                        <Button variant="danger">Rose Danger</Button>
                        <Button variant="warning">Amber Warning</Button>
                        <Button variant="navy">Dark Navy</Button>
                        <Button variant="outline">Outline Blue</Button>
                        <Button variant="ghost">Ghost Button</Button>
                        <Button variant="link">Link Style</Button>
                      </div>
                    </div>

                    <div>
                      <Typography variant="h6" className="font-bold mb-3">Button Sizes & Icons</Typography>
                      <div className="flex flex-wrap items-center gap-3">
                        <Button size="xs" variant="primary">Size XS</Button>
                        <Button size="sm" variant="primary">Size SM</Button>
                        <Button size="md" variant="primary">Size MD</Button>
                        <Button size="lg" variant="primary">Size LG</Button>
                        <Button size="md" variant="primary" leftIcon={<Icon name="Plus" size={16} />}>
                          With Left Icon
                        </Button>
                        <Button size="md" variant="outline" rightIcon={<Icon name="ArrowRight" size={16} />}>
                          With Right Icon
                        </Button>
                        <Button size="md" variant="primary" loading>
                          Loading State
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* SubTab 2: Forms */}
                {componentSubTab === "forms" && (
                  <div className="pt-4 space-y-4">
                    <Grid cols={{ default: 1, md: 2 }} gap={4}>
                      <Input
                        label="Full Name"
                        placeholder="e.g. Aarav Sharma"
                        required
                        leftIcon={<Icon name="User" size={15} />}
                      />
                      <Input
                        label="Society Flat / Unit Number"
                        placeholder="e.g. Flat A-402"
                        required
                        leftIcon={<Icon name="Home" size={15} />}
                      />
                      <Select
                        label="Resident Category"
                        options={[
                          { label: "Owner (Resident)", value: "owner" },
                          { label: "Tenant Resident", value: "tenant" },
                          { label: "Executive Committee Member", value: "ec" },
                        ]}
                      />
                      <DatePicker
                        label="Tentative Event Date"
                        value={demoDate}
                        onChange={(e) => setDemoDate(e.target.value)}
                      />
                    </Grid>

                    <Divider className="my-2" />

                    <div className="space-y-3">
                      <Slider
                        label="Expected Guest Attendance"
                        value={demoSlider}
                        min={10}
                        max={500}
                        step={5}
                        onChange={(e) => setDemoSlider(Number(e.target.value))}
                        valueDisplay={`${demoSlider} Attendees`}
                      />

                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-card-sm border border-slate-200">
                        <div>
                          <div className="text-xs font-bold text-navy-900">Enable Automated SMS & WhatsApp Reminders</div>
                          <div className="text-[11px] text-navy-500">Send confirmation tickets directly to resident phone</div>
                        </div>
                        <Switch checked={demoSwitch} onChange={(e) => setDemoSwitch(e.target.checked)} />
                      </div>
                    </div>
                  </div>
                )}

                {/* SubTab 3: Content */}
                {componentSubTab === "content" && (
                  <div className="pt-4 space-y-6">
                    <div>
                      <Typography variant="h6" className="font-bold mb-2">Modern Badges</Typography>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="primary" dot>Primary Royal Blue</Badge>
                        <Badge variant="sky" dot>Sky Blue</Badge>
                        <Badge variant="success" dot>Emerald Success</Badge>
                        <Badge variant="warning" dot>Amber Warning</Badge>
                        <Badge variant="danger" dot>Rose Danger</Badge>
                        <Badge variant="navy">Dark Navy</Badge>
                        <Badge variant="outline">Outline</Badge>
                      </div>
                    </div>

                    <div>
                      <Typography variant="h6" className="font-bold mb-2">Avatars & Status Indicators</Typography>
                      <div className="flex items-center gap-3">
                        <Avatar name="Aarav Sharma" size="lg" status="online" />
                        <Avatar name="Priya Patel" size="md" status="busy" />
                        <Avatar name="Rohan Verma" size="sm" status="away" />
                        <Avatar name="Sneha Rao" size="xs" status="offline" />
                      </div>
                    </div>
                  </div>
                )}

                {/* SubTab 4: Feedback */}
                {componentSubTab === "feedback" && (
                  <div className="pt-4 space-y-4">
                    <Alert
                      variant="info"
                      title="Modern Community Blue Theme"
                      description="Clean, trustworthy and professional design tokens active across the frontend."
                    />
                    <Alert
                      variant="success"
                      title="Payment System Operational"
                      description="UPI, NetBanking, and Payment Gateway webhooks are running normally."
                    />
                    <div className="flex gap-3">
                      <Button variant="primary" onClick={() => toast.success("Sample success notification!")}>
                        Trigger Success Toast
                      </Button>
                      <Button variant="danger" onClick={() => toast.error("Sample error notification!")}>
                        Trigger Error Toast
                      </Button>
                      <Button variant="sky" onClick={() => setBookingModalOpen(true)}>
                        Open Modal Dialog
                      </Button>
                    </div>
                  </div>
                )}

                {/* SubTab 5: API Tester */}
                {componentSubTab === "api" && (
                  <div className="pt-4 space-y-4">
                    <div className="p-4 bg-slate-50 rounded-card-sm border border-slate-200 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-navy-900">API Base Target: {envConfig.apiUrl}</div>
                        <div className="text-[11px] text-navy-500">Request Timeout: {envConfig.apiTimeout}ms</div>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        loading={apiTesting}
                        leftIcon={<Icon name="Zap" size={14} />}
                        onClick={handleTestApi}
                      >
                        Ping Backend API
                      </Button>
                    </div>

                    {apiResult && (
                      <div className="p-3 bg-navy-950 text-slate-100 rounded-card-sm text-xs font-mono overflow-x-auto">
                        {JSON.stringify(apiResult, null, 2)}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </Stack>
          )}
        </main>
      </div>

      {/* =========================================================
          REUSABLE MODAL: CREATE / BOOK EVENT
      ========================================================= */}
      <Modal
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        title="Create Community Event / Book Venue"
        description="Fill in event details to publish tickets and schedule venue availability."
        footer={
          <>
            <Button variant="secondary" onClick={() => setBookingModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setBookingModalOpen(false);
                toast.success("Event created and published to society portal!");
              }}
            >
              Publish Event
            </Button>
          </>
        }
      >
        <Stack direction="vertical" gap={4}>
          <Input
            label="Event Name"
            placeholder="e.g. New Year Musical Eve 2027"
            required
          />
          <Grid cols={{ default: 1, sm: 2 }} gap={3}>
            <Select
              label="Venue Location"
              options={[
                { label: "Main Clubhouse & Lawn", value: "clubhouse" },
                { label: "Central Garden Amphitheater", value: "garden" },
                { label: "Auditorium Wing B", value: "auditorium" },
                { label: "Sports Turf & Court", value: "turf" },
              ]}
            />
            <DatePicker
              label="Event Date"
              defaultValue="2026-10-24"
            />
          </Grid>
          <Input
            label="Target Budget / Collection (₹)"
            placeholder="e.g. 500000"
            type="number"
          />
          <TextArea
            label="Description & Resident Instructions"
            placeholder="Provide event schedule, catering details, and ticket pass pricing rules..."
            rows={3}
          />
        </Stack>
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider position="top-right">
      <SocietyAppContent />
    </ToastProvider>
  );
}

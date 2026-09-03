import React, { useState } from "react";
import {
  // Action
  Button,
  IconButton,
  Link,
  // Form
  Input,
  TextArea,
  Checkbox,
  RadioGroup,
  Select,
  Switch,
  Slider,
  DatePicker,
  // Navigation
  Tabs,
  Breadcrumbs,
  Pagination,
  // Content
  Typography,
  Table,
  List,
  Card,
  Avatar,
  Badge,
  Icon,
  // Feedback
  Alert,
  ToastProvider,
  useToast,
  Modal,
  Tooltip,
  Spinner,
  ProgressBar,
  // Layout
  Container,
  Stack,
  Grid,
  Divider,
} from "./components";
import { envConfig, ENVIRONMENTS } from "./config";
import { apiClient } from "./api";

function ShowcaseContent() {
  const toast = useToast();

  // State for interactive demonstrations
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([1]);
  const [sliderVal, setSliderVal] = useState(45);
  const [switchVal, setSwitchVal] = useState(true);
  const [radioVal, setRadioVal] = useState("admin");
  const [dateVal, setDateVal] = useState("2026-09-15");
  const [progressVal, setProgressVal] = useState(65);
  const [apiTesting, setApiTesting] = useState(false);
  const [apiResult, setApiResult] = useState(null);

  // Table sample data
  const tableColumns = [
    { key: "id", header: "ID", width: "60px" },
    {
      key: "name",
      header: "Member Name",
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={val} size="sm" status={row.status === "Active" ? "online" : "away"} />
          <div>
            <div className="font-semibold text-gray-900">{val}</div>
            <div className="text-xs text-gray-400">{row.email}</div>
          </div>
        </div>
      ),
    },
    { key: "role", header: "Role" },
    {
      key: "status",
      header: "Status",
      render: (val) => (
        <Badge
          variant={val === "Active" ? "success" : "warning"}
          dot
          size="sm"
        >
          {val}
        </Badge>
      ),
    },
    { key: "eventsAttended", header: "Events", align: "right" },
  ];

  const tableData = [
    { id: 1, name: "Aarav Sharma", email: "aarav@society.com", role: "President", status: "Active", eventsAttended: 18 },
    { id: 2, name: "Priya Patel", email: "priya@society.com", role: "Treasurer", status: "Active", eventsAttended: 24 },
    { id: 3, name: "Rohan Verma", email: "rohan@society.com", role: "Secretary", status: "Away", eventsAttended: 11 },
    { id: 4, name: "Ananya Iyer", email: "ananya@society.com", role: "Coordinator", status: "Active", eventsAttended: 9 },
  ];

  // Test API client
  const handleTestApi = async () => {
    setApiTesting(true);
    setApiResult(null);
    try {
      // Test request to health or ping endpoint
      const res = await apiClient.get("health", { timeout: 3000 });
      setApiResult(res);
      if (res.success) {
        toast.success("API request succeeded!");
      } else {
        toast.warning(`API reachable test result: ${res.message || res.status}`);
      }
    } catch (err) {
      setApiResult({ error: err.message });
      toast.error("API error encountered");
    } finally {
      setApiTesting(false);
    }
  };

  const navTabItems = [
    {
      id: "overview",
      label: "Overview & Env",
      icon: <Icon name="Activity" size={16} />,
      content: (
        <Stack direction="vertical" gap={6} className="mt-4">
          {/* Environment Banner */}
          <Card
            title="Environment & Centralized API Status"
            subtitle="Configured via src/config/env.config.js"
            headerAction={
              <Badge
                variant={
                  envConfig.env === ENVIRONMENTS.LIVE
                    ? "danger"
                    : envConfig.env === ENVIRONMENTS.STAGE
                    ? "warning"
                    : "success"
                }
                size="lg"
                dot
              >
                ENV: {envConfig.env.toUpperCase()}
              </Badge>
            }
          >
            <Grid cols={{ default: 1, sm: 2, md: 4 }} gap={4}>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-500 uppercase tracking-wider block">Environment</span>
                <span className="text-base font-bold text-gray-800">{envConfig.env}</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-500 uppercase tracking-wider block">API Base URL</span>
                <span className="text-sm font-mono text-blue-600 truncate block" title={envConfig.apiUrl}>
                  {envConfig.apiUrl}
                </span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-500 uppercase tracking-wider block">Request Timeout</span>
                <span className="text-base font-semibold text-gray-800">{envConfig.apiTimeout} ms</span>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs text-gray-500 uppercase tracking-wider block">Safety Guard</span>
                <span className="text-xs font-semibold text-emerald-600">Active (Blocks Localhost in Live)</span>
              </div>
            </Grid>

            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-gray-500">
                Test the unified <code className="text-blue-600">apiClient</code> against current base URL:
              </div>
              <Button
                size="sm"
                variant="primary"
                loading={apiTesting}
                leftIcon={<Icon name="Zap" size={14} />}
                onClick={handleTestApi}
              >
                Ping API Client
              </Button>
            </div>

            {apiResult && (
              <div className="mt-4 p-3 rounded-lg bg-gray-900 text-gray-100 text-xs font-mono overflow-x-auto">
                <div className="text-gray-400 mb-1">{"// API Response Payload:"}</div>
                {JSON.stringify(apiResult, null, 2)}
              </div>
            )}
          </Card>

          {/* Quick Component Summary */}
          <Grid cols={{ default: 2, sm: 3, md: 6 }} gap={4}>
            {[
              { title: "Form Components", count: "8 Controls", icon: "CheckSquare" },
              { title: "Action Controls", count: "3 Types", icon: "MousePointer" },
              { title: "Navigation", count: "3 Components", icon: "Navigation" },
              { title: "Content Display", count: "7 Primitives", icon: "Layers" },
              { title: "Feedback & Alerts", count: "5 Systems", icon: "Bell" },
              { title: "Layout Primitives", count: "5 Helpers", icon: "Layout" },
            ].map((cat, idx) => (
              <Card key={idx} padding="sm" hoverable className="text-center">
                <div className="flex justify-center mb-2 text-blue-600">
                  <Icon name={cat.icon} size={24} />
                </div>
                <div className="font-semibold text-xs text-gray-800">{cat.title}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{cat.count}</div>
              </Card>
            ))}
          </Grid>
        </Stack>
      ),
    },
    {
      id: "form",
      label: "Form Controls",
      icon: <Icon name="CheckSquare" size={16} />,
      content: (
        <Grid cols={{ default: 1, lg: 2 }} gap={6} className="mt-4">
          <Card title="Inputs & Selects" subtitle="Controlled & uncontrolled form controls with full validation">
            <Stack direction="vertical" gap={4}>
              <Input
                label="Full Name"
                placeholder="Enter member full name"
                required
                helperText="Official name registered with the society"
                leftIcon={<Icon name="User" size={16} />}
              />

              <Input
                label="Email Address"
                type="email"
                defaultValue="invalid-email@"
                error="Please provide a valid email format"
                required
                leftIcon={<Icon name="Mail" size={16} />}
              />

              <Select
                label="Society Role"
                options={[
                  { label: "Executive Committee Member", value: "ec" },
                  { label: "Resident Owner", value: "owner" },
                  { label: "Tenant Resident", value: "tenant" },
                  { label: "Associate Member", value: "associate" },
                ]}
                defaultValue="owner"
                required
              />

              <DatePicker
                label="Event Date"
                value={dateVal}
                onChange={(e) => setDateVal(e.target.value)}
                helperText="Choose the tentative event date"
              />
            </Stack>
          </Card>

          <Card title="Selection, Slider & Toggles" subtitle="Interactive switches, sliders, checkboxes and radio groups">
            <Stack direction="vertical" gap={5}>
              <TextArea
                label="Event Description"
                placeholder="Provide event details..."
                rows={3}
                maxLength={200}
                showCount
                helperText="Maximum 200 characters"
              />

              <Slider
                label="Expected Attendees Capacity"
                min={10}
                max={200}
                value={sliderVal}
                onChange={setSliderVal}
              />

              <Switch
                label="Enable Email Notifications"
                description="Send updates when residents RSVP to this event"
                checked={switchVal}
                onChange={setSwitchVal}
              />

              <Divider dashed />

              <RadioGroup
                label="Access Permission Level"
                name="access_level"
                value={radioVal}
                onChange={setRadioVal}
                direction="horizontal"
                options={[
                  { label: "Admin", value: "admin" },
                  { label: "Staff", value: "staff" },
                  { label: "Viewer", value: "viewer" },
                ]}
              />

              <Checkbox
                label="Agree to Society Terms & Guidelines"
                description="Confirm adherence to noise level and venue cleanliness policies"
                defaultChecked
              />
            </Stack>
          </Card>
        </Grid>
      ),
    },
    {
      id: "actions",
      label: "Actions & Buttons",
      icon: <Icon name="MousePointer" size={16} />,
      content: (
        <Stack direction="vertical" gap={6} className="mt-4">
          <Card title="Button Variants" subtitle="9 Semantic design variants with smooth active and focus states">
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="success">Success</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="warning">Warning</Button>
              <Button variant="info">Info</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="link">Link Style</Button>
            </div>
          </Card>

          <Card title="Button Sizes & States" subtitle="Size hierarchy, loading indicators, and left/right icons">
            <Stack direction="vertical" gap={4}>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="xs">Size XS</Button>
                <Button size="sm">Size SM</Button>
                <Button size="md">Size MD</Button>
                <Button size="lg">Size LG</Button>
                <Button size="xl">Size XL</Button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" loading>Saving...</Button>
                <Button variant="danger" disabled>Disabled State</Button>
                <Button
                  variant="primary"
                  leftIcon={<Icon name="Plus" size={16} />}
                >
                  Create Event
                </Button>
                <Button
                  variant="secondary"
                  rightIcon={<Icon name="ArrowRight" size={16} />}
                >
                  Next Step
                </Button>
              </div>
            </Stack>
          </Card>

          <Card title="Icon Buttons & Semantic Links" subtitle="Accessible icon actions and internal/external hyperlinks">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <IconButton icon={<Icon name="Search" size={18} />} aria-label="Search" variant="primary" />
                <IconButton icon={<Icon name="Bell" size={18} />} aria-label="Notifications" variant="secondary" />
                <IconButton icon={<Icon name="Edit" size={18} />} aria-label="Edit item" variant="ghost" />
                <IconButton icon={<Icon name="Trash" size={18} />} aria-label="Delete item" variant="danger" />
              </div>
              <Divider orientation="vertical" />
              <div className="flex items-center gap-4 text-sm">
                <Link href="#internal" variant="primary">Internal Link</Link>
                <Link href="https://github.com" external variant="secondary">External Link</Link>
                <Link href="#danger" variant="danger" underline="always">Danger Action Link</Link>
              </div>
            </div>
          </Card>
        </Stack>
      ),
    },
    {
      id: "feedback",
      label: "Feedback & Overlays",
      icon: <Icon name="Bell" size={16} />,
      content: (
        <Stack direction="vertical" gap={6} className="mt-4">
          <Card title="Alerts" subtitle="Dismissible contextual alert boxes">
            <Stack direction="vertical" gap={3}>
              <Alert
                variant="success"
                title="Event Approved"
                description="Annual General Meeting has been scheduled and broadcasted to all residents."
                closable
              />
              <Alert
                variant="warning"
                title="Maintenance Scheduled"
                description="Elevator service will occur this Saturday between 10:00 AM and 2:00 PM."
                closable
              />
              <Alert
                variant="error"
                title="Payment Failed"
                description="Unable to process society maintenance dues. Please verify card details."
                closable
              />
              <Alert
                variant="info"
                title="New Feature Available"
                description="Resident parking stall reservations can now be booked directly online."
                closable
              />
            </Stack>
          </Card>

          <Grid cols={{ default: 1, md: 2 }} gap={6}>
            <Card title="Toast Notification Triggers" subtitle="Interactive multi-toast notification stack">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => toast.success("Maintenance fee marked as paid.")}
                >
                  Trigger Success
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => toast.error("Could not cancel RSVP. Try again.")}
                >
                  Trigger Error
                </Button>
                <Button
                  size="sm"
                  variant="warning"
                  onClick={() => toast.warning("Low venue booking quota remaining.")}
                >
                  Trigger Warning
                </Button>
                <Button
                  size="sm"
                  variant="info"
                  onClick={() => toast.info("New circular posted by committee.")}
                >
                  Trigger Info
                </Button>
              </div>
            </Card>

            <Card title="Modal & Tooltips" subtitle="Accessible dialogs and directional tooltips">
              <Stack direction="vertical" gap={4}>
                <div>
                  <Button variant="primary" onClick={() => setModalOpen(true)}>
                    Open Confirmation Modal
                  </Button>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Tooltip content="Tooltip displayed on Top" position="top">
                    <Button size="sm" variant="secondary">Top Tooltip</Button>
                  </Tooltip>
                  <Tooltip content="Tooltip displayed on Bottom" position="bottom">
                    <Button size="sm" variant="secondary">Bottom Tooltip</Button>
                  </Tooltip>
                  <Tooltip content="Tooltip displayed on Left" position="left">
                    <Button size="sm" variant="secondary">Left Tooltip</Button>
                  </Tooltip>
                  <Tooltip content="Tooltip displayed on Right" position="right">
                    <Button size="sm" variant="secondary">Right Tooltip</Button>
                  </Tooltip>
                </div>
              </Stack>
            </Card>
          </Grid>

          <Card title="Spinners & Progress Bars" subtitle="Loading states and progress tracking">
            <Stack direction="vertical" gap={4}>
              <div className="flex items-center gap-6">
                <Spinner size="xs" />
                <Spinner size="sm" />
                <Spinner size="md" color="success" />
                <Spinner size="lg" color="danger" />
                <Spinner size="xl" label="Loading assets..." />
              </div>

              <div className="flex items-center gap-4">
                <ProgressBar
                  value={progressVal}
                  label="Community Hall Renovation Funding"
                  showLabel
                  variant="primary"
                />
                <Button
                  size="xs"
                  variant="secondary"
                  onClick={() => setProgressVal((p) => (p >= 100 ? 10 : p + 15))}
                >
                  +15%
                </Button>
              </div>
            </Stack>
          </Card>
        </Stack>
      ),
    },
    {
      id: "content",
      label: "Content & Table",
      icon: <Icon name="Layers" size={16} />,
      content: (
        <Stack direction="vertical" gap={6} className="mt-4">
          <Card title="Responsive Data Table" subtitle="Columns, custom cell renderers, row selection, and pagination">
            <Table
              columns={tableColumns}
              data={tableData}
              selectable
              selectedRows={selectedRows}
              onSelectRow={(id) => {
                setSelectedRows((prev) =>
                  prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                );
              }}
              onSelectAll={(checked) => {
                setSelectedRows(checked ? tableData.map((d) => d.id) : []);
              }}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={5}
              totalItems={20}
              pageSize={4}
              onPageChange={setCurrentPage}
            />
          </Card>

          <Grid cols={{ default: 1, md: 3 }} gap={6}>
            <Card title="Avatars & Status" subtitle="Initials fallback & status dot">
              <div className="flex items-center gap-3">
                <Avatar name="Rajan Patel" size="lg" status="online" />
                <Avatar name="Sneha Rao" size="md" status="busy" />
                <Avatar name="Karan Joshi" size="sm" status="away" />
                <Avatar name="Anil K" size="xs" status="offline" />
              </div>
            </Card>

            <Card title="Badges" subtitle="Color variants & dot indicators">
              <div className="flex flex-wrap gap-2">
                <Badge variant="primary" dot>Primary</Badge>
                <Badge variant="success" dot>Success</Badge>
                <Badge variant="warning" dot>Warning</Badge>
                <Badge variant="danger" dot>Danger</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </Card>

            <Card title="Breadcrumbs & List" subtitle="Navigation path and structured list">
              <Breadcrumbs
                items={[
                  { label: "Home", href: "#" },
                  { label: "Events", href: "#" },
                  { label: "Diwali Gala 2026", current: true },
                ]}
              />
              <Divider dashed className="my-2" />
              <List
                items={[
                  "Catering arrangement confirmed",
                  "Audio-visual equipment tested",
                  "Security team briefed",
                ]}
                variant="simple"
                spacing="sm"
              />
            </Card>
          </Grid>
        </Stack>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 pb-16">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <Container maxWidth="7xl">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                S
              </div>
              <div>
                <Typography variant="h5" className="leading-tight font-bold">
                  Society Component System
                </Typography>
                <Typography variant="caption" className="text-gray-500">
                  Reusable React + Tailwind Common UI Layer & Environment API
                </Typography>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant={
                  envConfig.env === ENVIRONMENTS.LIVE
                    ? "danger"
                    : envConfig.env === ENVIRONMENTS.STAGE
                    ? "warning"
                    : "success"
                }
                dot
              >
                {envConfig.env.toUpperCase()} MODE
              </Badge>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Icon name="Code" size={14} />}
                onClick={() => toast.info(`Current API Target: ${envConfig.apiUrl}`)}
              >
                Inspect API
              </Button>
            </div>
          </div>
        </Container>
      </header>

      {/* Main Body */}
      <main className="pt-6">
        <Container maxWidth="7xl">
          <Tabs items={navTabItems} variant="pills" size="md" />
        </Container>
      </main>

      {/* Reusable Modal Dialog */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Confirm Event Booking"
        description="Review booking parameters before submitting to the committee."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setModalOpen(false);
                toast.success("Event booking confirmed successfully!");
              }}
            >
              Confirm Booking
            </Button>
          </>
        }
      >
        <Stack direction="vertical" gap={3}>
          <Typography variant="bodySmall">
            You are about to book the <strong>Community Club House</strong> for the tentative date{" "}
            <code className="bg-gray-100 px-1 py-0.5 rounded text-blue-600">{dateVal}</code> with an
            expected attendance of <strong>{sliderVal}</strong> guests.
          </Typography>
          <Alert
            variant="info"
            title="Refund Policy Notice"
            description="Cancellations made 48 hours prior to the event will receive a 100% refund."
          />
        </Stack>
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider position="top-right">
      <ShowcaseContent />
    </ToastProvider>
  );
}

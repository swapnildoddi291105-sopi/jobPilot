const statuses = ["Applied", "Interviewing", "Offer", "Rejected", "Saved", "Phone Screen"]
const sources = ["LinkedIn", "Indeed", "Referral", "Company Site", "Glassdoor", "AngelList"]
const jobTitles = [
  "Senior Frontend Engineer",
  "Full Stack Developer",
  "React Developer",
  "Software Engineer II",
  "Frontend Architect",
  "UI Engineer",
  "Staff Engineer",
  "Senior Software Engineer",
  "Lead Developer",
  "Web Developer",
  "TypeScript Developer",
  "Next.js Developer",
  "Platform Engineer",
  "DevOps Engineer",
  "Backend Engineer",
]
const companies = [
  "Google",
  "Meta",
  "Amazon",
  "Apple",
  "Microsoft",
  "Netflix",
  "Stripe",
  "Airbnb",
  "Spotify",
  "Figma",
  "Vercel",
  "Shopify",
  "Slack",
  "Twilio",
  "Datadog",
  "Cloudflare",
  "Notion",
  "Linear",
  "Coinbase",
  "Roblox",
  "Uber",
  "Lyft",
  "Salesforce",
  "Adobe",
  "Atlassian",
  "Square",
  "PayPal",
  "Databricks",
  "Snowflake",
  "MongoDB",
]
const locations = [
  "San Francisco, CA",
  "New York, NY",
  "Seattle, WA",
  "Austin, TX",
  "Remote",
  "Chicago, IL",
  "Boston, MA",
  "Denver, CO",
  "Los Angeles, CA",
  "Miami, FL",
]
const salaryRanges = [
  "$120k - $160k",
  "$140k - $180k",
  "$160k - $200k",
  "$180k - $220k",
  "$200k - $250k",
  "$150k - $190k",
  "$130k - $170k",
  "$170k - $210k",
  "$190k - $240k",
  "$220k - $280k",
]

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDate(daysAgo = 90) {
  const now = new Date()
  const past = new Date(now.getTime() - Math.random() * daysAgo * 24 * 60 * 60 * 1000)
  return past.toISOString()
}

function generateJobId() {
  return `job-${Math.random().toString(36).slice(2, 8)}`
}

export const mockJobs = Array.from({ length: 30 }, () => ({
  id: generateJobId(),
  title: randomFrom(jobTitles),
  company: randomFrom(companies),
  location: randomFrom(locations),
  source: randomFrom(sources),
  status: randomFrom(statuses),
  salary: randomFrom(salaryRanges),
  dateApplied: randomDate(90),
  url: "https://example.com/job",
  description:
    "We are looking for a skilled engineer to join our team and help build the next generation of our platform. You will work with cutting-edge technologies and collaborate with a talented team.",
  notes: "Applied with tailored resume. Follow up in one week.",
  timeline: [
    { event: "Application submitted", date: randomDate(14) },
    { event: "Recruiter outreach", date: randomDate(10) },
    { event: "Technical screen scheduled", date: randomDate(7) },
  ],
}))

export const mockResumes = [
  {
    id: "res-001",
    name: "Senior Frontend Resume",
    fileName: "resume_frontend_2024.pdf",
    dateUploaded: randomDate(30),
    atsScore: 92,
    targetRole: "Senior Frontend Engineer",
    sections: ["Summary", "Experience", "Education", "Skills", "Projects"],
    size: "245 KB",
    lastUsed: "2 days ago",
  },
  {
    id: "res-002",
    name: "Full Stack Developer Resume",
    fileName: "resume_fullstack_v3.pdf",
    dateUploaded: randomDate(45),
    atsScore: 87,
    targetRole: "Full Stack Developer",
    sections: ["Summary", "Experience", "Education", "Technical Skills", "Certifications"],
    size: "312 KB",
    lastUsed: "5 days ago",
  },
  {
    id: "res-003",
    name: "Software Engineer Resume",
    fileName: "resume_swe_generic.pdf",
    dateUploaded: randomDate(60),
    atsScore: 78,
    targetRole: "Software Engineer",
    sections: ["Objective", "Work Experience", "Education", "Skills"],
    size: "198 KB",
    lastUsed: "1 week ago",
  },
  {
    id: "res-004",
    name: "React Specialist Resume",
    fileName: "resume_react_specialist.pdf",
    dateUploaded: randomDate(20),
    atsScore: 95,
    targetRole: "React Developer",
    sections: ["Profile", "Experience", "Projects", "Education", "Technical Skills"],
    size: "278 KB",
    lastUsed: "1 day ago",
  },
  {
    id: "res-005",
    name: "Leadership Resume",
    fileName: "resume_tech_lead.pdf",
    dateUploaded: randomDate(90),
    atsScore: 83,
    targetRole: "Engineering Manager / Tech Lead",
    sections: ["Executive Summary", "Leadership Experience", "Technical Background", "Education"],
    size: "356 KB",
    lastUsed: "2 weeks ago",
  },
  {
    id: "res-006",
    name: "DevOps Engineer Resume",
    fileName: "resume_devops_v2.pdf",
    dateUploaded: randomDate(15),
    atsScore: 90,
    targetRole: "DevOps / Platform Engineer",
    sections: ["Summary", "Experience", "Infrastructure Projects", "Certifications", "Skills"],
    size: "267 KB",
    lastUsed: "3 days ago",
  },
]

export const mockDashboardStats = {
  jobsApplied: 147,
  jobsAppliedTrend: 12.5,
  interviewsScheduled: 23,
  interviewsTrend: 8.3,
  offersReceived: 4,
  offersTrend: 33.3,
  responseRate: 38.2,
  responseRateTrend: -2.1,
  upcomingInterviews: [
    { company: "Google", role: "Senior Frontend Engineer", date: "2026-06-28T14:00:00Z", type: "Technical" },
    { company: "Stripe", role: "Full Stack Developer", date: "2026-06-30T10:00:00Z", type: "Behavioral" },
    { company: "Vercel", role: "UI Engineer", date: "2026-07-02T15:00:00Z", type: "System Design" },
  ],
  recentJobs: mockJobs.slice(0, 5),
}

export const mockWeeklyActivity = [
  { day: "Mon", applications: 8, responses: 3 },
  { day: "Tue", applications: 12, responses: 5 },
  { day: "Wed", applications: 6, responses: 2 },
  { day: "Thu", applications: 15, responses: 7 },
  { day: "Fri", applications: 10, responses: 4 },
  { day: "Sat", applications: 3, responses: 1 },
  { day: "Sun", applications: 5, responses: 2 },
]

export const mockMonthlyTrend = [
  { month: "Jan", applications: 42, interviews: 8, offers: 1 },
  { month: "Feb", applications: 38, interviews: 6, offers: 0 },
  { month: "Mar", applications: 55, interviews: 12, offers: 1 },
  { month: "Apr", applications: 48, interviews: 10, offers: 0 },
  { month: "May", applications: 62, interviews: 15, offers: 2 },
  { month: "Jun", applications: 70, interviews: 18, offers: 3 },
]

export const mockSourceBreakdown = [
  { name: "LinkedIn", value: 45, color: "#0A66C2" },
  { name: "Indeed", value: 25, color: "#2557a7" },
  { name: "Referral", value: 15, color: "#10B981" },
  { name: "Company Site", value: 10, color: "#6366F1" },
  { name: "Other", value: 5, color: "#F59E0B" },
]

export const mockStatusBreakdown = [
  { status: "Applied", count: 85, fill: "#6366F1" },
  { status: "Phone Screen", count: 35, fill: "#3B82F6" },
  { status: "Interviewing", count: 23, fill: "#8B5CF6" },
  { status: "Offer", count: 4, fill: "#10B981" },
  { status: "Rejected", count: 28, fill: "#EF4444" },
]

export const mockUserProfile = {
  name: "Alex Johnson",
  email: "alex.johnson@email.com",
  role: "Senior Frontend Engineer",
  location: "San Francisco, CA",
  bio: "Passionate engineer with 6+ years of experience building scalable web applications. Specializing in React, TypeScript, and modern frontend architectures.",
  avatar: null,
  initials: "AJ",
}

export const mockSettings = {
  autoApply: true,
  followUpReminders: true,
  emailNotifications: true,
  browserNotifications: false,
  weeklyDigest: true,
  darkMode: false,
  targetRoles: ["Senior Frontend Engineer", "Full Stack Developer", "React Developer"],
  targetLocations: ["San Francisco, CA", "Remote", "New York, NY"],
  salaryMin: 150000,
  salaryMax: 250000,
  jobTypes: ["Full-time", "Remote"],
  sources: ["LinkedIn", "Indeed", "Company Site", "Referral"],
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  timezone: string;
  role?: "owner" | "member" | "admin";
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  notification_preferences: { email: boolean; sms: boolean };
  organizations?: Organization[];
  timezone?: string | null;
}

export type DeadlineStatus = "upcoming" | "overdue" | "done";
export type Recurrence = "none" | "monthly" | "quarterly" | "yearly" | "custom_days";

export interface DeadlineItem {
  id: number;
  organization_id: number;
  name: string;
  category: string | null;
  notes: string | null;
  due_date: string;
  days_until_due: number;
  recurrence: Recurrence;
  recurrence_interval_days: number | null;
  owner: User;
  status: DeadlineStatus;
  last_completed_at: string | null;
  is_active: boolean;
  reminder_rule?: ReminderRule | null;
  notification_targets?: NotificationTarget[];
  created_at: string;
}

export interface NotificationTarget {
  user_id: number;
  channels: ("email" | "sms")[];
  user?: User;
}

export interface ReminderRule {
  offsets_days: number[];
  overdue_repeat_days: number;
}

export interface Wallet {
  id: number;
  currency: string;
  balance_cents: number;
  available_cents: number;
  held_cents: number;
  status: string;
}

export interface WalletTransaction {
  id: number;
  type: "credit" | "debit";
  amount_cents: number;
  net_cents: number;
  reason: string;
  reference: string | null;
  balance_after_cents: number;
  created_at: string;
}

export interface ReminderLog {
  id: number;
  channel: "sms" | "email";
  content: string;
  sent_at: string;
  success: boolean;
  error: string | null;
  user: User;
}

export const CATEGORY_PRESETS = [
  "Accounting/Bookkeeping Service",
  "Advertising/Marketing Contract",
  "API/Payment Subscription",
  "Bank Loan/Facility",
  "Building/Occupancy Permit",
  "CAC/Business Registration",
  "CDN",
  "Cleaning/Janitorial Contract",
  "Cloud Hosting",
  "Co-location/Data Center",
  "Courier/Logistics Contract",
  "Customs/Import-Export License",
  "Data Protection/Privacy Registration",
  "Domain",
  "Education/Training Certification",
  "Email/Workspace",
  "Employee Contract",
  "Environmental Permit",
  "Equipment Lease",
  "Fire Safety Certificate",
  "Food Safety/Health Permit",
  "Franchise Agreement",
  "Government Levy",
  "Health/Medical Insurance",
  "Insurance (General)",
  "Intellectual Property (Trademark/Patent/Copyright)",
  "IoT/Device Certificate",
  "ISO/Quality Certification",
  "IT Support Contract",
  "Legal Retainer",
  "License/Permit (General)",
  "Liquor License",
  "Loan/EMI",
  "Maintenance Contract",
  "Manufacturing License",
  "Membership/Association Dues",
  "NGO/Nonprofit Registration",
  "Office Lease/Rent",
  "Payroll/HR Software",
  "Pension/Retirement Contribution",
  "Pest Control Contract",
  "Pharmacy License",
  "Printing/Signage Contract",
  "Professional Body License",
  "Property Lease",
  "Rent/Service Charge",
  "Retail/POS License",
  "SaaS/AI Subscription",
  "Security Service Contract",
  "Server/Hardware Warranty",
  "SSL Certificate",
  "Staff Training/Certification",
  "Statutory Filing (Annual Returns)",
  "Supplier/Vendor Contract",
  "Tax/VAT",
  "Telecom/Internet Subscription",
  "Transport Permit",
  "Utilities (Electric/Water/Gas)",
  "Vehicle/Fleet Registration & Tax",
  "Visa/Work Permit",
  "Warehouse Lease",
  "Waste Management/Disposal Permit",
  "Website Maintenance Contract",
  "Workers' Compensation Insurance",
];

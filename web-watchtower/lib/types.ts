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
  "Domain",
  "Hosting",
  "CDN",
  "SSL Certificate",
  "API/Payment Subscription",
  "SaaS/AI Subscription",
  "Email/Workspace",
  "Insurance",
  "Vehicle Registration/Tax",
  "Rent/Service Charge",
  "CAC/Business Registration",
  "Tax/VAT",
  "License/Permit",
  "Trademark/Patent",
  "Utilities (Electric/Water/Gas)",
  "Loan/EMI",
  "Maintenance Contract",
  "Payroll/HR",
  "IoT/Certificate",
  "Education",
  "Health/Medical",
  "Legal Retainer",
  "Property Lease",
  "Government Levy",
  "Other (custom)",
];

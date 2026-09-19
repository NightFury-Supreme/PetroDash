const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../frontend/messages');
const locales = ['en', 'ar', 'de', 'es', 'fr', 'hi'];

const ticketsEn = {
  "newSupportTicket": "New Support Ticket",
  "openNewRequest": "Open a new request",
  "cancel": "Cancel",
  "createTicket": "Create Ticket",
  "subject": "Subject",
  "briefDescription": "Brief description of your issue",
  "category": "Category",
  "priority": "Priority",
  "priorities": {
    "low": "Low",
    "normal": "Normal",
    "high": "High"
  },
  "categories": {
    "general": "General",
    "billing": "Billing",
    "technical": "Technical",
    "abuse": "Abuse",
    "account": "Account",
    "server": "Server",
    "payment": "Payment",
    "other": "Other"
  },
  "searchTickets": "Search your tickets...",
  "noMatchesFound": "No matches found",
  "noMatchesDesc": "Try adjusting your search or filters to find what you're looking for.",
  "noTicketsFound": "No tickets found",
  "noTicketsDesc": "You haven't opened any tickets in this category yet.",
  "status": "Status",
  "ticketId": "Ticket #",
  "allTickets": "All Tickets",
  "open": "Open",
  "pending": "Pending",
  "resolved": "Resolved",
  "closed": "Closed",
  "updated": "Updated",
  "sort": {
    "updatedDesc": "Recently Updated",
    "updatedAsc": "Oldest Updated",
    "createdDesc": "Newest First",
    "createdAsc": "Oldest First"
  },
  "loadError": "Load Error",
  "failedToLoad": "Failed to Load Ticket",
  "retry": "Retry",
  "ticketReopened": "Ticket reopened",
  "failedToReopen": "Failed to reopen ticket",
  "ticketResolved": "Ticket marked as resolved",
  "failedToResolve": "Failed to mark as resolved",
  "markResolved": "Mark as resolved",
  "reopenTicket": "Reopen Ticket",
  "actions": "Actions",
  "replying": "Replying...",
  "typeMessage": "Type your message...",
  "sendReply": "Send Reply",
  "details": "Details",
  "involved": "Involved",
  "createdAt": "Created At",
  "lastUpdated": "Last Updated",
  "copyId": "Copy ID",
  "copied": "Copied!",
  "noneYet": "None yet",
  "you": "You",
  "supportStaff": "Support Staff",
  "loadMore": "Load previous messages",
  "loading": "Loading..."
};

const backendErrorsEn = {
  "ERR_TICKET_NOT_FOUND": "Ticket not found.",
  "ERR_TICKET_FORBIDDEN": "You are not authorized to view or modify this ticket.",
  "ERR_TICKET_DELETED": "This ticket has been deleted.",
  "ERR_TICKET_CLOSED": "This ticket is closed. Please reopen it first.",
  "ERR_TICKET_LIMIT_REACHED": "You have reached the maximum limit of active tickets.",
  "ERR_TICKET_RATE_LIMIT": "Please wait before sending another message.",
  "ERR_INVALID_PAYLOAD": "Invalid ticket data provided."
};

locales.forEach(loc => {
  const filePath = path.join(localesDir, `${loc}.json`);
  if (!fs.existsSync(filePath)) return;
  
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  if (!data.Tickets) data.Tickets = {};
  if (!data.BackendErrors) data.BackendErrors = {};
  
  // Merge keys (using English as base for all for now, to ensure keys exist, translator can translate later)
  data.Tickets = { ...ticketsEn, ...data.Tickets };
  data.BackendErrors = { ...backendErrorsEn, ...data.BackendErrors };

  // For hindi specifically we can add some basic strings if we want but keeping it simple.
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
});

console.log("Translations updated!");

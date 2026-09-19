const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, '../frontend/messages');
const files = fs.readdirSync(localesDir).filter(f => f.endsWith('.json'));

const updates = {
  en: {
    Tickets: {
      "supportTickets": "Support Tickets",
      "manageTicketsDesc": "Manage all user tickets and requests.",
      "ticketsTitle": "TICKETS",
      "resolve": "Resolve",
      "deleted": "Deleted"
    },
    Common: {
      "delete": "Delete"
    }
  },
  es: {
    Tickets: {
      "supportTickets": "Tickets de soporte",
      "manageTicketsDesc": "Administrar todos los tickets y solicitudes de usuario.",
      "ticketsTitle": "TICKETS",
      "resolve": "Resolver",
      "deleted": "Eliminado"
    },
    Common: {
      "delete": "Eliminar"
    }
  },
  fr: {
    Tickets: {
      "supportTickets": "Tickets de support",
      "manageTicketsDesc": "Gérer tous les tickets et demandes des utilisateurs.",
      "ticketsTitle": "TICKETS",
      "resolve": "Résoudre",
      "deleted": "Supprimé"
    },
    Common: {
      "delete": "Supprimer"
    }
  },
  de: {
    Tickets: {
      "supportTickets": "Support-Tickets",
      "manageTicketsDesc": "Verwalten Sie alle Benutzertickets und Anfragen.",
      "ticketsTitle": "TICKETS",
      "resolve": "Lösen",
      "deleted": "Gelöscht"
    },
    Common: {
      "delete": "Löschen"
    }
  },
  ar: {
    Tickets: {
      "supportTickets": "تذاكر الدعم",
      "manageTicketsDesc": "إدارة جميع تذاكر وطلبات المستخدمين.",
      "ticketsTitle": "تذاكر",
      "resolve": "حل",
      "deleted": "محذوف"
    },
    Common: {
      "delete": "حذف"
    }
  },
  hi: {
    Tickets: {
      "supportTickets": "सहायता टिकट",
      "manageTicketsDesc": "सभी उपयोगकर्ता टिकटों और अनुरोधों को प्रबंधित करें।",
      "ticketsTitle": "टिकट",
      "resolve": "समाधान करें",
      "deleted": "हटा दिया गया"
    },
    Common: {
      "delete": "हटाएं"
    }
  }
};

for (const file of files) {
  const lang = path.basename(file, '.json');
  if (!updates[lang]) continue;
  
  const p = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  
  if (!data.Tickets) data.Tickets = {};
  if (!data.Common) data.Common = {};
  
  data.Tickets = { ...data.Tickets, ...updates[lang].Tickets };
  data.Common = { ...data.Common, ...updates[lang].Common };
  
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n');
}
console.log('Translations patched successfully.');

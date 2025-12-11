#!/usr/bin/env node
/*
 * Generates rich demo data for LoyaLoop so instructors can seed the backend quickly.
 * Output: ./seed/seedData.json
 * Usage: npm run seed
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.resolve(__dirname, 'seedData.json');

const baseUsers = [
  { role: 'regular', name: 'Riley Patel', utorid: 'rpatel', email: 'riley.patel@example.com' },
  { role: 'regular', name: 'Noah Chen', utorid: 'nchen', email: 'noah.chen@example.com' },
  { role: 'regular', name: 'Emma Singh', utorid: 'esingh', email: 'emma.singh@example.com' },
  { role: 'regular', name: 'Ava Campbell', utorid: 'acamp', email: 'ava.campbell@example.com' },
  { role: 'regular', name: 'Lucas Martin', utorid: 'lmartin', email: 'lucas.martin@example.com' },
  { role: 'cashier', name: 'Jane Cashier', utorid: 'jcash', email: 'jane.cashier@example.com' },
  { role: 'manager', name: 'Bob Manager', utorid: 'bmanager', email: 'bob.manager@example.com' },
  { role: 'superuser', name: 'Sara Admin', utorid: 'sadmin', email: 'sara.admin@example.com' },
  { role: 'organizer', name: 'Mia Eventer', utorid: 'mevent', email: 'mia.eventer@example.com' },
  { role: 'cashier', name: 'Leo Teller', utorid: 'lteller', email: 'leo.teller@example.com' },
  { role: 'regular', name: 'Olivia Brooks', utorid: 'obrooks', email: 'olivia.brooks@example.com' },
];

const users = baseUsers.map((user, index) => ({
  id: index + 1,
  points: 80 + index * 15,
  password: 'Password!123',
  avatarUrl: `/images/avatars/${user.utorid}.png`,
  ...user,
}));

const transactionTypes = ['Purchase', 'Redemption', 'Transfer'];
const merchants = ['Maple Coffee', 'Campus Bookstore', 'Union Market', 'Bike Share', 'Tech Shop'];

const transactions = Array.from({ length: 30 }, (_, idx) => {
  const type = transactionTypes[idx % transactionTypes.length];
  const amount = type === 'Purchase' ? Number((15 + Math.random() * 45).toFixed(2)) : 0;
  const points = type === 'Purchase' ? Math.round(amount) : type === 'Transfer' ? -Math.round(10 + Math.random() * 20) : -Math.round(40 + Math.random() * 25);
  const user = users[idx % users.length];
  return {
    id: `TX-${1000 + idx}`,
    type,
    amount,
    points,
    date: new Date(Date.now() - idx * 86400000).toISOString(),
    peer: type === 'Transfer' ? users[(idx + 3) % users.length].utorid : merchants[idx % merchants.length],
    description: `${type} processed for ${user.utorid}`,
    userId: user.id,
  };
});

const events = Array.from({ length: 8 }, (_, idx) => ({
  id: `EV-${200 + idx}`,
  title: [
    'Alumni Mixer',
    'Coding Jam',
    'Study Sprint',
    'Wellness Fair',
    'Trivia Night',
    'FinLit Workshop',
    'Community Cleanup',
    'Design Challenge',
  ][idx],
  location: ['Hart House', 'BA2159', 'UC Quad', 'Robarts 14F'][idx % 4],
  startDate: new Date(Date.now() + idx * 604800000).toISOString(),
  endDate: new Date(Date.now() + idx * 604800000 + 7200000).toISOString(),
  capacity: 50 + idx * 10,
  organizer: users.find(u => u.role === 'organizer')?.utorid || 'mevent',
  status: idx % 2 === 0 ? 'Published' : 'Draft',
  description: 'Network, learn, and earn loyalty points at this curated event.',
}));

const promotions = Array.from({ length: 8 }, (_, idx) => ({
  id: `PR-${300 + idx}`,
  title: ['Brew Bonus', 'Book Bundle', 'Transit Top-up', 'Snack Saver', 'Gear Flash', 'Wellness Boost', 'Cafe Combo', 'Movie Night'][idx],
  code: `LOYAL${100 + idx}`,
  description: 'Limited-time offer automatically applied at checkout.',
  pointsRequired: 40 + idx * 10,
  startDate: new Date(Date.now() - idx * 86400000).toISOString(),
  endDate: new Date(Date.now() + (idx + 7) * 86400000).toISOString(),
  status: idx % 3 === 0 ? 'Draft' : 'Live',
}));

const payload = {
  metadata: {
    generatedAt: new Date().toISOString(),
    totals: {
      users: users.length,
      transactions: transactions.length,
      events: events.length,
      promotions: promotions.length,
    },
  },
  users,
  transactions,
  events,
  promotions,
};

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));

console.log(`Seed data written to ${OUTPUT_PATH}`);


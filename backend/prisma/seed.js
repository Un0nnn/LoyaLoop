/**
 * Database Seed Script
 * This script populates the database with sample data for testing and demonstration
 *
 * Run with: node backend/prisma/seed.js
 * Or with: npm run seed (if configured in package.json)
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper function to hash passwords
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Helper function to get random item from array
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to get random number in range
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('Starting database seed...\n');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.promotionUse.deleteMany();
  await prisma.eventGuest.deleteMany();
  await prisma.eventOrganizer.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.event.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.resetPassword.deleteMany();
  await prisma.user.deleteMany();
  console.log('Existing data cleared\n');

  // ==================== USERS ====================
  console.log('Creating users...');

  const users = [];
  // Password meets requirements: 8-20 chars, uppercase, lowercase, number, special character
  const password = await hashPassword('Password123!'); // All users use same password for testing

  // 1. Superuser
  const superuser = await prisma.user.create({
    data: {
      utorid: 'superadmin',
      name: 'Super Administrator',
      email: 'superadmin@mail.utoronto.ca',
      password,
      role: 'superuser',
      points: 5000,
      verified: true,
      activated: true,
      birthday: new Date('1990-01-01'),
    },
  });
  users.push(superuser);
  console.log('  ✓ Created superuser: superadmin');

  // 2. Manager
  const manager = await prisma.user.create({
    data: {
      utorid: 'manager1',
      name: 'Sarah Manager',
      email: 'manager1@mail.utoronto.ca',
      password,
      role: 'manager',
      points: 3000,
      verified: true,
      activated: true,
      birthday: new Date('1992-05-15'),
    },
  });
  users.push(manager);
  console.log('  ✓ Created manager: manager1');

  // 3-4. Cashiers
  const cashier1 = await prisma.user.create({
    data: {
      utorid: 'cashier1',
      name: 'John Cashier',
      email: 'cashier1@mail.utoronto.ca',
      password,
      role: 'cashier',
      points: 1500,
      verified: true,
      activated: true,
      birthday: new Date('1995-08-20'),
    },
  });
  users.push(cashier1);
  console.log('  ✓ Created cashier: cashier1');

  const cashier2 = await prisma.user.create({
    data: {
      utorid: 'cashier2',
      name: 'Emily Cashier',
      email: 'cashier2@mail.utoronto.ca',
      password,
      role: 'cashier',
      points: 1200,
      verified: true,
      activated: true,
      birthday: new Date('1996-03-10'),
    },
  });
  users.push(cashier2);
  console.log('  ✓ Created cashier: cashier2');

  // 5-14. Regular users
  const regularUsers = [
    { utorid: 'alice_wong', name: 'Alice Wong', email: 'alice.wong@mail.utoronto.ca', points: 850 },
    { utorid: 'bob_smith', name: 'Bob Smith', email: 'bob.smith@mail.utoronto.ca', points: 1200 },
    { utorid: 'carol_lee', name: 'Carol Lee', email: 'carol.lee@mail.utoronto.ca', points: 650 },
    { utorid: 'david_chen', name: 'David Chen', email: 'david.chen@mail.utoronto.ca', points: 2100 },
    { utorid: 'emma_garcia', name: 'Emma Garcia', email: 'emma.garcia@mail.utoronto.ca', points: 450 },
    { utorid: 'frank_kim', name: 'Frank Kim', email: 'frank.kim@mail.utoronto.ca', points: 1800 },
    { utorid: 'grace_patel', name: 'Grace Patel', email: 'grace.patel@mail.utoronto.ca', points: 950 },
    { utorid: 'henry_liu', name: 'Henry Liu', email: 'henry.liu@mail.utoronto.ca', points: 320 },
    { utorid: 'isabel_rodriguez', name: 'Isabel Rodriguez', email: 'isabel.rodriguez@mail.utoronto.ca', points: 1450 },
    { utorid: 'jack_nguyen', name: 'Jack Nguyen', email: 'jack.nguyen@mail.utoronto.ca', points: 780 },
  ];

  for (const userData of regularUsers) {
    const user = await prisma.user.create({
      data: {
        ...userData,
        password,
        role: 'regular',
        verified: true,
        activated: true,
        birthday: new Date(`199${randomInt(3, 9)}-${randomInt(1, 12).toString().padStart(2, '0')}-${randomInt(1, 28).toString().padStart(2, '0')}`),
      },
    });
    users.push(user);
    console.log(`  ✓ Created regular user: ${userData.utorid}`);
  }

  console.log(`Created ${users.length} users\n`);

  // ==================== PROMOTIONS ====================
  console.log('Creating promotions...');

  const promotions = [];

  const promotionData = [
    {
      name: 'Welcome Bonus',
      description: 'Get 2x points on your first purchase!',
      type: 'automatic',
      rate: 2.0,
      minSpending: 10,
      startTime: new Date('2024-01-01'),
      endTime: new Date('2025-12-31'),
    },
    {
      name: 'Weekend Special',
      description: 'Extra points every weekend!',
      type: 'automatic',
      rate: 1.5,
      minSpending: 20,
      startTime: new Date('2024-06-01'),
      endTime: new Date('2025-12-31'),
    },
    {
      name: 'Big Spender',
      description: 'Spend $50+ and get 3x points',
      type: 'automatic',
      rate: 3.0,
      minSpending: 50,
      startTime: new Date('2024-09-01'),
      endTime: new Date('2025-12-31'),
    },
    {
      name: 'Holiday Bonus',
      description: 'Flat 100 bonus points on any purchase',
      type: 'onetime',
      points: 100,
      minSpending: 15,
      startTime: new Date('2024-12-01'),
      endTime: new Date('2025-01-15'),
    },
    {
      name: 'Student Special',
      description: 'Show your student ID for 200 bonus points',
      type: 'onetime',
      points: 200,
      minSpending: 25,
      startTime: new Date('2024-09-01'),
      endTime: new Date('2025-04-30'),
    },
    {
      name: 'Summer Sale',
      description: 'Double your points all summer long!',
      type: 'automatic',
      rate: 2.0,
      minSpending: 15,
      startTime: new Date('2025-06-01'),
      endTime: new Date('2025-08-31'),
    },
    {
      name: 'Loyalty Reward',
      description: 'Loyal customers get 500 bonus points',
      type: 'onetime',
      points: 500,
      minSpending: 100,
      startTime: new Date('2024-01-01'),
      endTime: new Date('2025-12-31'),
    },
  ];

  for (const promoData of promotionData) {
    const promo = await prisma.promotion.create({ data: promoData });
    promotions.push(promo);
    console.log(`  ✓ Created promotion: ${promoData.name}`);
  }

  console.log(`Created ${promotions.length} promotions\n`);

  // ==================== EVENTS ====================
  console.log('Creating events...');

  const events = [];

  const eventData = [
    {
      name: 'Welcome Week BBQ',
      description: '<p>Join us for our annual Welcome Week BBQ! Free food, games, and a chance to meet fellow CS students.</p><ul><li>Free burgers and hot dogs</li><li>Lawn games</li><li>Raffle prizes</li></ul>',
      location: 'Bahen Centre Courtyard',
      startTime: new Date('2025-09-15T12:00:00'),  // Future - September 2025
      endTime: new Date('2025-09-15T15:00:00'),
      capacity: 100,
      pointsAllocated: 50,
      published: true,
    },
    {
      name: 'Tech Talk: AI and Machine Learning',
      description: '<p>Guest speaker from Google will discuss the latest trends in AI and ML.</p><p>Topics include:</p><ul><li>Neural Networks</li><li>Deep Learning</li><li>Real-world applications</li></ul>',
      location: 'BA1190',
      startTime: new Date('2025-12-09T10:00:00'),  // LIVE NOW - December 9, 2025 10am-8pm
      endTime: new Date('2025-12-09T20:00:00'),
      capacity: 150,
      pointsAllocated: 75,
      published: true,
    },
    {
      name: 'Hack Night',
      description: '<p>All-night coding session! Work on personal projects or team up with others.</p><p>Provided:</p><ul><li>Pizza and snacks</li><li>Energy drinks</li><li>Mentors available</li></ul>',
      location: 'Bahen Centre 2270',
      startTime: new Date('2025-12-15T19:00:00'),  // Upcoming - December 15, 2025
      endTime: new Date('2025-12-16T07:00:00'),
      capacity: 75,
      pointsAllocated: 100,
      published: true,
    },
    {
      name: 'Career Fair Prep Workshop',
      description: '<p>Get ready for the upcoming career fair! Resume reviews, mock interviews, and networking tips.</p>',
      location: 'Sidney Smith Hall',
      startTime: new Date('2025-12-20T17:00:00'),  // Upcoming - December 20, 2025
      endTime: new Date('2025-12-20T19:00:00'),
      capacity: 60,
      pointsAllocated: 60,
      published: true,
    },
    {
      name: 'Winter Social',
      description: '<p>End of semester celebration! Board games, karaoke, and hot chocolate.</p>',
      location: 'Student Commons',
      startTime: new Date('2025-12-09T08:00:00'),  // LIVE NOW - December 9, 2025 8am-11pm
      endTime: new Date('2025-12-09T23:00:00'),
      capacity: 120,
      pointsAllocated: 80,
      published: true,
    },
    {
      name: 'Study Session: Final Exams',
      description: '<p>Group study session for CSC courses. TAs and upper year students available to help.</p>',
      location: 'Robarts Library',
      startTime: new Date('2025-12-05T14:00:00'),  // Past - December 5, 2025
      endTime: new Date('2025-12-05T18:00:00'),
      capacity: 50,
      pointsAllocated: 40,
      published: true,
    },
    {
      name: 'Industry Panel Discussion',
      description: '<p>Hear from software engineers at top tech companies about their career paths.</p>',
      location: 'Online (Zoom)',
      startTime: new Date('2026-01-25T19:00:00'),  // Upcoming - January 2026
      endTime: new Date('2026-01-25T21:00:00'),
      capacity: 200,
      pointsAllocated: 70,
      published: true,
    },
  ];

  for (const eventDataItem of eventData) {
    const event = await prisma.event.create({ data: eventDataItem });
    events.push(event);
    console.log(`  ✓ Created event: ${eventDataItem.name}`);
  }

  console.log(`Created ${events.length} events\n`);

  // ==================== EVENT ORGANIZERS ====================
  console.log('Adding event organizers...');

  // Manager organizes first 3 events
  for (let i = 0; i < 3; i++) {
    await prisma.eventOrganizer.create({
      data: {
        eventId: events[i].id,
        userId: manager.id,
      },
    });
  }
  console.log(`Added manager as organizer for ${3} events`);

  // ==================== EVENT GUESTS ====================
  console.log('Adding event guests...');

  let guestCount = 0;
  // Add some random guests to events
  for (const event of events.slice(0, 5)) {
    const numGuests = randomInt(5, 15);
    const selectedUsers = users.filter(u => u.role === 'regular').slice(0, numGuests);

    for (const user of selectedUsers) {
      await prisma.eventGuest.create({
        data: {
          eventId: event.id,
          userId: user.id,
          attendanceConfirmed: Math.random() > 0.5,
        },
      });
      guestCount++;
    }
  }
  console.log(`Added ${guestCount} event guests\n`);

  // ==================== TRANSACTIONS ====================
  console.log('Creating transactions...');

  const transactions = [];
  const regularUsersList = users.filter(u => u.role === 'regular');

  // 1. Purchase Transactions (at least 6)
  console.log('  Creating purchase transactions...');
  for (let i = 0; i < 8; i++) {
    const customer = randomItem(regularUsersList);
    const cashier = randomItem([cashier1, cashier2]);
    const amount = randomInt(10, 100);
    const points = Math.floor(amount * (Math.random() > 0.5 ? 1 : 1.5));

    const tx = await prisma.transaction.create({
      data: {
        type: 'purchase',
        amount,
        points,
        remark: `Purchase at CSSU store - $${amount}`,
        userId: customer.id,
        cashierId: cashier.id,
        createdAt: new Date(Date.now() - randomInt(1, 90) * 24 * 60 * 60 * 1000),
      },
    });
    transactions.push(tx);

    // Update customer points
    await prisma.user.update({
      where: { id: customer.id },
      data: { points: { increment: points } },
    });
  }
  console.log(`Created 8 purchase transactions`);

  // 2. Redemption Transactions (at least 6)
  console.log('  Creating redemption transactions...');
  for (let i = 0; i < 8; i++) {
    const customer = randomItem(regularUsersList);
    const cashier = randomItem([cashier1, cashier2]);
    const points = randomInt(50, 300);

    const tx = await prisma.transaction.create({
      data: {
        type: 'redemption',
        amount: 0,
        points: -points,
        remark: `Redeemed for ${['T-Shirt', 'Mug', 'Hoodie', 'Water Bottle', 'Backpack'][randomInt(0, 4)]}`,
        userId: customer.id,
        cashierId: cashier.id,
        createdAt: new Date(Date.now() - randomInt(1, 60) * 24 * 60 * 60 * 1000),
      },
    });
    transactions.push(tx);

    // Update customer points (all redemptions are completed in this seed)
    await prisma.user.update({
      where: { id: customer.id },
      data: { points: { decrement: points } },
    });
  }
  console.log(`Created 8 redemption transactions`);

  // 3. Transfer Transactions (at least 4)
  console.log('  Creating transfer transactions...');
  for (let i = 0; i < 6; i++) {
    const sender = randomItem(regularUsersList);
    let recipient = randomItem(regularUsersList);
    while (recipient.id === sender.id) {
      recipient = randomItem(regularUsersList);
    }
    const points = randomInt(25, 150);

    const tx = await prisma.transaction.create({
      data: {
        type: 'transfer',
        amount: 0,
        points: -points,
        remark: `Transfer to ${recipient.name}`,
        userId: sender.id,
        targetUserId: recipient.id,
        createdAt: new Date(Date.now() - randomInt(1, 45) * 24 * 60 * 60 * 1000),
      },
    });
    transactions.push(tx);

    // Update points
    await prisma.user.update({
      where: { id: sender.id },
      data: { points: { decrement: points } },
    });
    await prisma.user.update({
      where: { id: recipient.id },
      data: { points: { increment: points } },
    });
  }
  console.log(` Created 6 transfer transactions`);

  // 4. Adjustment Transactions (at least 4)
  console.log('  Creating adjustment transactions...');
  for (let i = 0; i < 6; i++) {
    const customer = randomItem(regularUsersList);
    const points = randomInt(-100, 200);
    const isPositive = points >= 0;

    const tx = await prisma.transaction.create({
      data: {
        type: 'adjustment',
        amount: 0,
        points,
        remark: isPositive ? 'Manual bonus points' : 'Points correction',
        userId: customer.id,
        cashierId: manager.id,
        createdAt: new Date(Date.now() - randomInt(1, 75) * 24 * 60 * 60 * 1000),
      },
    });
    transactions.push(tx);

    // Update customer points
    await prisma.user.update({
      where: { id: customer.id },
      data: { points: { increment: points } },
    });
  }
  console.log(` Created 6 adjustment transactions`);

  // 5. Event Transactions (at least 4)
  console.log('  Creating event transactions...');
  for (let i = 0; i < 6; i++) {
    const customer = randomItem(regularUsersList);
    const event = randomItem(events);
    const points = randomInt(30, 100);

    const tx = await prisma.transaction.create({
      data: {
        type: 'event',
        amount: 0,
        points,
        remark: `Points from event: ${event.name}`,
        userId: customer.id,
        createdAt: new Date(Date.now() - randomInt(1, 50) * 24 * 60 * 60 * 1000),
      },
    });
    transactions.push(tx);

    // Update customer points
    await prisma.user.update({
      where: { id: customer.id },
      data: { points: { increment: points } },
    });
  }
  console.log(` Created 6 event transactions`);

  console.log(`Created ${transactions.length} transactions (${transactions.length} total)\n`);

  // ==================== SUMMARY ====================
  console.log('Seed Summary:');
  console.log(`   Users: ${users.length}`);
  console.log(`   - Superusers: 1`);
  console.log(`   - Managers: 1`);
  console.log(`   - Cashiers: 2`);
  console.log(`   - Regular: ${regularUsersList.length}`);
  console.log(`   Promotions: ${promotions.length}`);
  console.log(`   Events: ${events.length}`);
  console.log(`   Transactions: ${transactions.length}`);
  console.log(`   - Purchases: 8`);
  console.log(`   - Redemptions: 8`);
  console.log(`   - Transfers: 6`);
  console.log(`   - Adjustments: 6`);
  console.log(`   - Event: 6`);
  console.log('\nDatabase seed completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


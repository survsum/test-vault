require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const connectDB = require('./src/config/db');
const User = require('./src/models/User');
const Case = require('./src/models/Case');
const Evidence = require('./src/models/Evidence');
const Notification = require('./src/models/Notification');
const AuditLog = require('./src/models/AuditLog');
const SecurityEvent = require('./src/models/SecurityEvent');
const RefreshToken = require('./src/models/RefreshToken');

async function seed() {
  await connectDB();
  await Promise.all([
    User.deleteMany({}),
    Case.deleteMany({}),
    Evidence.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
    SecurityEvent.deleteMany({}),
    RefreshToken.deleteMany({}),
  ]);

  const passwordHash = await bcrypt.hash('Password123!', 12);

  const admin = await User.create({ name: 'Alex Morgan', email: 'admin@vault.test', passwordHash, role: 'ADMIN' });
  const supervisor = await User.create({ name: 'Jordan Reyes', email: 'supervisor@vault.test', passwordHash, role: 'SUPERVISOR', createdBy: admin._id });
  const investigator1 = await User.create({ name: 'Sam Carter', email: 'investigator1@vault.test', passwordHash, role: 'INVESTIGATOR', createdBy: admin._id });
  const investigator2 = await User.create({ name: 'Riley Chen', email: 'investigator2@vault.test', passwordHash, role: 'INVESTIGATOR', createdBy: admin._id });

  const case1 = await Case.create({
    caseNumber: 'CASE-2026-0001',
    title: 'Downtown Server Breach',
    description: 'Suspected unauthorized access to municipal file server.',
    status: 'OPEN',
    assignedInvestigators: [investigator1._id],
    createdBy: supervisor._id,
  });

  const case2 = await Case.create({
    caseNumber: 'CASE-2026-0002',
    title: 'Phishing Campaign Against City Hall',
    description: 'Multiple staff received fraudulent invoice emails.',
    status: 'OPEN',
    assignedInvestigators: [investigator1._id, investigator2._id],
    createdBy: supervisor._id,
  });

  const case3 = await Case.create({
    caseNumber: 'CASE-2025-0031',
    title: 'Stolen Laptop Recovery',
    description: 'Laptop reported stolen from evidence storage room, recovered with intact drive.',
    status: 'CLOSED',
    assignedInvestigators: [investigator2._id],
    createdBy: admin._id,
    closedAt: new Date('2026-06-01'),
  });

  await Evidence.create([
    {
      case: case1._id,
      originalFilename: 'server_log_export.txt',
      storedFilename: 'seed-file-1.txt',
      mimeType: 'text/plain',
      fileSize: 2048,
      sha256: 'a3f1c9d2b6e4f7a1c8d9e0b2f4a6c8d1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3',
      uploadedBy: investigator1._id,
      status: 'PENDING',
      description: 'Exported access logs from the affected server.',
    },
    {
      case: case1._id,
      originalFilename: 'firewall_config.txt',
      storedFilename: 'seed-file-2.txt',
      mimeType: 'text/plain',
      fileSize: 1024,
      sha256: 'b4a2d8c3e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9d1e3f5a7b9c1d3e5f7a9b1',
      uploadedBy: investigator1._id,
      status: 'APPROVED',
      reviewedBy: supervisor._id,
      reviewedAt: new Date(),
      description: 'Firewall configuration snapshot at time of breach.',
    },
    {
      case: case2._id,
      originalFilename: 'phishing_email.txt',
      storedFilename: 'seed-file-3.txt',
      mimeType: 'text/plain',
      fileSize: 512,
      sha256: 'c5b3e9d4f8a2b6c1d3e5f7a9b1c3d5e7f9a1b3c5d7e9f1a3b5c7d9e1f3a5b7c9',
      uploadedBy: investigator2._id,
      status: 'REJECTED',
      reviewedBy: supervisor._id,
      reviewedAt: new Date(),
      rejectionReason: 'Duplicate of an already-submitted item.',
      description: 'Copy of the phishing email headers.',
    },
  ]);

  await Notification.create([
    { recipient: investigator1._id, type: 'CASE_ASSIGNED', message: 'You were assigned to case CASE-2026-0001', link: `/cases/${case1._id}` },
    { recipient: investigator1._id, type: 'CASE_ASSIGNED', message: 'You were assigned to case CASE-2026-0002', link: `/cases/${case2._id}` },
    { recipient: investigator2._id, type: 'CASE_ASSIGNED', message: 'You were assigned to case CASE-2026-0002', link: `/cases/${case2._id}` },
    { recipient: supervisor._id, type: 'SYSTEM', message: 'Welcome to the Digital Evidence Vault' },
  ]);

  const dayAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

  await SecurityEvent.create([
    {
      user: admin._id,
      userRole: 'ADMIN',
      eventType: 'AUTHENTICATION',
      action: 'LOGIN_SUCCESS',
      status: 'SUCCESS',
      riskLevel: 'LOW',
      ip: '203.0.113.10',
      userAgent: 'Mozilla/5.0',
      createdAt: dayAgo(1),
    },
    {
      emailAttempted: 'investigator1@vault.test',
      user: investigator1._id,
      userRole: 'INVESTIGATOR',
      eventType: 'AUTHENTICATION',
      action: 'LOGIN_FAILED',
      status: 'FAILURE',
      riskLevel: 'LOW',
      ip: '198.51.100.23',
      userAgent: 'Mozilla/5.0',
      description: 'Incorrect password',
      createdAt: dayAgo(2),
    },
    {
      emailAttempted: 'unknown@vault.test',
      eventType: 'SECURITY',
      action: 'REPEATED_FAILED_LOGIN',
      status: 'BLOCKED',
      riskLevel: 'HIGH',
      ip: '198.51.100.99',
      userAgent: 'curl/8.4.0',
      description: '6 failed login attempts from this IP in the last 10 minutes',
      metadata: { failureCount: 6, windowMinutes: 10, threshold: 5 },
      createdAt: dayAgo(3),
    },
    {
      user: investigator2._id,
      userRole: 'INVESTIGATOR',
      eventType: 'AUTHORIZATION',
      action: 'FORBIDDEN_ACTION',
      resourceType: 'evidence',
      status: 'BLOCKED',
      riskLevel: 'HIGH',
      ip: '203.0.113.44',
      userAgent: 'Mozilla/5.0',
      description: 'INVESTIGATOR attempted POST /api/evidence/approve',
      createdAt: dayAgo(4),
    },
    {
      user: investigator2._id,
      userRole: 'INVESTIGATOR',
      eventType: 'AUTHORIZATION',
      action: 'UNAUTHORIZED_ACCESS',
      resourceType: 'Case',
      resourceId: case1._id,
      status: 'BLOCKED',
      riskLevel: 'HIGH',
      ip: '203.0.113.44',
      userAgent: 'Mozilla/5.0',
      description: `Investigator attempted to access case ${case1.caseNumber} without assignment`,
      createdAt: dayAgo(5),
    },
    {
      user: investigator1._id,
      userRole: 'INVESTIGATOR',
      eventType: 'EVIDENCE',
      action: 'EVIDENCE_UPLOAD',
      resourceType: 'Evidence',
      status: 'SUCCESS',
      riskLevel: 'LOW',
      ip: '203.0.113.10',
      userAgent: 'Mozilla/5.0',
      description: `Evidence uploaded to case ${case1.caseNumber}`,
      createdAt: dayAgo(6),
    },
    {
      user: supervisor._id,
      userRole: 'SUPERVISOR',
      eventType: 'EVIDENCE',
      action: 'INTEGRITY_FAILURE',
      resourceType: 'Evidence',
      status: 'FAILURE',
      riskLevel: 'CRITICAL',
      ip: '203.0.113.12',
      userAgent: 'Mozilla/5.0',
      description: 'Evidence hash mismatch detected on verification',
      metadata: { originalHash: 'b4a2d8c3e7f9a1b3...', currentHash: 'f1a2b3c4d5e6f7a8...' },
      createdAt: dayAgo(7),
    },
  ]);

  console.log('Seed complete.');
  console.log('Admin login:      admin@vault.test / Password123!');
  console.log('Supervisor login: supervisor@vault.test / Password123!');
  console.log('Investigator 1:   investigator1@vault.test / Password123!');
  console.log('Investigator 2:   investigator2@vault.test / Password123!');

  await mongoose.connection.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

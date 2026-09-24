# Digital Evidence Vault

> A secure full-stack digital evidence management platform built with the MERN stack, designed around role-based access control, evidence integrity, chain of custody, auditability, and secure case management.

---

## Overview

**Digital Evidence Vault** is a full-stack web application for securely managing digital evidence throughout its lifecycle.

The platform allows authorized users to create and manage investigation cases, upload digital evidence, maintain chain-of-custody records, verify file integrity using SHA-256 hashing, monitor security events, and generate reports.

The system implements role-based access control so that administrators, supervisors, and investigators have different levels of access to sensitive operations.

---

## Key Features

### Authentication & Authorization

- JWT-based authentication
- Access and refresh token system
- Refresh token rotation
- Secure password hashing with bcrypt
- Role-based access control
- Protected frontend routes
- Automatic access-token refresh
- Session and authentication event tracking

### Evidence Management

- Secure evidence uploads
- File metadata management
- SHA-256 integrity hashing
- Evidence integrity verification
- Evidence status tracking
- Evidence-to-case association
- Chain-of-custody tracking
- Controlled evidence access

### Case Management

- Create and manage investigation cases
- Assign investigators
- Track case status
- Associate evidence with cases
- View case activity
- Case-level audit history

### Security & Auditing

- Immutable-style audit trail
- Authentication event logging
- Failed login monitoring
- Security event tracking
- Role-based permissions
- IP and request metadata logging
- Evidence integrity verification
- Protected API endpoints

### Dashboard

- Role-specific dashboards
- Case statistics
- Evidence statistics
- User activity
- Security events
- Recent audit activity
- System overview

### Reports & Exports

- PDF report generation
- Excel report exports
- Case reports
- Evidence reports
- Audit log exports
- Chain-of-custody reporting

### Notifications

- In-app notifications
- Evidence-related notifications
- Case activity notifications
- Security-related alerts

---

## Technology Stack

### Frontend

- React
- Vite
- React Router
- Axios
- CSS

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- Zod
- Multer
- PDFKit
- ExcelJS

### Security

- JSON Web Tokens
- bcrypt password hashing
- SHA-256 file hashing
- Role-based access control
- Refresh token rotation
- Request validation
- Security event logging

---

## Architecture

```text
                         ┌──────────────────────┐
                         │      React / Vite     │
                         │      Frontend        │
                         └──────────┬───────────┘
                                    │
                                    │ HTTP / REST API
                                    ▼
                         ┌──────────────────────┐
                         │    Express Server    │
                         │       Backend        │
                         └──────────┬───────────┘
                                    │
                 ┌──────────────────┼──────────────────┐
                 │                  │                  │
                 ▼                  ▼                  ▼
        ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
        │ Authentication │ │ Evidence /     │ │ Audit /        │
        │ & RBAC         │ │ Case Logic     │ │ Security       │
        └────────────────┘ └────────────────┘ └────────────────┘
                 │                  │                  │
                 └──────────────────┼──────────────────┘
                                    ▼
                         ┌──────────────────────┐
                         │       MongoDB        │
                         │      Mongoose        │
                         └──────────────────────┘
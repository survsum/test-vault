# 🔐 Digital Evidence Vault

[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-5.x-black?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-ODM-880000?style=flat-square)
![React](https://img.shields.io/badge/React-Frontend-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-Build%20Tool-646CFF?style=flat-square&logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?style=flat-square&logo=jsonwebtokens)
![Zod](https://img.shields.io/badge/Zod-Validation-3E67B1?style=flat-square)

> A full-stack digital evidence management platform for organizing investigation cases, securely managing evidence, maintaining audit trails, and monitoring security activity.

---

## 📌 Overview

**Digital Evidence Vault** is a full-stack MERN application designed around the lifecycle of digital evidence within an investigation.

The platform provides a centralized workspace where authorized users can:

- Create and manage investigation cases
- Upload and organize digital evidence
- Associate evidence with cases
- Track evidence activity
- Verify evidence integrity using SHA-256 hashing
- Maintain audit and chain-of-custody records
- Monitor security events
- Manage users through role-based access control
- Generate investigation and audit reports

The project focuses on combining **secure backend architecture**, **role-based authorization**, **evidence integrity**, and a professional investigation-oriented interface.

---

## ✨ Features

### 🔑 Authentication & Authorization

- JWT-based authentication
- Access and refresh token architecture
- Refresh-token rotation
- Secure password hashing with `bcryptjs`
- Protected API routes
- Protected frontend routes
- Role-based access control
- Automatic access-token refresh

### 📁 Evidence Management

- Upload digital evidence
- Store evidence metadata
- Associate evidence with investigation cases
- Generate SHA-256 integrity hashes
- Verify evidence integrity
- Track evidence status
- Maintain evidence activity history
- Controlled access to evidence resources

### 📂 Case Management

- Create investigation cases
- View case details
- Assign investigators
- Associate evidence with cases
- Track case status
- Monitor case activity

### 🛡️ Security Center

- Security event monitoring
- Failed authentication tracking
- Authentication activity
- Security-related audit records
- Role-aware security access

### 📜 Audit & Chain of Custody

The application maintains records of important system and evidence-related actions.

Examples include:

- Evidence uploads
- Evidence access
- Evidence downloads
- Evidence updates
- Case activity
- Authentication events
- Security events
- User actions

This provides an auditable history of activity surrounding evidence and investigations.

### 📊 Dashboard

Role-aware dashboards provide an overview of:

- Cases
- Evidence
- Recent activity
- Security events
- Notifications
- System statistics

### 📑 Reports

The application provides reporting functionality for:

- Investigation cases
- Evidence
- Chain of custody
- System audit activity

Reports can be generated/exported through the application.

### 🔔 Notifications

- In-app notifications
- Case-related notifications
- Evidence activity notifications
- Security-related notifications

---

# 🏗️ Architecture

```text
                         DIGITAL EVIDENCE VAULT
                                  │
             ┌────────────────────┴────────────────────┐
             │                                         │
             ▼                                         ▼
      ┌───────────────┐                       ┌────────────────┐
      │ React + Vite  │                       │   REST API     │
      │   Frontend   │◄────── Axios ─────────►│ Node + Express │
      └───────────────┘                       └───────┬────────┘
                                                      │
                                    ┌─────────────────┼─────────────────┐
                                    │                 │                 │
                                    ▼                 ▼                 ▼
                              ┌───────────┐    ┌────────────┐    ┌─────────────┐
                              │   Auth    │    │   Cases &  │    │  Security & │
                              │   + RBAC  │    │  Evidence  │    │    Audit    │
                              └───────────┘    └────────────┘    └─────────────┘
                                                      │
                                                      ▼
                                             ┌────────────────┐
                                             │    MongoDB     │
                                             │   + Mongoose   │
                                             └────────────────┘
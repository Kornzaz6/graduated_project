# 🏢 Dormitory Management System (Backend Focus)

A full-stack dormitory management system with a strong backend architecture, designed to handle real-world rental workflows including contracts, payments, and user roles.

> 🎓 Graduation Project

---

## 🚀 Overview

This system provides a complete backend solution for managing dormitories, rooms, rental contracts, and payment processing.  

It supports multiple user roles such as **Member, Owner, and Admin**, with role-based access control and secure authentication.

---

## 🧠 Backend Architecture

The backend is structured using a layered architecture:

- Routes → Controllers → Services/Utils → Prisma ORM
- Middleware for authentication, authorization, and validation
- Centralized database access using Prisma

---

## 🔑 Core Features (Based on Actual Implementation)

### 👤 Authentication & Authorization
- JWT-based authentication
- Role-based access control (MEMBER, OWNER, ADMIN)
- Secure password hashing (bcrypt)

---

### 🏢 Dormitory & Room Management
- Create and manage dormitories (Owner)
- Room management with status:
  - AVAILABLE
  - OCCUPIED
  - MAINTENANCE
- Admin approval system for dormitories

---

### 📄 Contract & Rental System
- Rental request workflow
- Contract lifecycle:
  - Draft → Waiting Approval → Active → Expired
- Lease contract management

---

### 💳 Payment System (Advanced Feature 🔥)
- PromptPay QR Code generation
- Payment slip upload (multer)
- Payment status flow:
  - PENDING
  - SLIP_UPLOADED
  - VERIFYING
  - VERIFIED
  - CONFIRMED / REJECTED

---

### 🤖 Smart Payment Verification
- QR code detection using `jsQR`
- OCR processing using `tesseract.js`
- Image processing with `sharp`
- Designed to simulate real-world payment verification

---

### 📦 File Upload & Storage
- File upload using multer
- Supabase integration for storage

---

### 🛠 Additional Systems
- Ticket system (complaints, maintenance, payment issues)
- Messaging system between users
- Owner application system

---

## 🗄 Database Design

- PostgreSQL + Prisma ORM
- Well-structured relational schema
- Key models:
  - User
  - Dormitory
  - Room
  - LeaseContract
  - Payment
  - Review
  - Ticket

---

## 🛠 Tech Stack

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM
- PostgreSQL

### Libraries & Tools
- JWT (jsonwebtoken)
- bcrypt
- multer (file upload)
- sharp (image processing)
- jsQR (QR detection)
- tesseract.js (OCR)
- promptpay-qr + qrcode

### External Services
- Supabase (storage)

---

## 📂 Project Structure

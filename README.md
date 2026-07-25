# VTSC PaintPro - Enterprise Resource Planning & Paint Customization Platform

## Introduction

Welcome to **VTSC PaintPro**! This project is a comprehensive enterprise platform designed to digitalize the operational workflow of VOSCO (VTSC), a major paint distribution company[cite: 4]. By replacing traditional manual processes with a decentralized and automated architecture, this platform optimizes custom paint mixing (R&D), real-time inventory tracking, and B2B contract management[cite: 4]. 

Developed as a **Graduation Project (Đồ án Tốt nghiệp)** at Vietnam Maritime University, this application aims to provide a robust, secure, and practical solution for modern paint business and supply chain management[cite: 4].

---

## Features

* **Advanced Inventory Management (WMS):** Tracks inventory at the SKU level (Available vs. Reserved stock) with automated safety-stock alerts to prevent overselling.
* **Custom Paint Mixing (R&D) Workflow:** Digitalizes the entire lab process for custom paint orders, tracking formulas, testing history, and automating material deduction upon completion.
* **Performance Tracking (KPI):** Provides a real-time dashboard to evaluate staff and departmental performance based on sales, successful R&D batches, and delivery metrics.
* **Web3 B2B Contracts & Traceability:** Hashes and stores B2B agreements on the blockchain for immutable proof. Utilizes **IPFS** to store manufacturing documents and generates dynamic QR codes for product traceability.
* **Secure Authentication:** Implements a highly secure dual-token JWT mechanism (Access & Refresh Tokens) with strict Role-Based Access Control (Admin, Staff, Client).

---

## Technologies Used

* **Blockchain & Smart Contracts:** Solidity, Sepolia Testnet
* **Frontend:** Next.js, React.js, Tailwind CSS, Zustand
* **Backend:** Node.js, Express.js
* **Database:** MongoDB Atlas (NoSQL)
* **Decentralized Storage:** IPFS (via Pinata Cloud)

---

## Folder Structure

```text
VTSC-PaintPro
├── blockchain/           # Smart Contracts (Solidity) and deployment scripts
├── frontend/             # Frontend (Next.js, React, UI Components, Stores)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── ...
├── backend/              # Backend (Node.js, Express, MongoDB connection)
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── jobs/
├── plans/                # System architecture, ERD, and Data flow diagrams
├── .gitignore
├── implementation_plan.md
└── README.md

```

---

## Installation and Setup

### Prerequisites

Before running the project, ensure you have the following installed:

* **Node.js** (v18.x or higher)
* **MetaMask Extension** installed in your browser (configured for the Sepolia Testnet).
* A **MongoDB Atlas** account (or local MongoDB).
* A **Pinata Cloud** account (for IPFS API Keys).

### Step-by-Step Guide

**1. Clone the Repository:**

```bash
git clone [https://github.com/nducan04/VTSC-PaintPro.git](https://github.com/nducan04/VTSC-PaintPro.git)
cd VTSC-PaintPro

```

**2. Install Dependencies:**
You need to install dependencies for all main directories:

```bash
# In the root directory, open three terminal tabs:
cd frontend && npm install
cd backend && npm install
cd blockchain && npm install

```

**3. Configure Environment Variables:**
You must create `.env` files in both the `frontend` and `backend` directories.

* **For `frontend/`:** Create a `.env` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address

```

* **For `backend/`:** Create a `.env` file based on `.env.example`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
SEPOLIA_RPC_URL=your_alchemy_or_infura_url

```

**4. Run the Application:**
To run the full system, start both the backend and frontend simultaneously.

* **Start the Backend:**

```bash
cd backend
npm run dev

```

* **Start the Frontend:**

```bash
cd frontend
npm run dev

```

The application will be available at `http://localhost:3000`.

---

## Usage

1. **Secure Login:** Authenticate using your assigned Role (Admin/Staff/Client). The system will grant access based on JWT verification.
2. **Manage Inventory:** Access the WMS dashboard to view SKU-level stock, update materials, and monitor safety alerts.
3. **Process Custom Paint (R&D):** Create a new mixing request, input lab test results (temperature, adhesion, deltaE), and approve the final formula.
4. **E-Contract & Blockchain:** Generate a B2B agreement. The system will hash the document and store the transaction securely on the Sepolia Testnet.
5. **Traceability:** Scan the generated QR code on any product batch to view manufacturing details and IPFS-stored invoices.

---

## Authors

**Nguyễn Đức An**

* **Role:** System Analyst & Backend Developer
* **Responsibilities:** Entire NoSQL database architecture, Backend APIs, dual-token JWT authentication, SKU-level inventory logic, warehouse management, and system deployment.



**Trần Hữu Phước**

* **Role:** Blockchain & R&D Logic Developer
* **Responsibilities:** Smart Contract development (E-Contract), AI Chatbot implementation, custom paint mixing (R&D) workflow, and Post-sales/Promotions management.



**Phí Minh Thành**

* **Role:** Frontend UI/UX & Reporting Developer
* **Responsibilities:** Next.js frontend architecture, B2C retail workflow, dynamic reporting/statistical dashboards, and product catalog search engine.



*This project was researched and developed collaboratively as a Graduation Project at Vietnam Maritime University.*

---

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

---

## Contact

For any questions, feedback, or collaboration inquiries, please contact:

* **Email:** nducan08@gmail.com
* **GitHub:** https://github.com/nducan04

Thank you for exploring VTSC PaintPro!

```

```

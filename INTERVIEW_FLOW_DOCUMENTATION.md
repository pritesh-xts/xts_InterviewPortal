# Interview Portal - Professional Flow Documentation

## Status Flow

### Status IDs and Descriptions
1. **Status 1** - L1 Clear
2. **Status 2** - L1 Reject  
3. **Status 3** - On Hold after L1
4. **Status 4** - L2 Clear
5. **Status 5** - L2 Reject
6. **Status 6** - On Hold after L2
7. **Status 7** - Pending (New Candidate)
8. **Status 8** - L1 Interview Confirmed
9. **Status 9** - L2 Interview Confirmed

---

## Professional Interview Process Flow

### 1. HR Adds New Candidate
- **Action**: HR fills basic candidate information (8 fields only)
- **Status**: Automatically set to **7 (Pending)**
- **Fields Required**:
  - Full Name
  - Position
  - Education
  - Experience
  - Email
  - Phone (10-digit)
  - Resume (PDF/DOC/DOCX, max 5MB)
  - Skills (comma-separated)

### 2. HR Schedules L1 Interview
- **Action**: HR clicks "Schedule" button on candidate row
- **Status Changes**: 7 (Pending) → **8 (L1 Interview Confirmed)**
- **Fields Required**:
  - Date
  - Time
  - Location
  - Panel Member
- **Email Sent**: Panel member receives interview assignment email

### 3. Panel Conducts L1 Interview
- **Who Sees**: Only the assigned panel member sees this candidate
- **Panel Actions**: 
  - View candidate details
  - Submit feedback with status:
    - **1 (L1 Clear)** - Candidate passed L1
    - **2 (L1 Reject)** - Candidate failed L1
    - **3 (On Hold after L1)** - Decision pending
- **Email Sent**: HR receives feedback notification

### 4. HR Reviews L1 Feedback

#### If L1 Clear (Status 1):
- **HR Action**: Edit candidate and schedule L2 interview
- **Status Changes**: 1 (L1 Clear) → **9 (L2 Interview Confirmed)**
- **Email Sent**: L2 panel member receives assignment

#### If L1 Reject (Status 2):
- **Process Ends**: Candidate rejected

#### If On Hold (Status 3):
- **HR Decision**: Can schedule L2 or keep on hold

### 5. Panel Conducts L2 Interview
- **Who Sees**: Only the assigned L2 panel member
- **Panel Actions**:
  - View candidate details and L1 history
  - Submit feedback with status:
    - **4 (L2 Clear)** - Candidate passed L2
    - **5 (L2 Reject)** - Candidate failed L2
    - **6 (On Hold after L2)** - Decision pending
- **Email Sent**: HR receives feedback notification

### 6. HR Makes Final Decision

#### For Status 4 (L2 Clear) or Status 6 (On Hold after L2):
- **HR Action**: Use dropdown in candidate row
- **Options**:
  - **Selected** - Candidate hired
  - **Rejected** - Candidate not hired

---

## Dashboard Views

### HR Dashboard
- **Sees**: ALL candidates
- **Can Do**:
  - Add new candidates (basic info only)
  - Schedule L1 interviews (for Pending candidates)
  - Schedule L2 interviews (for L1 Clear candidates)
  - Make final hiring decision (for L2 Clear/On Hold)
  - View all feedback and history

### Panel Dashboard (L1)
- **Sees**: Only candidates assigned to them with Status 8 (L1 Interview Confirmed)
- **Can Do**:
  - View candidate details
  - Submit L1 feedback (Clear/Reject/On Hold)
  - Cannot see other panel's candidates

### Panel Dashboard (L2)
- **Sees**: Only candidates assigned to them with Status 9 (L2 Interview Confirmed)
- **Can Do**:
  - View candidate details and L1 history
  - Submit L2 feedback (Clear/Reject/On Hold)
  - Cannot see other panel's candidates

### Global Admin Dashboard
- **Sees**: ALL candidates (like HR)
- **Can Do**: Everything HR can do + User Management
- **Can Switch**: Between HR view and Panel view

---

## Candidate Row Display Logic

### For HR/Admin:
- **Status 7 (Pending)**: Shows "Schedule" button
- **Status 8 (L1 Interview Confirmed)**: Shows status label
- **Status 9 (L2 Interview Confirmed)**: Shows status label
- **Status 1 (L1 Clear)**: Shows status label
- **Status 2 (L1 Reject)**: Shows status label
- **Status 3 (On Hold after L1)**: Shows status label
- **Status 4 (L2 Clear)**: Shows dropdown (Selected/Rejected)
- **Status 5 (L2 Reject)**: Shows status label
- **Status 6 (On Hold after L2)**: Shows dropdown (Selected/Rejected)

### For Panel:
- **Status 8 (L1 Interview Confirmed)**: Shows status label, can submit feedback
- **Status 9 (L2 Interview Confirmed)**: Shows status label, can submit feedback
- **Other Statuses**: Not visible to panel

---

## Email Notifications

1. **Interview Scheduled**: Panel member receives email with candidate details and interview time
2. **Feedback Submitted**: HR receives email when panel submits feedback
3. **Password Reset**: User receives reset link

---

## Professional Best Practices Implemented

✅ **Separation of Concerns**: HR handles scheduling, Panels handle evaluation
✅ **Role-Based Access**: Each role sees only relevant candidates
✅ **Status-Driven Workflow**: Clear progression through interview stages
✅ **Audit Trail**: Complete history of all interviews and feedback
✅ **Email Notifications**: Automated communication at key stages
✅ **Data Validation**: All inputs validated before submission
✅ **Session Management**: Independent sessions per browser tab
✅ **Security**: Role-based permissions enforced at backend

---

## Technical Implementation

- **Frontend**: React with modular components
- **Backend**: PHP with PDO for database operations
- **Database**: MySQL with proper foreign keys and indexes
- **Authentication**: Session-based with role validation
- **File Upload**: Secure resume handling with validation
- **Email**: PHPMailer for SMTP notifications


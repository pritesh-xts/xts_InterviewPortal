# Professional Interview Email Notification Flow

## Complete Email Notification System

### 1. Interview Scheduling Emails

#### When HR Schedules L1 Interview (Status 7 → 8)
**Panel Member Receives:**
- Subject: "Interview Assignment - [Candidate Name]"
- Content: Candidate details, Date, Time, Location
- Actions: Accept/Reject buttons
- Attachment: Calendar invite (.ics file)

**Candidate Receives:**
- Subject: "Interview Scheduled - [Position]"
- Content: Position, Date, Time, Location, Interviewer name
- Message: Professional interview confirmation

---

### 2. L1 Interview Feedback Emails

#### When Panel Submits L1 Clear (Status 8 → 1)
**Candidate Receives:**
- Subject: "🎉 Congratulations! L1 Interview Cleared - [Position]"
- Content: 
  - Congratulations message
  - "You have successfully cleared the L1 Interview"
  - "You will be notified about the L2 interview schedule soon"
  - "Please prepare for the next round"
- Design: Green success theme with checkmark

**HR Dashboard:**
- Status immediately changes to "L1 Clear"
- HR can now schedule L2 interview

#### When Panel Submits L1 Reject (Status 8 → 2)
**Candidate Receives:**
- Subject: "Interview Update - [Position]"
- Content:
  - Professional rejection message
  - "Thank you for taking the time to interview"
  - "We have decided not to move forward at this time"
  - "We wish you all the best in your future endeavors"
- Design: Professional, respectful tone

**HR Dashboard:**
- Status immediately changes to "L1 Reject"
- Process ends for this candidate

---

### 3. L2 Interview Scheduling Emails

#### When HR Schedules L2 Interview (Status 1 → 9)
**L2 Panel Member Receives:**
- Subject: "Interview Assignment - [Candidate Name]"
- Content: Candidate details, Date, Time, Location
- Note: Candidate has cleared L1
- Actions: Accept/Reject buttons
- Attachment: Calendar invite (.ics file)

**Candidate Receives:**
- Subject: "Interview Scheduled - [Position]"
- Content: L2 interview details
- Message: "Your L2 interview has been scheduled"
- Details: Position, Date, Time, Location, L2 Interviewer name

---

### 4. L2 Interview Feedback Emails

#### When Panel Submits L2 Clear (Status 9 → 4)
**Candidate Receives:**
- Subject: "🎉 Excellent Performance! L2 Interview Cleared - [Position]"
- Content:
  - Congratulations message
  - "You have successfully cleared the L2 Interview"
  - "Our HR team will contact you soon with the next steps"
  - "We look forward to having you on our team!"
- Design: Green success theme with celebration

**HR Dashboard:**
- Status immediately changes to "L2 Clear"
- HR can make final hiring decision (Selected/Rejected)

#### When Panel Submits L2 Reject (Status 9 → 5)
**Candidate Receives:**
- Subject: "Interview Update - [Position]"
- Content: Professional rejection message
- Design: Professional, respectful tone

**HR Dashboard:**
- Status immediately changes to "L2 Reject"
- Process ends for this candidate

---

## Email Templates Design

### Success Emails (L1 Clear, L2 Clear)
- **Color Theme**: Green gradient (#059669 to #047857)
- **Icon**: ✓ Checkmark
- **Tone**: Congratulatory and encouraging
- **Call to Action**: Prepare for next round / Wait for HR contact

### Rejection Emails (L1 Reject, L2 Reject)
- **Color Theme**: Professional dark (#0f172a)
- **Tone**: Respectful and appreciative
- **Message**: Thank you + Not moving forward + Best wishes

### Interview Scheduling Emails
- **Color Theme**: Professional dark (#0f172a)
- **Content**: Clear interview details
- **Format**: Structured table with all information
- **Attachment**: Calendar invite for easy scheduling

---

## Professional Flow Summary

```
1. HR adds candidate → Status: Pending (7)

2. HR schedules L1 → Status: L1 Interview Confirmed (8)
   ├─ Panel receives: Assignment email with Accept/Reject
   └─ Candidate receives: Interview confirmation

3. Panel submits L1 feedback:
   ├─ L1 Clear (1) → Candidate receives: "Congratulations! L1 Cleared"
   │                  Status changes immediately in HR dashboard
   │
   └─ L1 Reject (2) → Candidate receives: Professional rejection
                       Process ends

4. HR schedules L2 → Status: L2 Interview Confirmed (9)
   ├─ L2 Panel receives: Assignment email with Accept/Reject
   └─ Candidate receives: L2 interview confirmation

5. Panel submits L2 feedback:
   ├─ L2 Clear (4) → Candidate receives: "Congratulations! L2 Cleared"
   │                  Status changes immediately in HR dashboard
   │
   └─ L2 Reject (5) → Candidate receives: Professional rejection
                       Process ends

6. HR makes final decision:
   ├─ Selected → Candidate hired
   └─ Rejected → Process ends
```

---

## Key Features

✅ **Immediate Status Updates**: Status changes instantly when panel submits feedback
✅ **Automatic Email Notifications**: Candidates informed at every stage
✅ **Professional Communication**: Well-designed HTML emails
✅ **Clear Messaging**: Candidates know exactly where they stand
✅ **Encouraging Tone**: Success emails motivate candidates
✅ **Respectful Rejections**: Professional and courteous rejection messages
✅ **Complete Transparency**: No confusion about interview status

---

## Technical Implementation

- **Email Service**: PHPMailer with SMTP
- **Email Format**: HTML with plain text fallback
- **Triggers**: Automatic on status change
- **Error Handling**: Graceful failure (process continues even if email fails)
- **Logging**: Email failures logged for debugging

---

## Benefits

1. **For Candidates**:
   - Always informed about their status
   - Clear expectations for next steps
   - Professional experience throughout

2. **For HR**:
   - Automated communication
   - Reduced manual follow-ups
   - Professional brand image

3. **For Panels**:
   - Clear assignment notifications
   - Calendar integration
   - Easy accept/reject workflow


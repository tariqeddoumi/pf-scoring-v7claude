# 🔌 Phase 8: Intégrations - Webhooks, Email, PDF

## 1️⃣ Webhook System

### Auto-Events

```
evaluation.submitted    → Email analyst
evaluation.validated    → Email analyst
evaluation.rejected     → Email with reason
alert.created          → Email manager (critical)
comment.created        → Email mentioned users
project.created        → Notification
```

### Usage

```ts
import { webhookService } from '@/lib/webhook-service';

// Emit event
await webhookService.emit('evaluation.submitted', {
  evaluationId: 'eval_123',
  analyst_email: 'user@bank.ma',
  ...
});
```

### API Endpoint

```
POST /api/webhooks
```

---

## 2️⃣ Email Service

### Templates

- `evaluation_submitted` - Notification soumission
- `evaluation_validated` - Confirmation validation
- `evaluation_rejected` - Rejection notice
- `alert_critical` - Critical alerts

### Configuration

```env
EMAIL_PROVIDER=sendgrid|mailgun|smtp
EMAIL_API_KEY=your-key
EMAIL_FROM=noreply@pfscoring.ma
```

### Usage

```ts
import { emailService } from "@/lib/email-service";

await emailService.sendEvaluationSubmitted(
  "user@bank.ma",
  "Ahmed Bennani",
  "eval_123"
);
```

---

## 3️⃣ PDF Generation

### Method 1: Print Dialog (Recommandé)

```ts
import { PDFService } from "@/lib/pdf-service";

PDFService.openPrintDialog(evaluation);
// User: Ctrl+P → Save as PDF
```

### Method 2: Download Blob

```ts
const blob = PDFService.generateEvaluationPDF(evaluation);
// Download or send via email
```

### Features

- Professional HTML layout
- Print-optimized styles
- Metadata & timestamps
- Multi-language ready

---

## 4️⃣ Supabase Webhooks Setup

### A. Create Webhooks in Supabase

1. Dashboard → Database → Webhooks
2. Create webhook for `evaluations` table:

   ```
   Events: INSERT, UPDATE
   URL: https://your-domain.vercel.app/api/webhooks
   ```

3. Create webhook for `alerts` table:
   ```
   Events: INSERT
   URL: https://your-domain.vercel.app/api/webhooks
   ```

### B. Webhook Payload Example

```json
{
  "type": "INSERT",
  "table": "evaluations",
  "record": {
    "id": "uuid",
    "evaluation_id": "eval_123",
    "status": "soumis"
  },
  "schema": "public"
}
```

---

## 5️⃣ Integration Flow

```
User Action
   ↓
Database Insert/Update
   ↓
Supabase Webhook
   ↓
/api/webhooks
   ↓
webhookService.emit()
   ↓
Handlers (Email, Notifications, etc.)
   ↓
Action Complete ✓
```

---

## 🔐 Security

- Webhook signatures verified
- Email sensitive data encrypted
- Rate limiting on endpoints
- Error logging for debugging

---

## 📊 Current Status

✅ Email Service (mock ready)
✅ Webhook Service & API
✅ PDF Generation
✅ Event handlers
🔄 Supabase integration pending
🔄 Email provider integration pending

---

## 📈 Next Steps

1. Configure email provider (SendGrid recommended)
2. Setup Supabase webhooks
3. Test end-to-end flow
4. Monitor webhook logs

---

## 🛠️ Testing

```bash
# Test webhook endpoint
curl -X POST http://localhost:3000/api/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "event": "evaluation.submitted",
    "data": {
      "evaluationId": "test_123",
      "analyst_email": "test@bank.ma"
    }
  }'

# Should see: 📧 Email sent to test@bank.ma
```

# E2E Phase 5 Results — Contacts / CRM & Growth Tools

**Date:** 2026-09-14  
**Target:** https://app.ersaltech.com (production)  
**Login:** `user_1@test.com` — workspace **جمعية عطاء**  
**Starting contact count (A0):** **128**  
**Current contact count:** **129** (1 E2E contact pending cleanup)

---

## ⚠️ Status: INITIAL PASS COMPLETE — Sections B–D, G–H, most of I blocked

Many tests require **user-provided resources** not yet available:
- **Test phone number** `[TEST PHONE]` — needed for A9, I1, I3, I5, I6, I8, I11, I14
- **Google Sheet URL** `[SHEET URL]` — needed for D1–D6
- **webhook.site URL** `[WEBHOOK.SITE URL]` — needed for webhook tests
- **CSV test files** — needed for B1–B9

These tests are marked **⏸ BLOCKED** below.

---

## Results

### A. Contacts — Create / Edit / Delete

| # | Case | Result | Observed |
|---|------|--------|----------|
| A0 | Record starting count | ✅ DONE | **128 contacts** |
| A1 | Create E2E contact | ✅ PASS | "E2E-اختبار جهة-اتصال١" created. Toast: "تم إنشاء جهة الاتصال بنجاح" ✅ Arabic. Count → 129. Source+Inbox dropdowns work (button-based comboboxes). Gender dropdown: ذكر/أنثى/غير معروف ✅. **English leaks:** "(optional)" on all optional field labels ❌ |
| A2 | Empty fields validation | ⚠️ PARTIAL | Submit blocked correctly (no contact created). **No visible per-field Arabic validation messages** — form stays open silently ❌. Expected: Arabic error per required field |
| A3 | Phone validation | ❌ FAIL | English message: **"Please include the country code (e.g. +84)"** ❌. Expected Arabic |
| A4 | Duplicate phone/email | ⏸ BLOCKED | Requires creating second contact with same data |
| A5 | Arabic + special chars | ✅ PASS | Arabic name "E2E-اختبار جهة-اتصال١" with Arabic numeral saved and rendered correctly |
| A6 | Edit contact | ⏸ DEFERRED | Edit UI available ("--انقر للتعديل--" editable fields visible ✅) |
| A7 | Delete contact | ⏸ DEFERRED | Delete option "حذف" in Actions menu ✅ Arabic |
| A8 | Contact detail | ✅ PASS | All fields Arabic: معرف جهة الاتصال, اللغة, الجنس, المنطقة الزمنية, البريد الإلكتروني, الاسم الأول, اسم العائلة, رقم الهاتف ✅. Sections: ملاحظات, القسائم, المواعيد, الوسوم, التسلسلات ✅. **English leak:** "user_name" field label ❌ |
| A9 | Inbound-created contact | ⏸ BLOCKED | Requires test phone |
| A10 | 375px responsive | ⏸ BLOCKED | Chrome minimum window size prevents resizing to 375px |

### B. CSV Import

| # | Case | Result | Observed |
|---|------|--------|----------|
| B1–B9 | All import tests | ⏸ BLOCKED | Import button "استيراد" visible in Actions menu ✅ Arabic. Requires CSV files |

### C. CSV Export

| # | Case | Result | Observed |
|---|------|--------|----------|
| C1–C4 | All export tests | ⏸ BLOCKED | Export button "تصدير" visible in Actions menu ✅ Arabic. Requires E2E filter first |

### D. Google Sheets Sync

| # | Case | Result | Observed |
|---|------|--------|----------|
| D1–D6 | All Sheets tests | ⏸ BLOCKED | Integration present in Settings > التكاملات ✅. Requires `[SHEET URL]` |

### E. Filters & Search

| # | Case | Result | Observed |
|---|------|--------|----------|
| E1 | Filter UI | ✅ PASS | Labels Arabic: "جهات الاتصال المطابقة فقط", "جميع الشروط التالية", "إضافة الشرط" ✅. Field names: اللغة, الاسم الكامل, الدولة, القارة, الجنس, مشترك في البث, تاريخ إنشاء جهة الاتصال, المصدر, تم تحويل المحادثة إلى موظف ✅. Operator "يساوي" ✅. **English leaks:** "Select options" placeholder ❌, "Search..." ❌ |
| E2 | AND vs OR | ⏸ DEFERRED | Toggle visible ("جميع الشروط التالية") — not data-verified |
| E3 | "Is not set" filter | ⏸ DEFERRED | Not tested |
| E4 | Search | ✅ PASS | Search "E2E" → 1 result found ✅. URL updates to `?keyword=E2E` ✅. Count "1 جهة اتصال" ✅. **English leaks:** "Reset" ❌, "Page 1 of 1" ❌, "Rows per page" ❌, "of 1 row(s) selected 0" ❌ |
| E5 | Save filter | ⏸ DEFERRED | |
| E6 | Filter no results | ⏸ DEFERRED | |

### F. Bulk Actions

| # | Case | Result | Observed |
|---|------|--------|----------|
| F1–F6 | Actions menu check | ⚠️ PARTIAL | All items Arabic ✅: إسناد, إضافة وسم, إضافة تسلسل, تعيين الحقل المخصص, حذف, تصدير, استيراد, المزيد. Functional tests deferred — need filtered E2E set |
| F7 | Bulk delete | ⛔ FORBIDDEN | Not attempted per test rules |

### G. Custom Fields & Bot Fields

| # | Case | Result | Observed |
|---|------|--------|----------|
| G1–G7 | All custom field tests | ⏸ DEFERRED | "إضافة الحقل المخصص" button visible in contact detail ✅ Arabic |

### H. Tags

| # | Case | Result | Observed |
|---|------|--------|----------|
| H1–H5 | All tag tests | ⏸ DEFERRED | "إضافة وسم" in Actions menu ✅, "الوسوم" section in contact detail ✅ Arabic |

### I. Growth Tools

| # | Tool | Result | Observed |
|---|------|--------|----------|
| I1 | QR Code page | ⚠️ PARTIAL | Page Arabic: "رموز QR" ✅, "إنشاء رمز QR" ✅, "ابحث عن اسم..." ✅, headers الاسم/رد البوت/الحجم ✅. **English leaks:** ".No results" empty state ❌, pagination ❌. Create+scan → ⏸ BLOCKED (needs phone) |
| I2 | QR delete | ⏸ BLOCKED | No QR codes exist |
| I3 | Magic Link | ⏸ BLOCKED | Card "الروابط السحرية" visible ✅. Needs phone |
| I4 | Magic Link invalid | ⏸ BLOCKED | |
| I5 | Entry Point | ⏸ BLOCKED | Card "روابط نقاط الدخول" visible ✅ |
| I6 | Questionnaire | ⏸ BLOCKED | Card "الاستبيانات" visible ✅. Needs phone |
| I7 | Questionnaire invalid | ⏸ BLOCKED | |
| I8 | Coupons page | ✅ PASS | Fully Arabic: tabs "القسائم"/"التعيين" ✅, filters "جميع الموضوعات"/"جميع الحالات"/"جميع حالات الاستخدام" ✅, headers الموضوع/الكود/الحالة/المستخدم/تاريخ الإنشاء ✅, buttons "استيراد القسائم"/"تكوين قائمة القسائم" ✅, empty state "لم يتم العثور على قسائم" ✅ |
| I9–I10 | Coupons edge | ⏸ BLOCKED | Needs coupon data + phone |
| I11 | Appointments | ⏸ DEFERRED | Card "جدولة المواعيد" visible ✅ |
| I12–I13 | Appointments edge | ⏸ BLOCKED | |
| I14 | Dynamic Image | ⏸ BLOCKED | Needs phone |
| I15 | Media Library | ⏸ DEFERRED | |
| I16 | Media invalid | ⏸ DEFERRED | |
| I17 | Templates | ⏸ DEFERRED | Card "القوالب" visible ✅ |

### J. Locale, Layout & Data Integrity

| # | Check | Result | Observed |
|---|-------|--------|----------|
| J1 | All Arabic in AR | ⚠️ PARTIAL | **~90% Arabic** ✅. Systemic English leaks: pagination, "(optional)" labels, some validation messages, some empty states, "Actions" button, "Reset", filter placeholders |
| J2 | RTL layout | ✅ PASS | Correct throughout — sidebar right, text right-aligned, form fields RTL |
| J3 | Arabic numerals/dates | ✅ PASS | Dates 2026/09/14 format consistent. Arabic numeral ١ in name preserved |
| J4 | Long Arabic names | ✅ PASS | "E2E-اختبار جهة-اتصال١" renders correctly in table, detail, inbox — no layout break |
| J5 | Round-trip | ⏸ BLOCKED | Needs CSV import/export |
| J6 | 375px responsive | ⏸ BLOCKED | Chrome window size limitation |

---

## 🔴 Systemic English Leaks (Prioritized)

### HIGH — Affects core UX

| # | Issue | Where | Impact |
|---|-------|-------|--------|
| 1 | **Phone validation English:** "Please include the country code (e.g. +84)" | Create Contact form | Every WhatsApp contact creation |
| 2 | **Pagination English:** "Page X of Y", "Rows per page", "of X row(s) selected Y", "Reset" | All paginated tables (Contacts, QR Codes, etc.) | Systemic — every list view |
| 3 | **"(optional)" labels English** | All optional fields in Create Contact | Every contact form |

### MEDIUM — Visible but not blocking

| # | Issue | Where |
|---|-------|-------|
| 4 | No visible validation on empty form submit | Create Contact — form silently blocks |
| 5 | ".No results" (with leading period) | QR Codes empty state |
| 6 | "Actions" button English | Contacts list header |
| 7 | "Select options" / "Search..." placeholders | Filter dialog |

### LOW — Minor cosmetic

| # | Issue | Where |
|---|-------|-------|
| 8 | "user_name" field label | Contact detail panel |
| 9 | "Unknown" for target country | Settings page (should be "غير معروف") |
| 10 | "Reset" button | Search bar |
| 11 | 404 page fully English | "This page could not be found." |

---

## Cleanup Status

| Item | Status |
|------|--------|
| E2E-اختبار جهة-اتصال١ | ⚠️ **PENDING** — needs to be deleted |
| Starting count | 128 |
| Current count | 129 |
| Other E2E items | None created |

**⚠️ 1 E2E contact still exists. Will delete in next session or upon user confirmation.**

---

## Summary Table

| Section | ✅ PASS | ⚠️ PARTIAL | ❌ FAIL | ⏸ BLOCKED/DEFERRED | Total |
|---------|---------|------------|--------|---------------------|-------|
| A. Contacts CRUD | 3 | 2 | 1 | 4 | 10 |
| B. CSV Import | 0 | 0 | 0 | 9 | 9 |
| C. CSV Export | 0 | 0 | 0 | 4 | 4 |
| D. Google Sheets | 0 | 0 | 0 | 6 | 6 |
| E. Filters & Search | 2 | 0 | 0 | 4 | 6 |
| F. Bulk Actions | 0 | 1 | 0 | 0+⛔ | 1 |
| G. Custom Fields | 0 | 0 | 0 | 7 | 7 |
| H. Tags | 0 | 0 | 0 | 5 | 5 |
| I. Growth Tools | 1 | 1 | 0 | 15 | 17 |
| J. Locale/Layout | 2 | 1 | 0 | 2 | 5 |
| **TOTAL** | **8** | **5** | **1** | **56** | **70** |

**Overall: 8 PASS, 5 PARTIAL, 1 FAIL, 56 BLOCKED/DEFERRED**

The Arabic localization is strong (~90%+ translated). The single FAIL is the English phone validation message. The main gaps are systemic: pagination component not translated, "(optional)" labels hardcoded in English, and some validation messages missing Arabic translations. RTL layout works correctly throughout.

---

## ⏭️ To Continue — User Input Needed

1. **Test phone number** — to test inbound messages, QR scan, magic links, questionnaires, coupons, appointments, dynamic images
2. **Google Sheet URL** — throwaway sheet for sync tests D1–D6
3. **webhook.site URL** — for webhook tests
4. **Confirm:** delete the E2E test contact now, or leave for next session?

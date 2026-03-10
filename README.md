# Risk Watch

> A Google Apps Script automation that enforces lifecycle discipline, traceability, and review control inside a spreadsheet‑based risk register.

Spreadsheet risk registers are common in security and governance workflows, but they frequently degrade over time due to manual updates, inconsistent review cycles, and missing audit context. This automation introduces structured control logic so the register behaves more like a managed risk system rather than a passive spreadsheet.

The implementation relies on three trigger driven functions:

* `onEdit(e)`
* `onOpen()`
* `updateRiskData()`

Together they enforce consistent state handling, automatic review calculations, and traceable updates across the register.

---

# How It Works

## `onEdit(e)` — Event Driven Control

`onEdit(e)` executes whenever a user modifies the sheet.

The function immediately evaluates the edit context:

* Active sheet
* Edited row
* Edited column

Automation is intentionally restricted to **rows starting at row 3** to protect header rows or control metadata.

Key operational columns:

* **Column L (12)** → Status
* **Column P (16)** → Date Closed

The function also references the **`Index` sheet**, which acts as a lightweight persistence layer for stored lifecycle state.

### Change Logging

For edits occurring between **Column A and Column Q (1–17)** the script records a traceable update entry.

The process:

1. Generates a timestamp using the script time zone
2. Extracts the editing user's email prefix
3. Builds a change record

Example format:

```
MM/dd/yyyy, hh:mm:ss a changed by username
```

The log entry is written to two locations:

* Column **B** of the `Index` sheet
* Column **R (18)** of the active sheet

This provides row level traceability without maintaining a full audit table.

### Status Lifecycle Handling

When the **Status column** is edited, the script enforces lifecycle behavior.

If status equals **`closed`**:

* The current timestamp is written to

  * `Index!A`
  * `Risk Register!P`

If status changes away from `closed`:

* Both stored timestamps are cleared

This ensures the closure state of a risk is deterministic and synchronized between operational and stored data.

---

## `onOpen()` — State Refresh Trigger

When the spreadsheet is opened, the script executes:

```
updateRiskData()
```

This refresh step recalculates time dependent fields such as due dates, countdown values, and overdue duration.

The result is that the register always reflects the **current risk posture at the moment it is accessed**.

---

## `updateRiskData()` — Risk Lifecycle Engine

`updateRiskData()` recalculates operational state for every row in the register.

The function reads:

* Risk Level
* Risk Date
* Status

and computes review timing based on defined severity rules.

### Column Mapping

* **Column B** → Risk Date
* **Column G** → Risk Level
* **Column L** → Status
* **Column M** → Due Date
* **Column N** → Remaining Days
* **Column O** → Overdue Days
* **Column P** → Date Closed

### Review Intervals

Risk severity determines the review cadence:

| Risk Level | Review Interval |
| ---------- | --------------- |
| Very High  | 6 months        |
| High       | 12 months       |
| Medium     | 24 months       |

The script calculates the **Due Date** by adding the defined interval to the Risk Date.

### Remaining Days Calculation

The script calculates the number of days between the current date and the due date.

Output examples:

* `45 days remaining`
* `1 day remaining`
* `Due Now`

### Overdue Calculation

If the due date has passed, the script records overdue duration in **Column O**.

Example values:

* `0 days`
* `14 days`

### Visual Risk Signaling

The script also applies visual indicators to make operational status immediately visible:

| Condition           | Color |
| ------------------- | ----- |
| Closed Risk         | Green |
| < 30 days remaining | Red   |
| Default             | White |

This allows security teams to quickly identify risks approaching review thresholds.

### Closure State Restoration

The script retrieves stored closure timestamps from the `Index` sheet.

If a stored value exists, it restores the value to the active row in **Column P**.

If not, the column is cleared.

This ensures closure history remains consistent even if operational rows are recalculated.

---

# System Flow

```
User edits risk row
        │
        ▼
    onEdit(e)
        │
        ├── Validate row scope
        ├── Write change log
        └── Handle status lifecycle

Spreadsheet opened
        │
        ▼
     onOpen()
        │
        ▼
  updateRiskData()
        │
        ├── Calculate due date
        ├── Calculate remaining days
        ├── Calculate overdue days
        └── Restore closure state
```

---

# Architecture Principles Behind the Script

## Event Driven Automation

The system relies on Google Apps Script triggers instead of manual recalculation.

* `onEdit` captures operational events in real time
* `onOpen` refreshes state when the workbook is accessed

This ensures the register remains responsive without requiring user intervention.

## Guardrails on Automation Scope

The script ignores rows before row 3. This prevents automation from corrupting header rows or configuration metadata.

## Traceability

Every tracked edit produces a timestamp and user identifier. This adds lightweight accountability to a spreadsheet environment that otherwise lacks change context.

## State Synchronization

The register and the `Index` sheet maintain synchronized lifecycle data.

Closure timestamps are written to both locations and restored during refresh operations.

## Deterministic Date Calculations

Review cycles are derived from risk severity rather than manually entered deadlines. This reduces drift and enforces consistent review intervals.

## In Place State Refresh

The script recalculates values on existing rows rather than creating new records.

This makes the automation idempotent; repeated execution refreshes state without generating duplicates.

## Visual Operational Signaling

Color based cues provide immediate visual feedback on risk urgency, allowing teams to identify overdue or high‑priority items without scanning raw numbers.

---

# Security Impact

Although the script runs inside a spreadsheet, it introduces several controls that directly improve the operational security value of the risk register.

## Improved Change Accountability

Every tracked edit produces a timestamp and user reference. This discourages silent modification of risk records and provides context during reviews.

## Consistent Risk Lifecycle Handling

Closing a risk automatically records a closure timestamp, while reopening a risk clears that state. This reduces inconsistent lifecycle tracking.

## Enforced Review Cadence

Review schedules are derived from severity levels rather than manually maintained due dates. This reduces the risk of high‑severity items remaining unreviewed.

## Early Identification of Aging Risks

Automatic countdown and overdue calculations highlight risks approaching deadlines or already overdue.

## Reduced Manual Error

The automation eliminates several common spreadsheet risks:

* forgotten due date updates
* inconsistent closure timestamps
* stale countdown values
* missed review intervals

These improvements increase confidence in the operational integrity of the register.

---
<img width="1822" height="928" alt="WAF (1)" src="https://github.com/user-attachments/assets/8c150a14-bc87-41f8-ab5e-8421fc8be271" />


# Functions Included

* `onEdit(e)`
* `onOpen()`
* `updateRiskData()`

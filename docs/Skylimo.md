# SkyLimo Booking Trips Web App --- Antigravity Implementation Specification

## 1. Purpose

Build a production-ready web application that replaces the existing
SkyLimo monthly/daily Google Sheets booking workflow.

The application must preserve the familiar spreadsheet workflow while
improving data reliability, search, date navigation, multi-user access,
driver and vehicle selection, booking management, historical record
access, security, and scalability.

The existing spreadsheet screenshot is the primary visual reference for
the Daily Booking interface.

The previously prepared Client Brief is the primary functional
reference.

**Do not begin implementation until this specification and the client
requirements have been reviewed and approved.**

------------------------------------------------------------------------

# 2. Recommended Technology Stack

Use:

-   React
-   TypeScript
-   Vite
-   Firebase
-   Cloud Firestore
-   Firebase Authentication
-   Firebase Hosting
-   Firestore Security Rules

Use a modern component architecture. Do not build the entire application
as one large component.

------------------------------------------------------------------------

# 3. Design Direction

## Brand / Theme

The entire application uses a strict:

**RED + WHITE + BLACK**

visual system.

The design should feel:

-   Professional
-   Premium
-   Clean
-   Operational
-   High-contrast
-   Fast to scan
-   Suitable for a transportation/logistics company

Avoid excessive gradients, excessive shadows, cartoon-like UI, or overly
decorative dashboard designs.

The application should look like a serious business operations system.

------------------------------------------------------------------------

# 4. Color System

Use CSS variables/design tokens so colors can be changed centrally.

``` css
:root {
  --color-primary: #D90000;
  --color-primary-dark: #A80000;
  --color-primary-light: #FCE8E8;

  --color-black: #111111;
  --color-black-soft: #1E1E1E;

  --color-white: #FFFFFF;
  --color-background: #F7F7F7;

  --color-border: #D9D9D9;
  --color-muted: #6B6B6B;

  --color-success: #15803D;
  --color-warning: #B45309;
  --color-danger: #B91C1C;
}
```

### Color Rules

-   Red is the primary brand/action color.
-   Black is used for headings, navigation, strong text, and structural
    elements.
-   White is the primary surface/background color for cards and tables.
-   Light gray may be used as a neutral page background.
-   Do not introduce unrelated brand colors.
-   Status colors may use limited semantic colors where necessary for
    usability.
-   Red should not be used for every element. It should identify
    important actions and brand identity.

------------------------------------------------------------------------

# 5. Typography

Use a clean modern sans-serif font.

Recommended:

-   Inter
-   Or another highly readable system sans-serif

Typography hierarchy:

-   Page title: large, bold
-   Section title: medium/semibold
-   Table header: compact, bold
-   Table content: compact and highly readable
-   Secondary information: muted gray
-   Buttons: semibold

The application is information-dense, so typography must remain compact
without becoming difficult to read.

------------------------------------------------------------------------

# 6. Overall Application Structure

``` text
Application
│
├── Authentication
│   ├── Login
│   └── Session / Auth Guard
│
├── Main Layout
│   ├── Sidebar / Navigation
│   ├── Header
│   └── Main Content
│
├── Dashboard
│
├── Bookings
│   ├── Daily View
│   ├── Weekly View
│   ├── Monthly View
│   ├── Search
│   ├── Booking Form
│   └── Booking Details
│
├── Drivers
│   ├── Driver List
│   ├── Add Driver
│   └── Edit Driver
│
├── Vehicles
│   ├── Vehicle List
│   ├── Add Vehicle
│   └── Edit Vehicle
│
├── Users
│   ├── User List
│   ├── Add / Invite User
│   └── Permissions
│
├── Reports
│
└── Settings
```

------------------------------------------------------------------------

# 7. Main Navigation

The main navigation should contain:

1.  Dashboard
2.  Bookings
3.  Calendar / Month
4.  Search
5.  Drivers
6.  Vehicles
7.  Users
8.  Reports
9.  Settings

Features outside the approved MVP should be structurally prepared for
future expansion without being unnecessarily implemented.

------------------------------------------------------------------------

# 8. Main Layout

Use a desktop-first application layout.

``` text
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                      │
│ Logo / Title                         Search / User / Actions│
├───────────────┬─────────────────────────────────────────────┤
│               │                                             │
│ SIDEBAR       │ MAIN CONTENT                                │
│               │                                             │
│ Dashboard     │ Page title                                  │
│ Bookings      │ Toolbar                                     │
│ Calendar      │                                             │
│ Search        │ Content                                     │
│ Drivers       │                                             │
│ Vehicles      │                                             │
│ Users         │                                             │
│ Reports       │                                             │
│ Settings      │                                             │
│               │                                             │
└───────────────┴─────────────────────────────────────────────┘
```

The sidebar should use black/dark styling with red highlights for the
active item.

The main content area should remain predominantly white/light gray.

------------------------------------------------------------------------

# 9. Daily Booking View --- PRIMARY SCREEN

This is the most important screen in the application.

It should closely reproduce the workflow and density of the existing
spreadsheet.

Example heading:

**24/08/2026 --- MONDAY BOOKING TRIPS**

The screen should contain:

### Top Toolbar

-   Previous day
-   Date picker
-   Next day
-   Today
-   View selector
-   Search
-   Add Booking
-   Filters

### Main Table

Use a horizontally scrollable data table.

  Column
  ---------------
  Invoice
  Date
  Customer
  Mobile Phone
  Time
  From
  To
  Flight
  Car Time Out
  Car Time In
  Car Type
  Car Number
  Cash
  Card
  Bank Transfer
  Credit
  Commission
  Driver
  Status
  Note

------------------------------------------------------------------------

# 10. Daily Table Visual Rules

The table should resemble an improved version of the existing
spreadsheet.

Requirements:

-   Sticky table header
-   Horizontal scrolling
-   Compact rows
-   Clear borders
-   Alternating subtle row backgrounds where useful
-   Hover state
-   Selected row state
-   Dropdowns for controlled fields
-   Inline editing where practical
-   Currency/amount fields aligned consistently
-   Date and time fields clearly formatted
-   Long customer/location values should wrap or truncate intelligently

Do not turn the table into a card-based CRM layout.

The table is intentionally the primary interaction model.

------------------------------------------------------------------------

# 11. Daily Table Header

The table header should be visually strong.

Recommended:

-   Black/dark background OR white header with strong black typography
-   Red accent
-   Bold labels
-   Thin borders
-   Sticky positioning

Long headers such as **BANK TRANSFER** may use two lines to preserve
column width.

------------------------------------------------------------------------

# 12. Add Booking

Provide a highly visible:

**+ ADD BOOKING**

button using the primary red color.

The booking form should contain:

### Booking

-   Invoice
-   Date
-   Customer
-   Mobile Phone
-   Time
-   From
-   To
-   Flight

### Vehicle

-   Car Time Out
-   Car Time In
-   Car Type
-   Car Number
-   Driver

### Payment

-   Cash
-   Card
-   Bank Transfer
-   Credit
-   Commission

### Status

-   Status

### Notes

-   Note

------------------------------------------------------------------------

# 13. Booking Form UX

Use a clean modal or dedicated side panel.

``` text
BOOKING DETAILS

Customer Information
--------------------
Customer
Mobile Phone

Trip Information
----------------
Date
Time
From
To
Flight

Vehicle
-------
Car Type
Car Number
Driver
Car Time Out
Car Time In

Payment
-------
Cash
Card
Bank Transfer
Credit
Commission

Status
------
Status

Notes
-----
Note

[Cancel] [Save Booking]
```

Required fields should be clearly marked. Validation should happen
before saving.

------------------------------------------------------------------------

# 14. Date / Calendar Architecture

The application must support:

### Daily

One selected date.

### Weekly

A selected week.

### Monthly

A selected month.

### Custom Search

Optional date range.

The user should be able to move quickly between views.

Example:

``` text
[ August 2026 ▼ ] [ Week ] [ Day ] [ Month ]
```

------------------------------------------------------------------------

# 15. Monthly View

The Monthly View should provide a clear overview.

Example:

``` text
AUGUST 2026

MON   TUE   WED   THU   FRI   SAT   SUN
-----------------------------------------
     1     2     3     4     5     6
7    8     9     10    11    12    13
14   15    16    17    18    19    20
21   22    23    24    25    26    27
28   29    30    31
```

Each day may show:

-   Number of bookings
-   Important status indicators
-   Optional total/payment summary

Clicking a day opens the Daily Booking View.

------------------------------------------------------------------------

# 16. Weekly View

The Weekly View should make operational planning easy.

Show:

-   Selected week
-   Each day
-   Booking count
-   Booking rows or summarized bookings
-   Driver assignments
-   Vehicle assignments
-   Status

The user should be able to open a booking directly from the weekly view.

------------------------------------------------------------------------

# 17. Global Search

Provide a dedicated search experience.

Search should support:

-   Customer
-   Mobile phone
-   Invoice
-   Flight
-   Driver
-   Car number
-   From
-   To

Search results should display:

-   Date
-   Invoice
-   Customer
-   Phone
-   Time
-   From
-   To
-   Flight
-   Driver
-   Car
-   Status

Clicking a result opens the booking.

------------------------------------------------------------------------

# 18. Filters

Provide filters for:

-   Date
-   Date range
-   Driver
-   Vehicle
-   Car type
-   Status
-   Payment method

Filters should be combinable.

Example:

``` text
Date: August 2026
Driver: AMIR
Status: Confirmed
```

------------------------------------------------------------------------

# 19. Drivers Screen

Display drivers in a simple management table.

Columns:

-   Driver Name
-   Mobile
-   Status
-   Created
-   Actions

Actions:

-   Edit
-   Activate/Deactivate

Primary action:

**+ ADD DRIVER**

Inactive drivers must not appear in new booking dropdowns.

Historical bookings must continue displaying the original driver.

------------------------------------------------------------------------

# 20. Vehicles Screen

Display vehicles in a management table.

Columns:

-   Car Number
-   Car Type
-   Status
-   Created
-   Actions

Actions:

-   Edit
-   Activate/Deactivate

Primary action:

**+ ADD VEHICLE**

Inactive vehicles must not appear in new booking dropdowns.

Historical records must remain intact.

------------------------------------------------------------------------

# 21. Users Screen

Administrator-only area.

Display:

-   Name
-   Email
-   Role
-   Status
-   Last activity
-   Actions

Roles:

-   Administrator
-   Staff

Keep the permission architecture extensible for future roles.

------------------------------------------------------------------------

# 22. Dashboard

The dashboard should be operational rather than overly analytical.

Possible top-level cards:

``` text
TODAY'S BOOKINGS
24

COMPLETED
18

PENDING
4

CANCELLED
2
```

Additional useful information:

-   Today's bookings
-   Upcoming trips
-   Current driver assignments
-   Current vehicle assignments
-   Quick access to today's schedule

Avoid excessive charts in the first version.

------------------------------------------------------------------------

# 23. Status Design

Use semantic visual treatment.

Suggested:

-   Pending → warning treatment
-   Confirmed → red/brand treatment
-   Completed → success treatment
-   Cancelled → danger treatment
-   No Show → neutral/danger treatment

Status should remain readable even without color.

Do not rely on color alone.

------------------------------------------------------------------------

# 24. Payment Design

Payment values should be displayed cleanly.

Use consistent numeric formatting.

Example:

``` text
CASH           40.000
CARD
BANK TRANSFER  32.500
CREDIT
COMMISSION
```

The UI should make it clear when a payment field is empty versus zero.

If the business later requires automatic totals, the architecture should
support it.

------------------------------------------------------------------------

# 25. Responsive Behavior

Desktop is the primary environment.

On desktop:

-   Full spreadsheet/table
-   Sidebar
-   Full toolbar

On tablet:

-   Collapsible sidebar
-   Horizontal table scrolling

On mobile:

-   Compact navigation
-   Search
-   Booking form
-   Booking details
-   Status updates

Do not force the entire 20-column spreadsheet into a tiny mobile screen.

------------------------------------------------------------------------

# 26. Firebase Data Model

Recommended initial Firestore structure:

``` text
users/{userId}

drivers/{driverId}

vehicles/{vehicleId}

bookings/{bookingId}

settings/{settingId}
```

### Booking document

Recommended conceptual fields:

``` text
invoice
date
customer
mobilePhone
time
from
to
flight
carTimeOut
carTimeIn
carType
carNumber
cash
card
bankTransfer
credit
commission
driverId
vehicleId
status
note

createdAt
updatedAt
createdBy
updatedBy
```

Use IDs for relationships such as `driverId` and `vehicleId` rather than
duplicating mutable master data unnecessarily.

For historical display, preserve enough information to ensure historical
records remain understandable even if a driver or vehicle is later
deactivated.

------------------------------------------------------------------------

# 27. Authentication

Use Firebase Authentication.

Initial login:

-   Email
-   Password

After login:

-   Load user profile
-   Determine role
-   Apply permissions
-   Redirect to Dashboard

Unauthenticated users must not access protected application routes.

------------------------------------------------------------------------

# 28. Security

Security is mandatory.

Implement Firebase Security Rules so:

-   Users must be authenticated
-   Staff cannot manage administrators
-   Staff cannot change system-level configuration unless authorized
-   Only authorized users can delete records
-   Users can only perform actions permitted by their role

Never rely only on frontend hiding for security.

Firestore rules must enforce permissions.

------------------------------------------------------------------------

# 29. Data Validation

Validate:

-   Required customer information
-   Valid date
-   Valid time
-   Numeric payment values
-   Valid driver
-   Valid vehicle
-   Valid status
-   Valid role

Prevent accidental malformed records.

------------------------------------------------------------------------

# 30. Error Handling

The UI should provide clear messages.

Examples:

-   **Unable to save booking. Please try again.**
-   **You do not have permission to perform this action.**
-   **Driver could not be loaded.**
-   **Please complete the required fields.**

Avoid exposing raw Firebase errors to normal users.

------------------------------------------------------------------------

# 31. Loading States

Every data-driven screen must have a proper loading state.

Examples:

-   Table skeleton
-   Spinner
-   Loading text

Avoid blank screens while Firebase data is loading.

------------------------------------------------------------------------

# 32. Empty States

Example:

``` text
NO BOOKINGS FOUND

There are no bookings for this date.

[ + ADD BOOKING ]
```

For search:

``` text
NO RESULTS

No bookings matched your search.
Try changing your search or filters.
```

------------------------------------------------------------------------

# 33. Notifications / Toasts

Use lightweight toast notifications.

Examples:

-   Booking created successfully
-   Booking updated successfully
-   Booking deleted
-   Driver added
-   Vehicle updated

Success messages should be subtle. Errors should be clearly visible.

------------------------------------------------------------------------

# 34. Component Architecture

Use reusable components.

Suggested structure:

``` text
src/
│
├── components/
│   ├── layout/
│   ├── navigation/
│   ├── table/
│   ├── forms/
│   ├── modals/
│   ├── buttons/
│   ├── inputs/
│   ├── dropdowns/
│   ├── status/
│   └── feedback/
│
├── pages/
│   ├── Login/
│   ├── Dashboard/
│   ├── Bookings/
│   ├── Calendar/
│   ├── Search/
│   ├── Drivers/
│   ├── Vehicles/
│   ├── Users/
│   ├── Reports/
│   └── Settings/
│
├── services/
│   ├── firebase/
│   ├── bookings/
│   ├── drivers/
│   ├── vehicles/
│   └── users/
│
├── hooks/
├── types/
├── utils/
├── constants/
└── styles/
```

Adjust this structure if a better architecture is justified. Do not
create unnecessary abstractions.

------------------------------------------------------------------------

# 35. Code Quality Rules

The implementation must:

-   Use TypeScript types/interfaces
-   Avoid `any` unless genuinely necessary
-   Keep Firebase operations out of presentation components where
    practical
-   Use reusable components
-   Keep business logic separate from UI
-   Use consistent naming
-   Avoid duplicated logic
-   Avoid giant components
-   Keep secrets out of source control
-   Use environment configuration appropriately

------------------------------------------------------------------------

# 36. Firebase Development Rules

Before implementing Firebase-dependent features:

1.  Confirm Firebase project configuration.
2.  Confirm Authentication configuration.
3.  Confirm Firestore configuration.
4.  Establish the data model.
5.  Establish Security Rules.
6.  Test read/write access.
7.  Then build UI functionality.

Do not create insecure temporary rules and forget to replace them.

------------------------------------------------------------------------

# 37. Performance

The booking table may eventually contain many records.

Design queries carefully.

Use:

-   Date-based Firestore queries
-   Pagination where appropriate
-   Efficient search/filter strategies
-   Indexed fields where required
-   Avoid loading the entire database unnecessarily

The Daily View should load only the records necessary for the selected
date.

------------------------------------------------------------------------

# 38. UX Priority

The most important workflow is:

``` text
LOGIN
  ↓
DASHBOARD
  ↓
BOOKINGS
  ↓
SELECT DATE
  ↓
VIEW DAILY TRIPS
  ↓
ADD / EDIT BOOKING
  ↓
ASSIGN DRIVER + VEHICLE
  ↓
UPDATE PAYMENT / STATUS
  ↓
SAVE
```

This workflow must feel fast and obvious.

------------------------------------------------------------------------

# 39. Visual Priority

The visual hierarchy should be:

1.  Current date/view
2.  Booking table
3.  Add Booking action
4.  Search/filter controls
5.  Booking status
6.  Secondary navigation

Do not allow dashboard cards or decorative elements to dominate the
booking table.

------------------------------------------------------------------------

# 40. Reference Screenshot

The provided screenshot showing:

**SKYLIMO AUGUST 2026 BOOKING TRIPS REPORT**

must be treated as the visual/UX reference for the Daily Booking screen.

Preserve the existing terminology and column order unless a clear
usability reason exists to change it.

The web application should be immediately recognizable to a staff member
who currently uses the spreadsheet.

------------------------------------------------------------------------

# 41. MVP Boundary

The MVP should include:

-   Authentication
-   Dashboard
-   Daily bookings
-   Monthly navigation
-   Weekly navigation
-   Search
-   Filtering
-   Add booking
-   Edit booking
-   Driver management
-   Vehicle management
-   User management
-   Payment fields
-   Status
-   Notes
-   Firebase Firestore
-   Firebase Authentication
-   Firestore Security Rules
-   Firebase Hosting

Do not implement speculative future features without approval.

------------------------------------------------------------------------

# 42. Future Features

Keep the architecture ready for:

-   PDF export
-   Excel export
-   Financial reporting
-   Driver reports
-   Vehicle reports
-   Customer history
-   WhatsApp integration
-   SMS
-   Email notifications
-   Flight status
-   Automated reminders
-   Accounting integration
-   PWA/mobile enhancements

These are future scope unless explicitly approved.

------------------------------------------------------------------------

# 43. Antigravity Working Rules

Before planning:

1.  Read this entire `.md` file.
2.  Read the Client Brief.
3.  Inspect the provided spreadsheet screenshot/reference.
4.  Understand the existing workflow.
5.  Inspect the Firebase project configuration.
6.  Identify ambiguities and assumptions.
7.  Produce an implementation plan.
8.  Do not begin coding until the user approves the plan.

After approval:

1.  Implement in small, verifiable phases.
2.  Complete one logical feature at a time.
3.  Verify each phase before moving on.
4.  Keep the database model stable.
5.  Do not silently change business requirements.
6.  If a requirement is ambiguous, stop and ask for clarification rather
    than inventing a business rule.
7.  Keep this specification as the source of truth for visual and
    structural decisions unless the user explicitly changes it.

------------------------------------------------------------------------

# 44. Required Development Phases

## Phase 1 --- Project Foundation

-   React + TypeScript + Vite
-   Firebase connection
-   Application shell
-   Theme system
-   Routing
-   Authentication foundation

## Phase 2 --- Database Foundation

-   Firestore collections
-   Types/interfaces
-   Security Rules
-   Users
-   Drivers
-   Vehicles
-   Bookings

## Phase 3 --- Daily Booking Screen

-   Table
-   Date navigation
-   Booking form
-   Inline/edit interactions
-   Driver dropdown
-   Vehicle dropdown
-   Status
-   Payment fields

## Phase 4 --- Search and Filters

-   Global search
-   Date filtering
-   Driver filtering
-   Vehicle filtering
-   Status filtering

## Phase 5 --- Weekly and Monthly Views

-   Calendar
-   Weekly overview
-   Monthly overview
-   Navigation between views

## Phase 6 --- Administration

-   User management
-   Driver management
-   Vehicle management
-   Permissions

## Phase 7 --- Polish and QA

-   Responsive behavior
-   Loading states
-   Empty states
-   Error handling
-   Security review
-   Performance review
-   UI consistency
-   Final testing

------------------------------------------------------------------------

# 45. Definition of Done

A feature is not considered complete merely because it renders on
screen.

A feature is complete when:

-   UI works
-   Data is persisted correctly
-   Validation works
-   Permissions work
-   Loading state exists
-   Error state exists
-   Empty state exists where relevant
-   Desktop layout works
-   Relevant mobile/tablet behavior works
-   No obvious console errors exist
-   Firebase rules are respected
-   Existing functionality is not broken

------------------------------------------------------------------------

# 46. Final Instruction to Antigravity

Build this application as a professional operational booking management
system.

The current spreadsheet is the workflow reference.

Firebase is the backend.

React + TypeScript is the recommended frontend.

The primary visual identity is:

**RED + WHITE + BLACK**

The Daily Booking Table is the most important screen.

Prioritize:

**Accuracy → Reliability → Usability → Familiarity → Visual Polish**

Do not over-engineer the first version.

Do not introduce features that have not been approved.

Do not replace the spreadsheet workflow with a generic CRM/dashboard
experience.

The finished application should feel like a modern, secure, searchable,
multi-user version of the existing SkyLimo booking sheet.

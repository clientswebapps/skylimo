# SkyLimo Booking Trips Management Web Application

## Client Brief — Draft v1.0

---

## 1. Project Overview

The objective is to replace the current Google Sheets-based daily booking/trips report with a dedicated web application.

The current sheet is used by staff to record and manage daily transportation bookings and airport transfer trips throughout the month.

The new web application should preserve the existing workflow and visual structure as closely as practical, while providing:

* Centralized data storage
* Multi-user access
* Search and filtering
* Daily, weekly, and monthly views
* Dropdown-based selection for drivers and cars
* User/staff management
* Booking/trip record management
* Payment tracking
* Booking status tracking
* Better data consistency and reliability than a spreadsheet

The application should feel familiar to existing staff so that the transition from the current spreadsheet is straightforward.

---

# 2. Existing Spreadsheet Structure

The current daily booking sheet contains the following columns:

| Column        | Description                |
| ------------- | -------------------------- |
| Invoice       | Invoice/reference number   |
| Date          | Booking/trip date          |
| Customer      | Customer name              |
| Mobile Phone  | Customer contact number    |
| Time          | Pickup/booking time        |
| From          | Pickup location            |
| To            | Destination                |
| Flight        | Flight number              |
| Car Time Out  | Vehicle departure/out time |
| Car Time In   | Vehicle return/in time     |
| Car Type      | Vehicle category           |
| Car Number    | Assigned vehicle           |
| Cash          | Cash payment               |
| Card          | Card payment               |
| Bank Transfer | Bank transfer payment      |
| Credit        | Credit payment             |
| Commission    | Commission amount          |
| Driver        | Assigned driver            |
| Status        | Trip/booking status        |
| Note          | Additional information     |

The web application should retain these core fields.

---

# 3. Main Concept

The application is based around **booking/trip records**.

Each record represents one customer trip.

Records are organized by date.

Users should be able to view:

1. A specific day
2. A week
3. A month
4. Search results across existing records

The system should not require users to create a separate spreadsheet for every day.

Instead, all records should be stored centrally and the interface should dynamically display the appropriate day/week/month.

---

# 4. Main Dashboard

After logging in, the user should see the main booking management screen.

The interface should closely resemble the current spreadsheet.

### Main controls

The top of the screen should provide:

* Current month selector
* Date selector
* Week selector
* Search
* Add booking
* Filters
* Refresh/reload
* User/account menu

A typical workflow could be:

**August 2026 → Monday 24 August → Daily Booking List**

The user can then switch to:

**Week View**

or:

**Month View**

without creating another document.

---

# 5. Daily View

The Daily View is the primary working screen.

It should visually resemble the existing Google Sheet.

The selected date should be clearly displayed at the top.

Example:

**24/08/2026 — MONDAY BOOKING TRIPS**

Below this, bookings should appear in rows.

Each booking is one row.

The columns should follow the existing spreadsheet structure:

* Invoice
* Date
* Customer
* Mobile Phone
* Time
* From
* To
* Flight
* Car Time Out
* Car Time In
* Car Type
* Car Number
* Cash
* Card
* Bank Transfer
* Credit
* Commission
* Driver
* Status
* Note

---

# 6. Booking Record

Each booking should contain the following information.

### Booking Information

**Invoice**

* Unique invoice/reference number
* Can be manually entered or automatically generated depending on final business rules

**Date**

* Trip date

**Customer**

* Customer name

**Mobile Phone**

* Customer contact number

**Time**

* Pickup/booking time

**From**

* Pickup location

**To**

* Destination

**Flight**

* Flight number

---

# 7. Vehicle Information

The booking should contain:

### Car Time Out

Time the vehicle leaves / starts the trip.

### Car Time In

Time the vehicle returns / finishes the trip.

### Car Type

Selectable vehicle category.

Examples from the existing sheet:

* Sedan
* SUV

Additional vehicle types can be added later.

### Car Number

Selectable from a predefined list of vehicles.

The vehicle list should be managed separately so staff do not have to manually type vehicle numbers for every booking.

Example:

* 640315
* Additional vehicle numbers added later

---

# 8. Payment Information

The existing sheet separates payments into different columns.

The web application should preserve this structure.

Payment fields:

* Cash
* Card
* Bank Transfer
* Credit
* Commission

The user should be able to record the appropriate amount against the booking.

The interface should make it immediately obvious which payment method was used.

---

# 9. Driver Assignment

Each booking should have a Driver field.

The Driver field should be a dropdown.

Drivers should be maintained in a separate configuration area.

Example:

* ISA
* AMIR
* Additional drivers added later

Staff should select the driver instead of typing the name manually.

This prevents spelling inconsistencies and makes filtering by driver possible.

---

# 10. Booking Status

Each booking should have a Status field.

The exact status options should be configurable.

Possible initial statuses:

* Pending
* Confirmed
* Completed
* Cancelled
* No Show

The final status list should be confirmed before implementation.

Status should be displayed as a dropdown and visually distinguishable.

---

# 11. Notes

Each booking should have a Note field.

This is for information that does not fit into the standard booking fields.

Examples:

* Customer requested child seat
* Customer changed pickup location
* Flight delayed
* Special instructions
* Payment clarification

---

# 12. Calendar / Date Navigation

The system should allow users to navigate between dates easily.

Users should be able to:

* Select a date from a date picker
* Move to previous day
* Move to next day
* Jump to today
* Select a month
* Select a week

The selected date determines which bookings are displayed.

---

# 13. Monthly View

The system should support viewing bookings for the entire month.

Example:

**August 2026**

Users should be able to see the bookings belonging to each day of the month.

The monthly view is primarily for overview and searching rather than replacing the detailed daily spreadsheet view.

Possible presentation:

* Calendar-style monthly overview
* Number of bookings per day
* Quick access to a specific day

Clicking a date should open that day's detailed booking list.

---

# 14. Weekly View

The system should provide a weekly view.

Example:

**24 August — 30 August 2026**

Users should be able to see bookings across the selected week.

The weekly view should make it easy to:

* Review upcoming trips
* Identify busy days
* Review driver assignments
* Review vehicle assignments
* Check booking status

---

# 15. Search

Search is one of the major improvements over the existing spreadsheet.

Users should be able to search existing records.

Searchable information should include:

* Customer name
* Mobile phone
* Invoice number
* Flight number
* Driver
* Car number
* From
* To
* Date
* Status

Example:

Searching:

**Osman**

should return all matching bookings.

Searching:

**RJ 672**

should return the relevant flight booking.

Searching:

**640315**

should return bookings assigned to that vehicle.

---

# 16. Date Filtering

Users should be able to filter records by:

### Day

Example:

24 August 2026

### Week

Example:

24–30 August 2026

### Month

Example:

August 2026

### Custom Date Range

Optional but recommended.

Example:

20 August → 31 August

This will make historical reporting much easier.

---

# 17. Staff / User Management

The application will have multiple staff/users.

Users should log in using their own accounts.

The system should support different access levels.

Suggested roles:

### Administrator

Can:

* Manage users
* Manage drivers
* Manage vehicles
* Manage system settings
* Add/edit/delete bookings
* View all records
* Access reports

### Staff

Can:

* View bookings
* Add bookings
* Edit bookings
* Assign drivers
* Assign vehicles
* Update booking status

The exact permissions should be finalized before implementation.

---

# 18. Driver Management

Administrators should be able to maintain the driver list.

Driver record could contain:

* Driver name
* Mobile number
* Status
* Notes

Example:

**ISA**

* Active

**AMIR**

* Active

Drivers marked inactive should no longer appear as selectable options for new bookings, while historical bookings should retain the original driver.

---

# 19. Vehicle / Car Management

Administrators should be able to maintain the vehicle list.

Vehicle record could contain:

* Car number
* Car type
* Status
* Notes

Example:

**640315**

* SUV
* Active

Vehicles marked inactive should not appear in new booking dropdowns but should remain associated with historical bookings.

---

# 20. Data Integrity

The system should reduce common spreadsheet problems.

The application should use controlled inputs where appropriate.

Examples:

Instead of typing:

`AMIR`

`Amir`

`amir`

the system should provide one Driver dropdown.

Likewise, Car Number and Car Type should use controlled selections.

This will make searching and reporting reliable.

---

# 21. Firebase Backend

The application should use Firebase as the backend platform.

Recommended Firebase services:

### Firebase Authentication

Used for:

* Staff login
* Administrator login
* User identity
* Role-based access

### Cloud Firestore

Used for:

* Booking records
* Drivers
* Vehicles
* Users
* System configuration

### Firebase Hosting

Used to host the web application.

### Firebase Security Rules

Used to control what each user is allowed to read/write.

---

# 22. Recommended Frontend Technology

Recommended stack:

**React + TypeScript + Vite**

with Firebase.

Reason:

The application will eventually contain:

* Spreadsheet-like tables
* Filtering
* Search
* Dropdowns
* Forms
* User management
* Calendar views
* Role-based UI
* Reporting

React provides a cleaner structure for these components than a large Vanilla JavaScript application.

TypeScript is recommended to reduce data and field-related errors as the system grows.

The application should still remain lightweight and fast.

---

# 23. Spreadsheet-Like Interface

The Daily Booking View should feel similar to the existing spreadsheet.

Important characteristics:

* Rows and columns
* Clear column headings
* Compact layout
* Dropdown controls
* Inline editing where appropriate
* Horizontal scrolling on smaller screens
* Frozen headers
* Easy keyboard/mouse navigation
* Clear visual separation between records

The application should **not look like a generic CRM**.

The existing spreadsheet workflow should remain recognizable.

---

# 24. Responsive Design

The application should work on:

* Desktop computers
* Laptops
* Tablets

Desktop should be the primary interface because the current workflow is spreadsheet-based.

Mobile support should focus on:

* Viewing bookings
* Searching
* Updating status
* Checking driver/vehicle assignments
* Adding basic booking information

The full spreadsheet-style interface can prioritize desktop/tablet layouts.

---

# 25. Booking Creation

Users should have an obvious:

**+ Add Booking**

button.

The system should allow staff to enter the booking information through either:

1. An inline spreadsheet row
2. A booking form

The preferred approach can be determined during UI planning.

After saving, the booking should immediately appear in the selected date's list.

---

# 26. Booking Editing

Authorized users should be able to edit existing bookings.

Editing should preserve the booking record rather than creating a duplicate.

Changes should be saved to Firestore.

---

# 27. Booking Deletion

Deletion should be restricted to authorized users.

Recommended behavior:

* Normal staff should not permanently delete records
* Administrators can delete records if required
* Confirmation should be required before deletion

An alternative is a soft-delete/archive system so historical records are never accidentally lost.

---

# 28. Historical Records

Bookings should remain accessible after the day/month has passed.

For example:

A booking created on:

**24/08/2026**

should still be searchable in:

* September
* October
* Future months

The system should maintain historical booking data unless an authorized administrator archives/removes it.

---

# 29. Reporting

The first version should focus on booking management and search.

However, the database should be designed so future reporting can easily be added.

Possible future reports:

* Daily trip report
* Weekly trip report
* Monthly trip report
* Driver trip count
* Vehicle utilization
* Cash totals
* Card totals
* Bank transfer totals
* Credit totals
* Commission totals
* Revenue totals
* Cancelled bookings
* Customer history

These reports should not necessarily be implemented in the first version unless requested.

---

# 30. Audit / Change Tracking

Recommended for the system.

The application should be designed so important changes can eventually be tracked.

For example:

* Who created the booking
* Who last edited it
* When it was created
* When it was last updated

This is particularly useful because multiple staff members will use the system.

---

# 31. Initial Data Setup

The system should initially support manually adding:

### Drivers

Added by administrator.

### Cars

Added by administrator.

### Staff/Users

Added/invited by administrator.

### Car Types

Initially:

* Sedan
* SUV

Additional options can be added later.

---

# 32. Initial Scope

The first version should include:

* User authentication
* Staff/user management
* Role-based permissions
* Daily booking view
* Monthly navigation
* Weekly navigation
* Booking creation
* Booking editing
* Booking search
* Date filtering
* Customer search
* Invoice search
* Flight search
* Driver dropdown
* Vehicle dropdown
* Car type dropdown
* Payment fields
* Status dropdown
* Notes
* Firebase Firestore database
* Firebase Security Rules
* Firebase Hosting
* Responsive desktop/tablet UI

---

# 33. Future Enhancements

The following can be considered after the core application is stable:

* Automated invoice generation
* PDF trip reports
* Excel export
* Monthly financial reports
* Driver performance reports
* Vehicle utilization reports
* Customer history
* WhatsApp integration
* SMS notifications
* Email notifications
* Flight status integration
* Automated reminders
* Dashboard analytics
* Expense tracking
* Accounting integration
* Mobile/PWA functionality

These should not be allowed to complicate the initial MVP.

---

# 34. Important Business Rules to Confirm

Before development begins, the following items should be confirmed:

### Invoice

* Is invoice number manually entered?
* Or should the system generate it automatically?
* What format should invoice numbers use?

### Payment

* Can a booking have multiple payment methods?
* Is the payment amount the total trip price?
* Is Commission entered manually?
* Should the system calculate totals automatically?

### Status

What exact status values should be used?

### Drivers

Can a booking have more than one driver?

### Vehicles

Can the same vehicle be assigned to overlapping trips?

Should the system warn about conflicts?

### Time

Is the booking time the customer pickup time?

What exactly do Car Time Out and Car Time In represent?

### Customer

Should customer information be stored separately so returning customers can be selected?

### Locations

Should From/To be free text, or should frequently used locations eventually become dropdown options?

---

# 35. Important UI Principle

The new application should **not attempt to redesign the workflow unnecessarily**.

The existing Google Sheet is already familiar to the staff.

Therefore the first version should preserve:

* The same terminology
* The same column structure
* The same payment structure
* The same driver/car assignment workflow
* The same daily booking concept

The improvements should primarily come from:

**centralized data + search + filtering + controlled dropdowns + user permissions + reliable storage.**

---

# 36. Success Criteria

The application will be considered successful when staff can perform their existing workflow without needing the original Google Sheet.

A staff member should be able to:

1. Log in
2. Select a date
3. View that day's bookings
4. Add a new booking
5. Select a driver
6. Select a vehicle
7. Enter payment information
8. Update the booking status
9. Edit an existing booking
10. Search previous bookings
11. View weekly bookings
12. View monthly bookings

An administrator should additionally be able to:

1. Manage staff users
2. Manage drivers
3. Manage vehicles
4. Manage configuration
5. Review historical records

---

# 37. Recommended Architecture

### Frontend

React + TypeScript + Vite

### Backend

Firebase

### Authentication

Firebase Authentication

### Database

Cloud Firestore

### Hosting

Firebase Hosting

### Security

Firestore Security Rules + Firebase Authentication

### Application Structure

The application should be organized around these primary areas:

* Authentication
* Dashboard
* Daily Bookings
* Weekly View
* Monthly View
* Search
* Booking Form
* Drivers
* Vehicles
* Users
* Settings
* Reports

---

# 38. Development Philosophy

The application should be built in small, verifiable stages.

The development process should avoid attempting to build the entire application at once.

Each major feature should be implemented, tested, and verified before moving to the next feature.

The database structure should be established carefully before large amounts of UI are implemented.

The final system should prioritize:

**Reliability → Data integrity → Ease of use → Familiar workflow → Visual polish**

rather than unnecessary complexity.

---

## End of Client Brief — Draft v1.0

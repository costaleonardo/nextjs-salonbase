# Data Import System

## Overview

The Data Import System allows salon owners to bulk import client data from CSV or Excel files. This is particularly useful when migrating from other platforms like Fresha.

## Features

### ✅ Supported File Formats
- **CSV** (`.csv`)
- **Excel** (`.xlsx`, `.xls`)

### ✅ Data Validation
- **Required fields**: First Name, Last Name, and at least one of Email or Phone
- **Email validation**: Checks for valid email format
- **Phone validation**: Accepts various phone formats (10-15 digits)
- **Field name normalization**: Automatically handles common variations like "First Name", "firstName", "first", etc.

### ✅ Deduplication
- Automatically detects duplicate clients by matching:
  - Email address (case-insensitive)
  - Phone number (ignores formatting)
- Options to:
  - Skip duplicates (only import new clients)
  - Update existing clients with new data

### ✅ Transaction Safety
- All imports use database transactions
- Automatic rollback on errors (no partial imports)
- 100% data integrity guaranteed
- If more than 10% of rows fail, the entire import is rolled back

### ✅ User-Friendly Interface
- Step-by-step wizard (Upload → Preview → Confirm → Complete)
- Visual progress indicators
- Preview data before importing
- Clear error messages with row numbers
- Success/error summary after import

## How to Use

### Step 1: Prepare Your Data

Download the sample template: [sample-import-template.csv](/sample-import-template.csv)

**Required columns:**
- `firstName` (required)
- `lastName` (required)
- `email` (required if phone is missing)
- `phone` (required if email is missing)

**Optional columns:**
- `notes`

**Example:**
```csv
firstName,lastName,email,phone,notes
John,Doe,john.doe@example.com,(555) 123-4567,Regular customer
Jane,Smith,jane.smith@example.com,5559876543,Prefers morning appointments
```

### Step 2: Access the Import Page

1. Log in to your SalonBase dashboard as an **OWNER**
2. Navigate to **Import Data** in the sidebar
3. Click "Download sample CSV template" if needed

### Step 3: Upload Your File

1. Click the upload area or drag and drop your file
2. Supported formats: CSV, XLSX, XLS
3. Wait for the file to be parsed and validated

### Step 4: Preview Data

- Review the parsed data in a table view
- Check for validation errors (highlighted in red)
- Fix any errors in your file and re-upload if needed
- Click "Continue" to proceed

### Step 5: Confirm Import

- Review the summary:
  - New clients to import
  - Duplicate clients found
- Choose how to handle duplicates:
  - **Skip duplicates**: Only import new clients
  - **Update existing**: Replace existing client data with new data
- Review the list of duplicate matches
- Click "Import Clients" to confirm

### Step 6: Review Results

- See the import summary:
  - Number of clients imported
  - Number of clients updated
  - Number of clients skipped
- View any errors that occurred
- Click "View Clients" to see your imported data

## Field Name Variations

The system automatically recognizes common field name variations:

| Standard Field | Accepted Variations |
|---------------|---------------------|
| `firstName` | firstName, first, fname, givenname, First Name |
| `lastName` | lastName, last, lname, surname, familyname, Last Name |
| `email` | email, emailaddress, mail, Email Address |
| `phone` | phone, phonenumber, mobile, cell, telephone, tel, Phone Number |
| `notes` | notes, note, comments, comment, memo |

**Note:** Field names are case-insensitive and ignore special characters.

## Phone Number Formats

The system accepts various phone number formats:

- `5551234567` (10 digits)
- `(555) 123-4567` (formatted)
- `555-123-4567` (dashed)
- `+1 555 123 4567` (international)
- `+44 20 1234 5678` (international, 11+ digits)

All phone numbers are validated and stored in a consistent format.

## Error Handling

### Common Validation Errors

| Error | Solution |
|-------|----------|
| "First name is required" | Add a first name to the row |
| "Last name is required" | Add a last name to the row |
| "Either email or phone is required" | Add at least one contact method |
| "Invalid email format" | Fix the email address (e.g., `user@example.com`) |
| "Invalid phone format" | Use at least 10 digits |

### Import Errors

If the import fails:
- **Transaction rolled back**: No changes were made to your database
- **Error report**: View specific errors by row number
- **Fix and retry**: Correct the issues in your file and import again

## Best Practices

### Before Importing

1. **Clean your data**: Remove duplicate rows in your file
2. **Validate emails**: Ensure all emails are in proper format
3. **Standardize phone numbers**: Use consistent formatting
4. **Test with a small file**: Import 5-10 rows first to verify

### During Import

1. **Review the preview**: Check for red highlighted errors
2. **Fix errors**: Go back and correct issues before confirming
3. **Choose deduplication carefully**: Understand if you want to skip or update duplicates

### After Import

1. **Review the results**: Check the import summary
2. **Verify data**: Navigate to the Clients page to verify imported data
3. **Keep your original file**: In case you need to reference or re-import

## Limitations

- **Maximum file size**: 10 MB (approximately 100,000 rows)
- **Timeout**: Imports must complete within 60 seconds
- **Owner-only**: Only salon owners can import data
- **Client data only**: Currently supports client imports only (not services or appointments)
- **No undo**: Once imported, you cannot undo (except for transaction rollback on error)

## Troubleshooting

### File won't upload
- Check file format (CSV, XLSX, XLS only)
- Ensure file size is under 10 MB
- Try re-saving the file in a different format

### All rows show as invalid
- Check that your file has a header row with column names
- Verify column names match accepted variations
- Ensure data is in the correct columns

### Import hangs or times out
- Reduce the number of rows (import in batches)
- Check your internet connection
- Contact support if the issue persists

### Duplicates not detected
- Ensure email/phone data is consistent between files
- Check for typos or formatting differences
- Manually review the deduplication matches

## Technical Details

### Architecture

- **Parser**: `lib/import-parser.ts` (PapaParse for CSV, xlsx for Excel)
- **Server Actions**: `app/actions/import.ts` (checkForDuplicates, importClients)
- **UI**: `app/dashboard/import/page.tsx` (4-step wizard)
- **Database**: PostgreSQL with Prisma ORM
- **Transactions**: Automatic rollback on errors

### Security

- **Authentication required**: User must be logged in
- **Role-based access**: OWNER role only
- **SQL injection protection**: Prisma ORM prevents SQL injection
- **File validation**: Only CSV/Excel files accepted
- **Size limits**: 10 MB maximum file size

### Performance

- **Batch processing**: Inserts processed in a single transaction
- **Timeout**: 60-second limit for large imports
- **Connection pooling**: Uses Neon serverless PostgreSQL with connection pooling
- **Error threshold**: Automatic rollback if >10% of rows fail

## Support

If you encounter issues with the data import system:

1. Check this documentation for troubleshooting tips
2. Review the error messages and fix data issues
3. Try importing a smaller batch of data
4. Contact support at support@salonbase.app

## Future Enhancements

Planned features for future releases:

- [ ] Import service data
- [ ] Import appointment history
- [ ] Import staff data
- [ ] Scheduled/recurring imports
- [ ] API for programmatic imports
- [ ] Import templates for popular platforms (Fresha, Square, Vagaro)
- [ ] Import undo functionality (within 24 hours)
- [ ] Import history and audit log

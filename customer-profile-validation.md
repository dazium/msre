# Customer Profile Quick-Action Validation Notes

- The public customer profile for John Mitchell (`/customers/720006`) displays portrait-safe **New Job**, **New Estimate**, **Quick Note**, and **Add Photo** actions.
- Selecting **New Job** opened `/projects?new=1&customerId=720006`; the Create New Project dialog automatically selected **John Mitchell** as the customer.
- Selecting **New Estimate** opened the existing Create Estimate dialog directly because this customer currently has one job. The dialog was closed without creating an estimate.
- Selecting **Add Photo** opened the project-bound photo uploader and automatically selected **Roof Replacement - Hail Damage**. No file was uploaded.
- Selecting **Quick Note** opened the existing persisted contact-history note dialog with interaction type, title, and details fields. No note was submitted.
- No new customer, project, estimate, note, or photo record was created during this validation.

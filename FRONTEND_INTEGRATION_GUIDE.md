# Frontend Integration Guide - Phase 8

## Overview

Phase 8 frontend integration includes:
- ✅ Custom React hooks for API consumption
- ✅ Reusable CRUD components (DataTable, FormBuilder)
- ✅ Complete pages for Users, Projects, and Evaluations
- ✅ Responsive UI with Tailwind CSS
- ✅ Form validation with Zod

---

## Architecture

### 1. API Hooks (`lib/hooks/useApi.ts`)

Custom hooks for fetching and mutating data:

```typescript
// Fetch data
const { data, error, loading, execute } = useApi(apiCall);
const { users, pagination, error, loading, refetch } = useUsers();
const { projects, pagination } = useProjects(page, limit, filters);
const { evaluations } = useEvaluations(page, limit, filters);

// Mutate data
const { mutate, data, error, loading } = useMutation('/api/endpoint', 'POST');
await mutate({ field: 'value' });
```

### 2. Components (`components/crud/`)

#### DataTable.tsx
Generic table component for displaying list data with actions:

```typescript
<DataTable
  data={items}
  columns={[
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status', render: (val) => <Badge>{val}</Badge> }
  ]}
  onView={handleView}
  onEdit={handleEdit}
  onDelete={handleDelete}
  loading={loading}
/>
```

#### FormBuilder.tsx
Form component with Zod validation:

```typescript
<FormBuilder
  schema={createUserSchema}
  fields={[
    { name: 'email', label: 'Email', type: 'email' },
    { name: 'role', label: 'Role', type: 'select', options: [...] }
  ]}
  onSubmit={handleSubmit}
  loading={loading}
  error={error}
/>
```

### 3. Pages (`app/dashboard/`)

#### Users Page (`users/page.tsx`)
- ✅ List all users
- ✅ Create new users
- ✅ Manage user roles
- ✅ Delete users

#### Projects Page (`projects/page.tsx`)
- ✅ List all projects
- ✅ Create new projects
- ✅ Filter by status
- ✅ View project scores
- ✅ Dashboard stats cards

#### Evaluations Page (`evaluations/page.tsx`)
- ✅ List all evaluations
- ✅ Create new evaluations
- ✅ Workflow visualization
- ✅ Status tracking

---

## Usage Examples

### Create a New Page with CRUD Operations

```typescript
'use client';

import { useProjects, useMutation } from '@/lib/hooks/useApi';
import { DataTable } from '@/components/crud/DataTable';
import { FormBuilder } from '@/components/crud/FormBuilder';
import { createProjectSchema } from '@/lib/validation-schemas';

export default function MyPage() {
  const { data, loading } = useProjects();
  const { mutate, loading: creating } = useMutation('/api/projects', 'POST');

  const handleCreate = async (data) => {
    await mutate(data);
  };

  return (
    <div>
      <FormBuilder
        schema={createProjectSchema}
        fields={[...]}
        onSubmit={handleCreate}
      />
      <DataTable data={data?.data} columns={[...]} />
    </div>
  );
}
```

### Add Authentication

The hooks automatically include JWT tokens from localStorage:

```typescript
// Automatically adds: Authorization: Bearer {token}
const { users } = useUsers();
```

Login flow sets token:
```typescript
localStorage.setItem('auth_token', jwtToken);
```

---

## File Structure

```
app/
├── dashboard/
│   ├── users/
│   │   └── page.tsx          ✅ Users management
│   ├── projects/
│   │   └── page.tsx          ✅ Projects management
│   └── evaluations/
│       └── page.tsx          ✅ Evaluations workflow

components/
├── crud/
│   ├── DataTable.tsx         ✅ Reusable table
│   └── FormBuilder.tsx       ✅ Reusable forms
└── ui/
    ├── table.tsx
    ├── button.tsx
    ├── form.tsx
    └── ...

lib/
├── hooks/
│   └── useApi.ts             ✅ API hooks
└── validation-schemas.ts     ✅ Zod schemas
```

---

## Features Implemented

### ✅ Authentication
- JWT token handling
- Auto-redirect on 401
- Token persistence

### ✅ Data Fetching
- useApi hook
- useUsers, useProjects, useEvaluations
- Pagination support
- Error handling

### ✅ Forms
- Zod validation
- Dynamic field rendering
- Multiple input types
- Loading states
- Error messages

### ✅ Tables
- Generic reusable component
- Sortable columns
- Action buttons
- Loading states
- Empty states

### ✅ Pages
- Complete CRUD workflows
- Dashboard stats
- Status tracking
- Responsive design

---

## Integration Checklist

- [x] Install dependencies
  ```bash
  npm install react-hook-form @hookform/resolvers zod
  ```

- [x] Create hook files
  - `lib/hooks/useApi.ts`

- [x] Create components
  - `components/crud/DataTable.tsx`
  - `components/crud/FormBuilder.tsx`

- [x] Create pages
  - `app/dashboard/users/page.tsx`
  - `app/dashboard/projects/page.tsx`
  - `app/dashboard/evaluations/page.tsx`

- [ ] Add navigation/sidebar
- [ ] Create login page
- [ ] Implement authentication flow
- [ ] Add error boundaries
- [ ] Add loading skeletons
- [ ] Implement real-time updates
- [ ] Add toast notifications
- [ ] Setup e2e tests

---

## Next Steps

### 1. Complete Authentication
- Create login page (`app/login/page.tsx`)
- Implement JWT flow
- Add user context

### 2. Enhance UI
- Add sidebar navigation
- Create layout wrapper
- Add loading skeletons
- Add toast notifications

### 3. Add Features
- Edit/Update operations (PUT)
- Delete with confirmation
- Bulk operations
- Advanced filtering
- Export to CSV

### 4. Testing
- Unit tests for hooks
- Component tests
- Integration tests
- E2E tests

### 5. Performance
- Add React Query for caching
- Implement pagination optimization
- Add data persistence
- Optimize re-renders

---

## Common Patterns

### Creating a Page

```typescript
'use client';

import { useMyData, useMutation } from '@/lib/hooks/useApi';
import { DataTable } from '@/components/crud/DataTable';
import { FormBuilder } from '@/components/crud/FormBuilder';
import { mySchema } from '@/lib/validation-schemas';

export default function MyPage() {
  const { data, loading, error, execute } = useMyData();
  const { mutate, loading: creating } = useMutation('/api/endpoint');

  const columns = [
    { key: 'field1', label: 'Field 1' },
    { key: 'field2', label: 'Field 2', render: (val) => <span>{val}</span> }
  ];

  const fields = [
    { name: 'field1', label: 'Field 1', type: 'text' },
    { name: 'field2', label: 'Field 2', type: 'select', options: [] }
  ];

  const handleSubmit = async (data) => {
    await mutate(data);
    await execute();
  };

  return (
    <div>
      <FormBuilder
        schema={mySchema}
        fields={fields}
        onSubmit={handleSubmit}
      />
      <DataTable data={data} columns={columns} loading={loading} />
    </div>
  );
}
```

---

## Troubleshooting

### Issue: "401 Unauthorized"
**Solution**: Check JWT token in localStorage:
```typescript
console.log(localStorage.getItem('auth_token'));
```

### Issue: "Components not found"
**Solution**: Ensure shadcn/ui components are installed:
```bash
npx shadcn-ui@latest add table button form input
```

### Issue: Form validation not working
**Solution**: Verify Zod schema is imported:
```typescript
import { createUserSchema } from '@/lib/validation-schemas';
```

---

## Testing

### Unit Test Example

```typescript
import { render, screen } from '@testing-library/react';
import { DataTable } from '@/components/crud/DataTable';

test('renders table with data', () => {
  const data = [{ id: '1', name: 'Test' }];
  const columns = [{ key: 'name', label: 'Name' }];
  
  render(<DataTable data={data} columns={columns} />);
  
  expect(screen.getByText('Test')).toBeInTheDocument();
});
```

---

## Performance Tips

1. **Memoize components**
   ```typescript
   export const DataTable = React.memo(({ data, columns }) => {...});
   ```

2. **Use useCallback for handlers**
   ```typescript
   const handleCreate = useCallback(async (data) => {...}, []);
   ```

3. **Implement pagination**
   ```typescript
   const { projects, pagination } = useProjects(page, 50);
   ```

4. **Add error boundaries**
   ```typescript
   <ErrorBoundary>
     <DataTable {...props} />
   </ErrorBoundary>
   ```

---

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

---

## Status

✅ **Phase 8 - Frontend Integration Started**

- [x] Custom hooks for API
- [x] Reusable components
- [x] CRUD pages (Users, Projects, Evaluations)
- [ ] Authentication flow
- [ ] Dashboard layout
- [ ] Testing
- [ ] Performance optimization

---

**Last Updated**: 2026-04-07  
**Status**: In Development

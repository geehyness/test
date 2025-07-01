#!/usr/bin/env bash
#
# dynamic‐scaffold.sh — bootstrap a DRY Next.js App Router CRUD panel
# Run this INSIDE an empty Next.js (13+) “app”‐directory project.

set -euo pipefail

# 1. Define your resources (kebab-case = route key)
ENTITIES=(
  tenants domains users roles permissions customers categories foods tables
  orders payments expenses suppliers purchases stocks store-timings coupons
  reviews faqs invoices payrolls menus administrators announcements settings
  carts delivery-personnels wallets notifications events gateways recipes
  daily-summaries messages currencies taxes tenant-settings
)

echo "📦 Installing deps…"
npm install axios @tanstack/react-query

echo "🗂️  Creating folder structure…"
mkdir -p app/{config,lib,components}
mkdir -p app/[resource]/[id]

# 2. app/config/entities.ts — resource metadata stub
cat > app/config/entities.ts << 'EOF'
export interface EntityConfig {
  label: string
  fields: string[]
}

export const entities: Record<string, EntityConfig> = {
$(for e in "${ENTITIES[@]}"; do
    lbl=$(echo "$e" | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++){$i=toupper(substr($i,1,1)) substr($i,2)}}1')
    echo "  \"$e\": { label: \"$lbl\", fields: [] },"
  done)
}
EOF

# 3. app/lib/api.ts — axios instance
cat > app/lib/api.ts << 'EOF'
import axios from 'axios'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  withCredentials: true,
})
EOF

# 4. app/components/DataTable.tsx — generic table
cat > app/components/DataTable.tsx << 'EOF'
'use client'
import React from 'react'

export default function DataTable({
  columns,
  data,
}: {
  columns: string[]
  data: any[]
}) {
  return (
    <table className="min-w-full bg-white shadow rounded overflow-hidden">
      <thead className="bg-gray-100">
        <tr>
          {columns.map((c) => (
            <th key={c} className="px-4 py-2 text-left">{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, idx) => (
          <tr key={idx} className="border-t">
            {columns.map((c) => (
              <td key={c} className="px-4 py-2">{String(row[c] ?? '')}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
EOF

# 5. app/components/CRUDForm.tsx — generic create/edit form
cat > app/components/CRUDForm.tsx << 'EOF'
'use client'
import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { api } from '../lib/api'

export default function CRUDForm({
  entity,
  fields,
  initialData = {},
}: {
  entity: string
  fields: string[]
  initialData?: Record<string, any>
}) {
  const router = useRouter()
  const params = useParams()
  const isEdit = Boolean(params.id)
  const [form, setForm] = useState<Record<string, any>>({
    ...initialData,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isEdit) {
      await api.put(\`/\${entity}/\${params.id}\`, form)
    } else {
      await api.post(\`/\${entity}\`, form)
    }
    router.push(\`/\${entity}\`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      {fields.length === 0 && (
        <p className="text-gray-500">
          No fields defined—add them in app/config/entities.ts
        </p>
      )}
      {fields.map((f) => (
        <div key={f}>
          <label className="block mb-1 capitalize">{f.replace(/_/g,' ')}</label>
          <input
            name={f}
            defaultValue={initialData[f] ?? ''}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
      ))}
      <button
        type="submit"
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        {isEdit ? 'Update' : 'Create'} {entity.replace(/-/g,' ')}
      </button>
    </form>
  )
}
EOF

# 6. app/layout.tsx — global layout + sidebar
cat > app/layout.tsx << 'EOF'
import React from 'react'
import Link from 'next/link'
import './globals.css'
import { entities } from './config/entities'

export const metadata = {
  title: 'Resto Admin',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const resources = Object.keys(entities)
  return (
    <html lang="en">
      <body className="flex h-screen">
        <nav className="w-64 bg-gray-800 text-white p-4 overflow-auto">
          <h2 className="text-2xl mb-6">Resto Admin</h2>
          <ul>
            {resources.map((r) => (
              <li key={r} className="mb-2">
                <Link href={'/' + r}>
                  <span className="hover:text-yellow-300 capitalize">
                    {entities[r].label}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="flex-1 bg-gray-100 p-6 overflow-auto">{children}</main>
      </body>
    </html>
  )
}
EOF

# 7. app/[resource]/page.tsx — dynamic list view
cat > app/[resource]/page.tsx << 'EOF'
'use client'
import React from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import DataTable from '../components/DataTable'
import { entities } from '../config/entities'

export default function ResourceListPage() {
  const params = useParams()
  const resource = params.resource!
  const cfg = entities[resource]
  if (!cfg) return <p>Unknown resource: {resource}</p>

  const { data, isLoading, error } = useQuery([resource], () =>
    api.get(\`/\${resource}\`).then((r) => r.data)
  )

  if (isLoading) return <p>Loading {cfg.label}…</p>
  if (error) return <p>Error loading {cfg.label}</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl">{cfg.label}</h1>
      <DataTable columns={cfg.fields} data={data || []} />
    </div>
  )
}
EOF

# 8. app/[resource]/[id]/page.tsx — dynamic detail/edit
cat > app/[resource]/[id]/page.tsx << 'EOF'
'use client'
import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import CRUDForm from '../../components/CRUDForm'
import { entities } from '../../config/entities'

export default function ResourceDetailPage() {
  const params = useParams()
  const resource = params.resource!
  const id = params.id!
  const cfg = entities[resource]
  const [initialData, setInitial] = useState<Record<string, any>>({})

  const { data, isLoading } = useQuery([resource, id], () =>
    api.get(\`/\${resource}/\${id}\`).then((r) => r.data), {
      onSuccess: (d) => setInitial(d),
    }
  )

  if (isLoading) return <p>Loading…</p>
  if (!cfg) return <p>Unknown resource: {resource}</p>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl">
        {cfg.label} &ndash; Edit #{id}
      </h1>
      <CRUDForm
        entity={resource}
        fields={cfg.fields}
        initialData={initialData}
      />
    </div>
  )
}
EOF

echo "✅ Done!
– Define your resource fields in app/config/entities.ts
– Run 'npm run dev' and navigate to '/users', '/orders', etc.
– You now have a DRY, single‐path CRUD UI—no 73 files to maintain!"

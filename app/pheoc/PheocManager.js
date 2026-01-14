'use client'

import { useState } from 'react'
import PheocForm from './PheocForm'
import PheocHistory from './PheocHistory'

export default function PheocManager({ reports }) {
    const [editingReport, setEditingReport] = useState(null)

    const handleEdit = (report) => {
        setEditingReport(report)
        // Scroll to top to see form
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleCancelEdit = () => {
        setEditingReport(null)
    }

    const handleSuccess = () => {
        setEditingReport(null)
    }

    return (
        <div>
            <PheocForm
                initialData={editingReport}
                onCancel={handleCancelEdit}
                onSuccess={handleSuccess}
            />

            <PheocHistory
                reports={reports}
                onEdit={handleEdit}
            />
        </div>
    )
}

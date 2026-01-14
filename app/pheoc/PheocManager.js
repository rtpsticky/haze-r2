'use client'
import { useState } from 'react'
import PheocForm from './PheocForm'
import PheocHistory from './PheocHistory'
import Modal from './Modal'

export default function PheocManager({ reports }) {
    const [editingReport, setEditingReport] = useState(null)

    const handleEdit = (report) => {
        setEditingReport(report)
    }

    const handleCancelEdit = () => {
        setEditingReport(null)
    }

    const handleSuccess = () => {
        setEditingReport(null)
    }

    return (
        <div>
            {/* Create Form - Always visible */}
            <PheocForm
                initialData={null}
                idPrefix="create-"
            />

            {/* History List */}
            <PheocHistory
                reports={reports}
                onEdit={handleEdit}
            />

            {/* Edit Modal */}
            <Modal
                isOpen={!!editingReport}
                onClose={handleCancelEdit}
                title=""
            >
                {editingReport && (
                    <PheocForm
                        initialData={editingReport}
                        onCancel={handleCancelEdit}
                        onSuccess={handleSuccess}
                        idPrefix="edit-"
                        className="shadow-none border-0 mb-0 !mb-0"
                    />
                )}
            </Modal>
        </div>
    )
}

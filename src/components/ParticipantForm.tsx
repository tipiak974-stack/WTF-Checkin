import { useState, type FormEvent } from 'react'
import { PARTICIPANT_STATUSES, type ParticipantStatus } from '../types'

export interface ParticipantFormValues {
  first_name: string
  last_name: string
  status: ParticipantStatus
  tshirt_size: string | null
}

export function ParticipantForm({
  onSubmit,
  submitLabel,
  submitting,
}: {
  onSubmit: (values: ParticipantFormValues) => void | Promise<void>
  submitLabel: string
  submitting?: boolean
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [status, setStatus] = useState<ParticipantStatus>('Participant')
  const [size, setSize] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!firstName.trim() || !lastName.trim()) return

    await onSubmit({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      status,
      tshirt_size: size.trim() ? size.trim() : null,
    })

    setFirstName('')
    setLastName('')
    setStatus('Participant')
    setSize('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
      <input
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="Prénom"
        required
        className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
      />
      <input
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        placeholder="Nom"
        required
        className="min-w-0 flex-1 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as ParticipantStatus)}
        className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus:border-neutral-500 focus:outline-none"
      >
        {PARTICIPANT_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input
        value={size}
        onChange={(e) => setSize(e.target.value)}
        list="tshirt-sizes"
        placeholder="Taille"
        className="w-24 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none"
      />
      <datalist id="tshirt-sizes">
        <option value="XS" />
        <option value="S" />
        <option value="M" />
        <option value="L" />
        <option value="XL" />
        <option value="XXL" />
      </datalist>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-white disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </form>
  )
}

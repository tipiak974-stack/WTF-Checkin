import { useState, type FormEvent } from 'react'
import { PARTICIPANT_STATUSES, type ParticipantStatus } from '../types'

export interface ParticipantFormValues {
  first_name: string
  last_name: string
  status: ParticipantStatus
  tshirt_size: string | null
}

const fieldClass =
  'min-w-0 rounded-xl border-2 border-line bg-surface px-3 py-3 text-base text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none'

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
        className={`flex-1 ${fieldClass}`}
      />
      <input
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        placeholder="Nom"
        required
        className={`flex-1 ${fieldClass}`}
      />
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value as ParticipantStatus)}
        className={fieldClass}
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
        className={`w-24 ${fieldClass}`}
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
        className="rounded-xl bg-brand-600 px-5 py-3 text-base font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
      >
        {submitLabel}
      </button>
    </form>
  )
}

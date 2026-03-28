import { useState } from 'react'
import { Button, Checkbox, Popover, PopoverContent } from '@carbon/react'
import { Filter } from '@carbon/icons-react'

interface FilterDropdownProps {
  label: string
  options: string[]
  selected: string[]
  onApply: (selected: string[]) => void
}

export function FilterDropdown({ label, options, selected, onApply }: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string[]>(selected)

  const handleOpen = () => {
    setDraft(selected)
    setOpen(true)
  }

  const handleApply = () => {
    onApply(draft)
    setOpen(false)
  }

  const handleReset = () => {
    setDraft([])
  }

  const toggleOption = (opt: string, checked: boolean) => {
    setDraft(prev =>
      checked ? [...prev, opt] : prev.filter(v => v !== opt)
    )
  }

  const isActive = selected.length > 0

  return (
    <Popover
      open={open}
      align="bottom-left"
      onRequestClose={() => setOpen(false)}
      style={{ zIndex: 9000 }}
    >
      <Button
        kind="ghost"
        size="sm"
        renderIcon={Filter}
        iconDescription={`篩選 ${label}`}
        hasIconOnly
        onClick={handleOpen}
        style={{ color: isActive ? 'var(--cds-interactive)' : undefined }}
      />
      <PopoverContent>
        <div>
          <div style={{ padding: '0.75rem 1rem 0.5rem' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--cds-text-secondary)', marginBottom: '0.75rem' }}>
              Filter options
            </p>
            <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {options.map(opt => (
                <Checkbox
                  key={opt}
                  id={`${label}-${opt}`}
                  labelText={opt}
                  checked={draft.includes(opt)}
                  onChange={(_: unknown, { checked }: { checked: boolean }) => toggleOption(opt, checked)}
                />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', borderTop: '1px solid var(--cds-border-subtle)' }}>
            <Button
              kind="secondary"
              size="sm"
              onClick={handleReset}
              style={{ flex: 1, backgroundColor: '#262626', color: '#fff', borderRight: '1px solid #393939' }}
            >
              Reset filters
            </Button>
            <Button
              kind="primary"
              size="sm"
              onClick={handleApply}
              style={{ flex: 1 }}
            >
              Apply filter
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

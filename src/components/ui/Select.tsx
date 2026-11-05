import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'

export interface SelectOption {
  label: string
  value: string
}

export function Select({ value, onValueChange, options, placeholder }: {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger className="inline-flex h-10 min-w-32 items-center justify-between gap-2 rounded-lg border border-border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary/10">
        <SelectPrimitive.Value placeholder={placeholder} />
        <SelectPrimitive.Icon><ChevronDown size={15} className="text-muted-foreground" /></SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content position="popper" sideOffset={5} className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-border bg-white p-1 shadow-lg">
          <SelectPrimitive.Viewport>
            {options.map((option) => (
              <SelectPrimitive.Item key={option.value} value={option.value} className="relative flex cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-8 text-sm outline-none data-[highlighted]:bg-muted">
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                <SelectPrimitive.ItemIndicator className="absolute right-2"><Check size={14} /></SelectPrimitive.ItemIndicator>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  )
}

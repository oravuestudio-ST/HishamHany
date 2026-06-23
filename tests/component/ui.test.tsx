import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

describe('ui/Button', () => {
  it('renders a native button by default and handles clicks', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Save</Button>)
    const btn = screen.getByRole('button', { name: 'Save' })
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('applies variant + size utility classes', () => {
    render(
      <Button variant="outline" size="lg">
        Outline
      </Button>,
    )
    const btn = screen.getByRole('button', { name: 'Outline' })
    expect(btn.className).toContain('border')
    expect(btn.className).toContain('h-11')
  })

  it('renders as a child element when asChild is set', () => {
    render(
      <Button asChild>
        <a href="/x">Link button</a>
      </Button>,
    )
    expect(screen.getByRole('link', { name: 'Link button' })).toBeInTheDocument()
  })

  it('is non-interactive when disabled', () => {
    render(<Button disabled>Nope</Button>)
    expect(screen.getByRole('button', { name: 'Nope' })).toBeDisabled()
  })
})

describe('ui/Input', () => {
  it('forwards type and value, and reflects typed input', () => {
    render(<Input type="email" placeholder="you@example.com" />)
    const input = screen.getByPlaceholderText('you@example.com') as HTMLInputElement
    expect(input.type).toBe('email')
    fireEvent.change(input, { target: { value: 'a@b.com' } })
    expect(input.value).toBe('a@b.com')
  })

  it('merges custom classNames with the base styles', () => {
    render(<Input className="custom-x" placeholder="p" />)
    expect(screen.getByPlaceholderText('p').className).toContain('custom-x')
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    context: () => ({ revert: vi.fn() }),
    from: vi.fn(),
    fromTo: vi.fn(),
    to: vi.fn(),
    quickTo: () => vi.fn(),
    set: vi.fn(),
    utils: { toArray: () => [], clamp: () => 0 },
  },
}))
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { create: vi.fn() } }))

import ContactForm from '@/components/contact/ContactForm'

const fetchMock = vi.fn()
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

const name = () => screen.getByLabelText('Your Name')
const email = () => screen.getByLabelText('Email Address')
const message = () => screen.getByLabelText('Tell me about your vision')

describe('Contact form field states', () => {
  it('lets browsers autofill name and email', () => {
    render(<ContactForm />)
    expect(name()).toHaveAttribute('autocomplete', 'name')
    expect(email()).toHaveAttribute('autocomplete', 'email')
  })

  it('flags an empty required field when the visitor leaves it', () => {
    render(<ContactForm />)
    fireEvent.blur(name())
    expect(name()).toHaveAttribute('aria-invalid', 'true')
    const hint = document.getElementById(name().getAttribute('aria-describedby')!)
    expect(hint).toHaveTextContent(/add your name/i)
  })

  it('flags an incomplete email, and clears the flag once it is fixed', () => {
    render(<ContactForm />)
    fireEvent.change(email(), { target: { value: 'jane@' } })
    fireEvent.blur(email())
    expect(email()).toHaveAttribute('aria-invalid', 'true')

    fireEvent.change(email(), { target: { value: 'jane@acme.com' } })
    expect(email()).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('does not scold a field the visitor has not reached yet', () => {
    render(<ContactForm />)
    expect(message()).not.toHaveAttribute('aria-invalid', 'true')
  })

  it('blocks an incomplete submission, shows every problem and focuses the first', () => {
    render(<ContactForm />)
    fireEvent.click(screen.getByRole('button', { name: /send inquiry/i }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(name()).toHaveAttribute('aria-invalid', 'true')
    expect(message()).toHaveAttribute('aria-invalid', 'true')
    expect(document.activeElement).toBe(name())
  })

  it('announces success and moves focus to it', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    render(<ContactForm />)
    fireEvent.change(name(), { target: { value: 'Jane' } })
    fireEvent.change(email(), { target: { value: 'jane@acme.com' } })
    fireEvent.change(message(), { target: { value: 'A campaign' } })
    fireEvent.click(screen.getByRole('button', { name: /send inquiry/i }))

    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent(/message received/i)
    await waitFor(() => expect(status.contains(document.activeElement)).toBe(true))
  })
})

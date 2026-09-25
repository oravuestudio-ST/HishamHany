import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Skip the scroll-trigger animation setup; exercise the form's data flow only.
vi.mock('gsap', () => ({
  gsap: {
    registerPlugin: vi.fn(),
    context: () => ({ revert: vi.fn() }),
    from: vi.fn(),
    fromTo: vi.fn(),
    to: vi.fn(),
    utils: { toArray: () => [] },
  },
}))
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: { create: vi.fn() } }))

import ContactForm from '@/components/contact/ContactForm'
import { SITE } from '@/lib/site'

const fetchMock = vi.fn()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
})

function fillAndSubmit() {
  fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Jane' } })
  fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'jane@acme.com' } })
  fireEvent.change(screen.getByLabelText('Tell me about your vision'), {
    target: { value: 'A fashion campaign' },
  })
  fireEvent.click(screen.getByRole('button', { name: /Send Inquiry/i }))
}

describe('Contact form honeypot', () => {
  it('renders a "website" trap field that is hidden from people and keyboard users', () => {
    const { container } = render(<ContactForm />)
    const trap = container.querySelector('input[name="website"]') as HTMLInputElement | null
    expect(trap).not.toBeNull()
    expect(trap!.tabIndex).toBe(-1)
    expect(trap!.getAttribute('autocomplete')).toBe('off')
    expect(trap!.closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('submits the trap value alongside the real fields', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    render(<ContactForm />)
    fillAndSubmit()
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(sent).toHaveProperty('website', '')
  })
})

describe('Contact form', () => {
  it('posts the form and shows a success state on 200', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    render(<ContactForm />)
    fillAndSubmit()

    await waitFor(() => expect(screen.getByText('Message received.')).toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledWith('/api/contact', expect.objectContaining({ method: 'POST' }))
  })

  it('surfaces the server error message on a non-OK response', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'Too many requests' }) })
    render(<ContactForm />)
    fillAndSubmit()

    await waitFor(() => expect(screen.getByText('Too many requests')).toBeInTheDocument())
  })

  it('on a network failure, says so plainly and keeps what was typed', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))
    render(<ContactForm />)
    fillAndSubmit()

    await waitFor(() => expect(screen.getByText(/didn.t go through/i)).toBeInTheDocument())
    expect(screen.getByLabelText('Your Name')).toHaveValue('Jane')
    expect(screen.getByLabelText('Tell me about your vision')).toHaveValue('A fashion campaign')
  })

  it('on a server failure, offers email and WhatsApp prefilled with the message', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({ error: 'Failed to send message.' }) })
    render(<ContactForm />)
    fillAndSubmit()

    await waitFor(() => expect(screen.getByText(/didn.t go through/i)).toBeInTheDocument())
    const email = screen.getByRole('link', { name: /email it/i })
    expect(email.getAttribute('href')).toMatch(new RegExp(`^mailto:${SITE.email}\\?`))
    expect(email.getAttribute('href')).toContain(encodeURIComponent('A fashion campaign'))
    const whatsapp = screen.getByRole('link', { name: /whatsapp/i })
    expect(whatsapp.getAttribute('href')).toContain(`${SITE.social.whatsapp}?text=`)
  })
})

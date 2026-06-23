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

import Contact from '@/components/Contact'

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

describe('Contact form', () => {
  it('posts the form and shows a success state on 200', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
    render(<Contact />)
    fillAndSubmit()

    await waitFor(() => expect(screen.getByText('Message received.')).toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledWith('/api/contact', expect.objectContaining({ method: 'POST' }))
  })

  it('surfaces the server error message on a non-OK response', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: 'Too many requests' }) })
    render(<Contact />)
    fillAndSubmit()

    await waitFor(() => expect(screen.getByText('Too many requests')).toBeInTheDocument())
  })

  it('shows a network-error message when fetch rejects', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))
    render(<Contact />)
    fillAndSubmit()

    await waitFor(() => expect(screen.getByText(/Network error/i)).toBeInTheDocument())
  })
})

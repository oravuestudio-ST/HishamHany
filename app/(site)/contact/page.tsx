import type { Metadata } from 'next'
import PageHeader from '@/components/PageHeader'
import ContactForm from '@/components/contact/ContactForm'
import SocialIcon from '@/components/SocialIcons'
import { SITE, SOCIAL_LINKS } from '@/lib/site'

export const metadata: Metadata = {
  title: `Contact — ${SITE.name}`,
  description:
    'Start a project — commissions for fashion, automotive, commercial, and editorial photography. Replies within 24 hours, Cairo time.',
  alternates: { canonical: '/contact' },
}

/**
 * The luxury contact experience: one oversized invitation, a minimal form,
 * and every direct channel beside it — with the response promise stated
 * plainly. No friction, no widgets.
 */
export default function ContactPage() {
  return (
    <main className="min-h-screen bg-bg text-fg">
      <PageHeader
        eyebrow="Contact — Cairo, Egypt"
        title="Start a"
        accent="project"
        lead="Tell me what the images need to do — campaign, launch, story, or portrait. Replies within 24 hours, Cairo time."
      />

      <section className="px-6 md:px-12 pb-section-sm">
        <div className="grid md:grid-cols-12 gap-x-8 gap-y-16">
          {/* Form */}
          <div className="md:col-span-7">
            <ContactForm />
          </div>

          {/* Direct channels */}
          <aside className="md:col-span-4 md:col-start-9">
            <div className="border-t border-fg/10 pt-6">
              <p className="font-sans text-label-xs uppercase text-muted/40 mb-4">Direct</p>
              <a
                href={`mailto:${SITE.email}`}
                data-cursor="Email"
                className="link-underline font-sans text-body-sm text-fg/85 hover:text-fg transition-colors duration-300 break-all"
              >
                {SITE.email}
              </a>
              <p className="mt-4">
                <a href={`tel:${SITE.phone}`} className="link-underline font-sans text-body-sm text-fg/85 hover:text-fg transition-colors duration-300">
                  +20 111 280 5807
                </a>
              </p>
            </div>

            <div className="border-t border-fg/10 pt-6 mt-10">
              <p className="font-sans text-label-xs uppercase text-muted/40 mb-4">Elsewhere</p>
              <ul className="flex items-center gap-5">
                {SOCIAL_LINKS.map(({ label, href, external }) => (
                  <li key={label}>
                    <a
                      href={href}
                      aria-label={label}
                      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="text-muted/60 hover:text-fg transition-colors duration-200 inline-block"
                    >
                      <SocialIcon label={label} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-fg/10 pt-6 mt-10">
              <p className="font-sans text-label-xs uppercase text-muted/40 mb-4">Practical</p>
              <ul className="space-y-3 font-sans text-body-sm text-fg/75">
                <li>Based in Cairo — worldwide by commission</li>
                <li>Replies within 24 hours, Cairo time</li>
                <li>Proposals are tailored; no fixed packages</li>
              </ul>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

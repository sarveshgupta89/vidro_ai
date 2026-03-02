import React from 'react';

const Section = ({ num, title, children }: { num?: string; title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold text-white mb-3">
      {num && <span className="text-indigo-400 mr-1">{num}.</span>}{title}
    </h2>
    <div className="text-gray-400 text-sm leading-relaxed space-y-3">{children}</div>
  </div>
);

const SubSection = ({ num, title, children }: { num: string; title?: string; children: React.ReactNode }) => (
  <div className="mt-3">
    <p className="text-gray-300 font-medium text-sm mb-1">{num} {title}</p>
    <p className="text-gray-400 text-sm leading-relaxed">{children}</p>
  </div>
);

export const TermsAndConditions = () => (
  <div className="max-w-3xl mx-auto pb-16">
    <h1 className="text-3xl font-bold text-white mb-2">Terms &amp; Conditions</h1>
    <p className="text-sm text-gray-500 mb-8">Last updated: 30 January 2026</p>

    <div className="text-gray-400 text-sm leading-relaxed mb-8">
      Welcome to Vidro AI ("we," "our," or "us"). By accessing or using our website and/or services, you agree to be bound by these Terms and Conditions ("Terms"). If you disagree with any part of these Terms, you may not use our services.
    </div>

    <Section num="1" title="Acceptance of Terms">
      <p>
        By creating an account or submitting your details for video generation and using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms, as well as our Privacy Policy.
      </p>
    </Section>

    <Section num="2" title="Description of Service">
      <p>
        Vidro AI provides an AI-powered video generation service. Users can log in, upload product images, and allow us to scrape their website to identify brand values and target audience information. Based on this data, we generate AI videos for the user's brand.
      </p>
    </Section>

    <Section num="3" title="User Accounts">
      <SubSection num="3.1">
        You must create an account to use our services. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
      </SubSection>
      <SubSection num="3.2">
        You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
      </SubSection>
    </Section>

    <Section num="4" title="User Content and Rights">
      <SubSection num="4.1">
        By uploading images and allowing us to scrape your website, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display this content solely for the purpose of providing our services to you.
      </SubSection>
      <SubSection num="4.2">
        You represent and warrant that you have all necessary rights to the content you provide and that it does not infringe on any third-party rights.
      </SubSection>
    </Section>

    <Section num="5" title="Intellectual Property">
      <SubSection num="5.1">
        The AI-generated videos we create are licensed to you for your use. You may not sell, sublicense, or redistribute these videos without our express permission.
      </SubSection>
      <SubSection num="5.2">
        Our website, logo, and service are protected by copyright, trademark, and other laws. You may not use our trademarks or service marks without our prior written consent.
      </SubSection>
    </Section>

    <Section num="6" title="Prohibited Uses">
      <p>You agree not to use Vidro AI for any purpose that:</p>
      <ul className="space-y-1.5 mt-2">
        {[
          'Is unlawful, harmful, threatening, abusive, harassing, tortious, defamatory, or otherwise objectionable',
          'Infringes any patent, trademark, trade secret, copyright, or other proprietary rights of any party',
          'Involves uploading or generating content depicting minors in any inappropriate manner',
          'Attempts to gain unauthorized access to our systems or networks',
          'Involves automated scraping of our platform without prior written consent',
        ].map(item => (
          <li key={item} className="flex items-start gap-2 text-gray-400 text-sm">
            <span className="text-indigo-400 mt-0.5 shrink-0">›</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Section>

    <Section num="7" title="Credits and Payments">
      <SubSection num="7.1">
        Our services operate on a credit-based system. Credits are purchased in advance and deducted per video generated. Credits are non-refundable once consumed.
      </SubSection>
      <SubSection num="7.2">
        All payments are processed securely through Stripe. We do not store your payment card details. By purchasing credits, you agree to Stripe's Terms of Service.
      </SubSection>
      <SubSection num="7.3">
        We reserve the right to change credit pricing at any time. Existing unused credits will not be affected by price changes.
      </SubSection>
    </Section>

    <Section num="8" title="Disclaimer of Warranties">
      <p>
        Our services are provided on an "as is" and "as available" basis without any warranties of any kind, either express or implied. We do not warrant that our services will be uninterrupted, error-free, or free of viruses or other harmful components.
      </p>
    </Section>

    <Section num="9" title="Limitation of Liability">
      <p>
        To the fullest extent permitted by applicable law, Vidro AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses resulting from your use of or inability to use our services.
      </p>
    </Section>

    <Section num="10" title="Changes to Terms">
      <p>
        We reserve the right to modify these Terms at any time. We will provide notice of significant changes by updating the "Last updated" date at the top of these Terms. Your continued use of our services after such modifications constitutes your acceptance of the revised Terms.
      </p>
    </Section>

    <Section num="11" title="Governing Law">
      <p>
        These Terms shall be governed by and construed in accordance with applicable laws, without regard to its conflict of law provisions.
      </p>
    </Section>

    <Section num="12" title="Contact Us">
      <p>
        If you have any questions about these Terms, please contact us via the Help page or at support@vidro.ai.
      </p>
    </Section>
  </div>
);

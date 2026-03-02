import React from 'react';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold text-white mb-3">{title}</h2>
    <div className="text-gray-400 text-sm leading-relaxed space-y-3">{children}</div>
  </div>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-1.5 mt-2">
    {items.map(item => (
      <li key={item} className="flex items-start gap-2">
        <span className="text-indigo-400 mt-0.5">›</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export const PrivacyPolicy = () => (
  <div className="max-w-3xl mx-auto pb-16">
    <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
    <p className="text-sm text-gray-500 mb-8">This policy is effective as of 15 October 2025 and was last updated on 30 January 2026.</p>

    <div className="text-gray-400 text-sm leading-relaxed mb-8">
      Your privacy is important to us. It is Vidro AI's policy to respect your privacy and comply with any applicable law and regulation regarding any personal information we may collect about you, including across our website and other sites we own and operate.
    </div>

    <Section title="Information We Collect">
      <p>
        Information we collect includes both information you knowingly and actively provide us when using or participating in any of our services and promotions, and any information automatically sent by your devices in the course of accessing our products and services.
      </p>
    </Section>

    <Section title="Log Data">
      <p>
        When you visit our website, our servers may automatically log the standard data provided by your web browser. It may include your device's Internet Protocol (IP) address, your browser type and version, the pages you visit, the time and date of your visit, the time spent on each page, and other details about your visit, and technical details that occur in conjunction with any errors you may encounter.
      </p>
      <p>
        Please be aware that while this information may not be personally identifying by itself, it may be possible to combine it with other data to personally identify individual persons.
      </p>
    </Section>

    <Section title="Personal Information">
      <p>We may ask for personal information which may include one or more of the following:</p>
      <BulletList items={['Name', 'Email', 'Social media profiles', 'Date of birth', 'Phone/mobile number', 'Home/mailing address']} />
    </Section>

    <Section title="Legitimate Reasons for Processing Your Personal Information">
      <p>
        We only collect and use your personal information when we have a legitimate reason for doing so. In which instance, we only collect personal information that is reasonably necessary to provide our services to you.
      </p>
    </Section>

    <Section title="Collection and Use of Information">
      <p>
        We may collect personal information from you when you do any of the following on our website:
      </p>
      <BulletList items={[
        'Register for an account',
        'Purchase a subscription or credits',
        'Use a mobile device or web browser to access our content',
        'Contact us via email, social media, or any similar technology',
        'Mention us on social media',
      ]} />
      <p>
        We may collect, hold, use, and disclose information for the following purposes, and personal information will not be further processed in a manner that is incompatible with these purposes:
      </p>
      <BulletList items={[
        "to provide you with our platform's core features and services",
        'to enable you to access and use our website and associated applications',
        'to process payments for credits and subscriptions',
        'to send you technical notices, updates, security alerts, and support messages',
        'to comply with our legal obligations and resolve any disputes that we may have',
      ]} />
    </Section>

    <Section title="Security of Your Personal Information">
      <p>
        When we collect and process personal information, and while we retain this information, we will protect it within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use, or modification.
      </p>
      <p>
        Although we will do our best to protect the personal information you provide to us, we advise that no method of electronic transmission or storage is 100% secure, and no one can guarantee absolute data security.
      </p>
    </Section>

    <Section title="How Long We Keep Your Personal Information">
      <p>
        We keep your personal information only for as long as we need to. This time period may depend on what we are using your information for, in accordance with this privacy policy. For example, if you have provided us with personal information as part of creating an account with us, we may retain this information for as long as your account exists plus a reasonable period of time after that to facilitate handling any issues.
      </p>
      <p>
        If you no longer require us to retain your personal information, please contact us and we will delete it within a reasonable time.
      </p>
    </Section>

    <Section title="Children's Privacy">
      <p>
        We do not aim any of our products or services directly at children under the age of 13, and we do not knowingly collect personal information about children under 13.
      </p>
    </Section>

    <Section title="Disclosure of Personal Information to Third Parties">
      <p>We may disclose personal information to:</p>
      <BulletList items={[
        'a parent, subsidiary, or affiliate of our company',
        'third-party service providers for the purpose of enabling them to provide their services, including (without limitation) IT service providers, data storage, hosting and server providers, analytics, error loggers, payment processors, and customer relationship management tools',
        'our employees, contractors, and/or related entities',
        'credit reporting agencies, courts, tribunals, and regulatory authorities, in the event you fail to pay for goods or services we have provided to you',
        'courts, tribunals, regulatory authorities, and law enforcement officers, as required by law',
      ]} />
    </Section>

    <Section title="Your Rights and Controlling Your Personal Information">
      <p>
        You always retain the right to withhold personal information from us, with the understanding that your experience of our website may be affected. We will not discriminate against you for exercising any of your rights over your personal information.
      </p>
      <p>
        If you have previously agreed to us using your personal information for direct marketing purposes, you may change your mind at any time. We will provide you with the ability to unsubscribe from our email-database or opt out of communications.
      </p>
    </Section>

    <Section title="Contact Us">
      <p>
        For any questions or concerns regarding your privacy, you may contact us using the Help page or via email at support@vidro.ai.
      </p>
    </Section>
  </div>
);

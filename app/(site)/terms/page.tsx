import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use | Practera',
  description: 'Terms of Use for Practera ProposalHub',
}

export default function TermsOfUse() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Terms of Use</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-700">
            By accessing and using this platform, you accept and agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. Use of Services</h2>
          <p className="text-gray-700">
            You agree to:
          </p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account</li>
            <li>Use the services in compliance with applicable laws</li>
            <li>Not engage in any unauthorized or fraudulent activities</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Intellectual Property</h2>
          <p className="text-gray-700">
            All content, features, and functionality of this platform are owned by Practera and are protected by international copyright, trademark, and other intellectual property laws.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. User Content</h2>
          <p className="text-gray-700">
            By submitting content to our platform, you:
          </p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            <li>Grant us the right to use and process the content for service delivery</li>
            <li>Confirm you have the right to share such content</li>
            <li>Accept responsibility for the content you submit</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Limitation of Liability</h2>
          <p className="text-gray-700">
            Practera shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">6. Modifications</h2>
          <p className="text-gray-700">
            We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the modified terms.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">7. Contact Information</h2>
          <p className="text-gray-700">
            For questions about these Terms of Use, please contact us at:
            <br />
            Email: wes@practera.com
          </p>
        </section>

        <section>
          <p className="text-sm text-gray-500 mt-8">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </section>
      </div>
    </div>
  )
} 
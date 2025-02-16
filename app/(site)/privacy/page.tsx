import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Practera',
  description: 'Privacy Policy for Practera ProposalHub',
}

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
          <p className="text-gray-700">
            We collect information that you provide directly to us, including but not limited to:
          </p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            <li>Name and contact information</li>
            <li>Account credentials</li>
            <li>Proposal and project information</li>
            <li>Communication preferences</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
          <p className="text-gray-700">
            We use the collected information to:
          </p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            <li>Provide and maintain our services</li>
            <li>Process and manage proposals</li>
            <li>Communicate with you about our services</li>
            <li>Improve and optimize our platform</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">3. Information Sharing</h2>
          <p className="text-gray-700">
            We do not sell your personal information. We may share your information with:
          </p>
          <ul className="list-disc ml-6 mt-2 text-gray-700">
            <li>Service providers who assist in our operations</li>
            <li>Legal authorities when required by law</li>
            <li>Other parties with your explicit consent</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">4. Data Security</h2>
          <p className="text-gray-700">
            We implement appropriate security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">5. Contact Us</h2>
          <p className="text-gray-700">
            If you have any questions about this Privacy Policy, please contact us at:
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
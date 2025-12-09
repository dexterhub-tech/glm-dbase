import Header from "@/components/Header";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <h1 className="mb-8 text-3xl font-bold">Terms and Conditions</h1>

          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using the Gospel Labour Ministry (GLM) platform, you agree to be bound by these Terms and Conditions, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. If you do not agree with any of these terms, you are prohibited from using or accessing this platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">2. User Accounts</h2>
              <p>
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.
              </p>
              <p className="mt-2">
                You are responsible for safeguarding the password that you use to access the platform and for any activities or actions under your password. You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">3. Privacy Policy</h2>
              <p>
                Your use of the GLM platform is also governed by our Privacy Policy, which is incorporated by reference into these Terms and Conditions. By using this platform, you consent to the collection and use of information as detailed in our Privacy Policy.
              </p>
              <p className="mt-2">
                We respect your privacy and are committed to protecting personally identifiable information you may provide us through the platform. We have adopted appropriate data collection, storage, and processing practices to protect against unauthorized access, alteration, disclosure, or destruction of your personal information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">4. User Content</h2>
              <p>
                Our platform may allow you to post, link, store, share and otherwise make available certain information, text, graphics, or other material. You are responsible for the content that you post, including its legality, reliability, and appropriateness.
              </p>
              <p className="mt-2">
                By posting content, you grant us the right to use, modify, publicly perform, publicly display, reproduce, and distribute such content on and through the platform. You retain any and all of your rights to any content you submit, post, or display on or through the platform and you are responsible for protecting those rights.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">5. Prohibited Uses</h2>
              <p>
                You may use the GLM platform only for lawful purposes and in accordance with these Terms. You agree not to use the platform:
              </p>
              <ul className="list-disc pl-6 mt-2">
                <li>In any way that violates any applicable national or international law or regulation.</li>
                <li>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail", "chain letter," "spam," or any other similar solicitation.</li>
                <li>To impersonate or attempt to impersonate GLM, a GLM employee, another user, or any other person or entity.</li>
                <li>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the platform, or which may harm GLM or users of the platform or expose them to liability.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">6. Termination</h2>
              <p>
                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the platform will immediately cease.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">7. Changes to Terms</h2>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">8. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us at <a href="mailto:info@gospellabourministry.org" className="text-blue-600 hover:underline">info@gospellabourministry.org</a>.
              </p>
            </section>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;

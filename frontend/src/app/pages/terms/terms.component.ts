import { Component } from '@angular/core';

@Component({
  selector: 'app-terms',
  template: `
    <section class="page-header">
      <div class="container">
        <h1>Terms & Conditions</h1>
        <p>Last Updated: March 20, 2026</p>
      </div>
    </section>
    <div class="container py-5">
      <div class="glass-effect p-5 rounded-lg content-area">
        <h2>Part I: Terms and Conditions of Use</h2>

        <h3 class="mt-4">1. Legal Agreement</h3>
        <p>By accessing or using TroopersGears.com (the "Site"), you ("User" or "Customer") agree to be legally bound by these Terms and Conditions. If you do not agree, you must cease use of the Site immediately.</p>

        <h3 class="mt-4">2. Eligibility and Account Security</h3>
        <ul>
          <li>Age Requirement: Users must be at least 18 years of age to purchase specialized camping, survival, or tactical equipment.</li>
          <li>Account Responsibility: Users are responsible for maintaining the confidentiality of login credentials. Activity under a User account is the sole responsibility of the account holder.</li>
          <li>Verification: TroopersGears reserves the right to request proof of age or identity for high-value or restricted equipment orders.</li>
        </ul>

        <h3 class="mt-4">3. Prohibited Conduct and Anti-Cyberbullying</h3>
        <p>In compliance with the Jamaican Cybercrimes Act (2015), the following actions are strictly prohibited:</p>
        <ul>
          <li>Digital Harassment: Threatening, intimidating, or cyberbullying staff or other users.</li>
          <li>Malicious Communication: Defamatory, obscene, or disorder-causing content.</li>
          <li>System Interference: Bypassing security, SQL injection, or using bots to scrape inventory.</li>
          <li>Enforcement: Violations result in permanent bans, and evidence may be referred to the Jamaica Constabulary Force (CFCD).</li>
        </ul>

        <h3 class="mt-4">4. Sales, Returns, and Liability</h3>
        <ul>
          <li>Pricing: All prices are quoted in the currency displayed at checkout. We may cancel orders resulting from obvious pricing errors.</li>
          <li>Consumer Rights: Returns are accepted for defective goods or items not matching their professional description under Jamaica's Consumer Protection Act.</li>
          <li>Assumption of Risk: Camping and survival activities involve inherent risks. TroopersGears is not liable for injury, loss, or death resulting from misuse of equipment.</li>
        </ul>

        <h2 class="mt-5">Part II: Product Governance</h2>
        <h3 class="mt-4">5. Safety and Maintenance Responsibilities</h3>
        <ul>
          <li>Mandatory Inspection: Inspect all gear immediately upon delivery and before every use.</li>
          <li>Adherence to Guidelines: Use equipment strictly according to the manufacturer's manual.</li>
          <li>Professional Training: Certain equipment requires professional training. TroopersGears is a retailer, not a training entity.</li>
        </ul>

        <h3 class="mt-4">6. Prohibited Modifications</h3>
        <p>Users shall not modify, re-engineer, or repair equipment using non-authorized parts. Such action voids warranties and shifts liability to the User.</p>

        <h2 class="mt-5">Part III: Breach, Dispute Resolution, and Governing Law</h2>
        <h3 class="mt-4">7. Legal Consequences of Breach</h3>
        <ul>
          <li>Administrative Actions: Suspension of access and cancellation of pending orders if fraud is suspected.</li>
          <li>Criminal Prosecution: Cybercrime violations may be referred to the Jamaica Constabulary Force. Fraudulent chargebacks may be prosecuted under the Cybercrimes Act.</li>
          <li>Civil Litigation: We may pursue damages, technical repair costs, and legal fees. Users agree to indemnify TroopersGears for losses due to breach or unsafe use.</li>
        </ul>

        <h3 class="mt-4">8. Consumer Rights and Dispute Resolution</h3>
        <ul>
          <li>Sale of Goods Act: Goods are of merchantable quality. Defective products are eligible for refund or replacement per CAC guidelines.</li>
          <li>Right of Withdrawal: Transactions may be canceled within 14 days if required disclosures are not provided under the Electronic Transactions Act (2006).</li>
          <li>Arbitration: Prior to litigation, parties agree to attempt mediation through the Consumer Affairs Commission of Jamaica.</li>
        </ul>

        <h3 class="mt-4">9. Governing Law</h3>
        <p>These Terms are governed by the laws of Jamaica. Disputes are subject to the exclusive jurisdiction of Jamaican courts.</p>

        <p class="mt-4"><strong>Version ID:</strong> TG-TOS-2026-01</p>
      </div>
    </div>
  `,
  styles: [`
    .content-area { color: #333; line-height: 1.8; }
    h2 { color: var(--primary); margin-bottom: 1rem; border-bottom: 2px solid var(--border); padding-bottom: 0.5rem; }
    .py-5 { padding: 3rem 0; }
    .p-5 { padding: 2.5rem; }
  `]
})
export class TermsComponent {}

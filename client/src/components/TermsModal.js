import React, { useEffect, useRef } from "react";

function TermsModal({ open, onClose }) {
  const prevFocus = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    prevFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (modalRef.current) modalRef.current.focus();

    return () => {
      document.body.style.overflow = prev || "";
      if (prevFocus.current?.focus) prevFocus.current.focus();
    };
  }, [open]);

  if (!open) return null;

  const pStyle = "text-sm text-slate-600 leading-relaxed";
  const hStyle = "font-semibold text-slate-900 mt-4 mb-2";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-title"
    >
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative z-[10000] w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden outline-none"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 id="terms-title" className="text-lg font-bold text-slate-800">
            Terms &amp; Conditions and Privacy Policy
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Close Terms"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto bg-white">
          <p className="text-xs text-slate-500">
            Last Updated: November 26, 2025
          </p>
          <p className={pStyle}>
            These Terms and Conditions ("Terms," "Agreement") govern your access to and use of the web application Queue-Our-Code ("Service"), developed by the NexQ Team capstone project team ("Developers") at De La Salle University - Dasmariñas.
          </p>

          {/* === PART I: TERMS AND CONDITIONS === */}
          <h2 className="text-xl font-bold text-slate-800 pt-4 border-t border-slate-100">
            Part I: Terms and Conditions of Service
          </h2>

          {/* 1. Acceptance of Terms */}
          <div>
            <h4 className={hStyle}>1. Acceptance of Terms</h4>
            <p className={pStyle}>
              By accessing and using the Service, you confirm that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use the Service.
            </p>
          </div>

          {/* 2. Nature of the Service */}
          <div>
            <h4 className={hStyle}>2. Nature of the Service (Capstone Project & Queueing System)</h4>
            <ul className="list-disc ml-6 space-y-2">
              <li className={pStyle}>
                <strong>Educational Purpose:</strong> The Service is a university capstone project developed primarily for educational and demonstration purposes. It may not be fully optimized, bug-free, or intended for mission-critical use.
              </li>
              <li className={pStyle}>
                <strong>Functionality:</strong> The Service provides a digital, QR code-based queue management system designed to allow registered users to remotely queue for available rides within Star City amusement park.
              </li>
              <li className={pStyle}>
                <strong>Limited Availability:</strong> The Service may be taken down, modified, or terminated at any time, especially after the completion of the capstone project timeline, without prior notice.
              </li>
              <li className={pStyle}>
                <strong>Single-Day Use and Expiration:</strong> The Service is strictly valid for the date of your ticket purchase only. Your activated account and access to the digital queueing features will automatically expire and be deactivated when Star City concludes its standard operating hours for the day (e.g., 10:00 PM PHT).
              </li>
              <li className={pStyle}>
                <strong>Park Safety Requirements:</strong> Use of the Service does not grant automatic access to a ride. All users must still comply with the physical age, height, health, and safety restrictions mandated by Star City for each individual ride.
              </li>
            </ul>
          </div>

          {/* 3. User Obligations and Conduct */}
          <div>
            <h4 className={hStyle}>3. User Obligations and Conduct (Queue-Our-Code Rules)</h4>
            <p className={pStyle}>
              You agree to use the Service only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the Service.
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li className={pStyle}>
                Uploading or transmitting any data that contains viruses or other harmful code.
              </li>
              <li className={pStyle}>
                Attempting to gain unauthorized access to any part of the Service or its underlying systems.
              </li>
              <li className={pStyle}>
                Using the Service to generate spam or unsolicited advertising.
              </li>
              <li className={pStyle}>
                Misrepresenting your identity or affiliation with any person or entity.
              </li>
              <li className={pStyle}>
                <strong>Unauthorized Access and System Interference:</strong> You must not attempt to breach, interfere with, or disrupt the integrity or performance of the Service, its underlying code, or data. This includes using bots, automated scripts, or any method other than the official interface to queue. Any unauthorized activity or confirmed system abuse will result in the immediate and permanent termination of your account and QR code access without refund.
              </li>
              <li className={pStyle}>
                <strong>Queueing Limit:</strong> You acknowledge and agree that you are limited to a maximum of two (2) active ride queues at any given time. Attempting to circumvent this restriction may result in temporary suspension of your QR code access.
              </li>
              <li className={pStyle}>
                <strong>QR Code Responsibility:</strong> The generated QR code is your unique and sole identifier for the Service. You are responsible for ensuring its security and agree to bear all responsibility for any activities that occur under its use.
              </li>
              <li className={pStyle}>
                <strong>Physical Requirement:</strong> Entry into a queue requires you to physically present your activated QR code to the designated ride attendant for scanning. Digital queueing without physical scanning is not permitted.
              </li>
              <li className={pStyle}>
                <strong>Roaming and Timeliness:</strong> You have the freedom to roam the park while in a digital queue. However, you must return to the ride entrance before or during the expected return time listed on the Service.
              </li>
              <li className={pStyle}>
                <strong>Queue Absence Policy:</strong> If you are absent during your designated return window, your queue position will be temporarily pushed back to the next batch of eligible ride goers. If you fail to show up after being pushed back in the queue (a second missed opportunity), your reservation for that specific ride will be immediately cancelled, and you must re-queue from the back if you wish to ride.
              </li>
              <li className={pStyle}>
                <strong>Staff Final Authority:</strong> You acknowledge that physical ride attendants and Star City staff maintain final authority over ride access and safety procedures, even if a conflict arises with information or queue status displayed by the Service.
              </li>
              <li className={pStyle}>
                <strong>Device and Connectivity Responsibility:</strong> Use of the Service requires a personal, compatible mobile device. You are solely responsible for obtaining and maintaining necessary internet connectivity (Wi-Fi or mobile data) within the park to receive timely queue notifications and updates.
              </li>
            </ul>
          </div>

          {/* 4. Intellectual Property Rights */}
          <div>
            <h4 className={hStyle}>4. Intellectual Property Rights (IP)</h4>
            <ul className="list-disc ml-6 space-y-2">
              <li className={pStyle}>
                <strong>Service Content:</strong> The Developers and De La Salle University - Dasmariñas retain all ownership rights in the intellectual property of the Service, including all design, text, graphics, and underlying source code.
              </li>
              <li className={pStyle}>
                <strong>User Content:</strong> Any data you submit ("User Content," including your unique ID and queue history) remains yours. By submitting User Content, you grant the Developers a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display the User Content solely for the purpose of operating, testing, and demonstrating the Service for the capstone project.
              </li>
            </ul>
          </div>

          {/* 5. Disclaimer of Warranties and Estimates */}
          <div>
            <h4 className={hStyle}>5. Disclaimer of Warranties and Estimates</h4>
            <p className={pStyle}>
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Developers and De La Salle University - Dasmariñas make no representations or warranties of any kind, express or implied, as to the operation of the Service or the information, content, or materials included therein.
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li className={pStyle}>
                <strong>Wait Time Estimates:</strong> All estimated wait times and return times displayed by the Service are non-binding estimates and are subject to change due to operational issues, ride downtime, or other park conditions. The Developers are not liable for any losses or inconvenience caused by inaccuracies.
              </li>
              <li className={pStyle}>
                <strong>General Disclaimer:</strong> To the full extent permissible by applicable law, the Developers and De La Salle University - Dasmariñas expressly disclaim all warranties, express or implied, including, but not limited to, implied warranties of merchantability and fitness for a particular purpose.
              </li>
            </ul>
          </div>

          {/* 6. Limitation of Liability */}
          <div>
            <h4 className={hStyle}>6. Limitation of Liability</h4>
            <p className={pStyle}>
              In no event shall the Developers, De La Salle University - Dasmariñas, or their affiliates be liable for any direct, indirect, incidental, special, consequential, or exemplary damages, resulting from: i. The use or the inability to use the Service. ii. Unauthorized access to or alteration of your transmissions or data. iii. Statements or conduct of any third party on the Service.
            </p>
          </div>

          {/* 7. Governing Law, 8. Changes, 9. Contact */}
          <div>
            <h4 className={hStyle}>7. Governing Law</h4>
            <p className={pStyle}>
              These Terms shall be governed by and construed in accordance with the laws of The Republic of the Philippines.
            </p>
            <h4 className={hStyle}>8. Changes to Terms</h4>
            <p className={pStyle}>
              The Developers reserve the right, at their sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms.
            </p>
            <h4 className={hStyle}>9. Contact Information</h4>
            <p className={pStyle}>
              If you have any questions about these Terms, please contact the capstone project team at <strong>nexq.support@gmail.com</strong>.
            </p>
          </div>

          {/* === PART II: PRIVACY POLICY === */}
          <h2 className="text-xl font-bold text-slate-800 pt-8 border-t border-slate-100">
            Part II: Privacy Policy
          </h2>

          <p className={pStyle}>
            Effective Date: November 26, 2025. This Privacy Policy explains how Queue-Our-Code collects, uses, and discloses information about you when you use our web application.
          </p>

          {/* 1. Important Note on Capstone Project Scope */}
          <div>
            <h4 className={hStyle}>1. Important Note on Capstone Project Scope</h4>
            <p className={pStyle}>
              This Service is a non-commercial university capstone project created for educational and demonstration purposes. Data collected is primarily for the functional testing of the queue system and for academic reporting. We do not intend to hold personal data longer than necessary for the project timeline.
            </p>
          </div>

          {/* 2. Information We Collect */}
          <div>
            <h4 className={hStyle}>2. Information We Collect</h4>
            <p className={pStyle}>
              We collect information that allows the queueing system to function effectively. This includes:
            </p>
            <ul className="list-disc ml-6 space-y-3">
              <li className={pStyle}>
                <strong>A. Personal Information (Provided by User):</strong> Collected during registration and ticket activation, including User Name and Ticket Type.
              </li>
              <li className={pStyle}>
                <strong>B. Usage and Operational Data (Automatically Collected):</strong> Data essential for the queueing system, including Unique User ID, QR Code ID, Queue History, Timestamps (for key actions like login, queue joining, QR code scans), and Date of Use.
              </li>
              <li className={pStyle}>
                <strong>C. System and Security Data:</strong> Minimal technical information logged to ensure system integrity and prevent abuse, such as System Logs (basic non-identifying data for debugging, e.g., IP addresses, operating system type).
              </li>
            </ul>
          </div>

          {/* 3. How We Use Your Information */}
          <div>
            <h4 className={hStyle}>3. How We Use Your Information</h4>
            <ul className="list-disc ml-6 space-y-2">
              <li className={pStyle}>Service Provision (operate and maintain core functionality).</li>
              <li className={pStyle}>Queue Management (calculate wait times, manage lists, enforce limits).</li>
              <li className={pStyle}>Account Activation (activate/deactivate based on ticket/park hours).</li>
              <li className={pStyle}>Security and Anti-Abuse (detect and prevent violations).</li>
              <li className={pStyle}>Academic Reporting (for statistical analysis and project documentation).</li>
            </ul>
          </div>

          {/* 4. Data Sharing and Disclosure */}
          <div>
            <h4 className={hStyle}>4. Data Sharing and Disclosure</h4>
            <p className={pStyle}>
              We do not sell or rent your personal information to third parties. We may disclose your information in the following limited circumstances:
            </p>
            <ul className="list-disc ml-6 space-y-2">
              <li className={pStyle}>
                <strong>Park Operations:</strong> We may share Queue History and Unique User IDs with designated Star City staff solely for validating queue eligibility and ensuring park safety.
              </li>
              <li className={pStyle}>
                <strong>Legal Compliance:</strong> If required to do so by law.
              </li>
              <li className={pStyle}>
                <strong>University Requirements:</strong> Disclosure to faculty and evaluators at De La Salle University - Dasmariñas for project assessment and grading.
              </li>
            </ul>
          </div>

          {/* 5. Data Retention */}
          <div>
            <h4 className={hStyle}>5. Data Retention</h4>
            <p className={pStyle}>
              We retain Usage and Operational Data only for the duration of the park visit and the subsequent academic reporting period. All user accounts and associated operational data will be securely deleted or anonymized upon the conclusion of the capstone project.
            </p>
          </div>

          {/* 6. Security of Your Information */}
          <div>
            <h4 className={hStyle}>6. Security of Your Information</h4>
            <p className={pStyle}>
              We use reasonable administrative, technical, and physical measures to protect your information. However, no internet transmission is 100% secure, and we cannot guarantee absolute security.
            </p>
          </div>

          {/* 7. International Users and Governing Law */}
          <div>
            <h4 className={hStyle}>7. International Users and Governing Law</h4>
            <p className={pStyle}>
              The Service is governed by and operated in accordance with the laws of The Republic of the Philippines. By using the Service, you consent to the processing and transfer of your information in the Philippines.
            </p>
          </div>

          {/* 8. Changes to this Privacy Policy */}
          <div>
            <h4 className={hStyle}>8. Changes to this Privacy Policy</h4>
            <p className={pStyle}>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
            </p>
          </div>

          {/* 9. Contact Information */}
          <div>
            <h4 className={hStyle}>9. Contact Information</h4>
            <p className={pStyle}>
              If you have any questions about this Privacy Policy or our data practices, please contact the team email: <strong>nexq.support@gmail.com</strong>.
            </p>
          </div>

          <div className="pt-2">
            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-100">
              <strong>Acknowledge Terms:</strong> Please review these documents thoroughly. By continuing to use the Queue-Our-Code service, you acknowledge and accept all terms and policies outlined above.
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 shadow-sm transition-all text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default TermsModal;
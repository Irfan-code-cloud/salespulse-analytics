import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield } from 'lucide-react';
import Markdown from 'react-markdown';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRIVACY_POLICY_CONTENT = `
# Privacy Policy for SalesPulse Analytics Engine Dashboard

**Last Updated:** April 7, 2026

## 1. Introduction
Welcome to SalesPulse Analytics Engine Dashboard. Your privacy is critically important to us. This Privacy Policy outlines how we collect, use, and protect your information when you use our application.

## 2. Google Drive Data & API Usage
SalesPulse Dashboard utilizes the Google Drive API to allow users to import datasets (such as Google Spreadsheets, CSVs, and Excel files) directly into the application for local analysis and visualization. 

We request the **read-only** scope (\`https://www.googleapis.com/auth/drive.readonly\`). 

Regarding your Google Drive data, we strictly adhere to the following principles:
* **No Server Storage:** We do not upload, store, or transmit your Google Drive files to any external servers or databases. 
* **Local Processing:** All file parsing and data visualization happens strictly locally within your device's web browser memory.
* **No Third-Party Sharing:** We do not sell, trade, or share your Google Drive data with any third parties. 
* **Limited Access:** The app only accesses the specific files you explicitly choose to open via the Google Picker interface. It does not scan, read, or access any other files or folders in your Google Drive.

**Compliance with Google API Services User Data Policy:**
SalesPulse's use and transfer to any other app of information received from Google APIs will adhere to the [Google API Services User Data Policy](https://developers.google.com/terms/api-services-user-data-policy), including the Limited Use requirements.

## 3. Data Retention
Because SalesPulse processes your selected files entirely in your browser's local memory, the data is inherently transient. As soon as you refresh the page or close your browser tab, the imported data is completely cleared and deleted from the application's memory.

## 4. Changes to This Privacy Policy
We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.

## 5. Contact Us
If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
* **Email:** ifnkhattak@outlook.com
`;

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-[0.75rem] sm:p-[2rem]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#141414]/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.99, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.99, y: 5 }}
            className="relative bg-white w-full max-w-[40rem] max-h-[90vh] overflow-hidden rounded-[1rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] flex flex-col border border-[#141414]/10"
          >
            {/* Header */}
            <div className="px-[1.25rem] py-[1rem] border-b border-[#141414]/5 flex items-center justify-between bg-white sticky top-0 z-10">
              <div className="flex items-center gap-[0.75rem]">
                <Shield className="w-[1.125rem] h-[1.125rem] text-[#141414]/60" />
                <h2 className="text-[0.875rem] font-bold text-[#141414] uppercase tracking-wider">Privacy Policy</h2>
              </div>
              <button
                onClick={onClose}
                className="p-[0.375rem] hover:bg-[#141414]/5 rounded-md transition-colors"
              >
                <X className="w-[1.125rem] h-[1.125rem] text-[#141414]/40" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-[1.25rem] py-[1.5rem] sm:px-[2rem] sm:py-[2rem] bg-white">
              <div className="max-w-none prose prose-neutral prose-sm">
                <style dangerouslySetInnerHTML={{ __html: `
                  .prose-sm { font-size: 0.8125rem; line-height: 1.5; color: rgba(20,20,20,0.7); }
                  .prose-sm h1 { font-size: 1.25rem; font-weight: 800; margin-top: 0; margin-bottom: 1rem; color: #141414; letter-spacing: -0.01em; }
                  .prose-sm h2 { font-size: 0.9375rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #141414; border-bottom: 1px solid rgba(20,20,20,0.05); padding-bottom: 0.25rem; }
                  .prose-sm p { margin-bottom: 0.75rem; }
                  .prose-sm ul { margin-bottom: 1rem; padding-left: 1.25rem; list-style-type: disc; }
                  .prose-sm li { margin-bottom: 0.375rem; }
                  .prose-sm strong { color: #141414; font-weight: 600; }
                  .prose-sm code { font-family: var(--font-mono); font-size: 0.75rem; background: #f4f4f4; padding: 0.125rem 0.25rem; border-radius: 0.25rem; }
                `}} />
                <Markdown>{PRIVACY_POLICY_CONTENT}</Markdown>
              </div>
            </div>

            {/* Footer */}
            <div className="px-[1.25rem] py-[1rem] border-t border-[#141414]/5 bg-[#F9F9F9] flex flex-col sm:flex-row items-center justify-between gap-[1rem]">
              <p className="text-[0.75rem] text-[#141414]/50 font-medium text-center sm:text-left">
                Contact: <a href="mailto:ifnkhattak@outlook.com" className="text-[#141414] hover:underline font-bold">ifnkhattak@outlook.com</a>
              </p>
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-[1.5rem] py-[0.625rem] bg-[#141414] text-white rounded-[0.5rem] text-[0.8125rem] font-bold hover:bg-[#141414]/90 transition-all active:scale-[0.98]"
              >
                I Understand
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

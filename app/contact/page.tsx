"use client";

import { useState } from "react";
import Navbar from "../components/Navbar";

export default function Support() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual form submission (email service or database)
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", message: "" });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <Navbar />

      <main className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-black">Support</h1>
          <p className="mt-3 text-gray-600">Have feedback or questions? Get in touch.</p>
        </div>

        {submitted && (
          <div className="mb-6 border-l-4 border-black bg-green-50 p-4">
            <p className="font-semibold text-black">Message sent successfully!</p>
            <p className="text-sm text-gray-600">We'll get back to you soon.</p>
          </div>
        )}

        <div className="border border-gray-300 bg-white p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-bold uppercase tracking-wide text-black">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-2 w-full border-2 border-gray-300 px-4 py-3 text-black focus:border-black focus:outline-none"
                placeholder="Your name"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-bold uppercase tracking-wide text-black">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-2 w-full border-2 border-gray-300 px-4 py-3 text-black focus:border-black focus:outline-none"
                placeholder="your.email@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-bold uppercase tracking-wide text-black">
                Message
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="mt-2 w-full resize-none border-2 border-gray-300 px-4 py-3 text-black focus:border-black focus:outline-none"
                placeholder="Tell us what's on your mind..."
                rows={6}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-black py-4 font-bold uppercase tracking-wide text-white transition hover:bg-gray-800"
            >
              Send Message
            </button>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Or reach us directly at:</p>
          <a href="mailto:support@debatel.com" className="font-semibold text-black hover:underline">
            support@debatel.com
          </a>
        </div>
      </main>
    </div>
  );
}

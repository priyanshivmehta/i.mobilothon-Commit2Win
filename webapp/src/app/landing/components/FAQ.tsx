'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: 'How accurate is the drowsiness detection?',
      answer: 'Our AI achieves 98% accuracy in detecting drowsiness and fatigue using multi-modal fusion of facial landmarks, eye aspect ratio, head pose, and voice patterns.'
    },
    {
      question: 'Does this work in low light or at night?',
      answer: 'Yes, our system is optimized for various lighting conditions including nighttime driving. We use infrared-capable detection and adaptive algorithms.'
    },
    {
      question: 'What happens to my camera footage?',
      answer: 'All video processing happens on your device. No footage is uploaded to servers. Only anonymized attention scores are stored, and they auto-delete after 24 hours.'
    },
    {
      question: 'Can I use this without camera access?',
      answer: 'Camera access is required for facial detection. However, you can use our voice-only mode which analyzes speech patterns for fatigue detection with reduced accuracy.'
    },
    {
      question: 'How much battery does it consume?',
      answer: 'The app uses approximately 5-8% battery per hour. We use optimized on-device AI models and hardware acceleration to minimize power consumption.'
    },
    {
      question: 'Is this free for personal use?',
      answer: 'Yes! Individual drivers can use the basic monitoring features for free. Fleet management requires an enterprise subscription.'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden hover:border-blue-500 transition-all"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-semibold text-gray-900 pr-4">
                  {faq.question}
                </span>
                <Icon 
                  name={openIndex === index ? 'ChevronUpIcon' : 'ChevronDownIcon'} 
                  size={24} 
                  className="text-gray-500 flex-shrink-0"
                />
              </button>
              
              {openIndex === index && (
                <div className="px-6 pb-6 text-gray-700 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

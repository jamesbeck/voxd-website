"use client";

import { useState, useEffect } from "react";
import {
  List,
  X,
  FileText,
  BookOpen,
  LayoutDashboard,
  Wrench,
  MessageSquare,
  FileCheck,
  Rocket,
  HelpCircle,
} from "lucide-react";

const iconMap = {
  FileText,
  BookOpen,
  LayoutDashboard,
  Wrench,
  MessageSquare,
  FileCheck,
  Rocket,
  HelpCircle,
} as const;

type IconName = keyof typeof iconMap;

type Section = {
  id: string;
  label: string;
  icon: IconName;
};

type FloatingTableOfContentsProps = {
  sections: Section[];
  brandColor: string;
};

export default function FloatingTableOfContents({
  sections,
  brandColor,
}: FloatingTableOfContentsProps) {
  const [activeSection, setActiveSection] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -70% 0px",
        threshold: 0,
      }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Desktop sticky sidebar */}
      <nav className="hidden xl:block sticky top-8 self-start">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-[220px]">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Contents
          </p>
          <ul className="space-y-1">
            {sections.map(({ id, label, icon }) => {
              const Icon = iconMap[icon];
              return (
                <li key={id}>
                  <button
                    onClick={() => scrollToSection(id)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      activeSection === id
                        ? "font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                    style={
                      activeSection === id
                        ? {
                            backgroundColor: `${brandColor}15`,
                            color: brandColor,
                          }
                        : undefined
                    }
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Mobile floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="xl:hidden fixed bottom-6 right-6 z-50 bg-white shadow-lg border border-gray-200 rounded-full p-4 hover:bg-gray-50 transition-colors"
        aria-label="Open table of contents"
      >
        <List className="h-5 w-5 text-gray-700" />
      </button>

      {/* Mobile drawer */}
      {isOpen && (
        <>
          <div
            className="xl:hidden fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsOpen(false)}
          />
          <div className="xl:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50 p-6 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-900">Contents</p>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <ul className="space-y-1">
              {sections.map(({ id, label, icon }) => {
                const Icon = iconMap[icon];
                return (
                  <li key={id}>
                    <button
                      onClick={() => scrollToSection(id)}
                      className={`w-full text-left text-sm px-3 py-3 rounded-lg transition-colors flex items-center gap-2 ${
                        activeSection === id
                          ? "font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                      style={
                        activeSection === id
                          ? {
                              backgroundColor: `${brandColor}15`,
                              color: brandColor,
                            }
                          : undefined
                      }
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </>
  );
}

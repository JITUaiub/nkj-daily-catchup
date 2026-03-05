"use client";

import { Settings, Bell, Calendar, Key, Database } from "lucide-react";
import Link from "next/link";

export function SettingsPage() {
  return (
    <div className="min-h-full bg-surface-light dark:bg-surface-dark">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <header className="mb-8">
          <h1 className="font-display font-semibold text-2xl flex items-center gap-2">
            <Settings className="w-7 h-7" />
            Settings
          </h1>
          <p className="text-apple-gray-2 text-sm mt-1">
            Theme, notifications, and integrations.
          </p>
        </header>

        <ul className="space-y-2">
          <li>
            <Link
              href="/"
              className="flex items-center gap-3 rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 p-4 hover:border-apple-blue/30 transition-colors"
            >
              <span className="w-10 h-10 rounded-button bg-apple-gray-5/20 flex items-center justify-center">
                <Settings className="w-5 h-5 text-apple-gray-2" />
              </span>
              <div className="flex-1">
                <p className="font-medium">Appearance</p>
                <p className="text-sm text-apple-gray-2">Theme toggle is in the sidebar. Dark / Light / System.</p>
              </div>
            </Link>
          </li>
          <li>
            <div className="flex items-center gap-3 rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 p-4">
              <span className="w-10 h-10 rounded-button bg-apple-gray-5/20 flex items-center justify-center">
                <Bell className="w-5 h-5 text-apple-gray-2" />
              </span>
              <div className="flex-1">
                <p className="font-medium">Notifications</p>
                <p className="text-sm text-apple-gray-2">Web Push and in-app alerts — coming soon.</p>
              </div>
            </div>
          </li>
          <li>
            <div className="flex items-center gap-3 rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 p-4">
              <span className="w-10 h-10 rounded-button bg-apple-gray-5/20 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-apple-gray-2" />
              </span>
              <div className="flex-1">
                <p className="font-medium">Calendar sync</p>
                <p className="text-sm text-apple-gray-2">Google Calendar / Apple Calendar — coming soon.</p>
              </div>
            </div>
          </li>
          <li>
            <div className="flex items-center gap-3 rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 p-4">
              <span className="w-10 h-10 rounded-button bg-apple-gray-5/20 flex items-center justify-center">
                <Key className="w-5 h-5 text-apple-gray-2" />
              </span>
              <div className="flex-1">
                <p className="font-medium">OpenAI API key</p>
                <p className="text-sm text-apple-gray-2">Set OPENAI_API_KEY in .env for WorkDay AI.</p>
              </div>
            </div>
          </li>
          <li>
            <div className="flex items-center gap-3 rounded-card bg-background-light dark:bg-background-dark shadow-apple border border-apple-gray-5/20 p-4">
              <span className="w-10 h-10 rounded-button bg-apple-gray-5/20 flex items-center justify-center">
                <Database className="w-5 h-5 text-apple-gray-2" />
              </span>
              <div className="flex-1">
                <p className="font-medium">Database</p>
                <p className="text-sm text-apple-gray-2">
                  Set Supabase URL and keys in .env so WorkDay can persist tasks, time, notes, and more.
                </p>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}

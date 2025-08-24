// NavBar.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/clerk-react";

function NavBar() {
    const [open, setOpen] = useState(false);

    return (
        <nav className="fixed inset-x-0 top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700">
            {/* Header row */}
            <div className="max-w-screen-xl mx-auto p-4 flex items-center justify-between">
                {/* Logo */}
                <Link to="/" className="flex items-center space-x-3 rtl:space-x-reverse">
                    <img
                        src="/logo-mark-danger.svg"
                        alt="Monsters & Monarchs"
                        className="h-8 w-8"
                    />
                    <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
                        Monsters &amp; Monarchs
                    </span>
                </Link>

                {/* Desktop nav + auth */}
                <div className="hidden md:flex items-center gap-8">
                    <ul className="flex items-center gap-6 font-medium">
                        <li>
                            <Link
                                to="/"
                                className="text-blue-700 dark:text-blue-500"
                            >
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/builder"
                                className="text-gray-900 hover:text-blue-700 dark:text-white md:dark:hover:text-blue-500"
                            >
                                Deck Builder
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/decks"
                                className="text-gray-900 hover:text-blue-700 dark:text-white md:dark:hover:text-blue-500"
                            >
                                Decks
                            </Link>
                        </li>
                    </ul>

                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                    <SignedOut>
                        <SignInButton mode="modal">
                            <button className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400">
                                Sign In
                            </button>
                        </SignInButton>
                    </SignedOut>
                </div>

                {/* Mobile toggle */}
                <button
                    type="button"
                    aria-controls="mobile-menu"
                    aria-expanded={open ? "true" : "false"}
                    onClick={() => setOpen((v) => !v)}
                    className="md:hidden inline-flex items-center justify-center p-2 w-10 h-10 text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
                >
                    <span className="sr-only">Open main menu</span>
                    <svg
                        className="w-5 h-5"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 17 14"
                    >
                        <path
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M1 1h15M1 7h15M1 13h15"
                        />
                    </svg>
                </button>
            </div>

            {/* Mobile dropdown panel (separate from the header row) */}
            <div
                id="mobile-menu"
                className={`${open ? "block" : "hidden"} md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg`}
            >
                <div className="max-w-screen-xl mx-auto px-4 py-3">
                    <ul className="font-medium flex flex-col gap-1">
                        <li>
                            <Link
                                to="/"
                                onClick={() => setOpen(false)}
                                className="block py-2 px-3 rounded-sm text-blue-700 dark:text-blue-500"
                            >
                                Home
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/about"
                                onClick={() => setOpen(false)}
                                className="block py-2 px-3 rounded-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                            >
                                About
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/services"
                                onClick={() => setOpen(false)}
                                className="block py-2 px-3 rounded-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                            >
                                Services
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/pricing"
                                onClick={() => setOpen(false)}
                                className="block py-2 px-3 rounded-sm text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                            >
                                Pricing
                            </Link>
                        </li>
                    </ul>

                    <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                        <SignedOut>
                            <SignInButton mode="modal">
                                <button
                                    onClick={() => setOpen(false)}
                                    className="mt-2 w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                    Sign In
                                </button>
                            </SignInButton>
                        </SignedOut>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default NavBar;

'use client';

import { useState } from 'react';
import { LogoutModal } from './LogoutModal';

export default function LogoutButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 cursor-pointer"
            >
                Logout
            </button>
            <LogoutModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
}

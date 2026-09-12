"use client";

import React from 'react';

export default function UsersHeader() {
  return (
    <header className="flex flex-col gap-1">
      <h1 className="text-2xl font-bold text-white tracking-tight">Users</h1>
      <p className="text-sm text-[#888888]">
        Manage users, roles and limits.
      </p>
    </header>
  );
}

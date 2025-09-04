"use client";

import React from 'react';

export default function UsersHeader() {
  return (
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#202020] rounded-2xl flex items-center justify-center shadow-lg">
        <i className="fas fa-users text-white text-lg sm:text-2xl"></i>
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Users</h1>
        <p className="text-[#AAAAAA] text-base sm:text-lg">Manage users, roles and limits</p>
      </div>
    </div>
  );
}



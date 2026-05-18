import React from 'react';
import Reports from './Reports';

export default function AnalyticsTab({ user }) {
  return (
    <div>
      <Reports user={user} />
    </div>
  );
}
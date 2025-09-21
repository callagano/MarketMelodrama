'use client';

import { useState, useEffect } from 'react';

export default function SimpleTest() {
  console.log('SimpleTest component mounting...');
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('SimpleTest useEffect running...');
    
    const timer = setTimeout(() => {
      console.log('SimpleTest: Setting count to 1 and loading to false');
      setCount(1);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    console.log('SimpleTest: Rendering loading state');
    return <div style={{ padding: '20px', border: '2px solid red', margin: '10px' }}>
      <h3>Simple Test - Loading...</h3>
    </div>;
  }

  console.log('SimpleTest: Rendering data state, count:', count);
  return <div style={{ padding: '20px', border: '2px solid green', margin: '10px' }}>
    <h3>Simple Test - Data Loaded!</h3>
    <p>Count: {count}</p>
    <p>This component should update after 1 second.</p>
  </div>;
}

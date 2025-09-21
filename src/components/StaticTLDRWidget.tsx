'use client';

import styles from './TLDRWidget.module.css';

export default function StaticTLDRWidget() {
  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h3>The Brief</h3>
      </div>
      
      <div className={styles.content}>
        <div className={styles.noUpdate}>
          <p>No data available yet.</p>
          <p className={styles.hint}>
            Waiting for ActivePieces to send the latest market data...
          </p>
          <p className={styles.hint}>
            Data will appear here automatically when available.
          </p>
        </div>
      </div>
    </div>
  );
}

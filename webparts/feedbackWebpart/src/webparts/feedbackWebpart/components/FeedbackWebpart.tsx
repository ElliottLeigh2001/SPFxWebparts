import * as React from 'react';
import { useState, useEffect } from 'react';
import { PrimaryButton, TextField, MessageBar, MessageBarType } from '@fluentui/react';
import styles from './FeedbackWebpart.module.scss';

const FeedbackWebpart: React.FC = () => {
  const [feedback, setFeedback] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('success');
  const [loading, setLoading] = useState(false);

  const FLOW_URL = 'https://default1a44e8c4fbc44d25b648099e23c46f.e2.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/85b0f95cd38a4f42b54bfd96f9d36611/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=IktP2aVg1UdkWga4KofiU3A9-qvV6NZbmYcQyZkPuMo';

  const handleSubmit = async (): Promise<void> => {
    if (!feedback.trim()) return;

    setLoading(true);
    setStatus('idle');

    try {
      const res = await fetch(`${FLOW_URL}&key=${process.env.SECURITY_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ Feedback: feedback })
      });

      if (res.ok) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setStatus('success');
        setFeedback('');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }

    setLoading(false);
  };

    useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(() => setStatus('idle'), 4000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <div className={styles.feedbackContainer}>
      <h1 className={styles.title}>Feedback</h1>
      <p className={styles.info}>Heb je een vraag, opmerking of suggestie? Laat het ons weten. Dit formulier zal anoniem behandeld worden.</p>
      <div className={styles.textFieldContainer}>
        <TextField
          styles={{
              fieldGroup: {
                borderRadius: 8,
                border: "0px solid transparent",
                background: "#F3F2F1"
              },

            }}
            placeholder='Vul hier je feedback in'
            className={styles.textBox}
            multiline
            rows={3}
            value={feedback}
            onChange={(_, v) => setFeedback(v || '')}
        />
      </div>

      <div className={styles.statusContainer}>
        {status === 'success' && (
          <MessageBar
            messageBarType={MessageBarType.success}
            className={`${styles.messageBar} ${styles.success}`}
          >
            Bedankt voor je feedback!
          </MessageBar>
        )}

        {status === 'error' && (
          <MessageBar
            messageBarType={MessageBarType.error}
            className={`${styles.messageBar} ${styles.error}`}
          >
            Er liep iets fout. Probeer later opnieuw.
          </MessageBar>
        )}
      </div>
      <div className={styles.buttonContainer}>
        <PrimaryButton 
          text="Verstuur" 
          onClick={handleSubmit} 
          disabled={loading || !feedback.trim()} 
          className={styles.submitButton}
        />
      </div>


    </div>
  );
}

export default FeedbackWebpart
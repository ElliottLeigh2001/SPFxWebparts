// Send data to the power automate flow for sending out emails
export const sendEmail = async (data: any) => {
  await fetch(
    `https://254c9f51ba17ed558fd68efc5f949b.fe.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/569593f3dde346a0b8d12bf9dd7312a3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=gawEF5IO3FE67ihdO7MqHO8PjinGTlPkuHIbz9BIyKc`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }
  );
};

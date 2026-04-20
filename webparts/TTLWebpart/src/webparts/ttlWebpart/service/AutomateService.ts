// Send data to the power automate flow for sending out emails
export const sendEmail = async (data: any) => {
  await fetch(
    `https://default1a44e8c4fbc44d25b648099e23c46f.e2.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/c727dde11ffc4fbbab0aed71dc286e92/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=RZCIXnWlbWAiKBFzAu1y0rFnE7M-vmrYnpL7lu5daME`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    }
  );
};
// https://254c9f51ba17ed558fd68efc5f949b.fe.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/569593f3dde346a0b8d12bf9dd7312a3/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=gawEF5IO3FE67ihdO7MqHO8PjinGTlPkuHIbz9BIyKc

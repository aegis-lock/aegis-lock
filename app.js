const PROGRAM_ID = 'vusdc_transaction.aleo';

const PROGRAM_IDS = [
  'vusdc_transaction.aleo'
];

const DECRYPT_PERMISSION = 'DECRYPT_UPON_REQUEST';

/* =========================================================
   WALLET ADDRESS
   ========================================================= */

const connected =
  sessionStorage.getItem('usdcxAddress') || '';

function shortenAddress(address) {
  if (!address) return 'Not connected';

  if (address.length <= 16) {
    return address;
  }

  return (
    address.slice(0, 10) +
    '...' +
    address.slice(-4)
  );
}

function updateWalletDisplay(address) {
  document
    .querySelectorAll('[data-wallet]')
    .forEach(el => {
      el.textContent =
        shortenAddress(address);

      el.setAttribute(
        'title',
        address || ''
      );
    });
}

updateWalletDisplay(connected);

/* =========================================================
   COPY WALLET
   ========================================================= */

document
  .querySelectorAll('[data-copy]')
  .forEach(button => {

    button.addEventListener(
      'click',
      async () => {

        const address =
          sessionStorage.getItem(
            'usdcxAddress'
          ) || '';

        if (!address) return;

        if (
          !navigator.clipboard ||
          !navigator.clipboard.writeText
        ) {
          return;
        }

        try {
          await navigator.clipboard.writeText(
            address
          );

          const original =
            button.innerHTML;

          button.innerHTML = '✓';

          setTimeout(() => {
            button.innerHTML =
              original;
          }, 1200);

        } catch (error) {
          console.warn(
            'AEGIS: Copy failed:',
            error
          );
        }
      }
    );
  });

/* =========================================================
   CONNECT LEO WALLET
   ========================================================= */

async function connectLeoForRecords() {

  const adapter =
    window.usdcxLeoAdapter;

  if (!adapter) {
    throw new Error(
      'Leo Wallet adapter not available.'
    );
  }

  console.log(
    'AEGIS: Connecting Leo Wallet...'
  );

  console.log(
    'AEGIS: Network: MAINNET'
  );

  console.log(
    'AEGIS: Decrypt permission:',
    DECRYPT_PERMISSION
  );

  const account =
    await adapter.connect(
      'mainnet',
      DECRYPT_PERMISSION
    );

  console.log(
    'AEGIS: Leo Wallet connected:',
    account
  );

  const address =
    account?.address ||
    account?.publicKey ||
    adapter.publicKey;

  if (!address) {
    throw new Error(
      'Leo Wallet connected but no address was returned.'
    );
  }

  sessionStorage.setItem(
    'usdcxAddress',
    address
  );

  sessionStorage.setItem(
    'walletAddress',
    address
  );

  updateWalletDisplay(address);

  return account;
}

/* =========================================================
   RECORD VALUE HELPER
   ========================================================= */

function getRecordValue(
  record,
  names
) {
  if (!record) return null;

  for (
    const name
    of names
  ) {
    if (
      record[name] !== undefined &&
      record[name] !== null
    ) {
      return record[name];
    }
  }

  if (
    record.data &&
    typeof record.data === 'object'
  ) {
    for (
      const name
      of names
    ) {
      if (
        record.data[name] !== undefined &&
        record.data[name] !== null
      ) {
        return record.data[name];
      }
    }
  }

  return null;
}

/* =========================================================
   CLEAN ALEO VALUE
   ========================================================= */

function cleanAleoValue(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  let text =
    String(value).trim();

  text =
    text.replace(
      /^"(.*)"$/,
      '$1'
    );

  text =
    text.replace(
      /\.(private|public)$/i,
      ''
    );

  text =
    text.replace(
      /(u8|u16|u32|u64|u128|u256|field|group|scalar)$/i,
      ''
    );

  return text.trim();
}

/* =========================================================
   FORMAT STATUS
   ========================================================= */

function formatStatus(value) {

  const status =
    cleanAleoValue(value);

  if (status === '1') {
    return 'LOCKED';
  }

  if (status === '2') {
    return 'CLAIMED';
  }

  if (status === '0') {
    return 'UNKNOWN';
  }

  return status;
}

/* =========================================================
   EXTRACT RECORD LIST
   ========================================================= */

function extractRecordList(records) {

  if (Array.isArray(records)) {
    return records;
  }

  if (
    records &&
    Array.isArray(records.records)
  ) {
    return records.records;
  }

  if (
    records &&
    records.result &&
    Array.isArray(records.result)
  ) {
    return records.result;
  }

  if (
    records &&
    records.result &&
    Array.isArray(
      records.result.records
    )
  ) {
    return records.result.records;
  }

  return [];
}

/* =========================================================
   REQUEST PRIVATE WALLET RECORDS
   ========================================================= */

async function requestPlaintextRecords(
  adapter
) {

  if (
    typeof adapter.requestRecords !==
    'function'
  ) {
    throw new Error(
      'Leo Wallet adapter does not expose requestRecords().'
    );
  }

  console.log(
    'AEGIS: Requesting wallet records from:',
    PROGRAM_ID
  );

  const records =
    await adapter.requestRecords(
      PROGRAM_ID
    );

  console.log(
    'AEGIS: Raw records returned by Leo Wallet:',
    records
  );

  return extractRecordList(records);
}

/* =========================================================
   GET YOUR RECORD
   ========================================================= */

async function getYourRecord() {

  const adapter =
    window.usdcxLeoAdapter;

  if (!adapter) {
    throw new Error(
      'Leo Wallet adapter not available.'
    );
  }

  console.log(
    'AEGIS: GET YOUR RECORD'
  );

  /*
    Transaction ID is intentionally NOT used.

    Page 3 data comes ONLY from the private
    wallet record.
  */

  if (!adapter.account) {
    await connectLeoForRecords();
  }

  if (!adapter.account) {
    throw new Error(
      'Leo Wallet connection was not established.'
    );
  }

  const currentAddress =
    cleanAleoValue(
      adapter.account?.address ||
      adapter.account?.publicKey ||
      sessionStorage.getItem(
        'usdcxAddress'
      ) ||
      ''
    );

  if (!currentAddress) {
    throw new Error(
      'Connected wallet address could not be determined.'
    );
  }

  console.log(
    'AEGIS: Current wallet:',
    currentAddress
  );

  /*
    ========================================================
    WALLET ONLY

    Request records directly from:
    vusdc_transaction.aleo
    ========================================================
  */

  const recordList =
    await requestPlaintextRecords(
      adapter
    );

  console.log(
    'AEGIS: Total wallet records:',
    recordList.length
  );

  if (!recordList.length) {

    sessionStorage.removeItem(
      'usdcxSelectedRecord'
    );

    sessionStorage.removeItem(
      'usdcxSelectedAllocation'
    );

    return [];
  }

  /*
    ========================================================
    MATCH ONLY THE WALLET OWNER
    ========================================================
  */

  const matchingRecords =
    recordList.filter(
      record => {

        const owner =
          getRecordValue(
            record,
            [
              'owner',
              'owner_address'
            ]
          );

        const cleanOwner =
          cleanAleoValue(
            owner
          );

        const matches =
          cleanOwner ===
          currentAddress;

        console.log(
          'AEGIS: Checking wallet record owner:',
          cleanOwner,
          'MATCH:',
          matches
        );

        return matches;
      }
    );

  console.log(
    'AEGIS: Matching wallet records:',
    matchingRecords.length
  );

  if (!matchingRecords.length) {

    sessionStorage.removeItem(
      'usdcxSelectedRecord'
    );

    sessionStorage.removeItem(
      'usdcxSelectedAllocation'
    );

    return [];
  }

  /*
    ========================================================
    SELECT RAW WALLET RECORD

    NO normalization.
    NO backend data.
    NO Explorer data.
    NO fabricated fields.
    ========================================================
  */

  const walletRecord =
    matchingRecords[0];

  console.log(
    'AEGIS: Selected RAW wallet record:',
    walletRecord
  );

  /*
    Save EXACT raw wallet record.
  */

  try {

    const safeRecord =
      JSON.parse(
        JSON.stringify(
          walletRecord,
          (_, value) =>
            typeof value === 'bigint'
              ? value.toString()
              : value
        )
      );

    sessionStorage.setItem(
      'usdcxSelectedRecord',
      JSON.stringify(
        safeRecord
      )
    );

    /*
      Keep the legacy key only as a copy of
      the SAME wallet record.

      It contains no additional information.
    */

    sessionStorage.setItem(
      'usdcxSelectedAllocation',
      JSON.stringify(
        safeRecord
      )
    );

  } catch (error) {

    console.error(
      'AEGIS: Could not save wallet record:',
      error
    );

    throw new Error(
      'Could not save the private wallet record.'
    );
  }

  console.log(
    'AEGIS: Wallet record saved for Page 3.'
  );

  return [
    walletRecord
  ];
}

/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.connectLeoForRecords =
  connectLeoForRecords;

window.getYourRecord =
  getYourRecord;

window.shortenAddress =
  shortenAddress;

window.formatStatus =
  formatStatus;

window.cleanAleoValue =
  cleanAleoValue;

/* =========================================================
   VIEW DETAILS
   ========================================================= */

document
  .querySelectorAll('[data-details]')
  .forEach(button => {

    button.addEventListener(
      'click',
      () => {

        const selectedRecord =
          sessionStorage.getItem(
            'usdcxSelectedRecord'
          );

        if (!selectedRecord) {

          console.warn(
            'AEGIS: No wallet record available for Page 3.'
          );

          return;
        }

        location.href =
          'page3.html';
      }
    );
  });

/* =========================================================
   DISCONNECT WALLET
   ========================================================= */

document
  .querySelectorAll('[data-disconnect]')
  .forEach(button => {

    button.addEventListener(
      'click',
      async () => {

        try {

          const adapter =
            window.usdcxLeoAdapter;

          if (
            adapter &&
            adapter.account
          ) {

            console.log(
              'AEGIS: Disconnecting Leo Wallet...'
            );

            await adapter.disconnect();
          }

        } catch (error) {

          console.warn(
            'AEGIS: Wallet disconnect warning:',
            error
          );
        }

        sessionStorage.removeItem(
          'usdcxAddress'
        );

        sessionStorage.removeItem(
          'walletAddress'
        );

        sessionStorage.removeItem(
          'usdcxSelectedRecord'
        );

        sessionStorage.removeItem(
          'usdcxSelectedAllocation'
        );

        location.href =
          'index.html';
      }
    );
  });

/* =========================================================
   PAGE READY
   ========================================================= */

console.log(
  'AEGIS: Page ready.'
);

console.log(
  'AEGIS: Program:',
  PROGRAM_ID
);

console.log(
  'AEGIS: Decrypt permission:',
  DECRYPT_PERMISSION
);

console.log(
  'AEGIS: Data source: Leo Wallet private record ONLY.'
);

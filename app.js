const AEGIS_API_BASE = 'https://aegis-backend-1-3dph.onrender.com';

const PROGRAM_ID = 'vusdc_transaction.aleo';

const PROGRAM_IDS = [
  'vusdc_transaction.aleo'
];

const DECRYPT_PERMISSION = 'DECRYPT_UPON_REQUEST';

const ALEO_MAINNET_API =
  'https://api.provable.com/v2';


/* =========================================================
 * WALLET ADDRESS
 * ========================================================= */

const connected =
  sessionStorage.getItem('usdcxAddress') || '';


function shortenAddress(address) {

  if (!address) {
    return 'Not connected';
  }

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
 * COPY WALLET
 * ========================================================= */

document
  .querySelectorAll('[data-copy]')
  .forEach(button => {

    button.addEventListener(
      'click',
      async () => {

        const address =
          sessionStorage.getItem('usdcxAddress') || '';

        if (!address) {
          return;
        }

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
 * CONNECT LEO WALLET
 *
 * MAINNET
 *
 * DECRYPT_UPON_REQUEST
 * ========================================================= */

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
 * ALEO MAINNET TRANSACTION LOOKUP
 *
 * SOURCE:
 * Transaction ID entered by the client.
 *
 * NETWORK:
 * ALEO MAINNET
 *
 * NO BACKEND
 * NO MATCHING
 * NO HARDCODED TRANSACTION
 * ========================================================= */

async function fetchMainnetTransaction(
  transactionId
) {

  const id =
    String(transactionId || '').trim();


  if (!id) {

    throw new Error(
      'Please enter a Transaction ID.'
    );

  }


  console.log(
    'AEGIS: Looking up Aleo Mainnet transaction:',
    id
  );


  const url =
    ALEO_MAINNET_API +
    '/transaction/' +
    encodeURIComponent(id);


  let response;


  try {

    response =
      await fetch(
        url,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json'
          }
        }
      );

  } catch (error) {

    console.error(
      'AEGIS: Mainnet transaction request failed:',
      error
    );

    throw new Error(
      'Could not connect to the Aleo Mainnet.'
    );

  }


  if (!response.ok) {

    if (response.status === 404) {

      throw new Error(
        'Transaction was not found on Aleo Mainnet.'
      );

    }


    throw new Error(
      `Transaction lookup failed (${response.status}).`
    );

  }


  let transaction;


  try {

    transaction =
      await response.json();

  } catch (error) {

    console.error(
      'AEGIS: Invalid transaction response:',
      error
    );

    throw new Error(
      'Aleo Mainnet returned an invalid transaction response.'
    );

  }


  console.log(
    'AEGIS: Mainnet transaction response:',
    transaction
  );


  /*
   * Save the ORIGINAL blockchain response.
   *
   * Nothing is modified.
   * Nothing is invented.
   */

  try {

    sessionStorage.setItem(
      'usdcxTransaction',
      JSON.stringify(
        transaction
      )
    );


    sessionStorage.setItem(
      'usdcxTransactionId',
      id
    );

  } catch (storageError) {

    console.warn(
      'AEGIS: Could not save transaction:',
      storageError
    );

  }


  return transaction;

}


/* =========================================================
 * RECORD VALUE HELPER
 * ========================================================= */

function getRecordValue(record, names) {

  if (!record) {
    return null;
  }


  /* Direct fields */

  for (const name of names) {

    if (
      record[name] !== undefined &&
      record[name] !== null
    ) {

      return record[name];

    }

  }


  /* data.* */

  if (
    record.data &&
    typeof record.data === 'object'
  ) {

    for (const name of names) {

      if (
        record.data[name] !== undefined &&
        record.data[name] !== null
      ) {

        return record.data[name];

      }

    }

  }


  /* record.* */

  if (
    record.record &&
    typeof record.record === 'object'
  ) {

    for (const name of names) {

      if (
        record.record[name] !== undefined &&
        record.record[name] !== null
      ) {

        return record.record[name];

      }

    }

  }


  return null;

}


/* =========================================================
 * CLEAN ALEO VALUE
 * ========================================================= */

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
 * FORMAT STATUS
 *
 * Raw record:
 *
 * status = 1
 *
 * Display:
 *
 * LOCKED
 *
 * The original record is never modified.
 * ========================================================= */

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
 * RECORD TYPE
 *
 * Current lock record:
 *
 * LockedRecord
 *
 * The type is identified only when the
 * record actually contains LockedRecord fields.
 * ========================================================= */

function getRecordType(record) {

  if (!record) {
    return '';
  }


  const claimRoute =
    getRecordValue(
      record,
      ['claim_route']
    );


  const lockedEnd =
    getRecordValue(
      record,
      ['locked_end']
    );


  const status =
    getRecordValue(
      record,
      ['status']
    );


  if (
    claimRoute !== null ||
    lockedEnd !== null ||
    status !== null
  ) {

    return 'LockedRecord';

  }


  return '';

}


/* =========================================================
 * NORMALIZE LOCKED RECORD
 *
 * IMPORTANT:
 *
 * Only information actually present
 * in the private record is returned.
 *
 * Missing values remain empty.
 *
 * NO:
 * - Explorer
 * - Backend
 * - fixed TOKEN_ID
 * - fixed amount
 * - invented start date
 * - invented transaction ID
 * ========================================================= */

function normalizeLockedRecord(
  record,
  index,
  programId
) {

       const recordId =
  getRecordValue(
    record,
    [
      'record_id',
      'recordId',
      'id'
    ]
  );
  const owner =
    getRecordValue(
      record,
      ['owner']
    );


  const claimRoute =
    getRecordValue(
      record,
      ['claim_route']
    );


  const lockedEnd =
    getRecordValue(
      record,
      ['locked_end']
    );


  const status =
    getRecordValue(
      record,
      ['status']
    );


  /*
   * locked_start is intentionally searched,
   * but the current LockedRecord does not contain it.
   *
   * Therefore it remains empty unless the
   * actual returned record contains it.
   */

  const lockedStart =
    getRecordValue(
      record,
      [
        'locked_start',
        'start_time',
        'start'
      ]
    );


  /*
   * Amount is NOT part of LockedRecord.
   *
   * Do not invent it from Token records.
   */

  const amount =
    getRecordValue(
      record,
      [
        'amount',
        'display_amount',
        'locked_amount'
      ]
    );


  /*
   * These values are intentionally only read
   * if they actually exist in the record.
   */

  const tokenId =
    getRecordValue(
      record,
      [
        'token_id',
        'tokenId'
      ]
    );


  const transactionId =
    getRecordValue(
      record,
      [
        'transaction_id',
        'transactionId'
      ]
    );


  const lockRecordId =
    getRecordValue(
      record,
      [
        'lock_record_id',
        'lockRecordId',
        'record_id',
        'recordId'
      ]
    );


  const duration =
    calculateDuration(
      lockedStart,
      lockedEnd
    );


  return {

    allocationNumber:
      index + 1,
        
         recordId:
  recordId !== null
    ? String(recordId)
    : '',

    recordType:
      getRecordType(record),

    owner:
      owner !== null
        ? cleanAleoValue(owner)
        : '',

    claimRoute:
      claimRoute !== null
        ? cleanAleoValue(claimRoute)
        : '',

    amount:
      amount !== null
        ? cleanAleoValue(amount)
        : '',

    tokenId:
      tokenId !== null
        ? cleanAleoValue(tokenId)
        : '',

    transactionId:
      transactionId !== null
        ? cleanAleoValue(transactionId)
        : '',

    lockRecordId:
      lockRecordId !== null
        ? cleanAleoValue(lockRecordId)
        : '',

    start:
      lockedStart !== null
        ? cleanAleoValue(lockedStart)
        : '',

    end:
      lockedEnd !== null
        ? cleanAleoValue(lockedEnd)
        : '',

    status:
      status !== null
        ? formatStatus(status)
        : '',

    duration,

    program:
      programId || '',

    raw:
      record

  };

}


/* =========================================================
 * CALCULATE DURATION
 *
 * Only calculated when BOTH start and end
 * actually exist in the record.
 * ========================================================= */

function calculateDuration(
  start,
  end
) {

  if (
    start === null ||
    start === undefined ||
    end === null ||
    end === undefined
  ) {

    return '';

  }


  const startText =
    cleanAleoValue(start);

  const endText =
    cleanAleoValue(end);


  if (
    !startText ||
    !endText
  ) {

    return '';

  }


  const startNumber =
    Number(startText);

  const endNumber =
    Number(endText);


  if (
    !Number.isFinite(startNumber) ||
    !Number.isFinite(endNumber)
  ) {

    return '';

  }


  const seconds =
    endNumber - startNumber;


  if (seconds < 0) {
    return '';
  }


  const days =
    seconds / 86400;


  if (
    Number.isInteger(days)
  ) {

    return `${days} Days`;

  }


  return '';

}


/* =========================================================
 * EXTRACT RECORD LIST
 * ========================================================= */

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
    Array.isArray(records.result.records)
  ) {

    return records.result.records;

  }


  return [];

}


/* =========================================================
 * OWNER MATCH
 * ========================================================= */

function recordOwnerMatches(
  record,
  walletAddress
) {

  if (
    !record ||
    !walletAddress
  ) {

    return false;

  }


  const owner =
    getRecordValue(
      record,
      ['owner']
    );


  if (
    owner === null ||
    owner === undefined
  ) {

    return false;

  }


  return (
    cleanAleoValue(owner).toLowerCase() ===
    String(walletAddress).trim().toLowerCase()
  );

}


/* =========================================================
 * REQUEST PRIVATE RECORDS
 *
 * ONLY:
 *
 * adapter.requestRecords(
 *   'vusdc_transaction.aleo'
 * )
 *
 * No Backend.
 * ========================================================= */

async function requestPlaintextRecords(adapter) {

  console.log(
    'AEGIS: Requesting private records from Leo Wallet...'
  );


  if (
    typeof adapter.requestRecords !==
    'function'
  ) {

    throw new Error(
      'Leo Wallet adapter does not expose requestRecords().'
    );

  }


  const allRecords = [];


  for (
    const programId of PROGRAM_IDS
  ) {

    console.log(
      'AEGIS: Requesting records from program:',
      programId
    );


    try {

      const records =
        await adapter.requestRecords(
          programId
        );


      console.log(
        'AEGIS: Records returned from',
        programId,
        records
      );


      const list =
        extractRecordList(records);


      for (
        const record of list
      ) {

        allRecords.push({

          record,

          programId

        });

      }


    } catch (error) {

      console.warn(
        'AEGIS: Could not request records from',
        programId,
        error
      );

    }

  }


  return allRecords;

}


/* =========================================================
 * GET YOUR RECORD
 *
 * CURRENT STEP:
 *
 * 1. Read Transaction ID entered by client.
 * 2. Try searching Aleo Mainnet.
 * 3. Blockchain failure MUST NOT stop Leo Wallet.
 * 4. Continue Leo Wallet lookup.
 * ========================================================= */

async function matchBackendRecord(walletAddress, transactionId) {

  const wallet =
    cleanAleoValue(walletAddress || '');

  const transaction =
    String(transactionId || '').trim();


  if (!wallet || !transaction) {
    return null;
  }


  try {

    const response =
      await fetch(
        `${AEGIS_API_BASE}/api/admin/match`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            owner: wallet,
            transaction: transaction
          })
        }
      );


    if (!response.ok) {

      console.error(
        'AEGIS: Backend match failed:',
        response.status
      );

      return null;

    }


    const data =
      await response.json();


    if (!data.found || !data.record) {

      return null;

    }


    return data.record;


  } catch (error) {

    console.error(
      'AEGIS: Backend record match failed:',
      error
    );

    return null;

  }

}


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


  console.log(
    'AEGIS: Program:',
    PROGRAM_ID
  );


  /* =======================================================
   * STEP 1
   * CLIENT ENTERED TRANSACTION ID
   * ======================================================= */

  const transactionInput =
    document.querySelector(
      '#transaction-id'
    );


  if (!transactionInput) {

    throw new Error(
      'Transaction ID input was not found.'
    );

  }


  const transactionId =
    transactionInput.value.trim();


  if (!transactionId) {

    throw new Error(
      'Please enter a Transaction ID.'
    );

  }


  /* =======================================================
   * STEP 2
   * GET CONNECTED WALLET ADDRESS
   * ======================================================= */

  const walletAddress =
    adapter.account?.address ||
    adapter.account?.publicKey ||
    adapter.publicKey ||
    sessionStorage.getItem('usdcxAddress') ||
    sessionStorage.getItem('walletAddress') ||
    '';


  if (!walletAddress) {

    throw new Error(
      'Please connect your Leo Wallet first.'
    );

  }


  console.log(
    'AEGIS: Connected wallet:',
    walletAddress
  );


  /* =======================================================
   * STEP 3
   * BACKEND OWNER + TRANSACTION MATCH
   *
   * IMPORTANT:
   *
   * No Leo Wallet record request happens before
   * this backend match succeeds.
   *
   * No browser Mainnet transaction lookup.
   * ======================================================= */

  console.log(
    'AEGIS: Checking Backend Owner + Transaction match...'
  );


  const backendRecord =
    await matchBackendRecord(
      walletAddress,
      transactionId
    );


  if (!backendRecord) {

    console.warn(
      'AEGIS: Backend match failed. RECORD NOT FOUND.'
    );


    sessionStorage.removeItem(
      'usdcxSelectedRecord'
    );

    sessionStorage.removeItem(
      'usdcxSelectedAllocation'
    );


    return [];

  }


  console.log(
    'AEGIS: Backend Owner + Transaction MATCH confirmed:',
    backendRecord
  );


  /* =======================================================
   * STEP 4
   * REQUEST PRIVATE RECORDS FROM LEO WALLET
   *
   * This happens ONLY after Backend MATCH.
   * ======================================================= */

  if (!adapter.account) {

    await connectLeoForRecords();

  }


  if (!adapter.account) {

    throw new Error(
      'Leo Wallet connection was not established.'
    );

  }


  const connectedWalletAddress =
    adapter.account?.address ||
    adapter.account?.publicKey ||
    adapter.publicKey ||
    sessionStorage.getItem('usdcxAddress') ||
    sessionStorage.getItem('walletAddress') ||
    '';


  if (!connectedWalletAddress) {

    throw new Error(
      'No connected wallet address available.'
    );

  }


  console.log(
    'AEGIS: Backend matched. Requesting private LockedRecord...'
  );


  const recordList =
    await requestPlaintextRecords(
      adapter
    );


  console.log(
    'AEGIS: Record count:',
    recordList.length
  );


  if (!recordList.length) {

    console.warn(
      'AEGIS: No private records returned.'
    );

    return [];

  }


  /* =======================================================
   * STEP 5
   * ONLY VUSDC LockedRecord OWNED BY CONNECTED WALLET
   * ======================================================= */

  const ownedRecords =
    recordList.filter(
      item =>
        item.programId === PROGRAM_ID &&
        recordOwnerMatches(
          item.record,
          connectedWalletAddress
        )
    );


  console.log(
    'AEGIS: Matching wallet records:',
    ownedRecords.length
  );


  if (!ownedRecords.length) {

    console.warn(
      'AEGIS: Backend matched, but no matching private LockedRecord was found.'
    );

    return [];

  }


  /* =======================================================
   * STEP 6
   * PREFER LockedRecord
   * ======================================================= */

  const lockedRecords =
    ownedRecords.filter(
      item =>
        getRecordType(item.record) ===
        'LockedRecord'
    );


  const selected =
    lockedRecords.length
      ? lockedRecords[0]
      : ownedRecords[0];


  /* =======================================================
   * STEP 7
   * NORMALIZE ACTUAL PRIVATE RECORD
   * ======================================================= */

  const normalized =
    normalizeLockedRecord(
      selected.record,
      0,
      selected.programId
    );


  /* =======================================================
   * STEP 8
   * SAVE PRIVATE RECORD
   *
   * Backend data is kept separate.
   * Record ID = private wallet record.
   * Lock Record ID = backend record.
   * ======================================================= */

  try {

    const walletRecord =
  selected.record?.raw ||
  selected.record?.record ||
  selected.record;

sessionStorage.setItem(
  'usdcxSelectedRecord',
  JSON.stringify(
    walletRecord
  )
);


    sessionStorage.setItem(
      'usdcxSelectedAllocation',
      JSON.stringify(
        normalized
      )
    );


    sessionStorage.setItem(
      'aegisBackendRecord',
      JSON.stringify(
        backendRecord
      )
    );


  } catch (storageError) {

    console.warn(
      'AEGIS: Could not save selected record:',
      storageError
    );

  }


  console.log(
    'AEGIS: Backend MATCH confirmed.'
  );


  console.log(
    'AEGIS: Selected private LockedRecord:',
    normalized
  );


  return [
    normalized
  ];

}

/* =========================================================
 * GLOBAL FUNCTIONS
 * ========================================================= */

window.connectLeoForRecords =
  connectLeoForRecords;

window.getYourRecord =
  getYourRecord;

window.fetchMainnetTransaction =
  fetchMainnetTransaction;

window.shortenAddress =
  shortenAddress;

window.formatStatus =
  formatStatus;


/* =========================================================
 * GET YOUR RECORD BUTTON
 *
 * SAME BUTTON:
 *
 * Client enters Transaction ID
 *            ↓
 * GET YOUR RECORD
 *            ↓
 * Mainnet Transaction Lookup
 *            ↓
 * Leo Wallet Record Lookup
 * ========================================================= */

/* =========================================================
 * VIEW DETAILS
 * ========================================================= */

document
  .querySelectorAll('[data-details]')
  .forEach(button => {

    button.addEventListener(
      'click',
      () => {

        /*
         * Page 3 reads the private record
         * saved by GET YOUR RECORD.
         */

        const selectedRecord =
          sessionStorage.getItem(
            'usdcxSelectedRecord'
          );


        if (!selectedRecord) {

          console.warn(
            'AEGIS: No selected record available for Page 3.'
          );

          return;

        }


        location.href =
          'page3.html';

      }
    );

  });


/* =========================================================
 * DISCONNECT WALLET
 * ========================================================= */

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


        sessionStorage.removeItem(
          'usdcxTransaction'
        );


        sessionStorage.removeItem(
          'usdcxTransactionId'
        );


        location.href =
          'index.html';

      }
    );

  });


/* =========================================================
 * PAGE READY
 * ========================================================= */

console.log(
  'AEGIS: Page ready.'
);

console.log(
  'AEGIS: Program:',
  PROGRAM_ID
);

console.log(
  'AEGIS: Mainnet API:',
  ALEO_MAINNET_API
);

console.log(
  'AEGIS: Decrypt permission:',
  DECRYPT_PERMISSION
);

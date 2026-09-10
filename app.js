```javascript
const PROGRAM_ID = 'usdcx_locked.aleo';

const PROGRAM_IDS = [
  'usdcx_locked.aleo',
  'vusdc_transaction.aleo'
];

const DECRYPT_PERMISSION = 'DECRYPT_UPON_REQUEST';

/* ALEO MAINNET EXPLORER API */

const ALEO_MAINNET_APIS = [
  'https://api.provable.com/v2',
  'https://api.explorer.provable.com/v1'
];

/*
TOKEN ID

Same value used by the old AEGIS Admin.
*/

const TOKEN_ID =
  '6088188135219746443092391282916151282477828391085949070550825603498725268775field';

/* =========================================================
PRIVATE ALLOCATION BACKEND

Amounts are stored outside the public GitHub frontend.
========================================================= */

const AEGIS_API_BASE =
  'https://aegis-backend-72a5.onrender.com';

async function getBackendAllocationAmount(
  walletAddress,
  transactionId
) {
  const wallet =
    cleanAleoValue(walletAddress || '');

  const transaction =
    String(transactionId || '').trim();

  if (!wallet || !transaction) {
    return '';
  }

  try {
    console.log(
      'USDCx LOCKED: Requesting private allocation amount from backend...'
    );

    const response =
      await fetch(
        `${AEGIS_API_BASE}/api/allocation`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            walletAddress: wallet,
            transactionId: transaction
          })
        }
      );

    if (!response.ok) {
      throw new Error(
        `Backend request failed: HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    if (
      !data ||
      !data.found
    ) {
      console.log(
        'USDCx LOCKED: No private allocation amount matched.'
      );

      return '';
    }

    const amount =
      String(data.amount || '').trim();

    console.log(
      'USDCx LOCKED: Private allocation amount received from backend:',
      amount || 'EMPTY'
    );

    return amount;

  } catch (error) {
    console.error(
      'USDCx LOCKED: Backend allocation lookup failed:',
      error
    );

    return '';
  }
}

/* =========================================================
SESSION STATE HELPERS
========================================================= */

/*
Clear only the transaction/record state.

This is deliberately used before every new lookup so that
Wallet B can never inherit Wallet A's selected record.
*/

function clearSelectedRecordState() {
  const keys = [
    'usdcxSelectedRecord',
    'usdcxSelectedAllocation',
    'usdcxExplorerTransaction',
    'usdcxExplorerData',
    'usdcxTransactionId',
    'usdcxTransitionId',
    'usdcxTokenId',
    'usdcxLockRecordId'
  ];

  keys.forEach(key => {
    sessionStorage.removeItem(key);
  });

  console.log(
    'USDCx LOCKED: Previous record/transaction state cleared.'
  );
}

/*
Clear everything related to the previous wallet.

This is used when connecting a different wallet and when
disconnecting.
*/

function clearWalletSessionState() {
  sessionStorage.removeItem('usdcxAddress');
  sessionStorage.removeItem('walletAddress');

  clearSelectedRecordState();

  console.log(
    'USDCx LOCKED: Previous wallet session cleared.'
  );
}

/*
Get the currently connected wallet from the current
session only.
*/

function getCurrentWalletAddress() {
  return cleanAleoValue(
    sessionStorage.getItem('usdcxAddress') ||
    sessionStorage.getItem('walletAddress') ||
    ''
  );
}

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
          getCurrentWalletAddress();

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
            'USDCx LOCKED: Copy failed:',
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
    'USDCx LOCKED: Connecting Leo Wallet...'
  );

  console.log(
    'USDCx LOCKED: Network: MAINNET'
  );

  console.log(
    'USDCx LOCKED: Decrypt permission:',
    DECRYPT_PERMISSION
  );

  /*
  IMPORTANT:

  Capture the old wallet before connecting.

  If Leo Wallet returns a different wallet, all previous
  transaction/record data is immediately invalidated.
  */

  const oldAddress =
    cleanAleoValue(
      sessionStorage.getItem(
        'usdcxAddress'
      ) || ''
    );

  const account =
    await adapter.connect(
      'mainnet',
      DECRYPT_PERMISSION
    );

  console.log(
    'USDCx LOCKED: Leo Wallet connected:',
    account
  );

  const address =
    cleanAleoValue(
      account?.address ||
      account?.publicKey ||
      adapter.publicKey ||
      ''
    );

  if (!address) {
    throw new Error(
      'Leo Wallet connected but no address was returned.'
    );
  }

  /*
  If the newly connected wallet is different from the
  previous wallet, destroy all previous record state.
  */

  if (
    oldAddress &&
    oldAddress !== address
  ) {
    console.log(
      'USDCx LOCKED: Wallet changed.'
    );

    console.log(
      'USDCx LOCKED: Old wallet:',
      oldAddress
    );

    console.log(
      'USDCx LOCKED: New wallet:',
      address
    );

    clearSelectedRecordState();
  }

  /*
  Always store the current wallet.
  */

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

  if (
    record.record &&
    typeof record.record === 'object'
  ) {
    for (
      const name
      of names
    ) {
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

  return (
    status ||
    'UNKNOWN'
  );
}

/* =========================================================
FORMAT DISPLAY AMOUNT
========================================================= */

function formatDisplayAmount(value) {

  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return '';
  }

  const text =
    cleanAleoValue(value);

  if (!text) {
    return '';
  }

  if (text.includes('.')) {
    return text;
  }

  if (/^\d+$/.test(text)) {

    const number =
      Number(text);

    if (
      Number.isSafeInteger(number)
    ) {
      return (
        number / 100
      ).toFixed(2);
    }
  }

  return text;
}

/* =========================================================
NORMALIZE ALLOCATION RECORD
========================================================= */

function normalizeAllocationRecord(
  record,
  index,
  programId = PROGRAM_ID
) {

  const amount =
    getRecordValue(
      record,
      [
        'display_amount',
        'amount',
        'locked_amount'
      ]
    );

  const ticket =
    getRecordValue(
      record,
      [
        'ticket_ref',
        'ticket_reference',
        'ticket'
      ]
    );

  const start =
    getRecordValue(
      record,
      [
        'locked_start',
        'start_time',
        'start'
      ]
    );

  const end =
    getRecordValue(
      record,
      [
        'locked_end',
        'end_time',
        'end'
      ]
    );

  const status =
    getRecordValue(
      record,
      ['status']
    );

  const owner =
    getRecordValue(
      record,
      [
        'owner',
        'owner_address'
      ]
    );

  return {

    allocationNumber:
      index + 1,

    amount:
      formatDisplayAmount(amount),

    ticket:
      ticket !== null
        ? cleanAleoValue(ticket)
        : '',

    start:
      start !== null
        ? cleanAleoValue(start)
        : '',

    end:
      end !== null
        ? cleanAleoValue(end)
        : '',

    status:
      status !== null
        ? formatStatus(status)
        : '',

    owner:
      owner !== null
        ? cleanAleoValue(owner)
        : '',

    raw:
      record,

    program:
      programId
  };
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
EXPLORER
========================================================= */

/* GET TRANSACTION ID FROM PAGE 2 */

function getTransactionInput() {

  const input =
    document.querySelector(
      '#transaction-id'
    );

  if (!input) {
    return '';
  }

  return input.value.trim();
}

/* FETCH TRANSACTION FROM ALEO MAINNET */

async function getExplorerTransaction(
  transactionId
) {

  if (!transactionId) {
    throw new Error(
      'Transaction ID is required.'
    );
  }

  let lastError = null;

  for (
    const apiBase
    of ALEO_MAINNET_APIS
  ) {

    const url =
      `${apiBase}/mainnet/transaction/${encodeURIComponent(transactionId)}`;

    try {

      console.log(
        'USDCx LOCKED: Querying Explorer:',
        url
      );

      const response =
        await fetch(
          url,
          {
            method: 'GET',
            headers: {
              'Accept':
                'application/json'
            }
          }
        );

      if (!response.ok) {
        throw new Error(
          `Explorer returned HTTP ${response.status}`
        );
      }

      const transaction =
        await response.json();

      if (
        !transaction ||
        typeof transaction !== 'object'
      ) {
        throw new Error(
          'Explorer returned invalid transaction data.'
        );
      }

      console.log(
        'USDCx LOCKED: Explorer transaction:',
        transaction
      );

      return transaction;

    } catch (error) {

      lastError =
        error;

      console.warn(
        'USDCx LOCKED: Explorer API failed:',
        apiBase,
        error
      );
    }
  }

  throw (
    lastError ||
    new Error(
      'Could not load transaction from Explorer.'
    )
  );
}

/* =========================================================
GET ALL TRANSACTIONS
========================================================= */

function getExplorerTransitions(
  transaction
) {

  const result = [];

  if (
    transaction?.execution &&
    Array.isArray(
      transaction.execution.transitions
    )
  ) {
    result.push(
      ...transaction.execution.transitions
    );
  }

  if (
    Array.isArray(
      transaction?.transitions
    )
  ) {
    result.push(
      ...transaction.transitions
    );
  }

  if (
    Array.isArray(
      transaction?.execution?.transition
    )
  ) {
    result.push(
      ...transaction.execution.transition
    );
  }

  if (
    transaction?.execution?.transition &&
    typeof transaction.execution.transition === 'object'
  ) {
    result.push(
      transaction.execution.transition
    );
  }

  return result;
}

/* =========================================================
FIND EXACT LOCK TRANSITION
========================================================= */

function findLockTransition(
  transaction
) {

  const transitions =
    getExplorerTransitions(
      transaction
    );

  console.log(
    'USDCx LOCKED: Explorer transitions:',
    transitions
  );

  const lockTransition =
    transitions.find(
      transition => {

        const program =
          transition?.program ||
          transition?.program_id ||
          transition?.programId ||
          '';

        const functionName =
          transition?.function ||
          transition?.function_name ||
          transition?.functionName ||
          '';

        return (
          program ===
            'vusdc_transaction.aleo' &&
          functionName ===
            'lock'
        );
      }
    );

  if (!lockTransition) {
    throw new Error(
      'The transaction does not contain vusdc_transaction.aleo::lock.'
    );
  }

  console.log(
    'USDCx LOCKED: Lock transition found:',
    lockTransition
  );

  return lockTransition;
}

/* =========================================================
EXTRACT A RECORD ID FROM EXPLORER OUTPUT
========================================================= */

function extractRecordIdFromValue(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  if (
    typeof value === 'string'
  ) {

    const match =
      value.match(
        /record1[a-z0-9]+/
      );

    return match
      ? match[0]
      : '';
  }

  if (
    typeof value === 'object'
  ) {

    const possibleValues = [
      value.value,
      value.id,
      value.record,
      value.record_id,
      value.recordId,
      value.output,
      value.data
    ];

    for (
      const possible
      of possibleValues
    ) {

      const found =
        extractRecordIdFromValue(
          possible
        );

      if (found) {
        return found;
      }
    }
  }

  return '';
}

/* =========================================================
EXTRACT LOCK RECORD ID
========================================================= */

function extractLockRecordId(
  lockTransition,
  transitions
) {

  const outputs = [
    ...(lockTransition?.outputs || []),
    ...transitions.flatMap(
      transition =>
        transition?.outputs || []
    )
  ];

  console.log(
    'USDCx LOCKED: Searching all Explorer outputs for Lock Record ID:',
    outputs
  );

  for (
    const output
    of outputs
  ) {

    const values = [
      output?.value,
      output?.record,
      output?.ciphertext,
      output?.id
    ];

    for (
      const value
      of values
    ) {

      if (
        typeof value === 'string' &&
        value.startsWith('record1')
      ) {

        console.log(
          'USDCx LOCKED: Lock Record ID found:',
          value
        );

        return value;
      }

      if (
        typeof value === 'string' &&
        value.includes('record1')
      ) {

        const match =
          value.match(
            /record1[a-z0-9]+/
          );

        if (match) {

          console.log(
            'USDCx LOCKED: Lock Record ID found:',
            match[0]
          );

          return match[0];
        }
      }

      const nestedRecordId =
        extractRecordIdFromValue(
          value
        );

      if (nestedRecordId) {
        return nestedRecordId;
      }
    }
  }

  return '';
}

/* =========================================================
TOKEN ID
========================================================= */

function getTokenId() {
  return TOKEN_ID;
}

/* =========================================================
EXTRACT TRANSITION ID
========================================================= */

function extractTransitionId(
  transition
) {

  return cleanAleoValue(
    transition?.id ||
    transition?.transition_id ||
    transition?.transitionId ||
    ''
  );
}

/* =========================================================
NORMALIZE EXPLORER DATA
========================================================= */

function normalizeExplorerTransaction(
  transaction,
  transactionId
) {

  const transitions =
    getExplorerTransitions(
      transaction
    );

  const lockTransition =
    findLockTransition(
      transaction
    );

  const transitionId =
    extractTransitionId(
      lockTransition
    );

  const lockRecordId =
    extractLockRecordId(
      lockTransition,
      transitions
    );

  const tokenId =
    getTokenId();

  return {

    transactionId:
      transaction?.id ||
      transaction?.transaction_id ||
      transactionId,

    transitionId,

    program:
      lockTransition?.program ||
      lockTransition?.program_id ||
      lockTransition?.programId ||
      'vusdc_transaction.aleo',

    function:
      lockTransition?.function ||
      lockTransition?.function_name ||
      lockTransition?.functionName ||
      'lock',

    tokenId,

    lockRecordId,

    rawTransition:
      lockTransition,

    rawTransaction:
      transaction
  };
}

/* =========================================================
SAVE EXPLORER DATA
========================================================= */

function saveExplorerTransaction(
  explorerData
) {

  try {

    sessionStorage.setItem(
      'usdcxExplorerTransaction',
      JSON.stringify(
        explorerData.rawTransaction
      )
    );

    sessionStorage.setItem(
      'usdcxTransactionId',
      explorerData.transactionId || ''
    );

    sessionStorage.setItem(
      'usdcxTransitionId',
      explorerData.transitionId || ''
    );

    sessionStorage.setItem(
      'usdcxTokenId',
      explorerData.tokenId || ''
    );

    sessionStorage.setItem(
      'usdcxLockRecordId',
      explorerData.lockRecordId || ''
    );

    sessionStorage.setItem(
      'usdcxExplorerData',
      JSON.stringify(
        explorerData
      )
    );

    console.log(
      'USDCx LOCKED: Explorer data saved:',
      explorerData
    );

  } catch (error) {

    console.warn(
      'USDCx LOCKED: Could not save Explorer data:',
      error
    );
  }
}

/* =========================================================
REQUEST PRIVATE RECORDS
========================================================= */

async function requestPlaintextRecords(
  adapter
) {

  console.log(
    'USDCx LOCKED: Requesting records from Leo Wallet...'
  );

  if (
    typeof adapter.requestRecords !==
    'function'
  ) {
    throw new Error(
      'Leo Wallet adapter does not expose requestRecords().'
    );
  }

  console.log(
    'USDCx LOCKED: Calling requestRecords(program)...'
  );

  const allRecords = [];

  for (
    const programId
    of PROGRAM_IDS
  ) {

    console.log(
      'USDCx LOCKED: Requesting records from program:',
      programId
    );

    try {

      const records =
        await adapter.requestRecords(
          programId
        );

      console.log(
        'USDCx LOCKED: Records returned from',
        programId,
        records
      );

      const list =
        extractRecordList(
          records
        );

      for (
        const record
        of list
      ) {

        allRecords.push({
          record,
          programId
        });
      }

    } catch (error) {

      console.warn(
        'USDCx LOCKED: Could not request records from',
        programId,
        error
      );
    }
  }

  return allRecords;
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
    'USDCx LOCKED: GET YOUR RECORD'
  );

  /*
  IMPORTANT:

  Every new Get Your Record operation starts clean.

  This prevents Wallet A's selected record from surviving
  into a new lookup.
  */

  clearSelectedRecordState();

  /*
  STEP 1
  Read Transaction ID entered by user.
  */

  const transactionId =
    getTransactionInput();

  if (!transactionId) {
    throw new Error(
      'Please enter the Transaction ID first.'
    );
  }

  console.log(
    'USDCx LOCKED: Transaction ID:',
    transactionId
  );

  /*
  STEP 2
  Search the transaction in Aleo Mainnet Explorer.
  */

  const explorerTransaction =
    await getExplorerTransaction(
      transactionId
    );

  /*
  STEP 3
  Find:
  vusdc_transaction.aleo::lock
  */

  const explorerData =
    normalizeExplorerTransaction(
      explorerTransaction,
      transactionId
    );

  /*
  STEP 4
  Make sure the Lock Record ID
  was actually found.
  */

  if (
    !explorerData.lockRecordId
  ) {

    console.warn(
      'USDCx LOCKED: No Lock Record ID was found in Explorer outputs.'
    );
  }

  if (
    !explorerData.tokenId
  ) {

    console.warn(
      'USDCx LOCKED: Token ID is not available.'
    );
  }

  /*
  STEP 5
  Make sure Leo Wallet is connected.
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
    'USDCx LOCKED: Current wallet:',
    currentAddress
  );

  /*
  Make absolutely sure the session wallet is the same
  wallet currently reported by Leo Wallet.
  */

  const sessionWallet =
    getCurrentWalletAddress();

  if (
    sessionWallet &&
    sessionWallet !== currentAddress
  ) {

    console.warn(
      'USDCx LOCKED: Session wallet differs from current Leo Wallet.'
    );

    clearSelectedRecordState();

    sessionStorage.setItem(
      'usdcxAddress',
      currentAddress
    );

    sessionStorage.setItem(
      'walletAddress',
      currentAddress
    );
  }

  /*
  ========================================================
  STEP 6
  WALLET <-> TRANSACTION VALIDATION

  The transaction is accepted ONLY when the exact
  connected wallet + transaction pair exists in the
  private backend.

  Wallet A + Transaction A = ACCEPT
  Wallet A + Transaction B = REJECT
  Wallet B + Transaction A = REJECT
  Wallet B + Transaction B = ACCEPT
  ========================================================
  */

  const backendAmount =
    await getBackendAllocationAmount(
      currentAddress,
      explorerData.transactionId
    );

  if (!backendAmount) {

    console.warn(
      'USDCx LOCKED: Wallet + Transaction mismatch. Record rejected.'
    );

    clearSelectedRecordState();

    return [];
  }

  console.log(
    'USDCx LOCKED: Wallet + Transaction MATCHED.'
  );

  console.log(
    'USDCx LOCKED: Private backend amount:',
    backendAmount
  );

  /*
  STEP 7

  Only after the Wallet + Transaction pair
  has passed validation, save Explorer information.
  */

  saveExplorerTransaction(
    explorerData
  );

  /*
  STEP 8
  Get private records from Leo Wallet.
  */

  const recordList =
    await requestPlaintextRecords(
      adapter
    );

  console.log(
    'USDCx LOCKED: Total records returned:',
    recordList.length
  );

  if (!recordList.length) {

    console.log(
      'USDCx LOCKED: No records found.'
    );

    clearSelectedRecordState();

    return [];
  }

  /*
  STEP 9
  Match records to connected wallet.
  */

  const matchingRecords =
    recordList.filter(
      item => {

        const owner =
          getRecordValue(
            item.record,
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
          'USDCx LOCKED: Checking record owner:',
          cleanOwner,
          'MATCH:',
          matches,
          'PROGRAM:',
          item.programId
        );

        return matches;
      }
    );

  console.log(
    'USDCx LOCKED: Records matching current wallet:',
    matchingRecords.length
  );

  if (!matchingRecords.length) {

    console.log(
      'USDCx LOCKED: No record belongs to the current wallet.'
    );

    clearSelectedRecordState();

    return [];
  }

  /*
  STEP 10
  Normalize private allocation.
  */

  const allocations =
    matchingRecords.map(
      (item, index) =>
        normalizeAllocationRecord(
          item.record,
          index,
          item.programId
        )
    );

  /*
  STEP 11
  Attach Explorer data to selected allocation.
  */

  if (allocations[0]) {

    allocations[0].transactionId =
      explorerData.transactionId;

    allocations[0].transitionId =
      explorerData.transitionId;

    allocations[0].tokenId =
      explorerData.tokenId ||
      TOKEN_ID;

    allocations[0].lockRecordId =
      explorerData.lockRecordId;

    allocations[0].explorer =
      explorerData;

    allocations[0].program =
      'vusdc_transaction.aleo';

    allocations[0].function =
      'lock';

    /*
    PRIVATE BACKEND AMOUNT

    The amount has already been validated
    against BOTH:

    1. connected wallet
    2. transaction ID

    Therefore use the validated backend value.
    */

    allocations[0].amount =
      String(backendAmount);

    /*
    Store the wallet that was actually used to
    create this selected allocation.

    Page 3 can use this value to reject stale
    information from another wallet.
    */

    allocations[0].walletAddress =
      currentAddress;

    console.log(
      'USDCx LOCKED: Backend amount for wallet + transaction:',
      allocations[0].amount || 'NOT FOUND'
    );
  }

  /*
  STEP 12
  Save selected private record.
  */

  try {

    sessionStorage.setItem(
      'usdcxSelectedRecord',
      JSON.stringify(
        allocations[0].raw
      )
    );

    sessionStorage.setItem(
      'usdcxSelectedAllocation',
      JSON.stringify(
        allocations[0]
      )
    );

    /*
    Save the wallet that owns this selection.
    */

    sessionStorage.setItem(
      'usdcxSelectedWallet',
      currentAddress
    );

    /*
    Transaction-specific Explorer data.
    */

    sessionStorage.setItem(
      'usdcxTransactionId',
      explorerData.transactionId || ''
    );

    sessionStorage.setItem(
      'usdcxTransitionId',
      explorerData.transitionId || ''
    );

    sessionStorage.setItem(
      'usdcxTokenId',
      explorerData.tokenId ||
      TOKEN_ID
    );

    sessionStorage.setItem(
      'usdcxLockRecordId',
      explorerData.lockRecordId || ''
    );

  } catch (storageError) {

    console.warn(
      'USDCx LOCKED: Could not save selected record:',
      storageError
    );

    clearSelectedRecordState();

    return [];
  }

  console.log(
    'USDCx LOCKED: Selected wallet record:',
    allocations[0]
  );

  console.log(
    'USDCx LOCKED: Explorer Transaction:',
    explorerData.transactionId
  );

  console.log(
    'USDCx LOCKED: Explorer Transition:',
    explorerData.transitionId
  );

  console.log(
    'USDCx LOCKED: Explorer Token ID:',
    explorerData.tokenId
  );

  console.log(
    'USDCx LOCKED: Lock Record ID:',
    explorerData.lockRecordId
  );

  console.log(
    'USDCx LOCKED: Selected wallet:',
    currentAddress
  );

  console.log(
    'USDCx LOCKED: Allocations:',
    allocations
  );

  return allocations;
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

window.clearSelectedRecordState =
  clearSelectedRecordState;

/* =========================================================
VIEW DETAILS
========================================================= */

document
  .querySelectorAll('[data-details]')
  .forEach(button => {

    button.addEventListener(
      'click',
      () => {

        /*
        Get the wallet that is currently connected.
        */

        const currentWallet =
          getCurrentWalletAddress();

        /*
        Get the wallet that originally created
        the currently selected allocation.
        */

        const selectedWallet =
          cleanAleoValue(
            sessionStorage.getItem(
              'usdcxSelectedWallet'
            ) || ''
          );

        const selectedRecord =
          sessionStorage.getItem(
            'usdcxSelectedRecord'
          );

        const selectedAllocation =
          sessionStorage.getItem(
            'usdcxSelectedAllocation'
          );

        /*
        No selected record = do not open Page 3.
        */

        if (
          !selectedRecord ||
          !selectedAllocation
        ) {

          console.warn(
            'USDCx LOCKED: No selected record available for Page 3.'
          );

          return;
        }

        /*
        CRITICAL SECURITY/STATE CHECK:

        If the selected record belongs to another wallet,
        destroy it instead of opening Page 3.
        */

        if (
          !currentWallet ||
          !selectedWallet ||
          currentWallet !== selectedWallet
        ) {

          console.warn(
            'USDCx LOCKED: Selected record does not belong to the current wallet.'
          );

          console.warn(
            'USDCx LOCKED: Current wallet:',
            currentWallet
          );

          console.warn(
            'USDCx LOCKED: Selected wallet:',
            selectedWallet
          );

          clearSelectedRecordState();

          sessionStorage.removeItem(
            'usdcxSelectedWallet'
          );

          return;
        }

        /*
        Verify the allocation itself also contains
        the same wallet.
        */

        try {

          const allocation =
            JSON.parse(
              selectedAllocation
            );

          const allocationWallet =
            cleanAleoValue(
              allocation?.walletAddress ||
              ''
            );

          if (
            !allocationWallet ||
            allocationWallet !== currentWallet
          ) {

            console.warn(
              'USDCx LOCKED: Allocation wallet validation failed.'
            );

            clearSelectedRecordState();

            sessionStorage.removeItem(
              'usdcxSelectedWallet'
            );

            return;
          }

        } catch (error) {

          console.warn(
            'USDCx LOCKED: Selected allocation is invalid.',
            error
          );

          clearSelectedRecordState();

          sessionStorage.removeItem(
            'usdcxSelectedWallet'
          );

          return;
        }

        /*
        Only now is Page 3 allowed to open.
        */

        console.log(
          'USDCx LOCKED: Opening Page 3 for wallet:',
          currentWallet
        );

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
              'USDCx LOCKED: Disconnecting Leo Wallet...'
            );

            await adapter.disconnect();
          }

        } catch (error) {

          console.warn(
            'USDCx LOCKED: Wallet disconnect warning:',
            error
          );
        }

        /*
        Completely destroy the previous wallet session.
        */

        clearWalletSessionState();

        sessionStorage.removeItem(
          'usdcxSelectedWallet'
        );

        updateWalletDisplay('');

        location.href =
          'index.html';
      }
    );
  });

/* =========================================================
PAGE READY
========================================================= */

console.log(
  'USDCx LOCKED: Page ready.'
);

console.log(
  'USDCx LOCKED: Program:',
  PROGRAM_ID
);

console.log(
  'USDCx LOCKED: Decrypt permission:',
  DECRYPT_PERMISSION
);
```

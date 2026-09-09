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

/* WALLET ADDRESS */
const connected =
  sessionStorage.getItem('usdcxAddress') || '';

function shortenAddress(address) {
  if (!address) return 'Not connected';
  if (address.length <= 16) return address;
  return address.slice(0, 10) + '...' + address.slice(-4);
}

function updateWalletDisplay(address) {
  document.querySelectorAll('[data-wallet]').forEach(el => {
    el.textContent = shortenAddress(address);
    el.setAttribute('title', address || '');
  });
}

updateWalletDisplay(connected);

/* COPY WALLET */
document.querySelectorAll('[data-copy]').forEach(button => {
  button.addEventListener('click', async () => {
    const address =
      sessionStorage.getItem('usdcxAddress') || '';

    if (!address) return;

    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(address);

      const original = button.innerHTML;
      button.innerHTML = '✓';

      setTimeout(() => {
        button.innerHTML = original;
      }, 1200);

    } catch (error) {
      console.warn(
        'USDCx LOCKED: Copy failed:',
        error
      );
    }
  });
});

/* CONNECT LEO WALLET */
async function connectLeoForRecords() {
  const adapter = window.usdcxLeoAdapter;

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

/* RECORD VALUE HELPER */
function getRecordValue(record, names) {
  if (!record) return null;

  for (const name of names) {
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
    for (const name of names) {
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

/* CLEAN ALEO VALUE */
function cleanAleoValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return '';
  }

  let text = String(value).trim();

  text = text.replace(
    /^"(.*)"$/,
    '$1'
  );

  text = text.replace(
    /\.(private|public)$/i,
    ''
  );

  text = text.replace(
    /(u8|u16|u32|u64|u128|u256|field|group|scalar)$/i,
    ''
  );

  return text.trim();
}

/* FORMAT STATUS */
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

  return status || 'UNKNOWN';
}

/* FORMAT DISPLAY AMOUNT */
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

  if (!text) return '';

  if (text.includes('.')) {
    return text;
  }

  if (/^\d+$/.test(text)) {
    const number = Number(text);

    if (Number.isSafeInteger(number)) {
      return (
        number / 100
      ).toFixed(2);
    }
  }

  return text;
}

/* NORMALIZE ALLOCATION RECORD */
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

  return {
    allocationNumber: index + 1,

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

    raw: record,

    program: programId
  };
}

/* EXTRACT RECORD LIST */
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
        await fetch(url, {
          method: 'GET',
          headers: {
            'Accept':
              'application/json'
          }
        });

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
      lastError = error;

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

/* GET ALL TRANSACTIONS */
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

/* FIND EXACT LOCK TRANSITION */
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

/* EXTRACT A RECORD ID FROM EXPLORER OUTPUT */
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

/* EXTRACT LOCK RECORD ID */
function extractLockRecordId(
  transition
) {
  const outputs =
    Array.isArray(
      transition?.outputs
    )
      ? transition.outputs
      : [];

  console.log(
    'USDCx LOCKED: Lock outputs:',
    outputs
  );

  /*
    The lock transition creates the
    private LockedRecord.

    Search every output instead of
    assuming a fixed output number.
  */

  for (
    const output
    of outputs
  ) {
    const recordId =
      extractRecordIdFromValue(
        output
      );

    if (recordId) {
      console.log(
        'USDCx LOCKED: Lock Record ID found:',
        recordId
      );

      return recordId;
    }
  }

  /*
    Defensive fallback for different
    Explorer response structures.
  */

  const candidates = [
    transition?.record,
    transition?.record_id,
    transition?.recordId,
    transition?.records
  ];

  for (
    const candidate
    of candidates
  ) {
    const recordId =
      extractRecordIdFromValue(
        candidate
      );

    if (recordId) {
      console.log(
        'USDCx LOCKED: Lock Record ID found:',
        recordId
      );

      return recordId;
    }
  }

  return '';
}

/* =========================================================
   EXTRACT TOKEN ID FROM EXPLORER
   ========================================================= */

function isLikelyTokenId(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return false;
  }

  const text =
    String(value).trim();

  /*
    Aleo token IDs are field values.
    Do not accept record ciphertext,
    transition IDs, or transaction IDs.
  */

  return /^\d+field$/.test(text);
}

function extractTokenIdFromValue(
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
    const direct =
      value.trim();

    if (
      isLikelyTokenId(
        direct
      )
    ) {
      return direct;
    }

    /*
      Search nested textual structures
      for an Aleo field value.
    */

    const matches =
      direct.match(
        /\b\d+field\b/g
      );

    if (matches?.length) {
      /*
        Ignore fields that are clearly
        unrelated to token identification.
        The caller performs contextual
        validation as well.
      */

      return matches[0];
    }

    return '';
  }

  if (
    Array.isArray(value)
  ) {
    for (
      const item
      of value
    ) {
      const found =
        extractTokenIdFromValue(
          item
        );

      if (found) {
        return found;
      }
    }

    return '';
  }

  if (
    typeof value === 'object'
  ) {
    const priorityKeys = [
      'token_id',
      'tokenId',
      'tokenID',
      'token',
      'token_id_field',
      'tokenIdField'
    ];

    for (
      const key
      of priorityKeys
    ) {
      if (
        value[key] !== undefined &&
        value[key] !== null
      ) {
        const candidate =
          extractTokenIdFromValue(
            value[key]
          );

        if (
          candidate &&
          isLikelyTokenId(
            candidate
          )
        ) {
          return candidate;
        }
      }
    }

    /*
      Search common Explorer fields.
    */

    const commonKeys = [
      'value',
      'data',
      'input',
      'inputs',
      'output',
      'outputs',
      'arguments',
      'record',
      'record_id',
      'recordId',
      'ciphertext'
    ];

    for (
      const key
      of commonKeys
    ) {
      if (
        value[key] !== undefined &&
        value[key] !== null
      ) {
        const found =
          extractTokenIdFromValue(
            value[key]
          );

        if (
          found &&
          isLikelyTokenId(
            found
          )
        ) {
          return found;
        }
      }
    }
  }

  return '';
}

/*
  Search the transaction specifically
  for a publicly readable Token ID.

  We inspect the lock transition first,
  then the token_registry transfer
  transition, then the complete
  transaction object.
*/
function extractTokenIdFromExplorer(
  transaction,
  lockTransition
) {
  console.log(
    'USDCx LOCKED: Searching Explorer transaction for Token ID...'
  );

  /*
    1. Search lock transition.
  */

  const fromLock =
    extractTokenIdFromValue(
      lockTransition
    );

  if (
    fromLock &&
    isLikelyTokenId(fromLock)
  ) {
    console.log(
      'USDCx LOCKED: Token ID found in lock transition:',
      fromLock
    );

    return fromLock;
  }

  /*
    2. Search token_registry transfer
       transition.
  */

  const transitions =
    getExplorerTransitions(
      transaction
    );

  const transferTransition =
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
            'token_registry.aleo' &&
          functionName ===
            'transfer_private'
        );
      }
    );

  if (transferTransition) {
    console.log(
      'USDCx LOCKED: token_registry transfer transition found:',
      transferTransition
    );

    const fromTransfer =
      extractTokenIdFromValue(
        transferTransition
      );

    if (
      fromTransfer &&
      isLikelyTokenId(fromTransfer)
    ) {
      console.log(
        'USDCx LOCKED: Token ID found in transfer transition:',
        fromTransfer
      );

      return fromTransfer;
    }
  }

  /*
    3. Search transaction-level
       public fields.
  */

  const transactionCandidates = [
    transaction?.token_id,
    transaction?.tokenId,
    transaction?.token,
    transaction?.asset,
    transaction?.asset_id
  ];

  for (
    const candidate
    of transactionCandidates
  ) {
    const found =
      extractTokenIdFromValue(
        candidate
      );

    if (
      found &&
      isLikelyTokenId(found)
    ) {
      console.log(
        'USDCx LOCKED: Token ID found in transaction:',
        found
      );

      return found;
    }
  }

  /*
    4. Last defensive search through
       the complete public transaction.
  */

  const completeSearch =
    extractTokenIdFromValue(
      transaction
    );

  if (
    completeSearch &&
    isLikelyTokenId(
      completeSearch
    )
  ) {
    console.log(
      'USDCx LOCKED: Token ID found in Explorer JSON:',
      completeSearch
    );

    return completeSearch;
  }

  console.warn(
    'USDCx LOCKED: Token ID is not publicly readable in this Explorer transaction.'
  );

  return '';
}

/* EXTRACT TRANSITION ID */
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

/* NORMALIZE EXPLORER DATA */
function normalizeExplorerTransaction(
  transaction,
  transactionId
) {
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
      lockTransition
    );

  const tokenId =
    extractTokenIdFromExplorer(
      transaction,
      lockTransition
    );

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

/* SAVE EXPLORER DATA */
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

  /*
    Token ID is now obtained from
    Explorer transaction data.
  */

  if (
    !explorerData.tokenId
  ) {
    console.warn(
      'USDCx LOCKED: Explorer did not expose a public Token ID for this transaction.'
    );
  }

  /*
    STEP 5
    Save Explorer information.
  */

  saveExplorerTransaction(
    explorerData
  );

  /*
    STEP 6
    Connect Leo Wallet if needed.
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
    STEP 7
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

    return [];
  }

  /*
    STEP 8
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

    return [];
  }

  /*
    STEP 9
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
    STEP 10
    Attach Explorer data to selected allocation.
  */

  if (allocations[0]) {
    allocations[0].transactionId =
      explorerData.transactionId;

    allocations[0].transitionId =
      explorerData.transitionId;

    allocations[0].tokenId =
      explorerData.tokenId || '';

    allocations[0].lockRecordId =
      explorerData.lockRecordId;

    allocations[0].explorer =
      explorerData;

    allocations[0].program =
      'vusdc_transaction.aleo';

    allocations[0].function =
      'lock';
  }

  /*
    STEP 11
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
      explorerData.tokenId || ''
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
    explorerData.tokenId || 'NOT PUBLIC'
  );

  console.log(
    'USDCx LOCKED: Lock Record ID:',
    explorerData.lockRecordId
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
            'USDCx LOCKED: No selected record available for Page 3.'
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
          'usdcxExplorerTransaction'
        );

        sessionStorage.removeItem(
          'usdcxExplorerData'
        );

        sessionStorage.removeItem(
          'usdcxTransactionId'
        );

        sessionStorage.removeItem(
          'usdcxTransitionId'
        );

        sessionStorage.removeItem(
          'usdcxTokenId'
        );

        sessionStorage.removeItem(
          'usdcxLockRecordId'
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

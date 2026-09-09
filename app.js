const PROGRAM_ID = 'usdcx_locked.aleo';

const PROGRAM_IDS = [
  'usdcx_locked.aleo',
  'vusdc_transaction.aleo'
];

const DECRYPT_PERMISSION = 'DECRYPT_UPON_REQUEST';


/* =========================================================
 * ALEO MAINNET EXPLORER
 * ========================================================= */

const ALEO_MAINNET_API =
  'https://api.explorer.provable.com/v1';


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

  document.querySelectorAll('[data-wallet]').forEach(el => {

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

document.querySelectorAll('[data-copy]').forEach(button => {

  button.addEventListener('click', async () => {

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

      await navigator.clipboard.writeText(address);

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

  });

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


  /* Remove surrounding quotes */

  text =
    text.replace(
      /^"(.*)"$/,
      '$1'
    );


  /*
   * Remove Leo type suffix.
   *
   * Handles:
   *
   * u8
   * u16
   * u32
   * u64
   * u128
   * u256
   * field
   * group
   * scalar
   *
   * Also handles:
   *
   * .private
   * .public
   */

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
 * EXPLORER TRANSACTION ID
 * ========================================================= */

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


/* =========================================================
 * GET ALEO MAINNET TRANSACTION
 * ========================================================= */

async function getExplorerTransaction(
  transactionId
) {

  const id =
    String(transactionId || '').trim();


  if (!id) {

    throw new Error(
      'Please enter the Transaction ID first.'
    );

  }


  console.log(
    'USDCx LOCKED: Searching Aleo Mainnet transaction:',
    id
  );


  const url =
    ALEO_MAINNET_API +
    '/mainnet/transaction/' +
    encodeURIComponent(id);


  const response =
    await fetch(
      url,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      }
    );


  if (!response.ok) {

    let details = '';

    try {

      details =
        await response.text();

    } catch (_) {

      details = '';

    }


    throw new Error(
      'Explorer transaction lookup failed (' +
      response.status +
      '). ' +
      details
    );

  }


  const transaction =
    await response.json();


  if (!transaction) {

    throw new Error(
      'Explorer returned an empty transaction.'
    );

  }


  console.log(
    'USDCx LOCKED: Explorer transaction:',
    transaction
  );


  return transaction;

}


/* =========================================================
 * GET TRANSACTION ID FROM EXPLORER RESPONSE
 * ========================================================= */

function getExplorerTransactionId(
  transaction,
  fallback
) {

  return (
    transaction?.id ||
    transaction?.transaction_id ||
    transaction?.transactionId ||
    fallback ||
    ''
  );

}


/* =========================================================
 * FIND VUSDC LOCK TRANSITION
 * ========================================================= */

function findLockTransition(
  transaction
) {

  if (!transaction) {
    return null;
  }


  const transitions = [];


  /*
   * Normal Aleo execution transaction.
   */

  if (
    transaction.execution &&
    Array.isArray(
      transaction.execution.transitions
    )
  ) {

    transitions.push(
      ...transaction.execution.transitions
    );

  }


  /*
   * Defensive support for responses where
   * transitions are returned at top level.
   */

  if (
    Array.isArray(
      transaction.transitions
    )
  ) {

    transitions.push(
      ...transaction.transitions
    );

  }


  /*
   * Defensive support for a single transition.
   */

  if (
    transaction.execution &&
    transaction.execution.transition
  ) {

    transitions.push(
      transaction.execution.transition
    );

  }


  console.log(
    'USDCx LOCKED: Explorer transitions:',
    transitions
  );


  /*
   * Exact match only.
   *
   * We do NOT select another program/function.
   */

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

    console.warn(
      'USDCx LOCKED: vusdc_transaction.aleo::lock transition was not found.'
    );

    return null;

  }


  console.log(
    'USDCx LOCKED: Lock transition found:',
    lockTransition
  );


  return lockTransition;

}


/* =========================================================
 * EXTRACT PUBLIC EXPLORER METADATA
 * ========================================================= */

function normalizeExplorerTransaction(
  transaction,
  transactionId
) {

  const transition =
    findLockTransition(
      transaction
    );


  const realTransactionId =
    getExplorerTransactionId(
      transaction,
      transactionId
    );


  /*
   * If the transaction exists but does not contain
   * our lock transition, keep the transaction itself
   * but mark the lock transition as missing.
   */

  if (!transition) {

    return {

      transactionId:
        realTransactionId,

      transitionId:
        '',

      program:
        '',

      function:
        '',

      tokenId:
        '',

      lockRecordId:
        '',

      transition:
        null,

      transaction:
        transaction

    };

  }


  const transitionId =
    transition.id ||
    transition.transition_id ||
    transition.transitionId ||
    '';


  /*
   * IMPORTANT:
   *
   * Token ID and Lock Record ID are private values
   * unless the Explorer response actually exposes them.
   *
   * We NEVER manufacture them.
   */

  const tokenId =
    transition.token_id ||
    transition.tokenId ||
    '';


  const lockRecordId =
    transition.record_id ||
    transition.recordId ||
    transition.lock_record_id ||
    transition.lockRecordId ||
    '';


  return {

    transactionId:
      realTransactionId,

    transitionId:
      transitionId,

    program:
      transition.program ||
      transition.program_id ||
      transition.programId ||
      'vusdc_transaction.aleo',

    function:
      transition.function ||
      transition.function_name ||
      transition.functionName ||
      'lock',

    tokenId:
      tokenId,

    lockRecordId:
      lockRecordId,

    transition:
      transition,

    transaction:
      transaction

  };

}


/* =========================================================
 * SAVE EXPLORER DATA
 * ========================================================= */

function saveExplorerTransaction(
  data
) {

  try {

    sessionStorage.setItem(
      'usdcxExplorerTransaction',
      JSON.stringify(data)
    );


    if (data.transactionId) {

      sessionStorage.setItem(
        'usdcxTransactionId',
        data.transactionId
      );

    }


    if (data.transitionId) {

      sessionStorage.setItem(
        'usdcxTransitionId',
        data.transitionId
      );

    }


    if (data.tokenId) {

      sessionStorage.setItem(
        'usdcxTokenId',
        data.tokenId
      );

    }


    if (data.lockRecordId) {

      sessionStorage.setItem(
        'usdcxLockRecordId',
        data.lockRecordId
      );

    }


    console.log(
      'USDCx LOCKED: Explorer data saved:',
      data
    );


  } catch (error) {

    console.warn(
      'USDCx LOCKED: Could not save Explorer data:',
      error
    );

  }

}


/* =========================================================
 * FORMAT STATUS
 *
 * IMPORTANT:
 *
 * The blockchain record keeps the original numeric value.
 *
 * status = 1
 *       ↓
 * Frontend display
 *       ↓
 * LOCKED
 *
 * We do NOT modify the raw Aleo record.
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


  return status || 'UNKNOWN';

}


/* =========================================================
 * FORMAT DISPLAY AMOUNT
 *
 * USDCx DISPLAY SCALE
 * ========================================================= */

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


  /*
   * Already decimal.
   *
   * Do not modify it.
   */

  if (text.includes('.')) {

    return text;

  }


  /*
   * Integer display value.
   *
   * USDCx allocation display uses /100.
   */

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
 * NORMALIZE ALLOCATION RECORD
 * ========================================================= */

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
      [
        'status'
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

    raw:
      record,

    program:
      programId

  };

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
 * REQUEST RECORDS
 *
 * IMPORTANT:
 *
 * ONLY:
 *
 * adapter.requestRecords(
 *   PROGRAM_ID
 * );
 *
 * ========================================================= */

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
    const programId of PROGRAM_IDS
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
        const record of list
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
 * GET YOUR RECORD
 * ========================================================= */

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

  console.log(
    'USDCx LOCKED: Program:',
    PROGRAM_ID
  );


  /* =======================================================
   * STEP 1
   * SEARCH TRANSACTION IN ALEO MAINNET EXPLORER
   * ======================================================= */

  const transactionId =
    getTransactionInput();


  if (!transactionId) {

    throw new Error(
      'Please enter the Transaction ID first.'
    );

  }


  const explorerTransaction =
    await getExplorerTransaction(
      transactionId
    );


  const explorerData =
    normalizeExplorerTransaction(
      explorerTransaction,
      transactionId
    );


  /*
   * The entered transaction must actually contain:
   *
   * vusdc_transaction.aleo::lock
   *
   * We do not accept another program/function.
   */

  if (
    explorerData.program !==
      'vusdc_transaction.aleo' ||
    explorerData.function !==
      'lock'
  ) {

    throw new Error(
      'The Transaction ID does not contain a vusdc_transaction.aleo::lock transition.'
    );

  }


  saveExplorerTransaction(
    explorerData
  );


  console.log(
    'USDCx LOCKED: Explorer lookup successful.'
  );


  console.log(
    'USDCx LOCKED: Transaction ID:',
    explorerData.transactionId
  );


  console.log(
    'USDCx LOCKED: Transition ID:',
    explorerData.transitionId
  );


  console.log(
    'USDCx LOCKED: Token ID:',
    explorerData.tokenId || 'PRIVATE / NOT EXPOSED'
  );


  console.log(
    'USDCx LOCKED: Lock Record ID:',
    explorerData.lockRecordId || 'PRIVATE / NOT EXPOSED'
  );


  /* =======================================================
   * STEP 2
   * CONNECT IF NECESSARY
   * ======================================================= */

  if (!adapter.account) {

    await connectLeoForRecords();

  }


  if (!adapter.account) {

    throw new Error(
      'Leo Wallet connection was not established.'
    );

  }


  /*
   * Get the CURRENT wallet address.
   */

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


  /* =======================================================
   * STEP 3
   * REQUEST PRIVATE RECORDS FROM LEO WALLET
   * ======================================================= */

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


  /* =======================================================
   * STEP 4
   * MATCH CURRENT WALLET OWNER
   * ======================================================= */

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


  /* =======================================================
   * STEP 5
   * NORMALIZE WALLET RECORD
   * ======================================================= */

  const allocations =
    matchingRecords.map(
      (item, index) =>
        normalizeAllocationRecord(
          item.record,
          index,
          item.programId
        )
    );


  /* =======================================================
   * STEP 6
   * ATTACH REAL EXPLORER DATA
   *
   * Nothing is fabricated.
   * Private values remain private.
   * ======================================================= */

  allocations[0].transactionId =
    explorerData.transactionId || '';


  allocations[0].transitionId =
    explorerData.transitionId || '';


  allocations[0].tokenId =
    explorerData.tokenId || '';


  allocations[0].lockRecordId =
    explorerData.lockRecordId || '';


  allocations[0].explorer =
    explorerData;


  /* =======================================================
   * STEP 7
   * SAVE SELECTED RECORD
   * ======================================================= */

  try {

    /*
     * Original raw private record.
     */

    sessionStorage.setItem(
      'usdcxSelectedRecord',
      JSON.stringify(
        allocations[0].raw
      )
    );


    /*
     * Normalized allocation.
     */

    sessionStorage.setItem(
      'usdcxSelectedAllocation',
      JSON.stringify(
        allocations[0]
      )
    );


    /*
     * Full Explorer response metadata.
     */

    sessionStorage.setItem(
      'usdcxExplorerTransaction',
      JSON.stringify(
        explorerData
      )
    );


    /*
     * Transaction ID.
     */

    sessionStorage.setItem(
      'usdcxTransactionId',
      explorerData.transactionId
    );


    /*
     * Transition ID if available.
     */

    if (
      explorerData.transitionId
    ) {

      sessionStorage.setItem(
        'usdcxTransitionId',
        explorerData.transitionId
      );

    }


    /*
     * Token ID only when genuinely returned.
     */

    if (
      explorerData.tokenId
    ) {

      sessionStorage.setItem(
        'usdcxTokenId',
        explorerData.tokenId
      );

    }


    /*
     * Lock Record ID only when genuinely returned.
     */

    if (
      explorerData.lockRecordId
    ) {

      sessionStorage.setItem(
        'usdcxLockRecordId',
        explorerData.lockRecordId
      );

    }


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
    'USDCx LOCKED: Explorer metadata:',
    explorerData
  );


  console.log(
    'USDCx LOCKED: Allocations:',
    allocations
  );


  return allocations;

}


/* =========================================================
 * GLOBAL FUNCTIONS
 * ========================================================= */

window.connectLeoForRecords =
  connectLeoForRecords;

window.getYourRecord =
  getYourRecord;

window.shortenAddress =
  shortenAddress;

window.formatStatus =
  formatStatus;


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
         * Page 2 has already loaded and selected
         * the record.
         *
         * Page 3 reads the saved record.
         */

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
 * PAGE READY
 * ========================================================= */

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

console.log(
  'USDCx LOCKED: Explorer:',
  ALEO_MAINNET_API
);

const PROGRAM_ID = 'usdcx_locked.aleo';

const PROGRAM_IDS = [
  'usdcx_locked.aleo',
  'vusdc_transaction.aleo'
];

const DECRYPT_PERMISSION = 'DECRYPT_UPON_REQUEST';


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
 *
 * IMPORTANT:
 *
 * Example:
 *
 * 140000u64.private
 *
 * becomes:
 *
 * 140000
 *
 * then:
 *
 * 140000 / 100
 *
 * = 1400.00
 *
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
   *
   * Example:
   *
   * 140000
   * → 1400.00
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

    /*
     * IMPORTANT:
     *
     * Display value is LOCKED.
     *
     * Raw record still contains status = 1.
     */

    status:
      status !== null
        ? formatStatus(status)
        : '',

    /*
     * Keep the original blockchain record untouched.
     */

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

async function requestPlaintextRecords(adapter) {

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


  /*
   * CORRECT CALL.
   *
   * DO NOT add true.
   * DO NOT add "all".
   */

  const allRecords = [];


  for (const programId of PROGRAM_IDS) {

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
        extractRecordList(records);


      for (const record of list) {

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


  /* Connect if necessary */

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
   *
   * This is important because Leo Wallet can return
   * records from more than one requested program.
   */

  const currentAddress =
    cleanAleoValue(
      adapter.account?.address ||
      adapter.account?.publicKey ||
      sessionStorage.getItem('usdcxAddress') ||
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
   * Request records ONLY after
   * GET YOUR RECORD is clicked.
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
   * IMPORTANT:
   *
   * Do NOT simply use recordList[0].
   *
   * We must first find records whose owner
   * matches the CURRENT connected wallet.
   */

  const matchingRecords =
    recordList.filter(item => {

      const owner =
        getRecordValue(
          item.record,
          [
            'owner',
            'owner_address'
          ]
        );


      const cleanOwner =
        cleanAleoValue(owner);


      const matches =
        cleanOwner === currentAddress;


      console.log(
        'USDCx LOCKED: Checking record owner:',
        cleanOwner,
        'MATCH:',
        matches,
        'PROGRAM:',
        item.programId
      );


      return matches;

    });


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
   * Normalize ONLY records belonging to
   * the currently connected wallet.
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
   * Save first selected record
   * for Page 3.
   *
   * IMPORTANT:
   *
   * usdcxSelectedRecord
   * contains the ORIGINAL raw record.
   *
   * usdcxSelectedAllocation
   * contains the frontend-normalized data.
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

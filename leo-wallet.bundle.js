(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __esm = (fn, res, err) => function __init() {
    if (err) throw err[0];
    try {
      return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
    } catch (e) {
      throw err = [e], e;
    }
  };
  var __commonJS = (cb, mod) => function __require() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/@provablehq/aleo-types/dist/index.mjs
  function hasInputRequest(inputs) {
    return inputs.some((i) => typeof i !== "string");
  }
  var TransactionStatus, Network;
  var init_dist = __esm({
    "node_modules/@provablehq/aleo-types/dist/index.mjs"() {
      TransactionStatus = /* @__PURE__ */ ((TransactionStatus2) => {
        TransactionStatus2["PENDING"] = "pending";
        TransactionStatus2["ACCEPTED"] = "accepted";
        TransactionStatus2["FAILED"] = "failed";
        TransactionStatus2["REJECTED"] = "rejected";
        return TransactionStatus2;
      })(TransactionStatus || {});
      Network = /* @__PURE__ */ ((Network2) => {
        Network2["MAINNET"] = "mainnet";
        Network2["TESTNET"] = "testnet";
        Network2["CANARY"] = "canary";
        return Network2;
      })(Network || {});
    }
  });

  // node_modules/eventemitter3/index.js
  var require_eventemitter3 = __commonJS({
    "node_modules/eventemitter3/index.js"(exports, module) {
      "use strict";
      var has = Object.prototype.hasOwnProperty;
      var prefix = "~";
      function Events() {
      }
      if (Object.create) {
        Events.prototype = /* @__PURE__ */ Object.create(null);
        if (!new Events().__proto__) prefix = false;
      }
      function EE(fn, context, once) {
        this.fn = fn;
        this.context = context;
        this.once = once || false;
      }
      function addListener(emitter, event, fn, context, once) {
        if (typeof fn !== "function") {
          throw new TypeError("The listener must be a function");
        }
        var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
        if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
        else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
        else emitter._events[evt] = [emitter._events[evt], listener];
        return emitter;
      }
      function clearEvent(emitter, evt) {
        if (--emitter._eventsCount === 0) emitter._events = new Events();
        else delete emitter._events[evt];
      }
      function EventEmitter2() {
        this._events = new Events();
        this._eventsCount = 0;
      }
      EventEmitter2.prototype.eventNames = function eventNames() {
        var names = [], events, name;
        if (this._eventsCount === 0) return names;
        for (name in events = this._events) {
          if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
        }
        if (Object.getOwnPropertySymbols) {
          return names.concat(Object.getOwnPropertySymbols(events));
        }
        return names;
      };
      EventEmitter2.prototype.listeners = function listeners(event) {
        var evt = prefix ? prefix + event : event, handlers = this._events[evt];
        if (!handlers) return [];
        if (handlers.fn) return [handlers.fn];
        for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
          ee[i] = handlers[i].fn;
        }
        return ee;
      };
      EventEmitter2.prototype.listenerCount = function listenerCount(event) {
        var evt = prefix ? prefix + event : event, listeners = this._events[evt];
        if (!listeners) return 0;
        if (listeners.fn) return 1;
        return listeners.length;
      };
      EventEmitter2.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
        var evt = prefix ? prefix + event : event;
        if (!this._events[evt]) return false;
        var listeners = this._events[evt], len = arguments.length, args, i;
        if (listeners.fn) {
          if (listeners.once) this.removeListener(event, listeners.fn, void 0, true);
          switch (len) {
            case 1:
              return listeners.fn.call(listeners.context), true;
            case 2:
              return listeners.fn.call(listeners.context, a1), true;
            case 3:
              return listeners.fn.call(listeners.context, a1, a2), true;
            case 4:
              return listeners.fn.call(listeners.context, a1, a2, a3), true;
            case 5:
              return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
            case 6:
              return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
          }
          for (i = 1, args = new Array(len - 1); i < len; i++) {
            args[i - 1] = arguments[i];
          }
          listeners.fn.apply(listeners.context, args);
        } else {
          var length = listeners.length, j;
          for (i = 0; i < length; i++) {
            if (listeners[i].once) this.removeListener(event, listeners[i].fn, void 0, true);
            switch (len) {
              case 1:
                listeners[i].fn.call(listeners[i].context);
                break;
              case 2:
                listeners[i].fn.call(listeners[i].context, a1);
                break;
              case 3:
                listeners[i].fn.call(listeners[i].context, a1, a2);
                break;
              case 4:
                listeners[i].fn.call(listeners[i].context, a1, a2, a3);
                break;
              default:
                if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) {
                  args[j - 1] = arguments[j];
                }
                listeners[i].fn.apply(listeners[i].context, args);
            }
          }
        }
        return true;
      };
      EventEmitter2.prototype.on = function on(event, fn, context) {
        return addListener(this, event, fn, context, false);
      };
      EventEmitter2.prototype.once = function once(event, fn, context) {
        return addListener(this, event, fn, context, true);
      };
      EventEmitter2.prototype.removeListener = function removeListener(event, fn, context, once) {
        var evt = prefix ? prefix + event : event;
        if (!this._events[evt]) return this;
        if (!fn) {
          clearEvent(this, evt);
          return this;
        }
        var listeners = this._events[evt];
        if (listeners.fn) {
          if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
            clearEvent(this, evt);
          }
        } else {
          for (var i = 0, events = [], length = listeners.length; i < length; i++) {
            if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
              events.push(listeners[i]);
            }
          }
          if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
          else clearEvent(this, evt);
        }
        return this;
      };
      EventEmitter2.prototype.removeAllListeners = function removeAllListeners(event) {
        var evt;
        if (event) {
          evt = prefix ? prefix + event : event;
          if (this._events[evt]) clearEvent(this, evt);
        } else {
          this._events = new Events();
          this._eventsCount = 0;
        }
        return this;
      };
      EventEmitter2.prototype.off = EventEmitter2.prototype.removeListener;
      EventEmitter2.prototype.addListener = EventEmitter2.prototype.on;
      EventEmitter2.prefixed = prefix;
      EventEmitter2.EventEmitter = EventEmitter2;
      if ("undefined" !== typeof module) {
        module.exports = EventEmitter2;
      }
    }
  });

  // node_modules/eventemitter3/index.mjs
  var import_index, eventemitter3_default;
  var init_eventemitter3 = __esm({
    "node_modules/eventemitter3/index.mjs"() {
      import_index = __toESM(require_eventemitter3(), 1);
      eventemitter3_default = import_index.default;
    }
  });

  // node_modules/@provablehq/aleo-wallet-standard/dist/index.mjs
  function hasUnsupportedConnectOptions(options) {
    if (!options) return false;
    return options.recordAccess !== void 0 || options.readAddress === false || options.algorithmsAllowed !== void 0 && options.algorithmsAllowed.length > 0;
  }
  var WalletFeatureName, WalletReadyState, WalletDecryptPermission;
  var init_dist2 = __esm({
    "node_modules/@provablehq/aleo-wallet-standard/dist/index.mjs"() {
      init_eventemitter3();
      WalletFeatureName = /* @__PURE__ */ ((WalletFeatureName2) => {
        WalletFeatureName2["CONNECT"] = "standard:connect";
        WalletFeatureName2["ACCOUNTS"] = "standard:accounts";
        WalletFeatureName2["SIGN"] = "aleo:sign";
        WalletFeatureName2["EXECUTE"] = "aleo:execute";
        WalletFeatureName2["TRANSACTION_STATUS"] = "aleo:transaction-status";
        WalletFeatureName2["CHAINS"] = "standard:chains";
        WalletFeatureName2["SWITCH_NETWORK"] = "standard:switch-network";
        WalletFeatureName2["DECRYPT"] = "standard:decrypt";
        WalletFeatureName2["REQUEST_RECORDS"] = "standard:request-records";
        WalletFeatureName2["EXECUTE_DEPLOYMENT"] = "standard:execute-deployment";
        WalletFeatureName2["TRANSITION_VIEWKEYS"] = "standard:transition_viewkeys";
        WalletFeatureName2["REQUEST_TRANSACTION_HISTORY"] = "standard:request_transaction_history";
        return WalletFeatureName2;
      })(WalletFeatureName || {});
      WalletReadyState = /* @__PURE__ */ ((WalletReadyState2) => {
        WalletReadyState2["INSTALLED"] = "Installed";
        WalletReadyState2["NOT_DETECTED"] = "NotDetected";
        WalletReadyState2["LOADABLE"] = "Loadable";
        WalletReadyState2["UNSUPPORTED"] = "Unsupported";
        return WalletReadyState2;
      })(WalletReadyState || {});
      WalletDecryptPermission = /* @__PURE__ */ ((WalletDecryptPermission2) => {
        WalletDecryptPermission2["NoDecrypt"] = "NO_DECRYPT";
        WalletDecryptPermission2["UponRequest"] = "DECRYPT_UPON_REQUEST";
        WalletDecryptPermission2["AutoDecrypt"] = "AUTO_DECRYPT";
        WalletDecryptPermission2["OnChainHistory"] = "ON_CHAIN_HISTORY";
        return WalletDecryptPermission2;
      })(WalletDecryptPermission || {});
    }
  });

  // node_modules/@provablehq/aleo-wallet-adaptor-core/dist/index.mjs
  function scopePollingDetectionStrategy(detect) {
    if (typeof window === "undefined" || typeof document === "undefined") return;
    const disposers = [];
    function detectAndDispose() {
      const detected = detect();
      if (detected) {
        for (const dispose of disposers) {
          dispose();
        }
      }
    }
    const interval = (
      // TODO: #334 Replace with idle callback strategy.
      setInterval(detectAndDispose, 1e3)
    );
    disposers.push(() => clearInterval(interval));
    if (
      // Implies that `DOMContentLoaded` has not yet fired.
      document.readyState === "loading"
    ) {
      document.addEventListener("DOMContentLoaded", detectAndDispose, { once: true });
      disposers.push(() => document.removeEventListener("DOMContentLoaded", detectAndDispose));
    }
    if (
      // If the `complete` state has been reached, we're too late.
      document.readyState !== "complete"
    ) {
      window.addEventListener("load", detectAndDispose, { once: true });
      disposers.push(() => window.removeEventListener("load", detectAndDispose));
    }
    detectAndDispose();
  }
  function validateInputRequests(inputs) {
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      if (typeof input === "string") continue;
      if (input.type === "record" && input.uid !== void 0 && input.filters !== void 0) {
        throw new WalletInputRequestInvalidError(
          `inputs[${i}]: type "record" cannot specify both \`uid\` and \`filters\`. \`uid\` pins a specific record returned by requestRecords; filters are ignored when \`uid\` is set.`
        );
      }
      if (input.type === "derived") {
        if (typeof input.algorithm !== "string" || input.algorithm.length === 0) {
          throw new WalletInputRequestInvalidError(
            `inputs[${i}]: type "derived" requires a non-empty \`algorithm\` string.`
          );
        }
        if (input.args === null || typeof input.args !== "object" || Array.isArray(input.args)) {
          throw new WalletInputRequestInvalidError(
            `inputs[${i}]: type "derived" requires \`args\` to be an object (Record<string, AlgorithmArg>).`
          );
        }
        for (const [argName, arg] of Object.entries(input.args)) {
          const invalidReason = invalidAlgorithmArgReason(arg);
          if (invalidReason) {
            throw new WalletInputRequestInvalidError(
              `inputs[${i}]: args["${argName}"]${invalidReason}`
            );
          }
        }
      }
    }
  }
  function invalidAlgorithmArgReason(arg) {
    if (arg === null || typeof arg !== "object") {
      return " must be { type, value }.";
    }
    if (!hasAlgorithmArgType(arg)) {
      return '.type must be an ArgType string (a LiteralType or "string").';
    }
    if (!hasAlgorithmArgValue(arg)) {
      return ".value must be a string Aleo literal.";
    }
    return null;
  }
  function hasAlgorithmArgType(arg) {
    return "type" in arg && typeof arg.type === "string";
  }
  function hasAlgorithmArgValue(arg) {
    return "value" in arg && typeof arg.value === "string";
  }
  function getNormalizedRecordStatus(record) {
    if (!record || typeof record !== "object") {
      return void 0;
    }
    const recordValue = record;
    if (typeof recordValue.spent === "boolean") {
      return recordValue.spent ? "spent" : "unspent";
    }
    if (typeof recordValue.status !== "string") {
      return void 0;
    }
    switch (recordValue.status.toLowerCase()) {
      case "spent":
        return "spent";
      case "unspent":
        return "unspent";
      case "pending":
        return "pending";
      default:
        return void 0;
    }
  }
  function filterRecordsByStatus(records, statusFilter = "all") {
    if (statusFilter === "all") {
      return records;
    }
    return records.filter((record) => getNormalizedRecordStatus(record) === statusFilter);
  }
  var WalletError, WalletNotConnectedError, WalletConnectionError, WalletFeatureNotAvailableError, WalletTransactionError, WalletDisconnectionError, WalletSignMessageError, WalletDecryptionNotAllowedError, WalletDecryptionError, MethodNotImplementedError, WalletInputRequestNotSupportedError, WalletConnectOptionsNotSupportedError, WalletInputRequestInvalidError, WalletAddressWithheldError, BaseAleoWalletAdapter;
  var init_dist3 = __esm({
    "node_modules/@provablehq/aleo-wallet-adaptor-core/dist/index.mjs"() {
      init_dist2();
      WalletError = class extends Error {
        constructor() {
          super(...arguments);
          this.name = "WalletError";
        }
      };
      WalletNotConnectedError = class extends WalletError {
        constructor() {
          super("Wallet not connected");
          this.name = "WalletNotConnectedError";
        }
      };
      WalletConnectionError = class extends WalletError {
        constructor(message = "Connection to wallet failed") {
          super(message);
          this.name = "WalletConnectionError";
        }
      };
      WalletFeatureNotAvailableError = class extends WalletError {
        constructor(feature) {
          super(`Wallet feature not available: ${feature}`);
          this.name = "WalletFeatureNotAvailableError";
        }
      };
      WalletTransactionError = class extends WalletError {
        constructor(message = "Transaction failed") {
          super(message);
          this.name = "WalletTransactionError";
        }
      };
      WalletDisconnectionError = class extends WalletError {
        constructor(message = "Disconnection failed") {
          super(message);
          this.name = "WalletDisconnectionError";
        }
      };
      WalletSignMessageError = class extends WalletError {
        constructor(message = "Failed to sign message") {
          super(message);
          this.name = "WalletSignMessageError";
        }
      };
      WalletDecryptionNotAllowedError = class extends WalletError {
        constructor() {
          super("Decryption not allowed");
          this.name = "WalletDecryptionNotAllowedError";
        }
      };
      WalletDecryptionError = class extends WalletError {
        constructor(message = "Failed to decrypt") {
          super(message);
          this.name = "WalletDecryptionError";
        }
      };
      MethodNotImplementedError = class extends WalletError {
        constructor(method) {
          super(`Method not implemented: ${method}`);
          this.name = "MethodNotImplementedError";
        }
      };
      WalletInputRequestNotSupportedError = class extends WalletError {
        constructor(walletName) {
          super(
            `Wallet "${walletName}" does not yet support InputRequest inputs. Pass literal Aleo string values, or switch to a wallet that supports wallet-specified inputs.`
          );
          this.name = "WalletInputRequestNotSupportedError";
        }
      };
      WalletConnectOptionsNotSupportedError = class extends WalletError {
        constructor(walletName) {
          super(
            `Wallet "${walletName}" does not yet support ConnectOptions (recordAccess, readAddress). Connect without these options, or switch to a wallet that supports them.`
          );
          this.name = "WalletConnectOptionsNotSupportedError";
        }
      };
      WalletInputRequestInvalidError = class extends WalletError {
        constructor(reason) {
          super(`InputRequest is invalid: ${reason}`);
          this.name = "WalletInputRequestInvalidError";
        }
      };
      WalletAddressWithheldError = class extends WalletError {
        constructor(method) {
          super(
            `"${method}" is not available when the connection was made with readAddress: false. Reconnect with readAddress: true to use this method.`
          );
          this.name = "WalletAddressWithheldError";
        }
      };
      BaseAleoWalletAdapter = class extends eventemitter3_default {
        constructor() {
          super(...arguments);
          this._readAddress = true;
        }
        get readyState() {
          return this._readyState;
        }
        set readyState(state) {
          if (state !== this._readyState) {
            this._readyState = state;
            this.emit("readyStateChange", state);
          }
        }
        /**
         * The supported chains
         */
        get chains() {
          return this._wallet?.features[WalletFeatureName.CHAINS]?.chains || [];
        }
        /**
         * The wallet's connected state
         */
        get connected() {
          return !!this.account;
        }
        assertReadAddressCompatibleWithDecryptPermission(decryptPermission, options) {
          if (options?.readAddress === false && decryptPermission !== WalletDecryptPermission.NoDecrypt) {
            throw new WalletConnectionError(
              "readAddress: false is only valid with decryptPermission: NoDecrypt. Plaintext-bearing operations would leak the owner address."
            );
          }
        }
        setReadAddressFromConnectOptions(options) {
          this._readAddress = options?.readAddress !== false;
        }
        resetReadAddress() {
          this._readAddress = true;
        }
        assertReadAddressAllowed(method) {
          if (!this._readAddress) {
            throw new WalletAddressWithheldError(method);
          }
        }
        /**
         * Connect to the wallet
         * @param network The network to connect to
         * @param decryptPermission The decrypt permission
         * @param programs The programs to connect to
         * @param options Optional additive connect-time options
         * @returns The connected account
         */
        async connect(network, decryptPermission, programs, options) {
          if (!this._wallet) {
            throw new WalletConnectionError("No wallet provider found");
          }
          this.assertReadAddressCompatibleWithDecryptPermission(decryptPermission, options);
          const feature = this._wallet.features[WalletFeatureName.CONNECT];
          if (!feature || !feature.available) {
            throw new WalletFeatureNotAvailableError(WalletFeatureName.CONNECT);
          }
          try {
            const account = await feature.connect(network, decryptPermission, programs, options);
            this.account = account;
            this.setReadAddressFromConnectOptions(options);
            this.emit("connect", account);
            return account;
          } catch (err) {
            this.emit("error", err);
            throw err;
          }
        }
        /**
         * Disconnect from the wallet
         */
        async disconnect() {
          if (!this._wallet) return;
          const feature = this._wallet.features[WalletFeatureName.CONNECT];
          if (feature && feature.available) {
            try {
              await feature.disconnect();
            } catch (err) {
              this.emit("error", err);
            }
          }
          this.account = void 0;
          this.resetReadAddress();
          this.emit("disconnect");
        }
        /**
         * Sign a message
         * @param options Transaction options
         * @returns The signed transaction
         */
        async signMessage(message) {
          if (!this._wallet || !this.account) {
            throw new WalletNotConnectedError();
          }
          const feature = this._wallet.features[WalletFeatureName.SIGN];
          if (!feature || !feature.available) {
            throw new WalletFeatureNotAvailableError(WalletFeatureName.SIGN);
          }
          return feature.signMessage(message);
        }
        /**
         * Execute a transaction
         * @param options Transaction options
         * @returns The executed temporary transaction ID
         */
        async executeTransaction(options) {
          if (!this._wallet || !this.account) {
            throw new WalletNotConnectedError();
          }
          validateInputRequests(options.inputs);
          const feature = this._wallet.features[WalletFeatureName.EXECUTE];
          if (!feature || !feature.available) {
            throw new WalletFeatureNotAvailableError(WalletFeatureName.EXECUTE);
          }
          return feature.executeTransaction(options);
        }
        /**
         * Get transaction status
         * @param transactionId The transaction ID
         * @returns The transaction status
         */
        async transactionStatus(transactionId) {
          if (!this._wallet || !this.account) {
            throw new WalletNotConnectedError();
          }
          const feature = this._wallet.features[WalletFeatureName.TRANSACTION_STATUS];
          if (!feature || !feature.available) {
            throw new WalletFeatureNotAvailableError(WalletFeatureName.TRANSACTION_STATUS);
          }
          return feature.transactionStatus(transactionId);
        }
        async switchNetwork(network) {
          if (!this._wallet || !this.account) {
            throw new WalletNotConnectedError();
          }
          const feature = this._wallet.features[WalletFeatureName.SWITCH_NETWORK];
          if (!feature || !feature.available) {
            throw new WalletFeatureNotAvailableError(WalletFeatureName.SWITCH_NETWORK);
          }
          await feature.switchNetwork(network);
          this.emit("networkChange", network);
        }
        async decrypt(cipherText, tpk, programId, functionName, index) {
          if (!this._wallet || !this.account) {
            throw new WalletNotConnectedError();
          }
          this.assertReadAddressAllowed("decrypt");
          const feature = this._wallet.features[WalletFeatureName.DECRYPT];
          if (!feature || !feature.available) {
            throw new WalletFeatureNotAvailableError(WalletFeatureName.DECRYPT);
          }
          return feature.decrypt(cipherText, tpk, programId, functionName, index);
        }
        async requestRecords(program, includePlaintext, statusFilter) {
          if (!this._wallet || !this.account) {
            throw new WalletNotConnectedError();
          }
          this.assertReadAddressAllowed("requestRecords");
          const feature = this._wallet.features[WalletFeatureName.REQUEST_RECORDS];
          if (!feature || !feature.available) {
            throw new WalletFeatureNotAvailableError(WalletFeatureName.REQUEST_RECORDS);
          }
          return feature.requestRecords(program, includePlaintext, statusFilter);
        }
        async executeDeployment(deployment) {
          if (!this._wallet || !this.account) {
            throw new WalletNotConnectedError();
          }
          const feature = this._wallet.features[WalletFeatureName.EXECUTE_DEPLOYMENT];
          if (!feature || !feature.available) {
            throw new WalletFeatureNotAvailableError(WalletFeatureName.EXECUTE_DEPLOYMENT);
          }
          return feature.executeDeployment(deployment);
        }
        async transitionViewKeys(transactionId) {
          if (!this._wallet || !this.account) {
            throw new WalletNotConnectedError();
          }
          this.assertReadAddressAllowed("transitionViewKeys");
          const feature = this._wallet.features[WalletFeatureName.TRANSITION_VIEWKEYS];
          if (!feature || !feature.available) {
            throw new WalletFeatureNotAvailableError(WalletFeatureName.TRANSITION_VIEWKEYS);
          }
          return feature.transitionViewKeys(transactionId);
        }
        async requestTransactionHistory(program) {
          if (!this._wallet || !this.account) {
            throw new WalletNotConnectedError();
          }
          this.assertReadAddressAllowed("requestTransactionHistory");
          const feature = this._wallet.features[WalletFeatureName.REQUEST_TRANSACTION_HISTORY];
          if (!feature || !feature.available) {
            throw new WalletFeatureNotAvailableError(WalletFeatureName.REQUEST_TRANSACTION_HISTORY);
          }
          return feature.requestTransactionHistory(program);
        }
        /**
         * Return the algorithm names this wallet implements for `type: "derived"`
         * InputRequests. A dapp calls this before connect to learn which entries
         * are valid in `ConnectOptions.algorithmsAllowed`. Wallets that do not
         * support derived inputs at all should return `[]`.
         *
         * Override in adapters that support derived inputs.
         */
        async algorithmsSupported() {
          return [];
        }
      };
    }
  });

  // node_modules/@provablehq/aleo-wallet-adaptor-leo/dist/index.mjs
  var LEO_NETWORK_MAP, Deployment, LeoWalletAdapter;
  var init_dist4 = __esm({
    "node_modules/@provablehq/aleo-wallet-adaptor-leo/dist/index.mjs"() {
      init_dist();
      init_dist2();
      init_dist3();
      init_dist();
      LEO_NETWORK_MAP = {
        [Network.MAINNET]: "mainnet",
        [Network.TESTNET]: "testnetbeta",
        [Network.CANARY]: "testnetbeta"
      };
      Deployment = class {
        constructor(address, chainId, program, fee, feePrivate = true) {
          this.address = address;
          this.chainId = chainId;
          this.program = program;
          this.fee = fee;
          this.feePrivate = feePrivate;
        }
      };
      LeoWalletAdapter = class extends BaseAleoWalletAdapter {
        /**
         * Create a new Leo wallet adapter
         * @param config Adapter configuration
         */
        constructor(config) {
          super();
          this.name = "Leo Wallet";
          this.url = "https://app.leo.app";
          this.icon = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFwAAABcCAMAAADUMSJqAAAASFBMVEVjTP////9kTf9GIP/5+P9dRP+ajf9WO//Jwv9fR/9KJv+Ccf9ZP//08/+Xiv9aQf+upf/c2P+Qgf96aP9TNv/Nx/+Fdf+6sv91nL8+AAABCUlEQVRoge2YyQ6EIBBEccVWBHf//09H42FESNRJk+ik3s06vANCQ0oIAAAAf0ps48u8XHKXiYVZsyE5pbxgj8s63RPpTAhZROkZ9QV7nKSRRb7JT0kTyCGHHPInyceAcppyBz0zyQVlDlJzyT1k+XvkZKQ0FEROqmqKoqkU8ctV327fba+45ar7Jp3ilVO/j3pilat2H7WKU06VnVXEKDeNnTWGUX6cioV8izzosgT9ocetuKzKWw5R0OMfdnAtKyPDjVwR9LI48ny5lu6zgm0rztp9EE1cJ9THyDW4fLBNRcghhxxyDvmh+vOxybVdB16p/pzS0sewesz90vJGtfpD3QoAAOCNfADu9hzTpMe3fQAAAABJRU5ErkJggg==";
          this.decryptPermission = WalletDecryptPermission.NoDecrypt;
          this._publicKey = "";
          this._readyState = typeof window === "undefined" || typeof document === "undefined" ? WalletReadyState.UNSUPPORTED : WalletReadyState.NOT_DETECTED;
          this.network = Network.TESTNET;
          if (this._readyState !== WalletReadyState.UNSUPPORTED) {
            scopePollingDetectionStrategy(() => this._checkAvailability());
          }
          if (config?.isMobile) {
            this.url = `https://app.leo.app/browser?url=${encodeURIComponent(config.mobileWebviewUrl)}`;
          }
        }
        /**
         * Check if Leo wallet is available
         */
        _checkAvailability() {
          this._window = window;
          if (this._window.leoWallet || this._window.leo) {
            this._leoWallet = this._window.leoWallet ?? this._window.leo;
            this.readyState = WalletReadyState.INSTALLED;
            this.emit("readyStateChange", this.readyState);
            if (this._window?.leoWallet?.isAvailable) {
              this._window?.leoWallet.isAvailable();
            }
            return true;
          }
          return false;
        }
        /**
         * Connect to Leo wallet
         * @returns The connected account
         */
        async connect(network, decryptPermission, programs, options) {
          if (hasUnsupportedConnectOptions(options)) {
            throw new WalletConnectOptionsNotSupportedError(this.name);
          }
          try {
            if (this.readyState !== WalletReadyState.INSTALLED) {
              throw new WalletConnectionError("Leo Wallet is not available");
            }
            try {
              await this._leoWallet?.connect(decryptPermission, LEO_NETWORK_MAP[network], programs);
              this.network = network;
            } catch (error) {
              if (error instanceof Object && "name" in error && error.name === "InvalidParamsAleoWalletError") {
                throw new WalletConnectionError(
                  "Connection failed: Likely due to a difference in configured network and the selected wallet network. Configured network: " + network
                );
              }
              throw new WalletConnectionError(
                error instanceof Error ? error.message : "Connection failed"
              );
            }
            this._publicKey = this._leoWallet?.publicKey || "";
            this.decryptPermission = decryptPermission;
            if (!this._publicKey) {
              throw new WalletConnectionError("No address returned from wallet");
            }
            const account = {
              address: this._publicKey
            };
            this.account = account;
            this.emit("connect", account);
            return account;
          } catch (err) {
            throw new WalletConnectionError(err instanceof Error ? err.message : "Connection failed");
          }
        }
        /**
         * Disconnect from Leo wallet
         */
        async disconnect() {
          try {
            await this._leoWallet?.disconnect();
            this._publicKey = "";
            this.account = void 0;
            this.emit("disconnect");
          } catch (err) {
            this.emit("error", err instanceof Error ? err : new Error(String(err)));
            throw new WalletDisconnectionError(
              err instanceof Error ? err.message : "Disconnection failed"
            );
          }
        }
        /**
         * Sign a transaction with Leo wallet
         * @param options Transaction options
         * @returns The signed transaction
         */
        async signMessage(message) {
          if (!this._publicKey || !this.account) {
            throw new WalletNotConnectedError();
          }
          try {
            const signature = await this._leoWallet?.signMessage(message);
            if (!signature) {
              throw new WalletSignMessageError("Failed to sign message");
            }
            return signature.signature;
          } catch (error) {
            throw new WalletSignMessageError(
              error instanceof Error ? error.message : "Failed to sign message"
            );
          }
        }
        async decrypt(cipherText, tpk, programId, functionName, index) {
          if (!this._leoWallet || !this._publicKey) {
            throw new WalletNotConnectedError();
          }
          switch (this.decryptPermission) {
            case WalletDecryptPermission.NoDecrypt:
              throw new WalletDecryptionNotAllowedError();
            case WalletDecryptPermission.UponRequest:
            case WalletDecryptPermission.AutoDecrypt:
            case WalletDecryptPermission.OnChainHistory: {
              try {
                const text = await this._leoWallet.decrypt(
                  cipherText,
                  tpk,
                  programId,
                  functionName,
                  index
                );
                return text.text;
              } catch (error) {
                throw new WalletDecryptionError(
                  error instanceof Error ? error.message : "Failed to decrypt"
                );
              }
            }
            default:
              throw new WalletDecryptionError();
          }
        }
        /**
         * Execute a transaction with Leo wallet
         * @param options Transaction options
         * @returns The executed temporary transaction ID
         */
        async executeTransaction(options) {
          if (hasInputRequest(options.inputs)) {
            throw new WalletInputRequestNotSupportedError(this.name);
          }
          if (!this._publicKey || !this.account) {
            throw new WalletNotConnectedError();
          }
          try {
            const requestData = {
              address: this._publicKey,
              chainId: LEO_NETWORK_MAP[this.network],
              fee: options.fee ? options.fee : 1e-3,
              feePrivate: options.privateFee ?? false,
              transitions: [
                {
                  program: options.program,
                  functionName: options.function,
                  inputs: options.inputs
                }
              ]
            };
            const result = await this._leoWallet?.requestTransaction(requestData);
            if (!result?.transactionId) {
              throw new WalletTransactionError("Could not create transaction");
            }
            return {
              transactionId: result.transactionId
            };
          } catch (error) {
            console.error("Leo Wallet executeTransaction error", error);
            if (error instanceof WalletError) {
              throw error;
            }
            throw new WalletTransactionError(
              error instanceof Error ? error.message : "Failed to execute transaction"
            );
          }
        }
        /**
         * Get transaction status
         * @param transactionId The transaction ID
         * @returns The transaction status
         */
        async transactionStatus(transactionId) {
          if (!this._publicKey || !this.account) {
            throw new WalletNotConnectedError();
          }
          try {
            const result = await this._leoWallet?.transactionStatus(transactionId);
            if (!result?.status) {
              throw new WalletTransactionError("Could not get transaction status");
            }
            const leoStatus = result.status;
            console.log("leoStatus", leoStatus);
            const status = leoStatus === "Finalized" ? TransactionStatus.ACCEPTED : leoStatus === "Completed" ? TransactionStatus.PENDING : leoStatus;
            return {
              status
            };
          } catch (error) {
            throw new WalletTransactionError(
              error instanceof Error ? error.message : "Failed to get transaction status"
            );
          }
        }
        /**
         * Request records from Leo wallet
         * @param program The program to request records from
         * @param includePlaintext Whether to include plaintext on each record
         * @param statusFilter Whether to filter records by status
         * @returns The records
         */
        async requestRecords(program, includePlaintext, statusFilter = "all") {
          if (!this._publicKey || !this.account) {
            throw new WalletNotConnectedError();
          }
          try {
            const result = includePlaintext ? await this._leoWallet?.requestRecordPlaintexts(program) : await this._leoWallet?.requestRecords(program);
            return filterRecordsByStatus(result?.records || [], statusFilter);
          } catch (error) {
            throw new WalletError(error instanceof Error ? error.message : "Failed to request records");
          }
        }
        /**
         * Switch the network
         * @param network The network to switch to
         */
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async switchNetwork(_network) {
          console.error("Leo Wallet does not support switching networks");
          throw new MethodNotImplementedError("switchNetwork");
        }
        /**
         * Execute a deployment
         * @param deployment The deployment to execute
         * @returns The executed transaction ID
         */
        async executeDeployment(deployment) {
          try {
            if (!this._publicKey || !this.account) {
              throw new WalletNotConnectedError();
            }
            try {
              const leoDeployment = new Deployment(
                this._publicKey,
                LEO_NETWORK_MAP[this.network],
                deployment.program,
                deployment.priorityFee,
                deployment.privateFee
              );
              const result = await this._leoWallet?.requestDeploy(leoDeployment);
              if (!result?.transactionId) {
                throw new WalletTransactionError("Could not create deployment");
              }
              return {
                transactionId: result.transactionId
              };
            } catch (error) {
              throw new WalletTransactionError(
                error instanceof Error ? error.message : "Failed to execute deployment"
              );
            }
          } catch (error) {
            this.emit("error", error instanceof Error ? error : new Error(String(error)));
            throw error;
          }
        }
      };
    }
  });

  // leo-wallet.js
  var require_leo_wallet = __commonJS({
    "leo-wallet.js"() {
      init_dist4();
      init_dist2();
      init_dist();
      var isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      var adapter = new LeoWalletAdapter({
        appName: "USDCx LOCKED",
        appDescription: "USDCx LOCKED - Private Lock Protocol",
        isMobile,
        mobileWebviewUrl: window.location.href
      });
      window.usdcxLeoAdapter = adapter;
      function initLeoWallet() {
        const connectButton = document.querySelector(".btn-connect");
        if (!connectButton) {
          console.error("USDCx LOCKED: Connect button not found");
          return;
        }
        connectButton.addEventListener("click", async () => {
  try {

    if (isMobile && !window.leoWallet && !window.leo) {
      window.location.href = adapter.url;
      return;
    }

    connectButton.disabled = true;

    console.log(
      "USDCx LOCKED: Connecting to Leo Wallet on MAINNET...",
      { isMobile }
    );

    const account = await adapter.connect(
      Network.MAINNET,
      WalletDecryptPermission.NoDecrypt
    );

    console.log(
      "USDCx LOCKED: Leo Wallet connected:",
      account
    );
            const address = account?.address || account?.publicKey || adapter.publicKey;
            if (!address) {
              throw new Error(
                "Leo Wallet connected but no address was returned."
              );
            }
            console.log(
              "USDCx LOCKED: Wallet address:",
              address
            );
            sessionStorage.setItem(
              "usdcxAddress",
              address
            );
            sessionStorage.setItem(
              "walletAddress",
              address
            );
            connectButton.textContent = address.slice(0, 10) + "..." + address.slice(-6);
            setTimeout(() => {
              window.location.href = "./page2.html";
            }, 300);
          } catch (error) {
            console.error(
              "USDCx LOCKED: Leo Wallet connection failed:",
              error
            );
            connectButton.disabled = false;
          }
        });
        console.log(
          "USDCx LOCKED: Leo Wallet connector ready - MAINNET",
          { isMobile }
        );
      }
      if (document.readyState === "loading") {
        document.addEventListener(
          "DOMContentLoaded",
          initLeoWallet
        );
      } else {
        initLeoWallet();
      }
    }
  });
  require_leo_wallet();
})();
